import * as React from "react";
import MobxPromiseCache from "../../../shared/lib/MobxPromiseCache";
import {ClinicalAttribute, ClinicalData, MolecularProfile, Sample} from "../../../shared/api/generated/CBioPortalAPI";
import {AxisMenuSelection, AxisType} from "./PlotsTab";
import d3Scale from "d3-scale";
import {computed} from "mobx";
import {MobxPromise} from "mobxpromise";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import {remoteData} from "../../../shared/api/remoteData";
import {IStringData} from "./PlotsTabUtils";
import ListIndexedMap from "../../../shared/lib/ListIndexedMap";

export interface ITablePlotProps {
    horzSelection:AxisMenuSelection;
    vertSelection:AxisMenuSelection;
    horzDataPromise:MobxPromise<IStringData>;
    vertDataPromise:MobxPromise<IStringData>;
    clinicalAttributeIdToClinicalAttribute:{[clinicalAttributeId:string]:ClinicalAttribute};
    molecularProfileIdToMolecularProfile:MobxPromise<{[molecularProfileId:string]:MolecularProfile}>;
}

interface ITableData {
    horzCategory:string;
    vertCategory:string;
    count:number;
}

const HOT_COLOR = "rgb(0, 102, 204)";
const COLD_COLOR = "rgb(255,255,255)";

export default class TablePlot extends React.Component<ITablePlotProps, {}> {
    readonly tableData = remoteData<ITableData[]>({
        await:()=>[
            this.props.horzDataPromise,
            this.props.vertDataPromise
        ],
        invoke: ()=>{
            const horzData = this.props.horzDataPromise.result!;
            const vertData = this.props.vertDataPromise.result!;

            const caseToCategories:{[caseKey:string]:{ horz:string, vert:string }} = {};
            for (const d of horzData) {
                caseToCategories[d.uniqueCaseKey] = caseToCategories[d.uniqueCaseKey] || {};
                caseToCategories[d.uniqueCaseKey].horz = d.value;
            }
            for (const d of vertData) {
                caseToCategories[d.uniqueCaseKey] = caseToCategories[d.uniqueCaseKey] || {};
                caseToCategories[d.uniqueCaseKey].vert = d.value;
            }

            const tableCounts:ListIndexedMap<number> = new ListIndexedMap(()=>0);
            for (const caseKey of Object.keys(caseToCategories)) {
                const caseCategories = caseToCategories[caseKey];
                tableCounts.set(
                    tableCounts.get(caseCategories.horz, caseCategories.vert)+1,
                    caseCategories.horz, caseCategories.vert
                );
            }

            return Promise.resolve(
                tableCounts.entries().map(entry=>({
                    horzCategory: entry[0],
                    vertCategory: entry[1],
                    count: entry.value
                }))
            );
        }
    });

    @computed get horzLabel() {
    }

    @computed get vertLabel() {
    }

    @computed get horzDescription() {
    }

    @computed get vertDescription() {
    }

    @computed get getCellColor():(val:number)=>string {
        if (!this.tableData.isComplete || !this.tableData.result.length) {
            return ()=>COLD_COLOR;
        }

        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;
        for (const d of this.tableData.result) {
            min = Math.min(min, d.count);
            max = Math.max(max, d.count);
        }
        return d3Scale.linear().domain([min, max]).range([COLD_COLOR, HOT_COLOR]);
    }

    render() {
        if (
            this.props.molecularProfileIdToMolecularProfile.isComplete && 
            this.props.uniquePatientKeyToSamples.isComplete
        ) {
        } else {
            return <LoadingIndicator isLoading={true}/>
        }
    }
}