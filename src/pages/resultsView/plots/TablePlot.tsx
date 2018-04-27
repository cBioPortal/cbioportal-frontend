import * as React from "react";
import MobxPromiseCache from "../../../shared/lib/MobxPromiseCache";
import {ClinicalAttribute, ClinicalData, MolecularProfile, Sample} from "../../../shared/api/generated/CBioPortalAPI";
import {AxisMenuSelection, AxisType} from "./PlotsTab";
import d3Scale from "d3-scale";
import {computed} from "mobx";
import {MobxPromise} from "mobxpromise";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import {remoteData} from "../../../shared/api/remoteData";
import ListIndexedMap from "../../../shared/lib/ListIndexedMap";
import {getAxisDescription, getAxisLabel, IAxisData, isStringData, IStringAxisData} from "./PlotsTabUtils";

export interface ITablePlotProps {
    horzData:IStringAxisData["data"];
    vertData:IStringAxisData["data"];
    horzLabel:string;
    vertLabel:string;
    horzDescription:string;
    vertDescription:string;
}

interface ITableData {
    horzCategory:string;
    vertCategory:string;
    count:number;
}

const HOT_COLOR = "rgb(0, 102, 204)";
const COLD_COLOR = "rgb(255,255,255)";

export default class TablePlot extends React.Component<ITablePlotProps, {}> {
    @computed get tableData():ITableData[] {
        const caseToCategories:{[caseKey:string]:{ horz?:string, vert?:string }} = {};
        for (const d of this.props.horzData) {
            caseToCategories[d.uniqueCaseKey] = caseToCategories[d.uniqueCaseKey] || {};
            caseToCategories[d.uniqueCaseKey].horz = d.value;
        }
        for (const d of this.props.vertData) {
            caseToCategories[d.uniqueCaseKey] = caseToCategories[d.uniqueCaseKey] || {};
            caseToCategories[d.uniqueCaseKey].vert = d.value;
        }

        const tableCounts:ListIndexedMap<number> = new ListIndexedMap();
        for (const caseKey of Object.keys(caseToCategories)) {
            const caseCategories = caseToCategories[caseKey];
            if (caseCategories.horz && caseCategories.vert) {
                tableCounts.set(
                    (tableCounts.get(caseCategories.horz, caseCategories.vert) || 0)+1,
                    caseCategories.horz, caseCategories.vert
                );
            }
        }

        return tableCounts.entries().map(entry=>({
            horzCategory: entry.key[0],
            vertCategory: entry.key[1],
            count: entry.value
        }));
    }

    @computed get getCellColor():(val:number)=>string {
        if (!this.tableData.length) {
            return ()=>COLD_COLOR;
        }

        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;
        for (const d of this.tableData) {
            min = Math.min(min, d.count);
            max = Math.max(max, d.count);
        }
        return d3Scale.scaleLinear<string>().domain([min, max]).range([COLD_COLOR, HOT_COLOR]);
    }

    render() {
        return <span>Table goes here :)</span>;
    }
}