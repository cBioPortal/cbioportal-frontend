import * as React from 'react';
import 'rc-tooltip/assets/bootstrap_white.css';
import SampleManager from "../../sampleManager";
import {isUncalled} from 'shared/lib/MutationUtils';

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
                        sampleManager.getComponentForSample(sample.id,
                                                            (presentSamples[sample.id]) ? 1 : 0.1,
                                                            (presentSamples[sample.id]) ? '' : "Mutation has supporting reads, but wasn't called"
                                                            )
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

    public static getPresentSamples<T extends {sampleId:string, tumorAltCount?: number, molecularProfileId?: string}>(data:T[]) {
        return data.reduce((map, next:T, currentIndex:number) => {
            // Indicate called mutations with true,
            // uncalled mutations with supporting reads as false
            // exclude uncalled mutations without supporting reads completely
            if (next.molecularProfileId && isUncalled(next.molecularProfileId)) {
                if (next.tumorAltCount && next.tumorAltCount > 0) {
                    map[next.sampleId] = false;
                }
            } else {
                map[next.sampleId] = true;
            }
            return map;
        }, {} as {[s:string]:boolean});
    }

    public static getSample(data:Array<{sampleId:string}>): string|string[] {
        let result: string[] =[];
        if (data) {
            data.forEach((datum:{sampleId:string}) => {
                result.push(datum.sampleId);
            })
        }
        if (result.length == 1) {
            return result[0];
        }
        return result;
    }
}
