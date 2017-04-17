import * as React from 'react';
import 'rc-tooltip/assets/bootstrap_white.css';
import SampleManager from "../../sampleManager";


export default class TumorColumnFormatter {

    public static renderFunction<T extends {sampleId:string}>(data:T[], sampleManager:SampleManager|null) {

        if (!sampleManager) {
            return (<span></span>);
        }

        const presentSamples = TumorColumnFormatter.getPresentSamples(data);

        let tdValue = sampleManager.samples.map((sample: any) => {
                return (
                    <li className={(sample.id in presentSamples) ? '' : 'invisible'}>
                        {
                        sampleManager.getComponentForSample(sample.id, false)
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
            // First, we sort by the number of present samples
            ret.push(Object.keys(presentSamples).length);
            // Then, we sort by the particular ones present
            for (const sampleId of sampleManager.getSampleIdsInOrder()) {
                ret.push(+(!!presentSamples[sampleId]))
            }
            return ret;
        }
    }

    private static getPresentSamples<T extends {sampleId:string}>(data:T[]) {
        return data.reduce((map:{[s:string]:boolean}, next:T)=>{
            map[next.sampleId] = true;
            return map;
        }, {});
    }
}
