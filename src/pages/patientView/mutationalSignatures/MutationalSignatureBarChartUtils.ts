import _ from 'lodash';
import { IMutationalCounts } from 'shared/model/MutationalSignature';
import { scalePoint, scaleBand } from 'd3-scale';
export interface IColorLegend extends IColorDataBar {
    group: string;
    subcategory?: string;
}

export interface IColorDataBar extends IMutationalCounts {
    colorValue: string;
    label: string;
    subcategory?: string;
}

export interface ColorMapProps {
    name: string;
    alternativeName: string;
    category: string;
    color: string;
    subcategory?: string;
}

export interface LegendLabelsType {
    group: string;
    label: string;
    color: string;
    subcategory?: string;
}
export interface DrawRectInfo {
    color: string;
    start: string;
    end: string;
}
export interface LabelInfo {
    color: string;
    start: string;
    end: string;
    category: string;
    group: string;
}
export interface LegendEntriesType {
    group: string;
    color: string;
    label: string;
    value: string;
}

export const colorMap: ColorMapProps[] = [
    {
        name: 'C>A',
        alternativeName: '_C-A_',
        category: 'C>A',
        color: 'lightblue',
    },
    {
        name: 'C>G',
        alternativeName: '_C-G_',
        category: 'C>G',
        color: 'darkblue',
    },
    { name: 'C>T', alternativeName: '_C-T_', category: 'C>T', color: 'red' },
    { name: 'T>A', alternativeName: '_T-A_', category: 'T>A', color: 'grey' },
    { name: 'T>C', alternativeName: '_T-C_', category: 'T>C', color: 'green' },
    { name: 'T>G', alternativeName: '_T-G_', category: 'T>G', color: 'pink' },
    {
        name: 'reference',
        alternativeName: 'reference',
        category: 'reference',
        color: '#1e97f3',
    },
    {
        name: 'AC>',
        alternativeName: 'AC-',
        category: 'AC>NN',
        color: 'skyblue',
    },
    {
        name: 'AT>',
        alternativeName: 'AT-',
        category: 'AT>NN',
        color: 'blue',
    },
    {
        name: 'CC>',
        alternativeName: 'CC-',
        category: 'CC>NN',
        color: 'lightgreen',
    },
    {
        name: 'CG>',
        alternativeName: 'CG-',
        category: 'CG>NN',
        color: 'darkgreen',
    },
    {
        name: 'CT>',
        alternativeName: 'CT-',
        category: 'CT>NN',
        color: 'pink',
    },
    {
        name: 'CG>',
        alternativeName: 'CG-',
        category: 'CG>NN',
        color: 'darkred',
    },
    {
        name: 'TA>',
        alternativeName: 'TA-',
        category: 'TA>NN',
        color: '#FF7F50',
    },
    {
        name: 'TC>',
        alternativeName: 'TC-',
        category: 'TC>NN',
        color: 'orange',
    },
    {
        name: 'TG>',
        alternativeName: 'TG-',
        category: 'TG>NN',
        color: '#ba55D3',
    },
    {
        name: 'TT>',
        alternativeName: 'TT-',
        category: 'TT>NN',
        color: 'purple',
    },
    {
        name: 'GC>',
        alternativeName: 'GC-',
        category: 'GC>NN',
        color: 'gold',
    },
    {
        name: '1:Del:C',
        alternativeName: '1_Del_C_',
        category: '1bp deletion',
        subcategory: 'C',
        color: '#f39c12',
    },
    {
        name: '1:Del:T',
        alternativeName: '1_Del_T_',
        category: '1bp deletion',
        subcategory: 'T',
        color: '#d68910',
    },
    {
        name: '2:Del:R',
        alternativeName: '2_Del_R_',
        category: '>1bp deletion',
        subcategory: '2',
        color: '#f1948a',
    },
    {
        name: '2:Del:M',
        alternativeName: '2_Del_M',
        category: 'Microhomology',
        subcategory: '2',
        color: '#D2B7F2',
    },
    {
        name: '3:Del:R',
        alternativeName: '3_Del_R',
        category: '>1bp deletion',
        subcategory: '3',
        color: '#ec7063',
    },
    {
        name: '3:Del:M',
        alternativeName: '3_Del_M',
        category: 'Microhomology',
        subcategory: '3',
        color: '#9b59b6',
    },
    {
        name: '4:Del:R',
        alternativeName: '4_Del_R',
        category: '>1bp deletion',
        subcategory: '4',
        color: '#e74c3c',
    },
    {
        name: '4:Del:M',
        alternativeName: '4_Del_M',
        category: 'Microhomology',
        subcategory: '4',
        color: '#7d3c98',
    },
    {
        name: '5:Del:R',
        alternativeName: '5_Del_R',
        category: '>1bp deletion',
        subcategory: '5',
        color: '#cb4335',
    },
    {
        name: '5:Del:M',
        alternativeName: '5_Del_M',
        category: 'Microhomology',
        subcategory: '5',
        color: '#4a235a',
    },
    {
        name: '1:Ins:T',
        alternativeName: '1_Ins_T',
        category: '1bp insertion',
        subcategory: 'T',
        color: '#28b463',
    },
    {
        name: '1:Ins:C',
        alternativeName: '1_Ins_C',
        category: '1bp insertion',
        subcategory: 'C',
        color: '#82e0aa',
    },
    {
        name: '2:Ins:M',
        alternativeName: '2_Ins_M',
        category: 'Microhomology',
        subcategory: '2',
        color: '#aed6f1',
    },
    {
        name: '2:Ins:R',
        alternativeName: '2_Ins_R',
        category: '>1bp insertion',
        subcategory: '2',
        color: '#33ffff',
    },
    {
        name: '3:Ins:M',
        alternativeName: '3_Ins_M',
        category: 'Microhomology',
        subcategory: '3',
        color: '#85c1e9',
    },
    {
        name: '3:Ins:R',
        alternativeName: '3_Ins_R',
        category: '>1bp insertion',
        subcategory: '3',
        color: '#aed6F1',
    },
    {
        name: '4:Ins:M',
        alternativeName: '4_Ins_M',
        category: 'Microhomology',
        subcategory: '4',
        color: '#85c1e9',
    },
    {
        name: '4:Ins:R',
        alternativeName: '4_Ins_R',
        category: '>1bp insertion',
        subcategory: '4',
        color: '#5dade2',
    },
    {
        name: '5:Ins:M',
        alternativeName: '5_Ins_M',
        category: 'Microhomology',
        subcategory: '5',
        color: '#3498db',
    },
    {
        name: '5:Ins:R',
        alternativeName: '5_Ins_R',
        category: '>1bp insertion',
        subcategory: '5',
        color: '#2874a6',
    },
];
export function getColorsForSignatures(
    dataset: IMutationalCounts[]
): IColorLegend[] {
    const colorTableData = dataset.map((obj: IMutationalCounts) => {
        if (obj.mutationalSignatureLabel !== '') {
            const colorIdentity = colorMap.filter(cmap => {
                if (
                    obj.mutationalSignatureLabel.indexOf('_') == -1 &&
                    obj.mutationalSignatureLabel.indexOf('-') == -1
                ) {
                    if (obj.mutationalSignatureLabel.match(cmap.name) != null) {
                        return cmap.color;
                    }
                } else {
                    if (
                        obj.mutationalSignatureLabel.match(
                            cmap.alternativeName
                        ) != null
                    ) {
                        return cmap.color;
                    }
                }
            });
            const label = obj.mutationalSignatureLabel;
            const group: string =
                colorIdentity.length > 0
                    ? colorIdentity[colorIdentity.length - 1].category
                    : 'unknown';
            const colorValue: string =
                colorIdentity.length > 0
                    ? colorIdentity[colorIdentity.length - 1].color
                    : '#EE4B2B';
            const subcategory: string =
                'subcategory' in colorIdentity[colorIdentity.length - 1]
                    ? colorIdentity[colorIdentity.length - 1].subcategory!
                    : ' ';
            return { ...obj, colorValue, label, subcategory, group };
        } else {
            const label = obj.mutationalSignatureLabel;
            const colorValue = '#EE4B2B';
            const group = ' ';
            const subcategory: string = ' ';
            return { ...obj, colorValue, label, subcategory, group };
        }
    });
    if (colorTableData[0].group !== ' ') {
        const colorTableDataSorted = _.sortBy(colorTableData, 'group');
        return colorTableDataSorted;
    } else {
        return colorTableData;
    }
}

