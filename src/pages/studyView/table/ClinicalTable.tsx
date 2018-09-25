import * as React from "react";
import {observer} from "mobx-react";
import {action, computed, toJS} from "mobx";
import {bind} from "bind-decorator";
import _ from "lodash";
import LabeledCheckbox from "shared/components/labeledCheckbox/LabeledCheckbox";
import {ChartMeta, ClinicalDataCountWithColor} from "pages/studyView/StudyViewPageStore";
import FixedHeaderTable from "./FixedHeaderTable";
import styles from "./tables.module.scss";

export interface IClinicalTableProps {
    data: ClinicalDataCountWithColor[];
    filters: string[];
    highlightedRow?: (value: string | undefined) => void;
    onUserSelection: (values: string[]) => void;
    compareCohorts: (selectedValues: string[]) => void;
    label?: string,
    width?: number,
    height?: number
}

class ClinicalTableComponent extends FixedHeaderTable<ClinicalDataCountWithColor> {

}

@observer
export default class ClinicalTable extends React.Component<IClinicalTableProps, {}> {

    constructor(props: IClinicalTableProps) {
        super(props);
    }

    private _columns = [{
        name: this.props.label ? this.props.label : 'Category',
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
                    <span className={styles.ellipsisText} title={data.value}>{data.value}</span>
                </div>
            )
        },
        filter: (d: ClinicalDataCountWithColor, f: string, filterStringUpper: string) => (d.value.toUpperCase().indexOf(filterStringUpper) > -1),
        sortBy: (d: ClinicalDataCountWithColor) => d.value,
        defaultSortDirection: 'asc' as 'asc',
        width: 180
    }, {
        name: '#',
        render: (data: ClinicalDataCountWithColor) =>
            <LabeledCheckbox
                checked={_.includes(this.props.filters, data.value)}
                onChange={event => this.onUserSelection(data.value)}>
                {data.count}
            </LabeledCheckbox>,
        filter: (d: ClinicalDataCountWithColor, f: string, filterStringUpper: string) => (d.count.toString().indexOf(f) > -1),
        sortBy: (d: ClinicalDataCountWithColor) => d.count,
        defaultSortDirection: 'desc' as 'desc',
        width: 60
    }, {
        name: 'Freq',
        render: (data: ClinicalDataCountWithColor) =>
            <span>{((data.count / this.totalCount) * 100).toFixed(2) + '%'}</span>,
        filter: (d: ClinicalDataCountWithColor, f: string, filterStringUpper: string) => {
            let freq = ((d.count / this.totalCount) * 100).toFixed(2) + '%'
            return (freq.indexOf(filterStringUpper) > -1)
        },
        sortBy: (d: ClinicalDataCountWithColor) => d.count,//sort freq column using count
        defaultSortDirection: 'desc' as 'desc',
        width: 60
    }];

    @bind
    private onUserSelection(filter: string) {
        let filters = toJS(this.props.filters)
        if (_.includes(filters, filter)) {
            filters = _.filter(filters, obj => obj !== filter);
        } else {
            filters.push(filter);
        }
        this.props.onUserSelection(filters);
    }

    @bind
    private tooltipLabelMouseEnter(value: string): void {
        if (this.props.highlightedRow) {
            this.props.highlightedRow(value);
        }
    }

    @bind
    private tooltipLabelMouseLeave(): void {
        if (this.props.highlightedRow) {
            this.props.highlightedRow(undefined);
        }
    }

    @computed
    get totalCount() {
        return _.sumBy(this.props.data, obj => obj.count);
    }

    @bind
    private compareCohorts() {
        this.props.compareCohorts(this.props.filters);
    }

    render() {
        return (
            <ClinicalTableComponent
                width={this.props.width}
                height={this.props.height}
                data={this.props.data || []}
                columns={this._columns}
                sortBy='#'
                showCohortComparison={this.props.filters.length > 0}
                afterSelectingRows={this.compareCohorts}
            />
        )
    }
}