import { remoteData } from 'cbioportal-frontend-commons';
import _ from 'lodash';
import client from 'shared/api/cbioportalClientInstance';
import { FEATURE_FLAG_METADATA } from 'shared/featureFlags';

export class FeatureFlagsModalStore {
    // studies that back a feature flag's relevantStudyIds - a flag with no
    // effect outside those studies is only worth showing to someone who can
    // access at least one. Access control is enforced server-side, so any
    // id missing from the response means this user can't see that study.
    readonly accessibleStudyIds = remoteData<string[]>({
        invoke: async () => {
            const candidateStudyIds = _.uniq(
                _.flatMap(
                    Object.values(FEATURE_FLAG_METADATA),
                    meta => meta.relevantStudyIds ?? []
                )
            );
            if (candidateStudyIds.length === 0) {
                return [];
            }
            const studies = await client.fetchStudiesUsingPOST({
                studyIds: candidateStudyIds,
                projection: 'ID',
            });
            return studies.map(s => s.studyId);
        },
        onError: () => {},
        default: [],
    });
}
