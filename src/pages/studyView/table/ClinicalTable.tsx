import * as React from "react";
import {observer} from "mobx-react";
import {action, computed, observable, toJS, reaction, IReactionDisposer} from "mobx";
import autobind from 'autobind-decorator';
import _ from "lodash";
import LabeledCheckbox from "shared/components/labeledCheckbox/LabeledCheckbox";
import {ClinicalDataCountWithColor} from "pages/studyView/StudyViewPageStore";
import FixedHeaderTable from "./FixedHeaderTable";
import styles from "./tables.module.scss";
import {
    correctColumnWidth,
    correctMargin, getClinicalAttributeOverlay,
    getFixedHeaderNumberCellMargin, getFixedHeaderTableMaxLengthStringPixel,
    getFrequencyStr
} from "../StudyViewUtils";
import {SortDirection} from "../../../shared/components/lazyMobXTable/LazyMobXTable";
import EllipsisTextTooltip from "../../../shared/components/ellipsisTextTooltip/EllipsisTextTooltip";
import {DEFAULT_SORTING_COLUMN} from "../StudyViewConfig";

export interface IClinicalTableProps {
    data: ClinicalDataCountWithColor[];
    filters: string[];
    highlightedRow?: (value: string | undefined) => void;
    onUserSelection: (values: string[]) => void;
    label?: string,
    labelDescription?: string,
    patientAttribute: boolean,
    width?: number,
    height?: number,
    showAddRemoveAllButtons?: boolean
}

class ClinicalTableComponent extends FixedHeaderTable<ClinicalDataCountWithColor> {

}

enum ColumnKey {
    CATEGORY = 'Category',
    NUMBER = '#',
    FREQ = 'Freq'
}

@observer
export default class ClinicalTable extends React.Component<IClinicalTableProps, {}> {
    private updateCellReaction:IReactionDisposer;
    @observable private sortBy: string = DEFAULT_SORTING_COLUMN;
    @observable private sortDirection: SortDirection;
    @observable private cellMargin: { [key: string]: number } = {
        [ColumnKey.CATEGORY]: 0,
        [ColumnKey.NUMBER]: 0,
        [ColumnKey.FREQ]: 0,
    };

    constructor(props: IClinicalTableProps) {
        super(props);

        this.updateCellReaction = reaction(() => this.columnsWidth, () => {
            this.updateCellMargin();
        }, {fireImmediately: true});
    }

    static readonly defaultProps = {
        width: 300,
        showAddRemoveAllButtons: false
    };

    @computed
    get columnsWidth() {
        // last two columns width are 80, 60
        return {
            [ColumnKey.CATEGORY]: correctColumnWidth(this.props.width! - 140),
            [ColumnKey.NUMBER]: 80,
            [ColumnKey.FREQ]: 60
        };
    }

    getFrequencyByCount(count:number) {
        return (count / this.totalCount) * 100;
    }

    @autobind
    @action
    updateCellMargin() {
        if (this.props.data.length > 0) {
            this.cellMargin[ColumnKey.NUMBER] = correctMargin(
                (this.columnsWidth[ColumnKey.NUMBER] - 10 - (
                        getFixedHeaderTableMaxLengthStringPixel(
                            _.max(this.props.data.map(item => item.count))!.toLocaleString()
                        ) + 20)
                ) / 2);
            this.cellMargin[ColumnKey.FREQ] = correctMargin(
                getFixedHeaderNumberCellMargin(
                    this.columnsWidth[ColumnKey.FREQ],
                    getFrequencyStr(
                        this.getFrequencyByCount(
                            _.max(this.props.data.map(item => this.getFrequencyByCount(item.count)))!
                        )
                    )
                )
            );
        }
    }

    @computed
    get firstColumnName() {
        return this.props.label ? this.props.label : ColumnKey.CATEGORY;
    }

