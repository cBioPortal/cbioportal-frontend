import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';
import LazyMobXTable, {
    Column,
} from 'shared/components/lazyMobXTable/LazyMobXTable';
import { observable } from 'mobx';
import { Radio } from 'react-bootstrap';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { SimpleGetterLazyMobXTableApplicationDataStore } from '../../../shared/lib/ILazyMobXTableApplicationDataStore';
import { truncateGeneList } from './PathwayMapperHelpers';

export interface IPathwayMapperTable {
    name: string;
    score: number;
    genes: string[];
}

enum IPathwayMapperTableColumnType {
    NAME,
    SCORE,
    GENES,
}

interface IPathwayMapperTableProps {
    data: IPathwayMapperTable[];
    selectedPathway: string;
    changePathway: Function;
    initialSortColumn?: string;
}

type PathwayMapperTableColumn = Column<IPathwayMapperTable>;

class PathwayMapperTableComponent extends LazyMobXTable<IPathwayMapperTable> {}

@observer
export default class PathwayMapperTable extends React.Component<
    IPathwayMapperTableProps
> {
    public static defaultProps = {
        columns: [
            IPathwayMapperTableColumnType.NAME,
            IPathwayMapperTableColumnType.SCORE,
            IPathwayMapperTableColumnType.GENES,
        ],
        initialSortColumn: 'name',
    };
    @observable protected _columns: {
        [columnEnum: number]: PathwayMapperTableColumn;
    };
    @observable selectedPathway: string;

    constructor(props: IPathwayMapperTableProps) {
        super(props);
        this._columns = {};
        this.generateColumns();
    }

    generateColumns() {
        const lengthThreshold = 20;

        this._columns = {};

        this._columns[IPathwayMapperTableColumnType.NAME] = {
            name: 'Pathway name',
            render: (d: IPathwayMapperTable) => {
                const pwName = d.name;
                const isPwNameShort = pwName.length < lengthThreshold;
                return (
                    <Radio
                        style={{ marginTop: 0, marginBottom: 0 }}
                        checked={this.props.selectedPathway === d.name}
                        onChange={(e: any) => {
                            this.props.changePathway(d.name);
                        }}
                    >
                        <DefaultTooltip
                            overlay={pwName}
                            disabled={isPwNameShort}
                        >
                            <b>
                                {isPwNameShort
                                    ? pwName
                                    : pwName.substring(0, lengthThreshold) +
                                      '...'}
                            </b>
                        </DefaultTooltip>
                    </Radio>
                );
            },
            tooltip: <span>Pathway name</span>,
            filter: (
                d: IPathwayMapperTable,
                filterString: string,
                filterStringUpper: string
            ) => d.name.toUpperCase().includes(filterStringUpper),
            sortBy: (d: IPathwayMapperTable) => d.name,
            download: (d: IPathwayMapperTable) => d.name,
        };

        this._columns[IPathwayMapperTableColumnType.SCORE] = {
            name: 'Score',
            render: (d: IPathwayMapperTable) => (
                <span>
                    <b>{d.score.toFixed(2)}</b>
                </span>
            ),
            tooltip: <span>Score</span>,
            filter: (
                d: IPathwayMapperTable,
                filterString: string,
                filterStringUpper: string
            ) => (d.score + '').includes(filterStringUpper),
            sortBy: (d: IPathwayMapperTable) => d.score,
            download: (d: IPathwayMapperTable) => d.score + '',
        };

        this._columns[IPathwayMapperTableColumnType.GENES] = {
            name: 'Genes matched',
            render: (d: IPathwayMapperTable) => {
                const geneTextLength = d.genes.join(' ').length;

                return (
                    <DefaultTooltip
                        overlay={d.genes.join(' ')}
                        disabled={geneTextLength < lengthThreshold}
                    >
                        <span>
                            {truncateGeneList(d.genes, lengthThreshold)}
                        </span>
                    </DefaultTooltip>
                );
            },
            tooltip: <span>Genes matched</span>,
            sortBy: (d: IPathwayMapperTable) => d.genes,
            download: (d: IPathwayMapperTable) => d.genes.toString(),
        };
    }

    private dataStore = new SimpleGetterLazyMobXTableApplicationDataStore(
        () => this.props.data
    );

    render() {
        const columns = _.sortBy(this._columns);
        return (
            <PathwayMapperTableComponent
                columns={columns}
                dataStore={this.dataStore}
                initialItemsPerPage={10}
                initialSortColumn={this.props.initialSortColumn}
                paginationProps={{ itemsPerPageOptions: [10] }}
                showColumnVisibility={false}
            />
        );
    }
}
