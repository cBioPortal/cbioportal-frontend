import { IOncoKbData } from 'cbioportal-frontend-commons';
import { Mutation } from 'cbioportal-utils';
import { MyVariantInfo, VariantAnnotation } from 'genome-nexus-ts-api-client';
import { CancerGene } from 'oncokb-ts-api-client';
import _ from 'lodash';
import { action, computed } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { Column } from 'react-table';

import Annotation, { getAnnotationData } from '../column/Annotation';
import ClinVar from '../column/ClinVar';
import Gnomad, { getMyVariantInfoData } from '../column/Gnomad';
import { MutationFilterValue } from '../../filter/MutationFilter';
import { IHotspotIndex } from '../../model/CancerHotspot';
import { ICivicGene, ICivicVariant } from '../../model/Civic';
import { DataFilterType } from '../../model/DataFilter';
import { MobxCache } from '../../model/MobxCache';
import { IMyCancerGenomeData } from '../../model/MyCancerGenome';
import { RemoteData } from '../../model/RemoteData';
import {
    findNonTextInputFilters,
    TEXT_INPUT_FILTER_ID,
} from '../../util/FilterUtils';
import { getRemoteDataGroupStatus } from '../../util/RemoteDataUtils';
import DataTable, {
    DataTableColumn,
    DataTableProps,
} from '../dataTable/DataTable';
import { MutationColumn } from './MutationColumnHelper';

import './defaultMutationTable.scss';

export type DefaultMutationTableProps = {
    hotspotData?: RemoteData<IHotspotIndex | undefined>;
    oncoKbData?: RemoteData<IOncoKbData | Error | undefined>;
    myCancerGenomeData?: IMyCancerGenomeData;
    oncoKbCancerGenes?: RemoteData<CancerGene[] | Error | undefined>;
    usingPublicOncoKbInstance: boolean;
    indexedMyVariantInfoAnnotations?: RemoteData<
        { [genomicLocation: string]: MyVariantInfo } | undefined
    >;
    indexedVariantAnnotations?: RemoteData<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    >;
    enableCivic?: boolean;
    civicGenes?: RemoteData<ICivicGene | undefined>;
    civicVariants?: RemoteData<ICivicVariant | undefined>;
    pubMedCache?: MobxCache;
    columns: Column<Partial<Mutation>>[];
    appendColumns?: boolean;
} & DataTableProps<Partial<Mutation>>;

@observer
class DefaultMutationTableComponent extends DataTable<Partial<Mutation>> {}

@observer
export default class DefaultMutationTable extends React.Component<
    DefaultMutationTableProps,
    {}
