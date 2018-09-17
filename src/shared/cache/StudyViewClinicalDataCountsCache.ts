import MobxPromiseCache from "../lib/MobxPromiseCache";
import { ClinicalAttribute } from "../api/generated/CBioPortalAPI";
import { MobxPromise } from "mobxpromise";
import _ from "lodash";
import client from "../api/cbioportalClientInstance";
import internalClient from "../api/cbioportalInternalClientInstance";
import { ClinicalDataCount, StudyViewFilter } from "shared/api/generated/CBioPortalAPIInternal";
import {NA_COLOR, COLORS, isFiltered, isNAClinicalValue} from "pages/studyView/StudyViewUtils";
import { ClinicalDataCountWithColor } from "pages/studyView/StudyViewPageStore";

type StudyViewClinicalDataCountsQuery = {
    attribute: ClinicalAttribute
    filters: StudyViewFilter
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
                        let count = 0;
                        let studyIds = q.filters.studyIds || [];
                        if(_.isEmpty(studyIds)){
                            studyIds = _.keys(_.reduce(q.filters.sampleIdentifiers,(acc, next)=>{
                                acc[next.studyId] = true;
                                return acc;
                            },{} as {[id:string]:boolean}))
                        }
                        result = await internalClient.fetchClinicalDataCountsUsingPOST({
                            attributeId: q.attribute.clinicalAttributeId,
                            clinicalDataType: q.attribute.patientAttribute ? 'PATIENT' : 'SAMPLE',
                            studyViewFilter: { studyIds: studyIds } as any
                        });
                        colors = _.reduce(result.sort((a, b) => {
                            if (isNAClinicalValue(a.value))
                                return isNAClinicalValue(b.value) ? 0 : 1;
                            if (isNAClinicalValue(b.value))
                                return -1;
                            return b.count - a.count;
                        }), (acc: { [id: string]: string }, slice) => {
                            if (isNAClinicalValue(slice.value)) {
                                acc[slice.value] = NA_COLOR;
                            } else {
                                acc[slice.value] = COLORS[count];
                                count += 1;
                            }
                            return acc;
                        }, {})
                        this.colorCache[q.attribute.clinicalAttributeId + q.attribute.patientAttribute] = colors;
                    }

                    //fetch data if its not already fetched
                    if (_.isEmpty(result) || isFiltered(q.filters as any) || !_.isUndefined(q.filters.sampleIdentifiers)) {
                        result = await internalClient.fetchClinicalDataCountsUsingPOST({
                            attributeId: q.attribute.clinicalAttributeId,
                            clinicalDataType: q.attribute.patientAttribute ? 'PATIENT' : 'SAMPLE',
                            studyViewFilter: q.filters
                        });
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
        this.colorCache = {}
    }
}
