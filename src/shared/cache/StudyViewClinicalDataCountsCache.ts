import MobxPromiseCache from "../lib/MobxPromiseCache";
import { ClinicalAttribute } from "../api/generated/CBioPortalAPI";
import { MobxPromise } from "mobxpromise";
import _ from "lodash";
import client from "../api/cbioportalClientInstance";
import internalClient from "../api/cbioportalInternalClientInstance";
import { ClinicalDataCount, StudyViewFilter } from "shared/api/generated/CBioPortalAPIInternal";

type StudyViewClinicalDataCountsQuery = {
    attribute: ClinicalAttribute
    filters: StudyViewFilter
}

async function fetch(query: StudyViewClinicalDataCountsQuery) {
    return await internalClient.fetchClinicalDataCountsUsingPOST({
        studyId: query.attribute.studyId,
        attributeId: query.attribute.clinicalAttributeId,
        clinicalDataType: query.attribute.patientAttribute ? 'PATIENT' : 'SAMPLE',
        studyViewFilter: query.filters
    });
}

export default class StudyViewClinicalDataCountsCache extends MobxPromiseCache<StudyViewClinicalDataCountsQuery, ClinicalDataCount[]> {
    constructor() {
        super(
            q => ({
                invoke: () => fetch(q)
            }),
            q => JSON.stringify(q)
        );
    }
}