export function getPercentageOfMutationalCount(
    inputData: IMutationalCounts[]
): IMutationalCounts[] {
    const sumValue = _.sum(inputData.map(item => item.value));
    return inputData.map(item => {
        const count = Math.round((item.value / sumValue!) * 100);
        return {
            uniqueSampleKey: item.uniqueSampleKey,
            patientId: item.patientId,
            uniquePatientKey: item.uniquePatientKey,
            studyId: item.studyId,
            sampleId: item.sampleId,
            mutationalSignatureLabel: item.mutationalSignatureLabel,
            mutationalSignatureClass: item.mutationalSignatureClass,
            version: item.version,
            value: count,
        };
    });
}

export function getxScalePoint(
    labels: LegendLabelsType[],
    xmin: number,
    xmax: number
) {
    return scaleBand()
        .domain(labels.map((x: LegendLabelsType) => x.label))
        .range([xmin, xmax]);
}
export function getLegendEntriesBarChart(
    labels: LegendLabelsType[]
): LegendEntriesType[] {
    return labels.map(item => ({
        group: item.group,
        color: item.color,
        label: item.label,
        value: item.label,
        subcategory: item.subcategory,
    }));
}

export function getCenterPositionLabelEntries(
    legendObjects: LegendEntriesType[]
): number[] {
    return Object.keys(_.groupBy(legendObjects, 'group')).map(x =>
        Math.round(_.groupBy(legendObjects, 'group')[x].length / 2)
    );
}
export function getLengthLabelEntries(
    legendObjects: LegendEntriesType[]
): number[] {
    return Object.keys(_.groupBy(legendObjects, 'group')).map(
        x => _.groupBy(legendObjects, 'group')[x].length
    );
}

