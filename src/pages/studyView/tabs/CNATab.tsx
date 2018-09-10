import * as React from "react";
import {Column, default as LazyMobXTable} from "shared/components/lazyMobXTable/LazyMobXTable";
import {observer} from "mobx-react";
import {If} from 'react-if';
import styles from '../table/tables.module.scss';
import classnames from 'classnames';

export type CNATabTableRow = {
    alteration: string;
    chromosome: number;
    cytoband: string;
    numberOfGenes: number;
    genes: string;
    qValue: number;
}

export interface ICNATabTable {
    data: CNATabTableRow[];
}

class CNATabTableComponent extends LazyMobXTable<CNATabTableRow> {
}

@observer
export class CNATab extends React.Component<ICNATabTable, {}> {
    getDefaultColumnConfig(key: keyof CNATabTableRow) {
        return {
            name: '',
            render: (data: CNATabTableRow) => <span>{data[key]}</span>,
            download: (data: CNATabTableRow) => data[key] === undefined ? '' : data[key].toString(),
            sortBy: (data: CNATabTableRow): any => data[key],
            filter: (data: CNATabTableRow, filterString: string, filterStringUpper: string) => (data[key] || '').toString().toUpperCase().includes(filterStringUpper)
        };
    }

    private columns: Column<CNATabTableRow>[] = [{
        ...this.getDefaultColumnConfig('alteration'),
        render: (data: CNATabTableRow) => {
            return <span className={classnames(data.alteration === 'AMP' ? styles.amp : styles.del)}>
                    {data.alteration}
                </span>
        },
        width: 110,
        name: 'AMP/DEL'
    }, {
        ...this.getDefaultColumnConfig('chromosome'),
        width: 70,
        name: 'Chr'
    }, {
        ...this.getDefaultColumnConfig('cytoband'),
        width: 110,
        name: 'Cytoband'
    }, {
        ...this.getDefaultColumnConfig('numberOfGenes'),
        width: 100,
        name: '# Genes'
    }, {
        ...this.getDefaultColumnConfig('genes'),
        name: 'Genes'
    }, {
        ...this.getDefaultColumnConfig('qValue'),
        render: (data: CNATabTableRow) => {
            return <span>{data.qValue === undefined ? '' : data.qValue.toExponential(3)}</span>
        },
        width: 100,
        name: 'Q-value'
    }];

    public render() {
        return (
            <div style={{width: '100%'}}>
                <span><b>{this.props.data.length} copy number alterations peaks by GISTIC2</b></span>
                <CNATabTableComponent
                    initialItemsPerPage={10}
                    showCopyDownload={true}
                    showColumnVisibility={true}
                    data={this.props.data}
                    columns={this.columns}
                    initialSortColumn={'Q-value'}
                />
            </div>
        );
    }
}

