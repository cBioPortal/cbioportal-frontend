
import * as React from 'react';
import * as _ from "lodash";
import { observer } from "mobx-react";
import LazyMobXTable, { Column } from "shared/components/lazyMobXTable/LazyMobXTable";
import { observable } from 'mobx';

export interface IPathwayMapperTable{
    name: string;
    score: number;
    genes: string[];
}
enum IPathwayMapperTableColumnType{
    NAME,
    SCORE,
    GENES
}

interface IPathwayMapperTableProps{
    data: IPathwayMapperTable[];
    initialSortColumn?: string;
}

type PathwayMapperTableColumn = Column<IPathwayMapperTable> & { order?: number, shouldExclude?: () => boolean };

class PathwayMapperTableComponent extends LazyMobXTable<IPathwayMapperTable> {
}

@observer
export default class PathwayMapperTable extends React.Component<IPathwayMapperTableProps>{
    public static defaultProps = {
        columns: [
            IPathwayMapperTableColumnType.NAME,
            IPathwayMapperTableColumnType.SCORE,
            IPathwayMapperTableColumnType.GENES,
        ],
        initialSortColumn: "name"
    };
    @observable protected _columns: { [columnEnum: number]: PathwayMapperTableColumn };

    constructor(props: IPathwayMapperTableProps) {
        super(props);
        this._columns = {};
        this.generateColumns();
    }

    

    generateColumns() {
        this._columns = {};

        this._columns[IPathwayMapperTableColumnType.NAME] = {
            name: "Pathway name",
            render: (d: IPathwayMapperTable) => <span><b>{d.name}</b></span>,
            tooltip: <span>Pathway name</span>,
            filter: (d: IPathwayMapperTable, filterString: string, filterStringUpper: string) =>
                d.name.toUpperCase().includes(filterStringUpper),
            sortBy: (d: IPathwayMapperTable) => d.name,
            download: (d: IPathwayMapperTable) => d.name
        };

        this._columns[IPathwayMapperTableColumnType.SCORE] = {
            name: "Score",
            render: (d: IPathwayMapperTable) => <span><b>{d.score}</b></span>,
            tooltip: <span>Score</span>,
            filter: (d: IPathwayMapperTable, filterString: string, filterStringUpper: string) =>
                (d.score + "").includes(filterStringUpper),
            sortBy: (d: IPathwayMapperTable) => d.score,
            download: (d: IPathwayMapperTable) => d.score + ""
        };

        this._columns[IPathwayMapperTableColumnType.GENES] = {
            name: "Genes matched",
            render: (d: IPathwayMapperTable) => <span>{d.genes}</span>,
            tooltip: <span>Genes matched</span>,
            sortBy: (d: IPathwayMapperTable) => d.genes,
            download: (d: IPathwayMapperTable) => d.genes.toString()
        };
    }

    render() {
        const orderedColumns = _.sortBy(this._columns, (c: PathwayMapperTableColumn) => c.order);
        return (
            <PathwayMapperTableComponent columns={orderedColumns} data={this.props.data} initialItemsPerPage={10}
                initialSortColumn={this.props.initialSortColumn} paginationProps={{ itemsPerPageOptions: [10] }}/>
        );
    }


}