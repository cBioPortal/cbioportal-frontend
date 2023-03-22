import * as React from 'react';
import { observer } from 'mobx-react';
import { action, computed, observable, makeObservable } from 'mobx';
import autobind from 'autobind-decorator';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { convertToMutationMapperProps } from 'shared/components/mutationMapper/MutationMapperServerConfig';
import { getGenomeNexusHgvsgUrl } from 'shared/api/urls';
import { getServerConfig } from 'config/config';
import GroupComparisonMutationMapper from './GroupComparisonMutationMapper';
import { Mutation } from 'cbioportal-ts-api-client';
import MutationMapperToolStore from 'pages/staticPages/tools/mutationMapper/MutationMapperToolStore';
import GroupComparisonStore from './GroupComparisonStore';
import _ from 'lodash';
import { MakeMobxView } from 'shared/components/MobxView';
import { countUniqueMutations } from 'shared/lib/MutationUtils';
import ErrorMessage from 'shared/components/ErrorMessage';
import { AxisScale } from 'react-mutation-mapper';
import { LollipopTooltipCountInfo } from './LollipopTooltipCountInfo';
import { AnnotatedMutation } from 'shared/model/AnnotatedMutation';
import MutationMapperUserSelectionStore from 'shared/components/mutationMapper/MutationMapperUserSelectionStore';

interface IGroupComparisonMutationsTabPlotProps {
    store: GroupComparisonStore;
    onScaleToggle: (selectedScale: AxisScale) => void;
    mutations?: Mutation[];
    filters?: any;
}

@observer
export default class GroupComparisonMutationsTabPlot extends React.Component<
    IGroupComparisonMutationsTabPlotProps,
    {}
> {
    private userSelectionStore: MutationMapperUserSelectionStore;

    constructor(props: IGroupComparisonMutationsTabPlotProps) {
        super(props);
        makeObservable(this);
        this.userSelectionStore = new MutationMapperUserSelectionStore();
    }

    @computed get mutationMapperToolStore() {
        const store = new MutationMapperToolStore(
            this.props.store.filteredAndAnnotatedMutations.result,
            {
                ...this.props.filters,
                countUniqueMutations: this.countUniqueMutationsInGroup,
            }
        );
        return store;
    }

    @autobind
    protected countUniqueMutationsInGroup(
        mutations: Mutation[],
        group: string
    ) {
        return this.props.store.axisMode === AxisScale.COUNT
            ? countUniqueMutations(mutations)
            : (countUniqueMutations(mutations) /
                  this.props.store.groupToProfiledPatients.result![group]
                      .length) *
                  100;
    }

    @autobind
    protected plotLollipopTooltipCountInfo(
        count: number,
        mutations: Mutation[],
        axisMode: AxisScale,
        group: string
    ): JSX.Element {
        return (
            <LollipopTooltipCountInfo
                count={count}
                mutations={mutations}
                axisMode={axisMode}
                patientCount={
                    this.props.store.groupToProfiledPatients.result![group]
                        .length
                }
            />
        );
    }

    @autobind
    protected plotYAxisLabelFormatter(symbol: string, groupName: string) {
        // lowercase = 1 and uppercase = 1.3 (based on 'w' and 'W'), if label >= 22 (13 + 9 leniency), stop and + "..."
        let length = 1;
        let label = `(${
            this.props.store.activeGroups.result!.find(
                g => g.name === groupName
            )!.ordinal
        }) `;
        for (let c of groupName) {
            let value = c === c.toLowerCase() ? 1 : 1.3;
            if (length + value >= 21) {
                label += '...';
                break;
            } else {
                label += c;
                length += value;
            }
        }
        if (symbol === '%') {
            return (
                `**${label}**\n${symbol}` +
                ' mutated of ' +
                this.props.store.groupToProfiledPatients.result![groupName]
                    .length +
                ' profiled pts'
            );
        } else {
            return `**${label}**\n${symbol} mutated`;
        }
    }

    readonly plotUI = MakeMobxView({
        await: () => [
            this.props.store.mutations,
            this.props.store.mutationsByGroup,
            this.props.store.filteredAndAnnotatedMutations,
            this.mutationMapperToolStore.mutationMapperStores,
            this.props.store.coverageInformation,
            this.props.store.groupToProfiledPatients,
        ],
        render: () => {
            if (
                this.mutationMapperToolStore.getMutationMapperStore(
                    this.props.store.activeMutationMapperGene!.hugoGeneSymbol
                )
            ) {
                const mutationMapperStore = this.mutationMapperToolStore.getMutationMapperStore(
                    this.props.store.activeMutationMapperGene!.hugoGeneSymbol
                );
                return (
                    <div
                        data-test="ComparisonPageMutationsTabPlot"
                        style={{ marginTop: 20 }}
                    >
                        <h3>
                            {this.props.store.activeMutationMapperGene
                                ?.hugoGeneSymbol +
                                ' mutations: ' +
                                this.props.store.activeGroups
                                    .result!.map(g => g.nameWithOrdinal)
                                    .join(' vs ')}
                        </h3>
                        <GroupComparisonMutationMapper
                            {...convertToMutationMapperProps({
                                ...getServerConfig(),
                            })}
                            generateGenomeNexusHgvsgUrl={hgvsg =>
                                getGenomeNexusHgvsgUrl(hgvsg, undefined)
                            }
                            store={mutationMapperStore}
                            showTranscriptDropDown={true}
                            plotLollipopTooltipCountInfo={
                                this.plotLollipopTooltipCountInfo
                            }
                            axisMode={this.props.store.axisMode}
                            onScaleToggle={this.props.onScaleToggle}
                            plotYAxisLabelFormatter={
                                this.plotYAxisLabelFormatter
                            }
                            isPutativeDriver={
                                this.props.store.driverAnnotationSettings
                                    .driversAnnotated
                                    ? (m: AnnotatedMutation) => m.putativeDriver
                                    : undefined
                            }
                            trackVisibility={
                                this.userSelectionStore.trackVisibility
                            }
                            compactStyle={true}
                            showPlotPercentToggle={true}
                            groups={this.props.store.activeGroups.result!}
                            annotationFilterSettings={this.props.store}
                        />
                    </div>
                );
            } else {
                if (
                    Object.values(
                        this.props.store.coverageInformation.result!.samples
                    ).some(s => !_.isEmpty(s.allGenes) || !_.isEmpty(s.byGene))
                ) {
                    return (
                        <div style={{ marginTop: '20px' }}>
                            Selected gene has no mutations for profiled samples.
                        </div>
                    );
                } else {
                    return (
                        <div style={{ marginTop: '20px' }}>
                            Selected gene has no mutations due to no profiled
                            samples.
                        </div>
                    );
                }
            }
        },
        renderPending: () => (
            <LoadingIndicator isLoading={true} center={true} size={'big'} />
        ),
        renderError: () => <ErrorMessage />,
    });

    public render() {
        return this.plotUI.component;
    }
}
