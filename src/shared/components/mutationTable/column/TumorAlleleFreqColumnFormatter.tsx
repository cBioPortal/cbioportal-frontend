import * as React from 'react';
import DefaultTooltip from "shared/components/DefaultTooltip";
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import TableCellStatusIndicator from "shared/components/TableCellStatus";
import {TableCellStatus} from "shared/components/TableCellStatus";

export default class TumorAlleleFreqColumnFormatter
{
    public static mainContent(frequency:number, altReads:number, refReads:number)
    {
        const overlay = (
            <span>
                <b>{altReads}</b> variant reads out of <b>{altReads + refReads}</b> total
            </span>
        );

        return (
            <DefaultTooltip
                placement="left"
                overlay={overlay}
                arrowContent={<div className="rc-tooltip-arrow-inner"/>}
                destroyTooltipOnHide={true}
            >
                <span>{frequency.toFixed(2)}</span>
            </DefaultTooltip>
        );
    }

    public static renderFunction(mutations:Mutation[]) {
        const frequency = TumorAlleleFreqColumnFormatter.getSortValue(mutations);

        if (frequency) {
            const altReads = mutations[0].tumorAltCount;
            const refReads = mutations[0].tumorRefCount;

            return TumorAlleleFreqColumnFormatter.mainContent(frequency, altReads, refReads);
        }
        else {
            return (
                <TableCellStatusIndicator status={TableCellStatus.NA} />
            );
        }
    }

    public static getSortValue(mutations:Mutation[])
    {
        const mutation = mutations[0];

        if (!mutation) {
            return null;
        }

        const altReads = mutation.tumorAltCount;
        const refReads = mutation.tumorRefCount;

        if ((altReads < 0) || (refReads < 0)) {
            return null;
        }

        return (altReads / (altReads + refReads));
    }

    public static isVisible(allMutations?: Mutation[][]): boolean {

        if (allMutations) {
            for (const rowMutations of allMutations) {
                const frequency = this.getSortValue(rowMutations);
                if (frequency) {
                    return true;
                }
            }
        }

        return false;
    }
}
