import * as React from "react";
import { observer } from "mobx-react";
import { action, computed, toJS } from "mobx";
import { bind } from "bind-decorator";
import _ from "lodash";
import LazyMobXTable from "shared/components/lazyMobXTable/LazyMobXTable";
import LabeledCheckbox from "shared/components/labeledCheckbox/LabeledCheckbox";
import { ClinicalDataCountWithColor } from "pages/studyView/StudyViewPageStore";
import "./styles.scss";

export interface IClinicalTableProps {
    data: ClinicalDataCountWithColor[];
    filters: string[];
    highlightedRow?: (value: string | undefined) => void;
    onUserSelection: (values: string[]) => void;
    label?: string
}

@observer
export default class ClinicalTable extends React.Component<IClinicalTableProps, {}> {

    constructor(props: IClinicalTableProps) {
        super(props);
    }

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
    @action private tooltipLabelMouseEnter(value: string): void {
        if (this.props.highlightedRow) {
            this.props.highlightedRow(value);
        }
    }

    @bind
    @action private tooltipLabelMouseLeave(): void {
        if (this.props.highlightedRow) {
            this.props.highlightedRow(undefined);
        }
    }

    @computed get totalCount() {
        return _.sumBy(this.props.data, obj => obj.count);
    }

    render() {
        return (
            <div className={"studyViewTable"}>
                <LazyMobXTable
                    showCopyDownload={false}
                    data={this.props.data}
                    showFilter={true}
                    showColumnVisibility={false}
                    enableHorizontalScroll={false}
                    initialSortColumn='#'
                    initialSortDirection='desc'
                    filterPlaceholder="Search..."
                    showPagination={true}
                    showPaginationAtTop={true}
                    paginationProps={{
                        showMoreButton: false,
                        showItemsPerPageSelector: false
                    }}
                    initialItemsPerPage={11}
                    columns={
                        [{
                            name: this.props.label ? this.props.label : 'Category',
                            render: (data: ClinicalDataCountWithColor) => {
                                return (
                                    <div
                                        className={"labelContent"}
                                        onMouseEnter={event => { this.tooltipLabelMouseEnter(data.value) }}
                                        onMouseLeave={this.tooltipLabelMouseLeave}>
                                        <svg width="18" height="12">
                                            <g>
                                                <rect x="0" y="0" width="12" height="12" fill={data.color} />
                                            </g>
                                        </svg>
                                        <span title={data.value}>{data.value}</span>
                                    </div>
                                )
                            },
                            filter: (d: ClinicalDataCountWithColor, f: string, filterStringUpper: string) => (d.value.indexOf(filterStringUpper) > -1),
                            sortBy: (d: ClinicalDataCountWithColor) => d.value,
                            width: "60%"
                        },
                        {
                            name: '#',
                            render: (data: ClinicalDataCountWithColor) =>
                                <LabeledCheckbox
                                    checked={_.includes(this.props.filters, data.value)}
                                    onChange={event => this.onUserSelection(data.value)}>
                                    {data.count}
                                </LabeledCheckbox>,
                            filter: (d: ClinicalDataCountWithColor, f: string, filterStringUpper: string) => (d.count.toString().indexOf(filterStringUpper) > -1),
                            sortBy: (d: ClinicalDataCountWithColor) => d.count,
                            width: "20%"
                        },
                        {
                            name: 'Freq',
                            render: (data: ClinicalDataCountWithColor) => <span>{((data.count / this.totalCount) * 100).toFixed(2) + '%'}</span>,
                            filter: (d: ClinicalDataCountWithColor, f: string, filterStringUpper: string) => {
                                let freq = ((d.count / this.totalCount) * 100).toFixed(2) + '%'
                                return (freq.indexOf(filterStringUpper) > -1)
                            },
                            sortBy: (d: ClinicalDataCountWithColor) => d.count,//sort freq column using count
                            width: "20%"
                        }]
                    }
                />
            </div>
        )
    }
}