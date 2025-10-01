import * as React from 'react';
import LazyMobXTable, {
    Column,
} from 'shared/components/lazyMobXTable/LazyMobXTable';
import _ from 'lodash';
import { observer } from 'mobx-react';
import { computed, makeObservable, observable } from 'mobx';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import { prepareExpressionRowDataForTable } from 'shared/lib/StoreUtils';
export interface IExpressionTableWrapperProps {
    store: PatientViewPageStore;
}

class ExpressionTable extends LazyMobXTable<IExpressionRow[]> {}

type ExpressionTableColumn = Column<IExpressionRow[]> & { order: number };

export interface IExpressionRow {
    hugoGeneSymbol: string;
    mrnaExpression: number;
    proteinExpression: number;
    mutations: string;
    structuralVariants: string;
    cna: string;
}

@observer
export default class ExpressionTableWrapper extends React.Component<
    IExpressionTableWrapperProps,
    {}
> {
    @observable
    selectedSignature: string;
    constructor(props: IExpressionTableWrapperProps) {
        super(props);
        makeObservable(this);
    }

    @computed get expressionDataForTable() {
        return prepareExpressionRowDataForTable(
            this.props.store.mrnaExpressionData.result,
            this.props.store.proteinExpressionData.result,
            this.props.store.mutationData.result,
            this.props.store.structuralVariantData.result,
            this.props.store.discreteCNAData.result,
            this.props.store.allEntrezGeneIdsToGene.result
        );
    }

    @computed get mrnaExpressionProfileName() {
        if (this.props.store.analysisMrnaExpressionProfiles.result.length > 0) {
            return this.props.store.analysisMrnaExpressionProfiles.result[0]
                .name;
        } else if (this.props.store.mrnaExpressionProfiles.result.length > 0) {
            return this.props.store.mrnaExpressionProfiles.result[0].name;
        } else {
            return '';
        }
    }

    @computed get proteinExpressionProfileName() {
        if (
            this.props.store.analysisProteinExpressionProfiles.result.length > 0
        ) {
            return this.props.store.analysisProteinExpressionProfiles.result[0]
                .name;
        } else if (
            this.props.store.proteinExpressionProfiles.result.length > 0
        ) {
            return this.props.store.proteinExpressionProfiles.result[0].name;
        } else {
            return '';
        }
    }

    @computed get columns() {
        const columns: ExpressionTableColumn[] = [];

        columns.push({
            name: 'Gene',
            render: (d: IExpressionRow[]) => <span>{d[0].hugoGeneSymbol}</span>,
            filter: (
                d: IExpressionRow[],
                filterString: string,
                filterStringUpper: string
            ) => {
                return d[0].hugoGeneSymbol.indexOf(filterStringUpper) > -1;
            },
            download: (d: IExpressionRow[]) => d[0].hugoGeneSymbol,
            sortBy: (d: IExpressionRow[]) => d[0].hugoGeneSymbol,
            visible: true,
            order: 30,
        });

        if (this.mrnaExpressionProfileName) {
            columns.push({
                name: this.mrnaExpressionProfileName,
                render: (d: IExpressionRow[]) => (
                    <span>
                        {d[0].mrnaExpression
                            ? d[0].mrnaExpression.toFixed(2)
                            : ''}
                    </span>
                ),
                download: (d: IExpressionRow[]) =>
                    d[0].mrnaExpression ? d[0].mrnaExpression.toFixed(2) : '',
                sortBy: (d: IExpressionRow[]) => {
                    if (d[0].mrnaExpression) {
                        return d[0].mrnaExpression;
                    } else {
                        return null;
                    }
                },
                visible: true,
                order: 35,
            });
        }

        if (this.proteinExpressionProfileName) {
            columns.push({
                name: this.proteinExpressionProfileName,
                render: (d: IExpressionRow[]) => (
                    <span>
                        {d[0].proteinExpression
                            ? d[0].proteinExpression.toFixed(2)
                            : ''}
                    </span>
                ),
                download: (d: IExpressionRow[]) =>
                    d[0].proteinExpression
                        ? d[0].proteinExpression.toFixed(2)
                        : '',
                sortBy: (d: IExpressionRow[]) => {
                    if (d[0].proteinExpression) {
                        return d[0].proteinExpression;
                    } else {
                        return null;
                    }
                },
                visible: true,
                order: 40,
            });
        }

        if (this.props.store.mutationMolecularProfile.result) {
            columns.push({
                name: this.props.store.mutationMolecularProfile.result.name,
                render: (d: IExpressionRow[]) => <span>{d[0].mutations}</span>,
                download: (d: IExpressionRow[]) => d[0].mutations,
                sortBy: (d: IExpressionRow[]) => d[0].mutations,
                visible: true,
                order: 45,
            });
        }

        if (this.props.store.structuralVariantProfile.result) {
            columns.push({
                name: this.props.store.structuralVariantProfile.result.name,
                render: (d: IExpressionRow[]) => (
                    <span>{d[0].structuralVariants}</span>
                ),
                download: (d: IExpressionRow[]) => d[0].structuralVariants,
                sortBy: (d: IExpressionRow[]) => d[0].structuralVariants,
                visible: true,
                order: 50,
            });
        }

        if (this.props.store.discreteMolecularProfile.result) {
            columns.push({
                name: this.props.store.discreteMolecularProfile.result.name,
                render: (d: IExpressionRow[]) => <span>{d[0].cna}</span>,
                download: (d: IExpressionRow[]) => d[0].cna,
                sortBy: (d: IExpressionRow[]) => d[0].cna,
                visible: true,
                order: 55,
            });
        }

        const orderedColumns = _.sortBy(
            columns,
            (c: ExpressionTableColumn) => c.order
        );
        return orderedColumns;
    }

    public render() {
        return (
            <div style={{ paddingTop: '0' }}>
                <ExpressionTable
                    columns={this.columns}
                    data={this.expressionDataForTable}
                    showPagination={true}
                    initialItemsPerPage={20}
                    showColumnVisibility={false}
                    initialSortColumn={
                        this.mrnaExpressionProfileName ||
                        this.proteinExpressionProfileName
                    }
                    initialSortDirection="desc"
                />
            </div>
        );
    }
}
