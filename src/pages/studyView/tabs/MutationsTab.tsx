import * as React from "react";
import {Column, default as LazyMobXTable, SortDirection} from "shared/components/lazyMobXTable/LazyMobXTable";
import {observer} from "mobx-react";
import {If} from 'react-if';

export type MutationsTabTableRow = {
    gene: string;
    cytoband: string;
    geneSize: number;
    numberOfMutations: number;
    density: number;
    qValue: number;
}

export interface IMutationsTabTable {
    data: MutationsTabTableRow[];
    getGeneQueryURL: (gene: string) => string;
}

class MutationsTabTableComponent extends LazyMobXTable<MutationsTabTableRow> {
}

@observer
export class MutationsTab extends React.Component<IMutationsTabTable, {}> {
    getDefaultColumnConfig(key: keyof MutationsTabTableRow) {
        return {
            name: '',
            render: (data: MutationsTabTableRow) => <span>{data[key]}</span>,
            download: (data: MutationsTabTableRow) => data[key] === undefined ? '' : data[key].toString(),
            sortBy: (data: MutationsTabTableRow): any => data[key],
            filter: (data: MutationsTabTableRow, filterString: string, filterStringUpper: string) => (data[key] || '').toString().toUpperCase().includes(filterStringUpper)
        };
    }

    private columns: Column<MutationsTabTableRow>[] = [{
        ...this.getDefaultColumnConfig('gene'),
        render: (data: MutationsTabTableRow) => {
            return <a target='_blank' href={this.props.getGeneQueryURL(data.gene)}>{data.gene}</a>
        },
        name: 'Gene'
    }, {
        ...this.getDefaultColumnConfig('cytoband'),
        name: 'Cytoband'
    }, {
        ...this.getDefaultColumnConfig('geneSize'),
        name: 'Gene size (nucleotides)'
    }, {
        ...this.getDefaultColumnConfig('numberOfMutations'),
        name: '# Mutations'
    }, {
        ...this.getDefaultColumnConfig('density'),
        render: (data: MutationsTabTableRow) => {
            return <span>{data.density === undefined ? '' : data.density.toExponential(3)}</span>
        },
        width: 100,
        name: '# Mutations / Nucleotide'
    }, {
        ...this.getDefaultColumnConfig('qValue'),
        render: (data: MutationsTabTableRow) => {
            return <span>{data.qValue === undefined ? '' : data.qValue.toExponential(3)}</span>
        },
        width: 100,
        name: 'Mutsig Q-value'
    }];

    public render() {
        return (
            <div style={{width: '100%'}}>
                <span><b>{this.props.data.length} mutated genes</b></span>
                <MutationsTabTableComponent
                    initialItemsPerPage={10}
                    showCopyDownload={true}
                    showColumnVisibility={true}
                    data={this.props.data}
                    columns={this.columns}
                    initialSortColumn={'# Mutations / Nucleotide'}
                    initialSortDirection={'asc' as SortDirection}
                />
            </div>
        );
    }
}

