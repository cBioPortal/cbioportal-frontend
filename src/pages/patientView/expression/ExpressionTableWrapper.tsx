import * as React from 'react';
import LazyMobXTable, {
    Column,
} from 'shared/components/lazyMobXTable/LazyMobXTable';
import _ from 'lodash';
import { observer } from 'mobx-react';
import { computed, makeObservable } from 'mobx';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import { prepareExpressionRowDataForTable } from 'shared/lib/StoreUtils';
import {
    Mutation,
    NumericGeneMolecularData,
    StructuralVariant,
} from 'cbioportal-ts-api-client';
import { getAlterationString } from 'shared/lib/CopyNumberUtils';
import { SampleLabelHTML } from 'shared/components/sampleLabel/SampleLabel';
import { getCNAByAlteration } from 'pages/studyView/StudyViewUtils';
import { getCnaTypes } from 'shared/lib/pathwayMapper/PathwayMapperHelpers';
import { getCNAColorByAlteration } from '../PatientViewPageUtils';
import TumorColumnFormatter from '../mutation/column/TumorColumnFormatter';
import ProteinChangeColumnFormatter from 'shared/components/mutationTable/column/ProteinChangeColumnFormatter';
import AnnotationColumnFormatter from 'shared/components/mutationTable/column/AnnotationColumnFormatter';
import {
    calculateOncoKbContentPadding,
    DEFAULT_ONCOKB_CONTENT_WIDTH,
} from 'shared/lib/AnnotationColumnUtils';
import autobind from 'autobind-decorator';
export interface IExpressionTableWrapperProps {
    store: PatientViewPageStore;
    mergeOncoKbIcons?: boolean;
}

class ExpressionTable extends LazyMobXTable<IExpressionRow[]> {}

type ExpressionTableColumn = Column<IExpressionRow[]> & { order: number };

export interface IExpressionRow {
    hugoGeneSymbol: string;
    mrnaExpression: Record<string, NumericGeneMolecularData[]>;
    proteinExpression: Record<string, NumericGeneMolecularData[]>;
    mutations: Mutation[];
    structuralVariants: StructuralVariant[];
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

    @autobind
    protected resolveTumorType(mutation: Mutation) {
        // first, try to get it from uniqueSampleKeyToTumorType map
        if (this.props.store.uniqueSampleKeyToTumorType) {
            return this.props.store.uniqueSampleKeyToTumorType[
                mutation.uniqueSampleKey
            ];
        }

        // second, try the study cancer type
        if (this.props.store.studyIdToStudy.result) {
            const studyMetaData = this.props.store.studyIdToStudy.result[
                mutation.studyId
            ];

            if (studyMetaData.cancerTypeId !== 'mixed') {
                return studyMetaData.cancerType.name;
            }
        }

        // return Unknown, this should not happen...
        return 'Unknown';
    }

