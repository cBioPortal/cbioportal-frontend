import * as React from 'react';
import {Td} from 'reactable';
import {If} from 'react-if';
import {IColumnFormatterData} from "../../../../shared/components/enhancedReactTable/IColumnFormatter";
import Tooltip from 'rc-tooltip';
import 'rc-tooltip/assets/bootstrap_white.css';
import {MutationTableRowData} from "../../../../shared/components/mutationTable/IMutationTableProps";


export default class CohortColumnFormatter {

    public static renderFunction(data:IColumnFormatterData<MutationTableRowData>, columnProps:any) {
        const qValue:number = CohortColumnFormatter.getQValue(data, columnProps.data);
        const qValueThreshold:number = 0.1; // TODO: what to use here?
        return (
            <Td key={data.name} column={data.name}>
                <If condition={(qValue !== null) && (qValue <= qValueThreshold)}>
                    {CohortColumnFormatter.makeMutSigIcon(qValue)};
                </If>
            </Td>
        );
    };

    private static getQValue(data:IColumnFormatterData<MutationTableRowData>, mutSigData:any) {
        if (!mutSigData || !data.rowData || data.rowData.length === 0) {
            return null;
        }
        mutSigData = mutSigData[data.rowData[0].entrezGeneId];
        if (!mutSigData) {
            return null;
        }
        return mutSigData.qValue;
    }

    private static makeMutSigIcon(qValue:number) {
        return (<Tooltip
            placement="left"
            overlay={CohortColumnFormatter.getMutSigTooltip(qValue)}
            arrowContent={<div className="rc-tooltip-arrow-inner"/>}
        >
            <svg width="12" height="12">
                <circle r="5" cx="6" cy="6" stroke="#55C" fill="none"/>
                <text x="3" y="8.5" fontSize="7" fill="#66C">
                    M
                </text>
            </svg>
        </Tooltip>);
    }

    private static getMutSigTooltip(qValue:number) {
        return (<div>
            <span style={{fontWeight:'bold'}}>MutSig</span><br/>
            <span> Q-value: {(qValue || 0).toExponential(3)}</span>
        </div>);
    }
}
