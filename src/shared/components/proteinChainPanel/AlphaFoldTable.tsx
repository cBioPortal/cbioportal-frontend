import * as React from 'react';
import LazyMobXTable, { Column } from '../lazyMobXTable/LazyMobXTable';
import { observer } from 'mobx-react';
import { computed, makeObservable } from 'mobx';
import {
    AlphaFoldPredictionMetadata,
    getAlphaFoldEntryUrl,
} from 'shared/components/structureViewer/AlphaFoldUtils';

class AlphaFoldTableComponent extends LazyMobXTable<
    AlphaFoldPredictionMetadata
> {}

export interface IAlphaFoldTableProps {
    predictions: AlphaFoldPredictionMetadata[];
}

@observer
export default class AlphaFoldTable extends React.Component<
    IAlphaFoldTableProps,
    {}
> {
    constructor(props: IAlphaFoldTableProps) {
        super(props);
        makeObservable(this);
    }

    @computed private get columns(): Column<AlphaFoldPredictionMetadata>[] {
        return [
            {
                name: 'Model',
                render: (d: AlphaFoldPredictionMetadata) => (
                    <a
                        href={getAlphaFoldEntryUrl(d.uniprotAccession)}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {d.entryId}
                    </a>
                ),
                sortBy: (d: AlphaFoldPredictionMetadata) => d.entryId,
                filter: (
                    d: AlphaFoldPredictionMetadata,
                    filterString: string,
                    filterStringUpper: string
                ) => d.entryId.toUpperCase().indexOf(filterStringUpper) > -1,
            },
            {
                name: 'Chain',
                render: (d: AlphaFoldPredictionMetadata) => (
                    <span>{d.chainId}</span>
                ),
                sortBy: (d: AlphaFoldPredictionMetadata) => d.chainId,
            },
            {
                name: 'Organism',
                render: (d: AlphaFoldPredictionMetadata) => (
                    <span>{d.organismScientificName}</span>
                ),
                sortBy: (d: AlphaFoldPredictionMetadata) =>
                    d.organismScientificName,
            },
            {
                name: 'Average pLDDT',
                render: (d: AlphaFoldPredictionMetadata) => (
                    <span>
                        {typeof d.globalMetricValue === 'number'
                            ? d.globalMetricValue.toFixed(1)
                            : '-'}
                    </span>
                ),
                sortBy: (d: AlphaFoldPredictionMetadata) =>
                    d.globalMetricValue ?? -1,
            },
            {
                name: 'Version',
                render: (d: AlphaFoldPredictionMetadata) => (
                    <span>v{d.latestVersion}</span>
                ),
                sortBy: (d: AlphaFoldPredictionMetadata) => d.latestVersion,
            },
        ];
    }

    render() {
        return (
            <AlphaFoldTableComponent
                showColumnVisibility={false}
                showCopyDownload={false}
                showFilter={false}
                itemsLabel="AlphaFold model"
                itemsLabelPlural="AlphaFold models"
                paginationProps={{
                    showItemsPerPageSelector: false,
                    showMoreButton: false,
                }}
                initialItemsPerPage={6}
                columns={this.columns}
                data={this.props.predictions}
                pageToHighlight={true}
            />
        );
    }
}
