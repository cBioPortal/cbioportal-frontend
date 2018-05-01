import * as React from "react";
import * as d3Scale from "d3-scale";
import {action, computed, observable, whyRun} from "mobx";
import {observer} from "mobx-react";
import ListIndexedMap from "../../../shared/lib/ListIndexedMap";
import {IStringAxisData, tableCellTextColor} from "./PlotsTabUtils";
import naturalSort from "javascript-natural-sort";
import {bind} from "bind-decorator";

export interface ITablePlotProps {
    horzData:IStringAxisData["data"];
    vertData:IStringAxisData["data"];
}

interface ITableData {
    horzCategories:string[];
    vertCategories:string[];
    data:{
        horzCategory:string;
        vertCategory:string;
        count:number;
    }[];
}

const HOT_COLOR = "rgb(0, 102, 204)";
const COLD_COLOR = "rgb(255,255,255)";

const TABLE_LABEL_CLASSNAME = "plots-tab-table-label";

@observer
export default class TablePlot extends React.Component<ITablePlotProps, {}> {
    private paddingForLabelsSet = false;
    @observable paddingForLabels = 250;

    @computed get tableData():ITableData {
        const caseToCategories:{[caseKey:string]:{ horz?:string, vert?:string }} = {};
        for (const d of this.props.horzData) {
            caseToCategories[d.uniqueCaseKey] = caseToCategories[d.uniqueCaseKey] || {};
            caseToCategories[d.uniqueCaseKey].horz = d.value;
        }
        for (const d of this.props.vertData) {
            caseToCategories[d.uniqueCaseKey] = caseToCategories[d.uniqueCaseKey] || {};
            caseToCategories[d.uniqueCaseKey].vert = d.value;
        }

        // count by categories
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

        // produce data and collect categories
        const horzCategoriesMap:{[cat:string]:boolean} = {};
        const vertCategoriesMap:{[cat:string]:boolean} = {};
        const data = tableCounts.entries().map(entry=>{
            const horzCategory = entry.key[0];
            const vertCategory = entry.key[1];
            horzCategoriesMap[horzCategory] = true;
            vertCategoriesMap[vertCategory] = true;
            return {
                horzCategory,
                vertCategory,
                count: entry.value
            };
        });

        // sort categories
        const horzCategories = Object.keys(horzCategoriesMap);
        horzCategories.sort(naturalSort);
        const vertCategories = Object.keys(vertCategoriesMap);
        vertCategories.sort(naturalSort);

        // add missing data
        for (const horzCategory of horzCategories) {
            for (const vertCategory of vertCategories) {
                if (!tableCounts.has(horzCategory, vertCategory)) {
                    data.push({
                        horzCategory, vertCategory, count:0
                    });
                }
            }
        }

        return {
            horzCategories, vertCategories, data
        };
    }

    @computed get dataRange():{min:number, max:number} {
        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;
        for (const d of this.tableData.data) {
            min = Math.min(min, d.count);
            max = Math.max(max, d.count);
        }

        return {min, max};
    }

    @computed get getCellColor():(val:number)=>string {
        if (!this.tableData.data.length) {
            return ()=>COLD_COLOR;
        }
        return d3Scale.scaleLinear<string>().domain([this.dataRange.min, this.dataRange.max]).range([COLD_COLOR, HOT_COLOR]);
    }

    @computed get getTextColor():(val:number)=>string {
        if (!this.tableData.data.length) {
            return ()=>"rgb(0,0,0)";
        }
        const dataRange = this.dataRange;
        return (val:number)=>tableCellTextColor(val, dataRange.min, dataRange.max);
    }

    @computed get cellWidth() {
        // width of a single 0 at this font size is 7.625
        const ONE_CHAR_WIDTH = 7.625;
        const maxLengthText = Math.ceil(Math.log10(this.dataRange.max));
        const padding = 3;
        return Math.max(70, ONE_CHAR_WIDTH*maxLengthText + 2*padding); // min width 70
    }