export function createLegendLabelObjects(
    lengthObjects: number[],
    objects: LegendEntriesType[],
    labels: string[]
) {
    return labels.map(
        (identifier: string, i: number) =>
            _.groupBy(objects, 'group')[identifier][lengthObjects[i] - 1]
    );
}

export function formatLegendObjectsForRectangles(
    lengthLegendObjects: number[],
    legendEntries: LegendEntriesType[],
    labels: string[],
    version: string
) {
    if (version != 'ID') {
        const formatLegendRect = lengthLegendObjects.map((value, i) => ({
            color: _.groupBy(legendEntries, 'group')[labels[i]][0].color,
            start: _.groupBy(legendEntries, 'group')[labels[i]][0].value,
            end: _.groupBy(legendEntries, 'group')[labels[i]][value - 1].value,
        }));
        return formatLegendRect;
    } else {
        // Create a new object grouped by 'group' and 'subcategory
        const dataGroupByCategory = _.groupBy(legendEntries, 'subcategory');
        const dataGroupByGroup = Object.keys(dataGroupByCategory).map(item =>
            _.groupBy(dataGroupByCategory[item], 'group')
        );
        const result: any[] = [];
        dataGroupByGroup.map(item =>
            Object.keys(item).map(x => result.push(item[x]))
        );
        const formatLegendRect = result.map(itemLegend => ({
            color: itemLegend[0].color,
            start: itemLegend[0].label,
            end:
                itemLegend.length > 1
                    ? itemLegend[itemLegend.length - 1].label
                    : itemLegend[0].label,
            category: itemLegend[0].subcategory,
            group: itemLegend[0].group,
        }));
        return formatLegendRect;
    }
}
