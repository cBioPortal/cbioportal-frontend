import * as React from 'react';
import ProteinChangeColumnFormatter from "shared/components/mutationTable/column/ProteinChangeColumnFormatter";
import {Column, default as LazyMobXTable} from "shared/components/lazyMobXTable/LazyMobXTable";
import OncoKbCard, {LEVEL_ICON_STYLE} from "../annotation/oncokb/OncoKbCard";
import TruncatedText from "../TruncatedText";

import styles from "../annotation/styles/oncokb/level.module.scss";

export interface IOncoKbSummaryTableProps
{
    data: OncoKbSummary[];
    columns?: Column<OncoKbSummary>[];
    initialSortColumn?: string;
    initialSortDirection?: 'asc'|'desc';
    initialItemsPerPage?: number;
}

export type OncoKbSummary = {
    count: number;
    proteinChange: string;
    clinicalImplication: string[];
    biologicalEffect: string[];
    level: {level: string, tumorTypes: string[]}[];
};

// LazyMobXTable is a generic component which requires data type argument
class OncoKbTable extends LazyMobXTable<OncoKbSummary> {}

export default class OncoKbSummaryTable extends React.Component<IOncoKbSummaryTableProps, {}>
{
    public static defaultProps = {
        data: [],
        columns: [
            {
                name: "Protein Change",
                order: 1.00,
                render: (d: OncoKbSummary) => (<span>{d.proteinChange}</span>),
                sortBy: (d: OncoKbSummary) => ProteinChangeColumnFormatter.extractSortValue(d.proteinChange)
            },
            {
                name: "Occurrence",
                order: 2.00,
                render: (d: OncoKbSummary) => <span>{d.count}</span>,
                sortBy: (d: OncoKbSummary) => d.count
            },
            {
                name: "Implication",
                order: 3.00,
                render: (d: OncoKbSummary) => (<span>{d.clinicalImplication.join(", ")}</span>),
                sortBy: (d: OncoKbSummary) => d.clinicalImplication.join(", ")
            },
            {
                name: "Effect",
                order: 4.00,
                render: (d: OncoKbSummary) => (<span>{d.biologicalEffect.join(", ")}</span>),
                sortBy: (d: OncoKbSummary) => d.biologicalEffect.join(", ")
            },
            {
                name: "Level",
                order: 5.00,
                render: (d: OncoKbSummary) => (
                    <span>
                        {
                            d.level.map(level => {
                                return (
                                    <div>
                                        <i
                                            className={`${styles["level-icon"]} ${styles[`level-${level.level}`]}`}
                                            style={{...LEVEL_ICON_STYLE, verticalAlign: "bottom"}}
                                        />
                                        <span> : </span>
                                        <TruncatedText
                                            text={level.tumorTypes.join(", ")}
                                            tooltip={<div style={{maxWidth: 300}}>{level.tumorTypes.join(", ")}</div>}
                                            maxLength={30}
                                        />
                                    </div>
                                );
                            })
                        }
                    </span>
                )
            }
        ],
        initialSortColumn: "Occurrence",
        initialSortDirection: "desc",
        initialItemsPerPage: 10
    };

    constructor(props: IOncoKbSummaryTableProps)
    {
        super(props);
        this.state = {};
    }

    public render()
    {
        const {
            data,
            columns,
            initialSortColumn,
            initialSortDirection,
            initialItemsPerPage,
        } = this.props;

        const showPagination = data.length >
            (this.props.initialItemsPerPage || OncoKbSummaryTable.defaultProps.initialItemsPerPage);

        return (
            <div className='cbioportal-frontend'>
                <OncoKbTable
                    data={data}
                    columns={columns || OncoKbSummaryTable.defaultProps.columns}
                    initialSortColumn={initialSortColumn}
                    initialSortDirection={initialSortDirection}
                    initialItemsPerPage={initialItemsPerPage}
                    showCopyDownload={false}
                    showColumnVisibility={false}
                    showFilter={false}
                    showPagination={showPagination}
                    showPaginationAtTop={true}
                    paginationProps={{showMoreButton:false}}
                />
            </div>
        );
    }
}
