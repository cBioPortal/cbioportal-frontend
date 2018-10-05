import MobxPromiseCache from "../lib/MobxPromiseCache";
import { ClinicalAttribute } from "../api/generated/CBioPortalAPI";
import _ from "lodash";
import internalClient from "../api/cbioportalInternalClientInstance";
import { ClinicalDataCount, StudyViewFilter } from "shared/api/generated/CBioPortalAPIInternal";
import { clinicalDataCountComparator, isFiltered , pickClinicalDataColors} from "pages/studyView/StudyViewUtils";
import { ClinicalDataCountWithColor } from "pages/studyView/StudyViewPageStore";

type StudyViewClinicalDataCountsQuery = {
    attribute: ClinicalAttribute
    filters: StudyViewFilter
};

async function fetchAndSortClinicalDataCounts(q: StudyViewClinicalDataCountsQuery,
                                              studyViewFilter?: StudyViewFilter): Promise<ClinicalDataCount[]>
{
    const result: ClinicalDataCount[] = await internalClient.fetchClinicalDataCountsUsingPOST({
        attributeId: q.attribute.clinicalAttributeId,
        clinicalDataType: q.attribute.patientAttribute ? 'PATIENT' : 'SAMPLE',
        studyViewFilter: studyViewFilter || q.filters
    });

    result.sort(clinicalDataCountComparator);
    return result;
}

export default class StudyViewClinicalDataCountsCache extends MobxPromiseCache<StudyViewClinicalDataCountsQuery, ClinicalDataCountWithColor[]> {
    private colorCache: { [attributeId: string]: { [id: string]: string } };

    constructor() {
        super(
            q => ({
                invoke: async () => {
                    let colors = this.colorCache[q.attribute.clinicalAttributeId + q.attribute.patientAttribute];
                    let result: ClinicalDataCount[] = [];
                    if (_.isUndefined(colors)) {
                        let studyIds = q.filters.studyIds || [];
                        if(_.isEmpty(studyIds)){
                            studyIds = _.keys(_.reduce(q.filters.sampleIdentifiers,(acc: {[id:string]:boolean}, next)=>{
                                acc[next.studyId] = true;
                                return acc;
                            }, {}));
                        }

                        result = await fetchAndSortClinicalDataCounts(q, { studyIds: studyIds } as any);
                        colors = pickClinicalDataColors(result);

                        this.colorCache[q.attribute.clinicalAttributeId + q.attribute.patientAttribute] = colors;
                    }

                    //fetch data if its not already fetched
                    if (_.isEmpty(result) || isFiltered(q.filters as any) || !_.isUndefined(q.filters.sampleIdentifiers)) {
                        result = await fetchAndSortClinicalDataCounts(q);
                    }

                    return new Promise<ClinicalDataCountWithColor[]>((resolve, reject) => {
                        resolve(_.reduce(result, (acc: ClinicalDataCountWithColor[], slice) => {
                            acc.push(_.assign({}, slice, { color: colors[slice.value] }));
                            return acc;
                        }, []));
                    });
                }
            }),
            q => JSON.stringify(q)
        );
        this.colorCache = {};
    }
}