    private _columns = [{
        name: this.firstColumnName,
        render: (data: ClinicalDataCountWithColor) => {
            return (
                <div
                    className={styles.labelContent}
                    onMouseEnter={event => {
                        this.tooltipLabelMouseEnter(data.value)
                    }}
                    onMouseLeave={this.tooltipLabelMouseLeave}>
                    <svg width="18" height="12" className={styles.labelContentSVG}>
                        <g>
                            <rect x="0" y="0" width="12" height="12" fill={data.color}/>
                        </g>
                    </svg>
                    <EllipsisTextTooltip text={data.value}></EllipsisTextTooltip>
                </div>
            )
        },
        headerRender: () => {
            return <div className={styles.ellipsisText}>{this.firstColumnName}</div>
        },
        tooltip: getClinicalAttributeOverlay(this.firstColumnName, this.props.labelDescription ? this.props.labelDescription : ''),
        filter: (d: ClinicalDataCountWithColor, f: string, filterStringUpper: string) => (d.value.toUpperCase().includes(filterStringUpper)),
        sortBy: (d: ClinicalDataCountWithColor) => d.value,
        defaultSortDirection: 'asc' as 'asc',
        width: this.columnsWidth[ColumnKey.CATEGORY]
    }, {
        name: ColumnKey.NUMBER,
        headerRender: () => {
            return <div style={{marginLeft: this.cellMargin[ColumnKey.NUMBER]}}>#</div>
        },
        render: (data: ClinicalDataCountWithColor) =>
            <LabeledCheckbox
                checked={_.includes(this.props.filters, data.value)}
                onChange={event => this.onUserSelection(data.value)}
                labelProps={{
                    style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginLeft: this.cellMargin[ColumnKey.NUMBER],
                        marginRight: this.cellMargin[ColumnKey.NUMBER]
                    }
                }}
                inputProps={{
                    className: styles.autoMarginCheckbox
                }}
            >
                {data.count.toLocaleString()}
            </LabeledCheckbox>,
        tooltip: (
            <span>Number of {this.props.patientAttribute ? 'patients' : 'samples'}</span>),
        filter: (d: ClinicalDataCountWithColor, f: string) => (d.count.toString().includes(f)),
        sortBy: (d: ClinicalDataCountWithColor) => d.count,
        defaultSortDirection: 'desc' as 'desc',
        width: this.columnsWidth[ColumnKey.NUMBER]
    }, {
        name: ColumnKey.FREQ,
        headerRender: () => {
            return <div style={{marginLeft: this.cellMargin[ColumnKey.FREQ]}}>Freq</div>
        },
        render: (data: ClinicalDataCountWithColor) =>
            <span
                style={{
                    flexDirection: 'row-reverse',
                    display: 'flex',
                    marginRight: this.cellMargin[ColumnKey.FREQ]
                }}
            >{getFrequencyStr(this.getFrequencyByCount(data.count))}</span>,
        tooltip: (
            <span>Percentage of {this.props.patientAttribute ? 'patients' : 'samples'}</span>),
        filter: (d: ClinicalDataCountWithColor, f: string) => {
            let freq = getFrequencyStr(this.getFrequencyByCount(d.count));
            return (freq.includes(f))
        },
        sortBy: (d: ClinicalDataCountWithColor) => d.count,//sort freq column using count
        defaultSortDirection: 'desc' as 'desc',
        width: this.columnsWidth[ColumnKey.FREQ]
    }];

    @autobind
    private onUserSelection(filter: string) {
        let filters = toJS(this.props.filters)
        if (_.includes(filters, filter)) {
            filters = _.filter(filters, obj => obj !== filter);
        } else {
            filters.push(filter);
        }
        this.props.onUserSelection(filters);
    }

    @autobind
    private tooltipLabelMouseEnter(value: string): void {
        if (this.props.highlightedRow) {
            this.props.highlightedRow(value);
        }
    }

    @autobind
    private tooltipLabelMouseLeave(): void {
        if (this.props.highlightedRow) {
            this.props.highlightedRow(undefined);
        }
    }

    @computed
    get totalCount() {
        return _.sumBy(this.props.data, obj => obj.count);
    }

    @autobind
    addAll(selectedRows: ClinicalDataCountWithColor[]) {
        this.props.onUserSelection(selectedRows.map(row => row.value));
    }

    @autobind
    removeAll(deselectedRows: ClinicalDataCountWithColor[]) {
        const deselectRows = deselectedRows.map(row => row.value);
        this.props.onUserSelection(this.props.filters.filter(filter => !deselectRows.includes(filter)));
    }

    @autobind
    @action
    afterSorting(sortBy: string, sortDirection: SortDirection) {
        this.sortBy = sortBy;
        this.sortDirection = sortDirection;
    }

    componentWillReceiveProps() {
        this.updateCellMargin();
    }

    componentWillUnmount(): void {
        this.updateCellReaction();
    }

    render() {
        return (
            <ClinicalTableComponent
                width={this.props.width}
                height={this.props.height}
                data={this.props.data || []}
                columns={this._columns}
                addAll={this.addAll}
                removeAll={this.removeAll}
                showAddRemoveAllButtons={this.props.showAddRemoveAllButtons}
                sortBy={this.sortBy}
                sortDirection={this.sortDirection}
                afterSorting={this.afterSorting}
            />
        )
    }
}