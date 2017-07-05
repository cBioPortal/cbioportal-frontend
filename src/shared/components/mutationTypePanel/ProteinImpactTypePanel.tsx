import * as React from "react";

import {Mutation} from "../../api/generated/CBioPortalAPI";
import {IMobXApplicationDataStore} from "../../lib/IMobXApplicationDataStore";
import {observer} from "mobx-react";
import {computed} from "mobx";
import MutationTypePanel from "./MutationTypePanel";
import {
    ProteinImpactType,
    getProteinImpactType
} from "../../lib/getCanonicalMutationType";
import {IProteinImpactTypeColors} from "shared/lib/MutationUtils";
import {MutationTypePanelButton} from "./MutationTypePanel";

export interface IProteinImpactTypePanelProps extends IProteinImpactTypeColors
{
    dataStore:IMobXApplicationDataStore<Mutation[]>;
}

const buttonOrder:ProteinImpactType[] = ["missense", "truncating", "inframe", "other"];

@observer
export default class ProteinImpactTypePanel extends React.Component<IProteinImpactTypePanelProps, {}> {
    @computed get typeToColor():{[proteinImpactType:string]:string} {
        return {
            "missense": this.props.missenseColor,
            "truncating": this.props.truncatingColor,
            "inframe": this.props.inframeColor,
            "other": this.props.otherColor
        };
    }

    @computed get presentTypes() {
        const present:{[proteinImpactType:string]:boolean} = {};
        for (const datum of this.props.dataStore.allData) {
            present[getProteinImpactType(datum[0].mutationType)] = true;
        }
        return present;
    }

    @computed get buttons() {
        const proteinImpactTypeToCount:{[proteinImpactType:string]:number} = {};
        for (const datum of this.props.dataStore.sortedFilteredData) {
            const type = getProteinImpactType(datum[0].mutationType);
            proteinImpactTypeToCount[type] = proteinImpactTypeToCount[type] || 0;
            proteinImpactTypeToCount[type] += 1;
        }
        return buttonOrder.reduce((list:MutationTypePanelButton[], type:ProteinImpactType)=>{
            if (this.presentTypes[type]) {
                list.push({
                    label: type[0].toUpperCase() + type.slice(1),
                    color: this.typeToColor[type],
                    count: proteinImpactTypeToCount[type] || 0,
                    onClick: ()=>{
                        this.props.dataStore.setFilter((d:Mutation[])=>(getProteinImpactType(d[0].mutationType) === type));
                        this.props.dataStore.filterString = "";
                    }
                });
            }
            return list;
        }, []);
    }

    render() {
        return (<MutationTypePanel buttons={this.buttons}/>);
    }
}