import * as React from 'react';
import { observer } from 'mobx-react';
import { computed, makeObservable, observable } from 'mobx';
import _ from 'lodash';
import LabeledCheckbox from 'shared/components/labeledCheckbox/LabeledCheckbox';
import FixedHeaderTable from 'pages/studyView/table/FixedHeaderTable';
import styles from 'pages/studyView/table/tables.module.scss';
import {
    Column,
    SortDirection,
} from 'shared/components/lazyMobXTable/LazyMobXTable';
import {
    correctColumnWidth,
    correctMargin,
    getFixedHeaderNumberCellMargin,
    getFrequencyStr,
    O2glDemoRow,
} from 'pages/studyView/StudyViewUtils';
import { EllipsisTextTooltip } from 'cbioportal-frontend-commons';
import { TreatmentGenericColumnHeader } from 'pages/studyView/table/treatments/treatmentsTableUtil';

export interface O2glDemoTableProps {
    data: O2glDemoRow[];
    width: number;
    height: number;
}

export enum O2glDemoColumnKey {
    GENE = 'Gene',
    ONCOTREE = 'Oncotree',
    ALTERATION = 'Alteration',
    NUMBER = '#',
    FREQ = 'Freq',
}

const DEFAULT_COLUMN_WIDTH_RATIO: {
    [key in O2glDemoColumnKey]: number;
} = {
    [O2glDemoColumnKey.GENE]: 0.24,
    [O2glDemoColumnKey.ONCOTREE]: 0.16,
    [O2glDemoColumnKey.ALTERATION]: 0.3,
    [O2glDemoColumnKey.NUMBER]: 0.15,
    [O2glDemoColumnKey.FREQ]: 0.15,
};

export function filterO2glDemoRow(
    row: O2glDemoRow,
    filterString: string,
    filterStringUpper: string
): boolean {
    if (!filterString) {
        return true;
    }
    const freqLabel = getFrequencyStr(row.freq);
    return (
        row.gene.toUpperCase().includes(filterStringUpper) ||
        row.oncotree.toUpperCase().includes(filterStringUpper) ||
        row.alteration.toUpperCase().includes(filterStringUpper) ||
        row.count.toString().includes(filterString) ||
        freqLabel.includes(filterString)
    );
}

@observer
export default class O2glDemoTable extends React.Component<
    O2glDemoTableProps,
    {}
