import * as React from 'react';
import {Td} from 'reactable';
import DefaultTooltip from 'shared/components/DefaultTooltip';
import * as _ from 'lodash';
import {IColumnFormatterData} from "../../enhancedReactTable/IColumnFormatter";
import {MutationTableRowData} from "../IMutationTableProps";
import {Mutation} from "../../../api/generated/CBioPortalAPI";
import {CosmicMutation} from "../../../api/generated/CBioPortalAPIInternal";
import CosmicMutationTable from "../../cosmic/CosmicMutationTable";
import styles from "./cosmic.module.scss";

export interface ICosmicData {
    [keyword:string]: CosmicMutation[];
}

export function placeArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.right = '10px';
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
        const position:RegExp = /[0-9]+/g;
        const matched:RegExpMatchArray|null = proteinChange.match(position);

        if (matched) {
            return matched[0];
        }
        else {
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

        return value;
    }

    public static renderFunction(data:Mutation[], cosmicData?:ICosmicData)
    {
        const cosmic:CosmicMutation[]|null = CosmicColumnFormatter.getData(data, cosmicData);

        let value:number = -1;
        let display:string = "";
        let overlay:JSX.Element|null = null;
        let content:JSX.Element;

        // calculate sum of the all counts
        if (cosmic && cosmic.length > 0)
        {
            value = _.reduce(_.map(cosmic, "count"), (sum:number, count:number) => {
                return sum + count;
            });

            overlay = (
                <span className={styles["cosmic-table"]}>
                    <b>{value}</b> occurrences of <b>{cosmic[0].keyword}</b> mutations in COSMIC
                    <CosmicMutationTable rawData={cosmic}/>
                </span>
            );

            display = value.toString();
        }

        // basic content is the value
        content = (
            <span>
                {display}
            </span>
        );

        // add a tooltip if the cosmic value is valid
        if (overlay)
        {
            const arrowContent = <div className="rc-tooltip-arrow-inner"/>;

            content = (
                <DefaultTooltip
                    overlay={overlay}
                    placement="topLeft"
                    arrowContent={arrowContent}
                    onPopupAlign={placeArrow}
                >
                    {content}
                </DefaultTooltip>
            );
        }

        // TODO if(!columnProps.cosmicData) -> loader image
        return content;
    }
}
