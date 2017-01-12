import * as React from 'react';
import {Td} from 'reactable';
import {IColumnFormatterData} from "../../../../shared/components/enhancedReactTable/IColumnFormatter";
import Tooltip from 'rc-tooltip';
import {compareNumberLists} from '../../../../shared/lib/SortUtils';
import 'rc-tooltip/assets/bootstrap_white.css';


export default class TumorColumnFormatter {

    static circleRadius = 6;
    static circleSpacing = 4;
    static indexToCircleLeft = (n:number) => n*(TumorColumnFormatter.circleSpacing + 2*TumorColumnFormatter.circleRadius);

    public static renderFunction(data:IColumnFormatterData, columnProps:any) {

        const samples = TumorColumnFormatter.getSampleIds(data);

        const presentSamples = samples.reduce((map:{[s:string]:boolean}, sampleId:string) => {map[sampleId] = true; return map;}, {});

        let tdValue = columnProps.sampleManager.samples.map((sample: any) => {
                return (
                    <li className={(sample.id in presentSamples) ? '' : 'invisible'}>
                        {
                        columnProps.sampleManager.getComponentForSample(sample.id, { showText: false })
                        }
                    </li>
                )
        });

        return (
            <Td column={data.name}>
                <div style={{position:'relative'}}>
                    <ul  style={{marginBottom:0}} className="list-inline list-unstyled">{ tdValue }</ul>
                </div>
            </Td>
        );
    };

    public static sortFunction(a:number[], b:number[]):number {
        return compareNumberLists(a, b);
    }

    private static getSampleIds(data:IColumnFormatterData) {
        return data.rowData.map((x:any) => x.sampleId);
    }
}
