import MobxPromiseCache from "../lib/MobxPromiseCache";
import { ClinicalAttribute } from "../api/generated/CBioPortalAPI";
import _ from "lodash";
import internalClient from "../api/cbioportalInternalClientInstance";
import {DataBin, StudyViewFilter} from "shared/api/generated/CBioPortalAPIInternal";

type StudyViewClinicalDataBinCountsQuery = {
    attribute: ClinicalAttribute
    filters: StudyViewFilter
    method: 'DYNAMIC' | 'STATIC'
    disableLogScale: boolean
};

export default class StudyViewClinicalDataBinCountsCache extends MobxPromiseCache<StudyViewClinicalDataBinCountsQuery, DataBin[]> {
    private dataBinCache: { [attributeId: string]: DataBin[] };

    constructor() {
        super(
            q => ({
                invoke: async () => {
                    let dataBins: DataBin[] = this.dataBinCache[q.attribute.clinicalAttributeId + q.attribute.patientAttribute];

                    if (_.isUndefined(dataBins)) {
                        let studyIds = q.filters.studyIds || [];
                        if(_.isEmpty(studyIds)) {
                            studyIds = _.keys(_.reduce(q.filters.sampleIdentifiers,(acc: {[id:string]:boolean}, next) => {
                                acc[next.studyId] = true;
                                return acc;
                            }, {}));
                        }

                        dataBins = await internalClient.fetchClinicalDataBinCountsUsingPOST({
                            dataBinMethod: q.method,
                            disableLogScale: q.disableLogScale,
                            attributeId: q.attribute.clinicalAttributeId,
                            clinicalDataType: q.attribute.patientAttribute ? 'PATIENT' : 'SAMPLE',
                            studyViewFilter: { studyIds: studyIds } as any
                        });

                        this.dataBinCache[q.attribute.clinicalAttributeId + q.attribute.patientAttribute] = dataBins;
                    }

                    if (_.isEmpty(dataBins) ||
                        !_.isUndefined(q.filters.sampleIdentifiers) ||
                        !_.isEmpty(q.filters.clinicalDataEqualityFilters) ||
                        !_.isEmpty(q.filters.clinicalDataIntervalFilters) ||
                        q.method !== undefined ||
                        q.disableLogScale !== undefined)
                    {
                        dataBins = await internalClient.fetchClinicalDataBinCountsUsingPOST({
                            dataBinMethod: q.method,
                            disableLogScale: q.disableLogScale,
                            attributeId: q.attribute.clinicalAttributeId,
                            clinicalDataType: q.attribute.patientAttribute ? 'PATIENT' : 'SAMPLE',
                            studyViewFilter: q.filters
                        });
                    }

                    return Promise.resolve(dataBins);
                }
            }),
            q => JSON.stringify(q)
        );

        this.dataBinCache = {};
    }
}
