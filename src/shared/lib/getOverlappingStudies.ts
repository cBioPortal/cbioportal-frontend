import {CancerStudy} from "../api/generated/CBioPortalAPI";
import * as _ from 'lodash';

//testIt
export default function getOverlappingStudies(studies: CancerStudy[]):CancerStudy[][] {
    const groupedTCGAStudies = _.reduce(studies,(memo, study:CancerStudy)=>{
        if (/_tcga/.test(study.studyId)) {
            const initial = study.studyId.match(/^[^_]*_[^_]*/);
            if (initial) {
                if (initial[0] in memo) {
                    memo[initial[0]].push(study);
                } else {
                    memo[initial[0]] = [study];
                }
            }
        }
        return memo;
    }, {} as { [studyId:string]:CancerStudy[] });
    return _.filter(groupedTCGAStudies, (grouping)=>grouping.length > 1);
}