> {
    @observable private sortBy: O2glDemoColumnKey = O2glDemoColumnKey.FREQ;
    @observable private sortDirection: SortDirection = 'desc';

    constructor(props: O2glDemoTableProps) {
        super(props);
        makeObservable(this);
    }

    @computed
    get columnsWidth() {
        const totalWidth = this.props.width;
        const widths = {
            [O2glDemoColumnKey.GENE]: correctColumnWidth(
                totalWidth * DEFAULT_COLUMN_WIDTH_RATIO[O2glDemoColumnKey.GENE]
            ),
            [O2glDemoColumnKey.ONCOTREE]: correctColumnWidth(
                totalWidth *
                    DEFAULT_COLUMN_WIDTH_RATIO[O2glDemoColumnKey.ONCOTREE]
            ),
            [O2glDemoColumnKey.ALTERATION]: correctColumnWidth(
                totalWidth *
                    DEFAULT_COLUMN_WIDTH_RATIO[O2glDemoColumnKey.ALTERATION]
            ),
            [O2glDemoColumnKey.NUMBER]: correctColumnWidth(
                totalWidth *
                    DEFAULT_COLUMN_WIDTH_RATIO[O2glDemoColumnKey.NUMBER]
            ),
            [O2glDemoColumnKey.FREQ]: correctColumnWidth(
                totalWidth * DEFAULT_COLUMN_WIDTH_RATIO[O2glDemoColumnKey.FREQ]
            ),
        };
        const usedWidth = _.sum(_.values(widths));
        widths[O2glDemoColumnKey.FREQ] += Math.max(totalWidth - usedWidth, 0);
        return widths;
    }

    @computed
    get numberCellMargin() {
        if (!this.props.data.length) {
            return 0;
        }
        const maxCount = _.max(this.props.data.map(row => row.count)) || 0;
        return correctMargin(
            getFixedHeaderNumberCellMargin(
                this.columnsWidth[O2glDemoColumnKey.NUMBER],
                maxCount.toLocaleString()
            )
        );
    }

    @computed
    get freqCellMargin() {
        if (!this.props.data.length) {
            return 0;
        }
        const maxFreq = _.max(this.props.data.map(row => row.freq)) || 0;
        return correctMargin(
            getFixedHeaderNumberCellMargin(
                this.columnsWidth[O2glDemoColumnKey.FREQ],
                getFrequencyStr(maxFreq)
            )
        );
    }

    @computed
    get columns(): Column<O2glDemoRow>[] {
        return [
            {
                name: O2glDemoColumnKey.GENE,
                render: (data: O2glDemoRow) => (
                    <EllipsisTextTooltip text={data.gene} />
                ),
                sortBy: (data: O2glDemoRow) => data.gene,
                filter: filterO2glDemoRow,
                width: this.columnsWidth[O2glDemoColumnKey.GENE],
            },
            {
                name: O2glDemoColumnKey.ONCOTREE,
                render: (data: O2glDemoRow) => (
                    <EllipsisTextTooltip text={data.oncotree} />
                ),
                sortBy: (data: O2glDemoRow) => data.oncotree,
                filter: filterO2glDemoRow,
                width: this.columnsWidth[O2glDemoColumnKey.ONCOTREE],
            },
            {
                name: O2glDemoColumnKey.ALTERATION,
                render: (data: O2glDemoRow) => (
                    <EllipsisTextTooltip text={data.alteration} />
                ),
                sortBy: (data: O2glDemoRow) => data.alteration,
                filter: filterO2glDemoRow,
                width: this.columnsWidth[O2glDemoColumnKey.ALTERATION],
            },
            {
                name: O2glDemoColumnKey.NUMBER,
                headerRender: () => (
                    <TreatmentGenericColumnHeader
                        margin={this.numberCellMargin}
                        headerName={O2glDemoColumnKey.NUMBER}
                    />
                ),
                render: (data: O2glDemoRow) => (
                    <LabeledCheckbox
                        disabled={true}
                        labelProps={{
                            style: {
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginLeft: 0,
                                marginRight: this.numberCellMargin,
                            },
                        }}
                        inputProps={{
                            className: styles.autoMarginCheckbox,
                        }}
                    >
                        <span>{data.count.toLocaleString()}</span>
                    </LabeledCheckbox>
                ),
                sortBy: (data: O2glDemoRow) => data.count,
                filter: filterO2glDemoRow,
                width: this.columnsWidth[O2glDemoColumnKey.NUMBER],
            },
            {
                name: O2glDemoColumnKey.FREQ,
                headerRender: () => (
                    <TreatmentGenericColumnHeader
                        margin={this.freqCellMargin}
                        headerName={O2glDemoColumnKey.FREQ}
                    />
                ),
                render: (data: O2glDemoRow) => (
                    <div
                        className={styles.pullRight}
                        style={{ marginLeft: this.freqCellMargin }}
                    >
                        {getFrequencyStr(data.freq)}
                    </div>
                ),
                sortBy: (data: O2glDemoRow) => data.freq,
                filter: filterO2glDemoRow,
                width: this.columnsWidth[O2glDemoColumnKey.FREQ],
            },
        ];
    }

    render() {
        return (
            <FixedHeaderTable
                data={this.props.data}
                columns={this.columns}
                width={this.props.width}
                height={this.props.height}
                sortBy={this.sortBy}
                sortDirection={this.sortDirection}
                numberOfSelectedRows={0}
            />
        );
    }
}
