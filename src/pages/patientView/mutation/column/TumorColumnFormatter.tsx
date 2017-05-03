import * as React from 'react';
import 'rc-tooltip/assets/bootstrap_white.css';
import SampleManager from "../../sampleManager";
import {GENETIC_PROFILE_UNCALLED_MUTATIONS_SUFFIX} from '../../../../shared/constants';


export default class TumorColumnFormatter {

    public static renderFunction<T extends {sampleId:string}>(data:T[], sampleManager:SampleManager|null) {

        if (!sampleManager) {
            return (<span></span>);
        }

        const presentSamples = TumorColumnFormatter.getPresentSamples(data);

        let tdValue = sampleManager.samples.map((sample: any) => {
                // hide labels for non-existent mutation data
                // decreased opacity for uncalled mutations
                return (
                    <li className={(sample.id in presentSamples) ? '' : 'invisible'}>
                        {
                        sampleManager.getComponentForSample(sample.id, (presentSamples[sample.id]) ? 1 : 0.1)
                        }
                    </li>
                );
        });

        return (
                <div style={{position:'relative'}}>
                    <ul  style={{marginBottom:0}} className="list-inline list-unstyled">{ tdValue }</ul>
                </div>
        );
    };

    public static getSortValue<T extends {sampleId:string}>(d:T[], sampleManager:SampleManager|null) {
        if (!sampleManager) {
            return [];
        } else {
            const presentSamples = TumorColumnFormatter.getPresentSamples(d);
            const ret = [];
            // First, we sort by the number of present and called samples
            ret.push(Object.keys(presentSamples).filter((s) => presentSamples[s]).length);
            // Then, we sort by the particular ones present
            for (const sampleId of sampleManager.getSampleIdsInOrder()) {
                ret.push(+(!!presentSamples[sampleId]));
            }
            return ret;
        }
    }

    public static getPresentSamples<T extends {sampleId:string, tumorAltCount?: number, geneticProfileId?: string}>(data:T[]) {
        return data.reduce((map:{[s:string]:boolean}, next:T, currentIndex:number) => {
            // Indicate called mutations with true,
            // uncalled mutations with supporting reads as false
            // exclude uncalled mutations without supporting reads completely
            if (next.geneticProfileId && next.geneticProfileId.endsWith(GENETIC_PROFILE_UNCALLED_MUTATIONS_SUFFIX)) {
                if (next.tumorAltCount && next.tumorAltCount > 0) {
                    map[next.sampleId] = false;
                }
            } else {
                map[next.sampleId] = true;
            }
            return map;
        }, {});
    }
}
