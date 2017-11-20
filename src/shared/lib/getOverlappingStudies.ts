import {CancerStudy} from "../api/generated/CBioPortalAPI";
import * as _ from 'lodash';

export default function getOverlappingStudies(studies: CancerStudy[]):CancerStudy[][] {
    const groupedTCGAStudies = _.reduce(studies,(memo, study:CancerStudy)=>{
        if (/_tcga/.test(study.studyId)) {
            const initial = study.studyId.replace(/(_\d\d\d\d|_pub|(_pub\d\d\d\d))$/,'');
            if (initial) {
                if (initial in memo) {
                    memo[initial].push(study);
                } else {
                    memo[initial] = [study];
                }
            }
        }

        return memo;
    }, {} as { [studyId:string]:CancerStudy[] });
    return _.filter(groupedTCGAStudies, (grouping)=>grouping.length > 1);
}