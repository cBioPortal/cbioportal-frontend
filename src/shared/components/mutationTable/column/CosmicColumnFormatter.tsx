import * as React from 'react';
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import * as _ from 'lodash';
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import {CosmicMutation} from "shared/api/generated/CBioPortalAPIInternal";
import CosmicMutationTable from "shared/components/cosmic/CosmicMutationTable";
import styles from "./cosmic.module.scss";
import {ICosmicData} from "shared/model/Cosmic";
import generalStyles from "./styles.module.scss";
import {getProteinPositionFromProteinChange} from "../../../lib/ProteinChangeUtils";

export function placeArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.left = '10px';
}

/**
 * @author Selcuk Onur Sumer
 */
export default class CosmicColumnFormatter
{
    public static getData(rowData:Mutation[]|undefined, cosmicData?:ICosmicData)
    {
        let value: CosmicMutation[] | null = null;

        if (rowData && cosmicData)
        {
            const mutation:Mutation = rowData[0];
            const cosmicMutations: CosmicMutation[] | null = cosmicData[mutation.keyword];

            // further filtering by protein change
            if (cosmicMutations)
            {
                const mutPos = CosmicColumnFormatter.extractPosition(mutation.proteinChange);

                // not comparing the entire protein change value, only the position!
                value = cosmicMutations.filter((cosmic:CosmicMutation) => {
                    const cosmicPos = CosmicColumnFormatter.extractPosition(cosmic.proteinChange);
                    return mutPos && cosmicPos && (mutPos === cosmicPos);
                });
            }
        }

        return value;
    }

    public static extractPosition(proteinChange:string)
    {
        const pos = getProteinPositionFromProteinChange(proteinChange);
        if (pos) {
            return pos.start;
        } else {
            return null;
        }
    }

    public static getSortValue(data:Mutation[], cosmicData?:ICosmicData):number|null {
        const cosmic:CosmicMutation[]|null = CosmicColumnFormatter.getData(data, cosmicData);
        let value:number|null = null;

        // calculate sum of the all counts
        if (cosmic)
        {
            if (cosmic.length > 0) {
                value = _.reduce(_.map(cosmic, "count"), (sum:number, count:number) => {
                    return sum + count;
                }, 0);
            } else {
                value = 0;
            }
        }

        // we don't want zero to be a valid value for sorting
        // return null instead to exclude it from sorting
        if (value === 0) {
            value = null;
        }

        return value;
    }

    public static getDownloadValue(data:Mutation[], cosmicData?:ICosmicData):string {
        let value = CosmicColumnFormatter.getSortValue(data, cosmicData);

        if (value) {
            return `${value}`;
        }
        else {
            return "";
        }
    }

    public static renderFunction(data:Mutation[], cosmicData?:ICosmicData)
    {
        const cosmic:CosmicMutation[]|null = CosmicColumnFormatter.getData(data, cosmicData);

        let value:number = -1;
        let display:string = "";
        let overlay:(() => JSX.Element)|null = null;
        let content:JSX.Element;

        // calculate sum of the all counts
        if (cosmic && cosmic.length > 0)
        {
            value = _.reduce(_.map(cosmic, "count"), (sum:number , count:number) => {
                return sum + count;
            }, 0);

            overlay = () => (
                <span className={styles["cosmic-table"]}>
                    <b>{value}</b> occurrences of <b>{cosmic[0].keyword}</b> mutations in COSMIC
                    <CosmicMutationTable data={cosmic}/>
                </span>
            );

            display = value.toString();
        }

        // basic content is the value
        content = (
            <div className={generalStyles["integer-data"]}>
                {display}
            </div>
        );

        // add a tooltip if the cosmic value is valid
        if (overlay)
        {
            content = (
                <DefaultTooltip
                    overlay={overlay}
                    placement="topLeft"
                    onPopupAlign={placeArrow}
                    trigger={['hover', 'focus']}
                    destroyTooltipOnHide={true}
                >
                    {content}
                </DefaultTooltip>
            );
        }

        // TODO if(!columnProps.cosmicData) -> loader image
        return content;
    }
}
