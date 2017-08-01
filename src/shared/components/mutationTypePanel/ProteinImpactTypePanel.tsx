import * as React from "react";

import {Mutation} from "../../api/generated/CBioPortalAPI";
import {IMobXApplicationDataStore} from "../../lib/IMobXApplicationDataStore";
import {observer} from "mobx-react";
import {
    ProteinImpactType,
    getProteinImpactType
} from "../../lib/getCanonicalMutationType";
import {IProteinImpactTypeColors} from "shared/lib/MutationUtils";

import styles from './styles.module.scss';

export interface IProteinImpactTypePanelProps extends IProteinImpactTypeColors
{
    dataStore:IMobXApplicationDataStore<Mutation[]>;
}

const buttonOrder:ProteinImpactType[] = ["missense", "truncating", "inframe", "other"];

export function mutationTypeButton(count:number, label:string, color:string, onClick:()=>void) {

    return (
        <span key={label} onClick={onClick} style={{ cursor:'pointer' }}>
                <span className="badge" style={{
                    backgroundColor: color,
                }}>{count || 0}</span>
                <span style={{color:color}}>{label}</span>
            </span>
    );
}

@observer
export default class ProteinImpactTypePanel extends React.Component<IProteinImpactTypePanelProps, {}> {

    public handleMutationClick(type: string){
        this.props.dataStore.setFilter((d:Mutation[])=>(getProteinImpactType(d[0].mutationType) === type));
        this.props.dataStore.filterString = "";
    }

    render() {
        const proteinImpactTypeToCount:{[proteinImpactType:string]:number} = {};
        for (const datum of this.props.dataStore.sortedFilteredData) {
            const type = getProteinImpactType(datum[0].mutationType);
            proteinImpactTypeToCount[type] = proteinImpactTypeToCount[type] || 0;
            proteinImpactTypeToCount[type] += 1;
        }
        return (
            <table className={styles.mutationTypeTable}>
                <tr>
                    <td>
                        {mutationTypeButton(proteinImpactTypeToCount['missense'], 'Missense', this.props.missenseColor,  ()=>this.handleMutationClick('missense') )}
                    </td>
                    <td>
                        {mutationTypeButton(proteinImpactTypeToCount['truncating'], 'Truncating', this.props.truncatingColor,  ()=>this.handleMutationClick('truncating') )}
                    </td>
                </tr>
                <tr>
                    <td>
                        {mutationTypeButton(proteinImpactTypeToCount['inframe'], 'Inframe', this.props.inframeColor,  ()=>this.handleMutationClick('inframe') )}
                    </td>
                    <td>
                        {mutationTypeButton(proteinImpactTypeToCount['other'], 'Other', this.props.otherColor,  ()=>this.handleMutationClick('other') )}
                    </td>
                </tr>
            </table>
        )

    }
}