    @computed get columns() {
        const columns: ExpressionTableColumn[] = [];
        const hasMultipleSamples: boolean =
            this.props.store.samples.result.length > 1;

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
                render: (d: IExpressionRow[]) => {
                    if (
                        d[0].mrnaExpression?.[
                            this.defaultMrnaExpressionProfile!
                                .molecularProfileId
                        ]
                    ) {
                        if (hasMultipleSamples) {
                            const mean = _.meanBy(
                                d[0].mrnaExpression[
                                    this.defaultMrnaExpressionProfile!
                                        .molecularProfileId
                                ],
                                d => d.value
                            ).toFixed(2);
                            return (
                                <span>
                                    {mean} (
                                    {d[0].mrnaExpression[
                                        this.defaultMrnaExpressionProfile!
                                            .molecularProfileId
                                    ].map((data, i) => (
                                        <span>
                                            {data.value.toFixed(2)}{' '}
                                            <SampleLabelHTML
                                                label={(
                                                    this.props.store
                                                        .sampleManager.result!
                                                        .sampleIndex[
                                                        data.sampleId
                                                    ] + 1
                                                ).toString()}
                                                fillOpacity={1}
                                                color={
                                                    this.props.store
                                                        .sampleManager.result!
                                                        .sampleColors[
                                                        data.sampleId
                                                    ]
                                                }
                                            />
                                            {i <
                                                d[0].mrnaExpression[
                                                    this
                                                        .defaultMrnaExpressionProfile!
                                                        .molecularProfileId
                                                ].length -
                                                    1 && ', '}
                                        </span>
                                    ))}
                                    )
                                </span>
                            );
                        } else {
                            return (
                                <span>
                                    {d[0].mrnaExpression[
                                        this.defaultMrnaExpressionProfile!
                                            .molecularProfileId
                                    ][0].value.toFixed(2)}
                                </span>
                            );
                        }
                    }
                    return <span></span>;
                },
                download: (d: IExpressionRow[]) => {
                    if (
                        d[0].mrnaExpression?.[
                            this.defaultMrnaExpressionProfile!
                                .molecularProfileId
                        ]
                    ) {
                        if (hasMultipleSamples) {
                            const mean = _.meanBy(
                                d[0].mrnaExpression[
                                    this.defaultMrnaExpressionProfile!
                                        .molecularProfileId
                                ],
                                d => d.value
                            ).toFixed(2);
                            return mean;
                        } else {
                            return d[0].mrnaExpression[
                                this.defaultMrnaExpressionProfile!
                                    .molecularProfileId
                            ][0].value.toFixed(2);
                        }
                    } else {
                        return '';
                    }
                },
                sortBy: (d: IExpressionRow[]) => {
                    if (
                        d[0].mrnaExpression?.[
                            this.defaultMrnaExpressionProfile!
                                .molecularProfileId
                        ]
                    ) {
                        if (hasMultipleSamples) {
                            const mean = _.meanBy(
                                d[0].mrnaExpression[
                                    this.defaultMrnaExpressionProfile!
                                        .molecularProfileId
                                ],
                                d => d.value
                            );
                            return mean;
                        } else {
                            return d[0].mrnaExpression[
                                this.defaultMrnaExpressionProfile!
                                    .molecularProfileId
                            ][0].value;
                        }
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
                    render: (d: IExpressionRow[]) => {
                        if (d[0].mrnaExpression?.[p.molecularProfileId]) {
                            if (hasMultipleSamples) {
                                const mean = _.meanBy(
                                    d[0].mrnaExpression[p.molecularProfileId],
                                    d => d.value
                                ).toFixed(2);
                                return (
                                    <span>
                                        {mean} (
                                        {d[0].mrnaExpression[
                                            p.molecularProfileId
                                        ].map((data, i) => (
                                            <span>
                                                {data.value.toFixed(2)}{' '}
                                                <SampleLabelHTML
                                                    label={(
                                                        this.props.store
                                                            .sampleManager
                                                            .result!
                                                            .sampleIndex[
                                                            data.sampleId
                                                        ] + 1
                                                    ).toString()}
                                                    fillOpacity={1}
                                                    color={
                                                        this.props.store
                                                            .sampleManager
                                                            .result!
                                                            .sampleColors[
                                                            data.sampleId
                                                        ]
                                                    }
                                                />
                                                {i <
                                                    d[0].mrnaExpression[
                                                        p.molecularProfileId
                                                    ].length -
                                                        1 && ', '}
                                            </span>
                                        ))}
                                        )
                                    </span>
                                );
                            } else {
                                return (
                                    <span>
                                        {d[0].mrnaExpression[
                                            p.molecularProfileId
                                        ][0].value.toFixed(2)}
                                    </span>
                                );
                            }
                        }
                        return <span></span>;
                    },
                    download: (d: IExpressionRow[]) => {
                        if (d[0].mrnaExpression?.[p.molecularProfileId]) {
                            if (hasMultipleSamples) {
                                const mean = _.meanBy(
                                    d[0].mrnaExpression[p.molecularProfileId],
                                    d => d.value
                                ).toFixed(2);
                                return mean;
                            } else {
                                return d[0].mrnaExpression[
                                    p.molecularProfileId
                                ][0].value.toFixed(2);
                            }
                        } else {
                            return '';
                        }
                    },
                    sortBy: (d: IExpressionRow[]) => {
                        if (d[0].mrnaExpression?.[p.molecularProfileId]) {
                            if (hasMultipleSamples) {
                                const mean = _.meanBy(
                                    d[0].mrnaExpression[p.molecularProfileId],
                                    d => d.value
                                );
                                return mean;
                            } else {
                                return d[0].mrnaExpression[
                                    p.molecularProfileId
                                ][0].value;
                            }
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
                render: (d: IExpressionRow[]) => {
                    if (
                        d[0].mrnaExpression?.[
                            this.defaultProteinExpressionProfile!
                                .molecularProfileId
                        ]
                    ) {
                        if (hasMultipleSamples) {
                            const mean = _.meanBy(
                                d[0].proteinExpression[
                                    this.defaultProteinExpressionProfile!
                                        .molecularProfileId
                                ],
                                d => d.value
                            ).toFixed(2);
                            return (
                                <span>
                                    {mean} (
                                    {d[0].proteinExpression[
                                        this.defaultProteinExpressionProfile!
                                            .molecularProfileId
                                    ].map((data, i) => (
                                        <span>
                                            {data.value.toFixed(2)}{' '}
                                            <SampleLabelHTML
                                                label={(
                                                    this.props.store
                                                        .sampleManager.result!
                                                        .sampleIndex[
                                                        data.sampleId
                                                    ] + 1
                                                ).toString()}
                                                fillOpacity={1}
                                                color={
                                                    this.props.store
                                                        .sampleManager.result!
                                                        .sampleColors[
                                                        data.sampleId
                                                    ]
                                                }
                                            />
                                            {i <
                                                d[0].proteinExpression[
                                                    this
                                                        .defaultProteinExpressionProfile!
                                                        .molecularProfileId
                                                ].length -
                                                    1 && ', '}
                                        </span>
                                    ))}
                                    )
                                </span>
                            );
                        } else {
                            return (
                                <span>
                                    {d[0].proteinExpression[
                                        this.defaultProteinExpressionProfile!
                                            .molecularProfileId
                                    ][0].value.toFixed(2)}
                                </span>
                            );
                        }
                    }
                    return <span></span>;
                },
                download: (d: IExpressionRow[]) => {
                    if (
                        d[0].proteinExpression?.[
                            this.defaultProteinExpressionProfile!
                                .molecularProfileId
                        ]
                    ) {
                        if (hasMultipleSamples) {
                            const mean = _.meanBy(
                                d[0].proteinExpression[
                                    this.defaultProteinExpressionProfile!
                                        .molecularProfileId
                                ],
                                d => d.value
                            ).toFixed(2);
                            return mean;
                        } else {
                            return d[0].proteinExpression[
                                this.defaultProteinExpressionProfile!
                                    .molecularProfileId
                            ][0].value.toFixed(2);
                        }
                    } else {
                        return '';
                    }
                },
                sortBy: (d: IExpressionRow[]) => {
                    if (
                        d[0].proteinExpression?.[
                            this.defaultProteinExpressionProfile!
                                .molecularProfileId
                        ]
                    ) {
                        if (hasMultipleSamples) {
                            const mean = _.meanBy(
                                d[0].proteinExpression[
                                    this.defaultProteinExpressionProfile!
                                        .molecularProfileId
                                ],
                                d => d.value
                            );
                            return mean;
                        } else {
                            return d[0].proteinExpression[
                                this.defaultProteinExpressionProfile!
                                    .molecularProfileId
                            ][0].value;
                        }
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
                    render: (d: IExpressionRow[]) => {
                        if (d[0].proteinExpression?.[p.molecularProfileId]) {
                            if (hasMultipleSamples) {
                                const mean = _.meanBy(
                                    d[0].proteinExpression[
                                        p.molecularProfileId
                                    ],
                                    d => d.value
                                ).toFixed(2);
                                return (
                                    <span>
                                        {mean} (
                                        {d[0].proteinExpression[
                                            p.molecularProfileId
                                        ].map((data, i) => (
                                            <span>
                                                {data.value.toFixed(2)}{' '}
                                                <SampleLabelHTML
                                                    label={(
                                                        this.props.store
                                                            .sampleManager
                                                            .result!
                                                            .sampleIndex[
                                                            data.sampleId
                                                        ] + 1
                                                    ).toString()}
                                                    fillOpacity={1}
                                                    color={
                                                        this.props.store
                                                            .sampleManager
                                                            .result!
                                                            .sampleColors[
                                                            data.sampleId
                                                        ]
                                                    }
                                                />
                                                {i <
                                                    d[0].proteinExpression[
                                                        p.molecularProfileId
                                                    ].length -
                                                        1 && ', '}
                                            </span>
                                        ))}
                                        )
                                    </span>
                                );
                            } else {
                                return (
                                    <span>
                                        {d[0].proteinExpression[
                                            p.molecularProfileId
                                        ][0].value.toFixed(2)}
                                    </span>
                                );
                            }
                        }
                        return <span></span>;
                    },
                    download: (d: IExpressionRow[]) => {
                        if (d[0].proteinExpression?.[p.molecularProfileId]) {
                            if (hasMultipleSamples) {
                                const mean = _.meanBy(
                                    d[0].proteinExpression[
                                        p.molecularProfileId
                                    ],
                                    d => d.value
                                ).toFixed(2);
                                return mean;
                            } else {
                                return d[0].proteinExpression[
                                    p.molecularProfileId
                                ][0].value.toFixed(2);
                            }
                        } else {
                            return '';
                        }
                    },
                    sortBy: (d: IExpressionRow[]) => {
                        if (d[0].proteinExpression?.[p.molecularProfileId]) {
                            if (hasMultipleSamples) {
                                const mean = _.meanBy(
                                    d[0].proteinExpression[
                                        p.molecularProfileId
                                    ],
                                    d => d.value
                                );
                                return mean;
                            } else {
                                return d[0].proteinExpression[
                                    p.molecularProfileId
                                ][0].value;
                            }
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
                render: (d: IExpressionRow[]) => {
                    if (d[0]?.mutations) {
                        return (
                            <>
                                <span style={{ display: 'flex' }}>
                                    {ProteinChangeColumnFormatter.renderWithMutationStatus(
                                        d[0].mutations,
                                        this.props.store
                                            .indexedVariantAnnotations
                                    )}
                                    {AnnotationColumnFormatter.renderFunction(
                                        d[0].mutations,
                                        {
                                            oncoKbData: this.props.store
                                                .oncoKbData,
                                            oncoKbCancerGenes: this.props.store
                                                .oncoKbCancerGenes,
                                            usingPublicOncoKbInstance: this
                                                .props.store
                                                .usingPublicOncoKbInstance,
                                            mergeOncoKbIcons: this.props
                                                .mergeOncoKbIcons,
                                            oncoKbContentPadding: calculateOncoKbContentPadding(
                                                DEFAULT_ONCOKB_CONTENT_WIDTH
                                            ),
                                            enableCivic: false,
                                            enableOncoKb: true,
                                            enableHotspot: false,
                                            enableRevue: false,
                                            resolveTumorType: this
                                                .resolveTumorType,
                                        }
                                    )}
                                </span>
                                {hasMultipleSamples &&
                                    TumorColumnFormatter.renderFunction(
                                        d[0].mutations,
                                        this.props.store.sampleManager.result!,
                                        this.props.store
                                            .sampleToDiscreteGenePanelId.result,
                                        this.props.store
                                            .genePanelIdToEntrezGeneIds.result
                                    )}
                            </>
                        );
                    } else if (
                        _.every(
                            TumorColumnFormatter.getProfiledSamplesForGene(
                                this.props.store.allHugoGeneSymbolsToGene
                                    .result[d[0].hugoGeneSymbol].entrezGeneId,
                                this.props.store.sampleIds,
                                this.props.store.sampleToMutationGenePanelId
                                    .result,
                                this.props.store.genePanelIdToEntrezGeneIds
                                    .result
                            ),
                            profiledStatus => !!!profiledStatus
                        )
                    ) {
                        return (
                            <svg
                                width="12"
                                height="12"
                                data-test="not-profiled-icon"
                            >
                                <g transform="translate(0,5)">
                                    <rect
                                        width="12"
                                        height="2.5"
                                        rx="1.25"
                                        ry="1.25"
                                        fill={'#cccccc'}
                                        fillOpacity={1}
                                    />
                                </g>
                            </svg>
                        );
                    } else {
                        return <span></span>;
                    }
                },
                download: (d: IExpressionRow[]) =>
                    d[0]?.mutations ? d[0].mutations[0].proteinChange : '',
                sortBy: (d: IExpressionRow[]) =>
                    d[0]?.mutations ? d[0].mutations[0].proteinChange : null,
                visible: true,
                order: 45,
            });
        }

        if (this.props.store.structuralVariantProfile.result) {
            columns.push({
                name: this.props.store.structuralVariantProfile.result.name,
                render: (d: IExpressionRow[]) => {
                    return (
                        <>
                            <span>
                                {d[0]?.structuralVariants
                                    ? d[0].structuralVariants[0].eventInfo
                                    : ''}
                            </span>
                            {d[0]?.structuralVariants ? (
                                TumorColumnFormatter.renderFunction(
                                    d[0].structuralVariants.map(datum => {
                                        // if both are available, return both genes in an array
                                        // otherwise, return whichever is available
                                        const genes =
                                            datum.site1EntrezGeneId &&
                                            datum.site2EntrezGeneId
                                                ? [
                                                      datum.site1EntrezGeneId,
                                                      datum.site2EntrezGeneId,
                                                  ]
                                                : datum.site1EntrezGeneId ||
                                                  datum.site2EntrezGeneId;
                                        return {
                                            sampleId: datum.sampleId,
                                            entrezGeneId: genes,
                                            sv: true,
                                        };
                                    }),
                                    this.props.store.sampleManager.result!,
                                    this.props.store.sampleToDiscreteGenePanelId
                                        .result,
                                    this.props.store.genePanelIdToEntrezGeneIds
                                        .result
                                )
                            ) : (
                                <span></span>
                            )}
                        </>
                    );
                },
                download: (d: IExpressionRow[]) =>
                    d[0]?.structuralVariants[0].eventInfo,
                sortBy: (d: IExpressionRow[]) =>
                    d[0]?.structuralVariants
                        ? d[0].structuralVariants[0].eventInfo
                        : null,
                visible: true,
                order: 50,
            });
        }

        if (this.props.store.discreteMolecularProfile.result) {
            columns.push({
                name: this.props.store.discreteMolecularProfile.result.name,
                render: (d: IExpressionRow[]) => {
                    let color = getCNAColorByAlteration(
                        d[0].cna?.[
                            this.props.store.discreteMolecularProfile.result!
                                .molecularProfileId
                        ]
                            ? getCNAByAlteration(
                                  d[0].cna[
                                      this.props.store.discreteMolecularProfile
                                          .result!.molecularProfileId
                                  ][0].value
                              )
                            : ''
                    );
                    return (
                        <span style={{ color }}>
                            {d[0].cna?.[
                                this.props.store.discreteMolecularProfile
                                    .result!.molecularProfileId
                            ]
                                ? getCnaTypes(
                                      d[0].cna[
                                          this.props.store
                                              .discreteMolecularProfile.result!
                                              .molecularProfileId
                                      ][0].value
                                  )
                                : ''}
                        </span>
                    );
                },
                download: (d: IExpressionRow[]) =>
                    d[0].cna?.[
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
                        d[0].cna?.[
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
                            {d[0].cna?.[p.molecularProfileId]
                                ? d[0].cna[
                                      p.molecularProfileId
                                  ][0].value.toFixed(2)
                                : ''}
                        </span>
                    ),
                    download: (d: IExpressionRow[]) =>
                        d[0].cna?.[p.molecularProfileId]
                            ? d[0].cna[p.molecularProfileId][0].value.toFixed(2)
                            : '',
                    sortBy: (d: IExpressionRow[]) => {
                        if (d[0].cna?.[p.molecularProfileId]) {
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
