import { CancerStudy } from 'cbioportal-ts-api-client';
import * as _ from 'lodash';

export default function getOverlappingStudies(
    studies: CancerStudy[]
): CancerStudy[][] {
    const groupedTCGAStudies = _.reduce(
        studies,
        (memo, study: CancerStudy) => {
            if (/_tcga/.test(study.studyId)) {
                // we need to find when root of study name is in duplicate, so strip out the modifiers (pub or pancan)
                const initial = study.studyId.replace(
                    /(_\d\d\d\d|_pub|(_pub\d\d\d\d)|_pan_can_atlas_\d\d\d\d)$/g,
                    ''
                );
                if (initial) {
                    if (initial in memo) {
                        memo[initial].push(study);
                    } else {
                        memo[initial] = [study];
                    }
                }
            }

            return memo;
        },
        {} as { [studyId: string]: CancerStudy[] }
    );
    return _.filter(groupedTCGAStudies, grouping => grouping.length > 1);
}
