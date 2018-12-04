import * as React from "react";
import {observer} from "mobx-react";
import {computed, toJS} from "mobx";
import autobind from 'autobind-decorator';
import _ from "lodash";
import LabeledCheckbox from "shared/components/labeledCheckbox/LabeledCheckbox";
import {ClinicalDataCountWithColor, ClinicalDataType, ClinicalDataTypeEnum} from "pages/studyView/StudyViewPageStore";
import FixedHeaderTable from "./FixedHeaderTable";
import styles from "./tables.module.scss";
import {getFrequencyStr} from "../StudyViewUtils";

export interface IClinicalTableProps {
    data: ClinicalDataCountWithColor[];
    filters: string[];
    highlightedRow?: (value: string | undefined) => void;
    onUserSelection: (values: string[]) => void;
    label?: string,
    labelDescription?: string,
    patientAttribute: boolean,
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

    static readonly defaultProps = {
        width: 300
    };

    @computed
    get columnWidth() {
        // last two columns width are 80, 60
        return [this.props.width! - 140, 80, 60]
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
        tooltip: this.props.labelDescription ? (<span>{this.props.labelDescription}</span>) : undefined,
        filter: (d: ClinicalDataCountWithColor, f: string, filterStringUpper: string) => (d.value.toUpperCase().indexOf(filterStringUpper) > -1),
        sortBy: (d: ClinicalDataCountWithColor) => d.value,
        defaultSortDirection: 'asc' as 'asc',
        width: this.columnWidth[0]
    }, {
        name: '#',
        render: (data: ClinicalDataCountWithColor) =>
            <LabeledCheckbox
                checked={_.includes(this.props.filters, data.value)}
                onChange={event => this.onUserSelection(data.value)}>
                {data.count.toLocaleString()}
            </LabeledCheckbox>,
        tooltip: (
            <span>Number of {this.props.patientAttribute ? 'patients' : 'samples'}</span>),
        filter: (d: ClinicalDataCountWithColor, f: string) => (d.count.toString().indexOf(f) > -1),
        sortBy: (d: ClinicalDataCountWithColor) => d.count,
        defaultSortDirection: 'desc' as 'desc',
        width: this.columnWidth[1]
    }, {
        name: 'Freq',
        render: (data: ClinicalDataCountWithColor) =>
            <span>{getFrequencyStr((data.count / this.totalCount) * 100)}</span>,
        tooltip: (
            <span>Percentage of {this.props.patientAttribute ? 'patients' : 'samples'}</span>),
        filter: (d: ClinicalDataCountWithColor, f: string) => {
            let freq = getFrequencyStr((d.count / this.totalCount) * 100);
            return (freq.indexOf(f) > -1)
        },
        sortBy: (d: ClinicalDataCountWithColor) => d.count,//sort freq column using count
        defaultSortDirection: 'desc' as 'desc',
        width: this.columnWidth[2]
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

    render() {
        return (
            <ClinicalTableComponent
                width={this.props.width}
                height={this.props.height}
                data={this.props.data || []}
                columns={this._columns}
                sortBy='#'
            />
        )
    }
}