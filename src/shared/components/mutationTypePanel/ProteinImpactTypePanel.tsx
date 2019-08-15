import * as React from "react";
import {IProteinImpactTypeColors} from "react-mutation-mapper";

import {Mutation} from "../../api/generated/CBioPortalAPI";
import {ILazyMobXTableApplicationDataStore} from "../../lib/ILazyMobXTableApplicationDataStore";
import {observer} from "mobx-react";
import {getProteinImpactType, ProteinImpactType} from "public-lib/lib/getCanonicalMutationType";

import styles from './styles.module.scss';

export interface IProteinImpactTypePanelProps extends IProteinImpactTypeColors
{
    dataStore:ILazyMobXTableApplicationDataStore<Mutation[]>;
}

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

    public handleMutationClick(type: ProteinImpactType){
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
                        {mutationTypeButton(proteinImpactTypeToCount[ProteinImpactType.MISSENSE],
                            'Missense',
                            this.props.missenseColor,
                            ()=>this.handleMutationClick(ProteinImpactType.MISSENSE)
                        )}
                    </td>
                    <td>
                        {mutationTypeButton(proteinImpactTypeToCount[ProteinImpactType.TRUNCATING],
                            'Truncating',
                            this.props.truncatingColor,
                            ()=>this.handleMutationClick(ProteinImpactType.TRUNCATING)
                        )}
                    </td>
                </tr>
                <tr>
                    <td>
                        {mutationTypeButton(proteinImpactTypeToCount[ProteinImpactType.INFRAME],
                            'Inframe',
                            this.props.inframeColor,
                            ()=>this.handleMutationClick(ProteinImpactType.INFRAME)
                        )}
                    </td>
                    <td>
                        {mutationTypeButton(proteinImpactTypeToCount[ProteinImpactType.OTHER],
                            'Other',
                            this.props.otherColor,
                            ()=>this.handleMutationClick(ProteinImpactType.OTHER)
                        )}
                    </td>
                </tr>
            </table>
        );
    }
}