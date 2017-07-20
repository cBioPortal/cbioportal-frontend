import * as React from "react";
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import TableCellStatusIndicator from "shared/components/TableCellStatus";
import {TableCellStatus} from "shared/components/TableCellStatus";

export default class CancerTypeColumnFormatter {

    public static getData(d: Mutation[], sampleIdToTumorType?: {[sampleId: string]: string}): string|null
    {
        let data: string|null = null;

        if (sampleIdToTumorType) {
            data = sampleIdToTumorType[d[0].sampleId] || null;
        }

        return data;
    }

    public static sortBy(d: Mutation[], sampleIdToTumorType?: {[sampleId: string]: string}): string|null
    {
        const data = CancerTypeColumnFormatter.getData(d, sampleIdToTumorType);

        if (data) {
            return data;
        }
        else {
            return null;
        }
    }

    public static filter(d: Mutation[],
                         filterStringUpper: string,
                         sampleIdToTumorType?: {[sampleId: string]: string}): boolean
    {
        const data = CancerTypeColumnFormatter.getData(d, sampleIdToTumorType);

        return (
            data !== null &&
            data.toUpperCase().indexOf(filterStringUpper) > -1
        );
    }

    public static render(d: Mutation[], sampleIdToTumorType?: {[sampleId: string]: string})
    {
        const data = CancerTypeColumnFormatter.getData(d, sampleIdToTumorType);

        if (data) {
            return <span>{data}</span>;
        }
        else {
            return (
                <TableCellStatusIndicator
                    status={TableCellStatus.NA}
                    naAlt="Cancer type not available for this sample."
                />
            );
        }
    }
}
