import * as React from 'react';
import LazyMobXTable, {
    Column,
} from 'shared/components/lazyMobXTable/LazyMobXTable';
import _ from 'lodash';
import { observer } from 'mobx-react';
import { computed, makeObservable } from 'mobx';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import { prepareExpressionRowDataForTable } from 'shared/lib/StoreUtils';
import { NumericGeneMolecularData } from 'cbioportal-ts-api-client';
import { getAlterationString } from 'shared/lib/CopyNumberUtils';
export interface IExpressionTableWrapperProps {
    store: PatientViewPageStore;
}

class ExpressionTable extends LazyMobXTable<IExpressionRow[]> {}

type ExpressionTableColumn = Column<IExpressionRow[]> & { order: number };

export interface IExpressionRow {
    hugoGeneSymbol: string;
    mrnaExpression: Record<string, NumericGeneMolecularData[]>;
    proteinExpression: Record<string, NumericGeneMolecularData[]>;
    mutations: string;
    structuralVariants: string;
    cna: Record<string, NumericGeneMolecularData[]>;
}

@observer
export default class ExpressionTableWrapper extends React.Component<
    IExpressionTableWrapperProps,
    {}
> {
    constructor(props: IExpressionTableWrapperProps) {
        super(props);
        makeObservable(this);
    }

    @computed get expressionDataForTable() {
        return prepareExpressionRowDataForTable(
            this.props.store.mrnaExpressionDataByGeneThenProfile.result,
            this.props.store.proteinExpressionDataByGeneThenProfile.result,
            this.props.store.mutationData.result,
            this.props.store.structuralVariantData.result,
            this.props.store.cnaDataByGeneThenProfile.result,
            this.props.store.allEntrezGeneIdsToGene.result
        );
    }

    @computed get defaultMrnaExpressionProfile() {
        if (this.props.store.analysisMrnaExpressionProfiles.result.length > 0) {
            return this.props.store.analysisMrnaExpressionProfiles.result[0];
        } else if (this.props.store.mrnaExpressionProfiles.result.length > 0) {
            return this.props.store.mrnaExpressionProfiles.result[0];
        }
    }

    @computed get defaultProteinExpressionProfile() {
        if (
            this.props.store.analysisProteinExpressionProfiles.result.length > 0
        ) {
            return this.props.store.analysisProteinExpressionProfiles.result[0];
        } else if (
            this.props.store.proteinExpressionProfiles.result.length > 0
        ) {
            return this.props.store.proteinExpressionProfiles.result[0];
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
            order: 20,
        });

        if (this.defaultMrnaExpressionProfile) {
            columns.push({
                name: this.defaultMrnaExpressionProfile.name,
                render: (d: IExpressionRow[]) => (
                    <span>
                        {d[0].mrnaExpression &&
                        d[0].mrnaExpression[
                            this.defaultMrnaExpressionProfile!
                                .molecularProfileId
                        ]
                            ? d[0].mrnaExpression[
                                  this.defaultMrnaExpressionProfile!
                                      .molecularProfileId
                              ][0].value.toFixed(2)
                            : ''}
                    </span>
                ),
                download: (d: IExpressionRow[]) =>
                    d[0].mrnaExpression &&
                    d[0].mrnaExpression[
                        this.defaultMrnaExpressionProfile!.molecularProfileId
                    ]
                        ? d[0].mrnaExpression[
                              this.defaultMrnaExpressionProfile!
                                  .molecularProfileId
                          ][0].value.toFixed(2)
                        : '',
                sortBy: (d: IExpressionRow[]) => {
                    if (
                        d[0].mrnaExpression &&
                        d[0].mrnaExpression[
                            this.defaultMrnaExpressionProfile!
                                .molecularProfileId
                        ]
                    ) {
                        return d[0].mrnaExpression[
                            this.defaultMrnaExpressionProfile!
                                .molecularProfileId
                        ][0].value;
                    } else {
                        return null;
                    }
                },
                visible: true,
                order: 25,
            });
        }

        this.props.store.mrnaExpressionProfiles.result.map((p, i) => {
            if (
                p.molecularProfileId !==
                this.defaultMrnaExpressionProfile?.molecularProfileId
            ) {
                columns.push({
                    name: p.name,
                    render: (d: IExpressionRow[]) => (
                        <span>
                            {d[0].mrnaExpression &&
                            d[0].mrnaExpression[p.molecularProfileId]
                                ? d[0].mrnaExpression[
                                      p.molecularProfileId
                                  ][0].value.toFixed(2)
                                : ''}
                        </span>
                    ),
                    download: (d: IExpressionRow[]) =>
                        d[0].mrnaExpression &&
                        d[0].mrnaExpression[p.molecularProfileId]
                            ? d[0].mrnaExpression[
                                  p.molecularProfileId
                              ][0].value.toFixed(2)
                            : '',
                    sortBy: (d: IExpressionRow[]) => {
                        if (
                            d[0].mrnaExpression &&
                            d[0].mrnaExpression[p.molecularProfileId]
                        ) {
                            return d[0].mrnaExpression[p.molecularProfileId][0]
                                .value;
                        } else {
                            return null;
                        }
                    },
                    visible: false,
                    order: 30,
                });
            }
        });

        if (this.defaultProteinExpressionProfile) {
            columns.push({
                name: this.defaultProteinExpressionProfile.name,
                render: (d: IExpressionRow[]) => (
                    <span>
                        {d[0].proteinExpression &&
                        d[0].proteinExpression[
                            this.defaultProteinExpressionProfile!
                                .molecularProfileId
                        ]
                            ? d[0].proteinExpression[
                                  this.defaultProteinExpressionProfile!
                                      .molecularProfileId
                              ][0].value.toFixed(2)
                            : ''}
                    </span>
                ),
                download: (d: IExpressionRow[]) =>
                    d[0].proteinExpression &&
                    d[0].proteinExpression[
                        this.defaultProteinExpressionProfile!.molecularProfileId
                    ]
                        ? d[0].proteinExpression[
                              this.defaultProteinExpressionProfile!
                                  .molecularProfileId
                          ][0].value.toFixed(2)
                        : '',
                sortBy: (d: IExpressionRow[]) => {
                    if (
                        d[0].proteinExpression &&
                        d[0].proteinExpression[
                            this.defaultProteinExpressionProfile!
                                .molecularProfileId
                        ]
                    ) {
                        return d[0].proteinExpression[
                            this.defaultProteinExpressionProfile!
                                .molecularProfileId
                        ][0].value;
                    } else {
                        return null;
                    }
                },
                visible: true,
                order: 35,
            });
        }

        this.props.store.proteinExpressionProfiles.result.map((p, i) => {
            if (
                p.molecularProfileId !==
                this.defaultProteinExpressionProfile?.molecularProfileId
            ) {
                columns.push({
                    name: p.name,
                    render: (d: IExpressionRow[]) => (
                        <span>
                            {d[0].proteinExpression &&
                            d[0].proteinExpression[p.molecularProfileId]
                                ? d[0].proteinExpression[
                                      p.molecularProfileId
                                  ][0].value.toFixed(2)
                                : ''}
                        </span>
                    ),
                    download: (d: IExpressionRow[]) =>
                        d[0].proteinExpression &&
                        d[0].proteinExpression[p.molecularProfileId]
                            ? d[0].proteinExpression[
                                  p.molecularProfileId
                              ][0].value.toFixed(2)
                            : '',
                    sortBy: (d: IExpressionRow[]) => {
                        if (
                            d[0].proteinExpression &&
                            d[0].proteinExpression[p.molecularProfileId]
                        ) {
                            return d[0].proteinExpression[
                                p.molecularProfileId
                            ][0].value;
                        } else {
                            return null;
                        }
                    },
                    visible: false,
                    order: 40,
                });
            }
        });

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
                render: (d: IExpressionRow[]) => (
                    <span>
                        {d[0].cna &&
                        d[0].cna[
                            this.props.store.discreteMolecularProfile.result!
                                .molecularProfileId
                        ]
                            ? getAlterationString(
                                  d[0].cna[
                                      this.props.store.discreteMolecularProfile
                                          .result!.molecularProfileId
                                  ][0].value
                              )
                            : ''}
                    </span>
                ),
                download: (d: IExpressionRow[]) =>
                    d[0].cna &&
                    d[0].cna[
                        this.props.store.discreteMolecularProfile.result!
                            .molecularProfileId
                    ]
                        ? getAlterationString(
                              d[0].cna[
                                  this.props.store.discreteMolecularProfile
                                      .result!.molecularProfileId
                              ][0].value
                          )
                        : '',
                sortBy: (d: IExpressionRow[]) => {
                    if (
                        d[0].cna &&
                        d[0].cna[
                            this.props.store.discreteMolecularProfile.result!
                                .molecularProfileId
                        ]
                    ) {
                        return d[0].cna[
                            this.props.store.discreteMolecularProfile.result!
                                .molecularProfileId
                        ][0].value;
                    } else {
                        return null;
                    }
                },
                visible: true,
                order: 55,
            });
        }

        this.props.store.cnaProfiles.result.map((p, i) => {
            if (
                p.molecularProfileId !==
                this.props.store.discreteMolecularProfile.result
                    ?.molecularProfileId
            ) {
                columns.push({
                    name: p.name,
                    render: (d: IExpressionRow[]) => (
                        <span>
                            {d[0].cna && d[0].cna[p.molecularProfileId]
                                ? d[0].cna[
                                      p.molecularProfileId
                                  ][0].value.toFixed(2)
                                : ''}
                        </span>
                    ),
                    download: (d: IExpressionRow[]) =>
                        d[0].cna && d[0].cna[p.molecularProfileId]
                            ? d[0].cna[p.molecularProfileId][0].value.toFixed(2)
                            : '',
                    sortBy: (d: IExpressionRow[]) => {
                        if (d[0].cna && d[0].cna[p.molecularProfileId]) {
                            return d[0].cna[p.molecularProfileId][0].value;
                        } else {
                            return null;
                        }
                    },
                    visible: false,
                    order: 60,
                });
            }
        });

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
                    showColumnVisibility={true}
                    initialSortColumn={
                        this.defaultMrnaExpressionProfile?.name ||
                        this.defaultProteinExpressionProfile?.name
                    }
                    initialSortDirection="desc"
                />
            </div>
        );
    }
}
