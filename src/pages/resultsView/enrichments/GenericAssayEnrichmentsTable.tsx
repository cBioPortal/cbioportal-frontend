import * as React from 'react';
import * as _ from 'lodash';
import LazyMobXTable, {
    Column,
} from '../../../shared/components/lazyMobXTable/LazyMobXTable';
import { observer } from 'mobx-react';
import { computed, makeObservable } from 'mobx';
import { formatSignificanceValueWithStyle } from 'shared/lib/FormatUtils';
import { toConditionalPrecision } from 'shared/lib/NumberUtils';
import styles from './styles.module.scss';
import autobind from 'autobind-decorator';
import { GenericAssayEnrichmentsTableDataStore } from './GenericAssayEnrichmentsTableDataStore';
import { GenericAssayEnrichmentRow } from 'shared/model/EnrichmentRow';

export interface IGenericAssayEnrichmentTableProps {
    visibleOrderedColumnNames?: string[];
    customColumns?: { [id: string]: GenericAssayEnrichmentTableColumn };
    data: GenericAssayEnrichmentRow[];
    initialSortColumn?: string;
    dataStore: GenericAssayEnrichmentsTableDataStore;
    onEntityClick?: (stableId: string) => void;
    mutexTendency?: boolean;
}

export enum GenericAssayEnrichmentTableColumnType {
    ENTITY_ID = 'Entity ID',
    LOG_RATIO = 'Log Ratio',
    P_VALUE = 'P_VALUE',
    Q_VALUE = 'Q_VALUE',
    TENDENCY = 'Tendency',
    EXPRESSED = 'Higher in',
    MEAN_SUFFIX = ' mean',
    STANDARD_DEVIATION_SUFFIX = ' standard deviation',
}

export type GenericAssayEnrichmentTableColumn = Column<
    GenericAssayEnrichmentRow
> & { uniqueName?: string; order?: number };

@observer
export default class GenericAssayEnrichmentsTable extends React.Component<
    IGenericAssayEnrichmentTableProps,
    {}
> {
    constructor(props: IGenericAssayEnrichmentTableProps) {
        super(props);
        makeObservable(this);
    }

    public static defaultProps = {
        columns: [
            GenericAssayEnrichmentTableColumnType.ENTITY_ID,
            GenericAssayEnrichmentTableColumnType.P_VALUE,
            GenericAssayEnrichmentTableColumnType.Q_VALUE,
        ],
        initialSortColumn: 'q-Value',
        mutexTendency: true,
    };

    @autobind
    private onRowClick(d: GenericAssayEnrichmentRow) {
        this.props.onEntityClick!(d.stableId);
        this.props.dataStore.setHighlighted(d);
    }

    @computed get columns(): {
        [columnEnum: string]: GenericAssayEnrichmentTableColumn;
    } {
        const columns: {
            [columnEnum: string]: GenericAssayEnrichmentTableColumn;
        } = this.props.customColumns || {};

        columns[GenericAssayEnrichmentTableColumnType.ENTITY_ID] = {
            name: 'Entity Name',
            render: (d: GenericAssayEnrichmentRow) => (
                <span className={styles.StableId}>
                    <b>{d.entityName}</b>
                </span>
            ),
            tooltip: <span>Entity Name</span>,
            filter: (
                d: GenericAssayEnrichmentRow,
                filterString: string,
                filterStringUpper: string
            ) => d.entityName.toUpperCase().includes(filterStringUpper),
            sortBy: (d: GenericAssayEnrichmentRow) => d.entityName,
            download: (d: GenericAssayEnrichmentRow) => d.entityName,
        };

        columns[GenericAssayEnrichmentTableColumnType.P_VALUE] = {
            name: 'p-Value',
            render: (d: GenericAssayEnrichmentRow) => (
                <span style={{ whiteSpace: 'nowrap' }}>
                    {toConditionalPrecision(d.pValue, 3, 0.01)}
                </span>
            ),
            tooltip: <span>Derived from Student's t-test</span>,
            sortBy: (d: GenericAssayEnrichmentRow) => d.pValue,
            download: (d: GenericAssayEnrichmentRow) =>
                toConditionalPrecision(d.pValue, 3, 0.01),
        };

        columns[GenericAssayEnrichmentTableColumnType.Q_VALUE] = {
            name: 'q-Value',
            render: (d: GenericAssayEnrichmentRow) => (
                <span style={{ whiteSpace: 'nowrap' }}>
                    {formatSignificanceValueWithStyle(d.qValue)}
                </span>
            ),
            tooltip: <span>Derived from Benjamini-Hochberg procedure</span>,
            sortBy: (d: GenericAssayEnrichmentRow) => d.qValue,
            download: (d: GenericAssayEnrichmentRow) =>
                toConditionalPrecision(d.qValue, 3, 0.01),
        };

        return columns;
    }

    public render() {
        const orderedColumns = _.sortBy(
            this.props.visibleOrderedColumnNames!.map(
                column => this.columns[column]
            ),
            (c: GenericAssayEnrichmentTableColumn) => c.order
        );
        return (
            <LazyMobXTable
                initialItemsPerPage={20}
                paginationProps={{ itemsPerPageOptions: [20] }}
                columns={orderedColumns}
                data={this.props.data}
                initialSortColumn={this.props.initialSortColumn}
                onRowClick={
                    this.props.onEntityClick ? this.onRowClick : undefined
                }
                dataStore={this.props.dataStore}
            />
        );
    }
}
