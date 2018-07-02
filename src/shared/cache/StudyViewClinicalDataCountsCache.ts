import MobxPromiseCache from "../lib/MobxPromiseCache";
import { ClinicalAttribute } from "../api/generated/CBioPortalAPI";
import { MobxPromise } from "mobxpromise";
import _ from "lodash";
import client from "../api/cbioportalClientInstance";
import internalClient from "../api/cbioportalInternalClientInstance";
import { ClinicalDataCount, StudyViewFilter } from "shared/api/generated/CBioPortalAPIInternal";
import { NA_COLOR, COLORS } from "pages/studyView/StudyViewUtils";
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
                        result = await internalClient.fetchClinicalDataCountsUsingPOST({
                            attributeId: q.attribute.clinicalAttributeId,
                            clinicalDataType: q.attribute.patientAttribute ? 'PATIENT' : 'SAMPLE',
                            studyViewFilter: { studyIds: q.filters.studyIds } as any
                        });
                        colors = _.reduce(result, (acc: { [id: string]: string }, slice) => {
                            if (slice.value.toLowerCase().includes('na')) {
                                acc[slice.value] = NA_COLOR;
                            } else {
                                acc[slice.value] = COLORS[count];
                                count += 1;
                            }
                            return acc;
                        }, {})
                        this.colorCache[q.attribute.clinicalAttributeId + q.attribute.patientAttribute] = colors;
                    }

                    if (_.isEmpty(result) ||
                        !(_.isEmpty(q.filters.clinicalDataEqualityFilters) ||
                            _.isEmpty(q.filters.cnaGenes) ||
                            _.isEmpty(q.filters.mutatedGenes))) {
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