> {
    public static defaultProps = {
        initialSortColumn: MutationColumn.ANNOTATION,
        appendColumns: true,
    };

    @computed
    get annotationColumnData() {
        return [
            this.props.oncoKbCancerGenes,
            this.props.hotspotData,
            this.props.oncoKbData,
            this.props.civicVariants,
        ];
    }

    @computed
    get annotationColumnDataStatus() {
        return getRemoteDataGroupStatus(_.compact(this.annotationColumnData));
    }

    @computed
    get gnomadColumnDataStatus() {
        return this.props.indexedMyVariantInfoAnnotations
            ? this.props.indexedMyVariantInfoAnnotations.status
            : 'complete';
    }

    @computed
    get annotationColumnAccessor() {
        return this.annotationColumnDataStatus === 'pending'
            ? () => undefined
            : (mutation: Mutation) =>
                  getAnnotationData(
                      mutation,
                      this.props.oncoKbCancerGenes,
                      this.props.hotspotData,
                      this.props.myCancerGenomeData,
                      this.props.oncoKbData,
                      this.props.usingPublicOncoKbInstance,
                      this.props.civicGenes,
                      this.props.civicVariants
                  );
    }

    @computed
    get myVariantInfoAccessor() {
        return this.gnomadColumnDataStatus === 'pending'
            ? () => undefined
            : (mutation: Mutation) =>
                  getMyVariantInfoData(
                      mutation,
                      this.props.indexedMyVariantInfoAnnotations
                  );
    }

    @computed
    get initialSortColumnData() {
        return this.props.initialSortColumnData || this.annotationColumnData;
    }

    protected getDefaultColumnAccessor(columnKey: MutationColumn) {
        switch (columnKey) {
            case MutationColumn.ANNOTATION:
                return this.annotationColumnAccessor;
            case MutationColumn.CLINVAR:
                return this.myVariantInfoAccessor;
            case MutationColumn.GNOMAD:
                return this.myVariantInfoAccessor;
            default:
                return undefined;
        }
    }

    protected getDefaultColumnCellRender(columnKey: MutationColumn) {
        switch (columnKey) {
            case MutationColumn.ANNOTATION:
                return (column: any) => (
                    <Annotation
                        mutation={column.original}
                        enableOncoKb={true}
                        enableHotspot={true}
                        enableCivic={this.props.enableCivic || false}
                        enableMyCancerGenome={true}
                        hotspotData={this.props.hotspotData}
                        oncoKbData={this.props.oncoKbData}
                        oncoKbCancerGenes={this.props.oncoKbCancerGenes}
                        usingPublicOncoKbInstance={
                            this.props.usingPublicOncoKbInstance
                        }
                        pubMedCache={this.props.pubMedCache}
                        civicGenes={this.props.civicGenes}
                        civicVariants={this.props.civicVariants}
                    />
                );
            case MutationColumn.GNOMAD:
                return (column: any) => (
                    <Gnomad
                        mutation={column.original}
                        indexedMyVariantInfoAnnotations={
                            this.props.indexedMyVariantInfoAnnotations
                        }
                        indexedVariantAnnotations={
                            this.props.indexedVariantAnnotations
                        }
                    />
                );
            case MutationColumn.CLINVAR:
                return (column: any) => (
                    <ClinVar
                        mutation={column.original}
                        indexedMyVariantInfoAnnotations={
                            this.props.indexedMyVariantInfoAnnotations
                        }
                    />
                );
            default:
                return undefined;
        }
    }

    @computed
    get columns() {
        return this.props.columns.map(c => {
            // we need to clone the column definition first,
            // directly modifying the props.columns breaks certain column functionality
            const column = { ...c };

            if (!column.accessor) {
                const defaultAccessor = this.getDefaultColumnAccessor(
                    column.id as MutationColumn
                );
                if (defaultAccessor) {
                    column.accessor = defaultAccessor;
                }
            }
            if (!column.Cell) {
                const defaultCellRender = this.getDefaultColumnCellRender(
                    column.id as MutationColumn
                );
                if (defaultCellRender) {
                    column.Cell = defaultCellRender;
                }
            }
            return column;
        });
    }

    public render() {
        return (
            <DefaultMutationTableComponent
                {...this.props}
                columns={this.columns}
                initialSortColumnData={this.initialSortColumnData}
                onSearch={this.onSearch}
                className="default-mutation-table"
            />
        );
    }

    @action.bound
    protected onSearch(
        searchText: string,
        visibleSearchableColumns: DataTableColumn<Mutation>[]
    ) {
        if (this.props.dataStore) {
            // all other filters except current text input filter
            const otherFilters = findNonTextInputFilters(
                this.props.dataStore.dataFilters
            );

            let dataFilterValues: MutationFilterValue[] = [];

            if (searchText.length > 0) {
                dataFilterValues = visibleSearchableColumns.map(
                    c => ({ [c.id!]: searchText } as MutationFilterValue)
                );

                const textInputFilter = {
                    id: TEXT_INPUT_FILTER_ID,
                    type: DataFilterType.MUTATION,
                    values: dataFilterValues,
                };

                // replace current text input filter with the new one
                this.props.dataStore.setDataFilters([
                    ...otherFilters,
                    textInputFilter,
                ]);
            } else {
                // if no text input remove text input filter (set data filters to all other filters except input)
                this.props.dataStore.setDataFilters(otherFilters);
            }
        }
    }
}
