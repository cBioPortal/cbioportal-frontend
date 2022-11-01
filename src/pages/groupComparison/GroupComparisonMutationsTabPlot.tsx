import * as React from 'react';
import { observer } from 'mobx-react';
import { action, computed, observable, makeObservable } from 'mobx';
import autobind from 'autobind-decorator';
import Loader from 'shared/components/loadingIndicator/LoadingIndicator';
import { convertToMutationMapperProps } from 'shared/components/mutationMapper/MutationMapperServerConfig';
import { getGenomeNexusHgvsgUrl } from 'shared/api/urls';
import { getServerConfig } from 'config/config';
import GroupComparisonMutationMapper from './GroupComparisonMutationMapper';
import { Mutation } from 'cbioportal-ts-api-client';
import MutationMapperToolStore from 'pages/staticPages/tools/mutationMapper/MutationMapperToolStore';
import GroupComparisonStore from './GroupComparisonStore';
import _ from 'lodash';
import {
    numberOfLeadingDecimalZeros,
    formatPercentValue,
} from 'cbioportal-utils';
import { AxisScale } from './AxisScaleSwitch';
import { MakeMobxView } from 'shared/components/MobxView';
import { remoteData } from 'cbioportal-frontend-commons';
import { countUniqueMutations } from 'shared/lib/MutationUtils';

interface IGroupComparisonMutationsTabPlotProps {
    store: GroupComparisonStore;
    mutations?: Mutation[];
    filters?: any;
}

@observer
export default class GroupComparisonMutationsTabPlot extends React.Component<
    IGroupComparisonMutationsTabPlotProps,
    {}
> {
    @observable public showPercent = true;
    constructor(props: IGroupComparisonMutationsTabPlotProps) {
        super(props);
        makeObservable(this);
    }

    private mutationMapperToolStore = remoteData<MutationMapperToolStore>({
        await: () => [this.props.store.mutationsByGroup],
        invoke: () => {
            const store = new MutationMapperToolStore(this.props.mutations, {
                ...this.props.filters,
                countUniqueMutations: this.countUniqueMutations,
            });
            return Promise.resolve(store);
        },
    });

    @autobind
    protected countUniqueMutations(mutations: Mutation[]) {
        return this.showPercent
            ? (countUniqueMutations(mutations) /
                  this.props.store.profiledSamplesCount.result!) *
                  100
            : countUniqueMutations(mutations);
    }

    @action.bound
    private onScaleToggle(selectedScale: AxisScale) {
        this.showPercent = selectedScale === AxisScale.PERCENT;
    }

    @autobind
    protected plotLollipopTooltipCountInfo(
        count: number,
        mutations?: Mutation[]
    ): JSX.Element {
        const decimalZeros = numberOfLeadingDecimalZeros(count);
        const fractionDigits = decimalZeros < 0 ? 1 : decimalZeros + 2;
        return mutations && mutations.length > 0 && this.showPercent ? (
            <strong>
                {formatPercentValue(count, fractionDigits)}% mutation rate
            </strong>
        ) : (
            <strong>
                {count} mutation{`${count !== 1 ? 's' : ''}`}
            </strong>
        );
    }

    protected plotYAxisLabelFormatter(symbol?: string, groupName?: string) {
        return `${symbol} ${groupName} Mutations`;
    }

    readonly plotUI = MakeMobxView({
        await: () => [
            this.props.store.mutations,
            this.props.store.mutationsByGroup,
            this.props.store.profiledSamplesCount,
            this.mutationMapperToolStore,
        ],
        render: () => {
            const mutationMapperStore = this.mutationMapperToolStore.result!.getMutationMapperStore(
                this.props.store.selectedMutationMapperGene!.hugoGeneSymbol
            );
            return (
                <div>
                    <Loader
                        isLoading={
                            this.mutationMapperToolStore.result!
                                .mutationMapperStores.isPending &&
                            this.props.store.mutations.isPending &&
                            this.props.store.mutationsByGroup.isPending &&
                            this.props.store.profiledSamplesCount.isPending
                        }
                    />
                    {mutationMapperStore &&
                        this.props.store.activeGroups.result!.length === 2 && (
                            <div>
                                <h3>
                                    {_(
                                        this.props.store.mutationsByGroup
                                            .result!
                                    )
                                        .keys()
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
                                    showPercent={this.showPercent}
                                    onScaleToggle={this.onScaleToggle}
                                    plotYAxisLabelFormatter={
                                        this.plotYAxisLabelFormatter
                                    }
                                />
                            </div>
                        )}
                </div>
            );
        },
    });

    public render() {
        return this.plotUI.component;
    }
}
