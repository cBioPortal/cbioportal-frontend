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
import { AxisScale } from './AxisScaleSwitch';
import { MakeMobxView } from 'shared/components/MobxView';
import { countUniqueMutations } from 'shared/lib/MutationUtils';
import ErrorMessage from 'shared/components/ErrorMessage';
import { LollipopTooltipCountInfo } from './LollipopTooltipCountInfo';

interface IGroupComparisonMutationsTabPlotProps {
    store: GroupComparisonStore;
    mutations?: Mutation[];
    filters?: any;
}

function plotYAxisLabelFormatter(symbol?: string, groupName?: string) {
    return `${symbol} ${groupName} Mutations`;
}

@observer
export default class GroupComparisonMutationsTabPlot extends React.Component<
    IGroupComparisonMutationsTabPlotProps,
    {}
> {
    @observable public axisMode: AxisScale = AxisScale.PERCENT;
    constructor(props: IGroupComparisonMutationsTabPlotProps) {
        super(props);
        makeObservable(this);
    }

    @computed get mutationMapperToolStore() {
        const store = new MutationMapperToolStore(this.props.mutations, {
            ...this.props.filters,
            countUniqueMutations: this.countUniqueMutations,
        });
        return store;
    }

    @autobind
    protected countUniqueMutations(mutations: Mutation[]) {
        return this.axisMode === AxisScale.PERCENT
            ? (countUniqueMutations(mutations) /
                  this.props.store.profiledSamplesCount.result!) *
                  100
            : countUniqueMutations(mutations);
    }

    @action.bound
    private onScaleToggle(selectedScale: AxisScale) {
        this.axisMode = selectedScale;
    }

    @autobind
    protected plotLollipopTooltipCountInfo(
        count: number,
        mutations?: Mutation[]
    ): JSX.Element {
        return (
            <LollipopTooltipCountInfo
                count={count}
                mutations={mutations}
                axisMode={this.axisMode}
            />
        );
    }

    readonly plotUI = MakeMobxView({
        await: () => [
            this.props.store.mutations,
            this.props.store.mutationsByGroup,
            this.props.store.profiledSamplesCount,
            this.mutationMapperToolStore.mutationMapperStores,
        ],
        render: () => {
            const mutationMapperStore = this.mutationMapperToolStore.getMutationMapperStore(
                this.props.store.activeMutationMapperGene!.hugoGeneSymbol
            );
            return (
                <>
                    <h3>
                        {_(this.props.store.mutationsByGroup.result!)
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
                        axisMode={this.axisMode}
                        onScaleToggle={this.onScaleToggle}
                        plotYAxisLabelFormatter={plotYAxisLabelFormatter}
                    />
                </>
            );
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