    @computed get cellHeight() {
        return 20;
    }

    @computed get tableTopLeft() {
        return [this.paddingForLabels,25];
    }

    private getCellCoordinates(horzCategory:string, vertCategory:string) {
        const tableTopLeft = this.tableTopLeft;
        return {
            x: tableTopLeft[0] + this.cellWidth * this.tableData.horzCategories.indexOf(horzCategory),
            y: tableTopLeft[1] + this.cellHeight * this.tableData.vertCategories.indexOf(vertCategory)
        };
    }

    @computed get tableBottomRight() {
        const lastHorzCategory = this.tableData.horzCategories[this.tableData.horzCategories.length-1];
        const lastVertCategory = this.tableData.vertCategories[this.tableData.vertCategories.length-1];
        const lastCellCoords = this.getCellCoordinates(lastHorzCategory, lastVertCategory);
        return [lastCellCoords.x + this.cellWidth, lastCellCoords.y + this.cellHeight];
    }
    
    @computed get svgSize() {
        const width = this.tableBottomRight[0] + 25;
        const height = this.tableBottomRight[1] + this.paddingForLabels;
        return {
            width, height
        };
    }

    private makeRectAndText(horzCategory:string, vertCategory:string, count:number) {
        const coords = this.getCellCoordinates(horzCategory, vertCategory);
        return [
            <rect
                key={`${horzCategory},${vertCategory},rect`}
                width={this.cellWidth}
                height={this.cellHeight}
                x={coords.x}
                y={coords.y}
                style={{
                    fill: this.getCellColor(count),
                    stroke: "rgb(208,208,208)"
                }}
            />,
            <text
                key={`${horzCategory},${vertCategory},text`}
                x={coords.x + this.cellWidth/2}
                y={coords.y + this.cellHeight/2}
                dy="0.3em"
                textAnchor="middle"
                fill={this.getTextColor(count)}
                fontSize={12}
            >
                {count}
            </text>
        ];
    }

    private makeLabel(category:string, horz:boolean) {
        const coords = this.getCellCoordinates(horz ? category : "", horz ? "" : category);
        const padding = 5;
        const x = horz ? (coords.x + this.cellWidth/2) : (this.tableTopLeft[0] - padding);
        const y = horz ? (this.tableBottomRight[1] + 3*padding) : (coords.y + this.cellHeight/2);
        return (
            <text
                className={TABLE_LABEL_CLASSNAME}
                key={`${category},${horz}`}
                dy="0.3em"
                transform={`translate(${x},${y}) ${horz ? "rotate(-70)" : ""}`}
                textAnchor="end"
                fill="black"
                fontWeight="bold"
            >
                {category}
            </text>
        );
    }

    private updatePaddingForLabels() {
        if (!this.paddingForLabelsSet) {
            // get maximum width and height for labels
            let max = 0;
            let box;
            for (const labelElt of (document.getElementsByClassName(TABLE_LABEL_CLASSNAME) as SVGTextElement[])) {
                box = labelElt.getBBox();
                max = Math.max(max, box.width);
                max = Math.max(max, box.height);
            }
            this.paddingForLabels = max + 50; // bump up bc bbox typically underestimates slightly
            this.paddingForLabelsSet = true;
        } else {
            this.paddingForLabelsSet = false;
        }
    }

    componentDidMount() {
        this.updatePaddingForLabels();
    }

    componentDidUpdate() {
        this.updatePaddingForLabels();
    }

    render() {
        const elts = this.tableData.data.map(d=>this.makeRectAndText(d.horzCategory, d.vertCategory, d.count));
        const horzLabels = this.tableData.horzCategories.map(c=>this.makeLabel(c, true));
        const vertLabels = this.tableData.vertCategories.map(c=>this.makeLabel(c, false));
        const svgSize = this.svgSize;
        return (
            <svg width={svgSize.width} height={svgSize.height}>
                {elts}
                {horzLabels}
                {vertLabels}
            </svg>
        );
    }
}