import * as React from 'react';
import { observer } from 'mobx-react';
import { action, computed, observable, makeObservable } from 'mobx';
import autobind from 'autobind-decorator';
import Loader from 'shared/components/loadingIndicator/LoadingIndicator';
import { convertToMutationMapperProps } from 'shared/components/mutationMapper/MutationMapperConfig';
import { getGenomeNexusHgvsgUrl } from 'shared/api/urls';
import { getServerConfig } from 'config/config';
import GroupComparisonMutationMapper from './GroupComparisonMutationMapper';
import { Mutation } from 'cbioportal-ts-api-client';
import MutationMapperToolStore from 'pages/staticPages/tools/mutationMapper/MutationMapperToolStore';
import GroupComparisonStore from './GroupComparisonStore';
import _ from 'lodash';
import {
    MUTATIONS_NOT_ENOUGH_GROUPS_MSG,
    MUTATIONS_TOO_MANY_GROUPS_MSG,
} from './GroupComparisonUtils';
import AsyncSelect from 'react-select/async';
import {
    numberOfLeadingDecimalZeros,
    formatPercentValue,
} from 'cbioportal-utils';
import { countUniqueMutations } from 'shared/lib/MutationUtils';

interface IMutationProps {
    store: GroupComparisonStore;
    mutations?: Mutation[];
    filters?: any;
}

@observer
export default class Mutations extends React.Component<IMutationProps, {}> {
    private mutationMapperToolStore: MutationMapperToolStore;
    private groupComparisonMutationMapper:
        | GroupComparisonMutationMapper
        | undefined;

    constructor(props: IMutationProps) {
        super(props);
        this.mutationMapperToolStore = new MutationMapperToolStore(
            this.props.mutations ||
                _(this.props.store.mutationsByGroup.result!)
                    .values()
                    .flatten()
                    .value(),
            this.props.filters || {
                groupFilters: _(this.props.store.mutationsByGroup.result!)
                    .keys()
                    .value()
                    .map(group => ({
                        group: group,
                        filter: {
                            type: 'GroupComparisonFilter',
                            values: [group],
                        },
                    })),
                filterAppliersOverride: {
                    ['GroupComparisonFilter']: this.props.store
                        .applySampleIdFilter,
                },
                countUniqueMutations: this.countUniqueMutations,
            }
        );
    }

    @computed
    get showPercent() {
        return this.groupComparisonMutationMapper
            ? this.groupComparisonMutationMapper.showPercent
            : true;
    }

    @autobind
    protected countUniqueMutations(mutations: Mutation[]) {
        return this.showPercent
            ? (countUniqueMutations(mutations) /
                  this.props.store.countProfiledSamples.result!) *
                  100
            : countUniqueMutations(mutations);
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

    @autobind
    private onMutationMapperInit(
        mutationMapper: GroupComparisonMutationMapper
    ) {
        this.groupComparisonMutationMapper = mutationMapper;
    }

    public render() {
        const selectorContent =
            this.props.store.activeGroups.result!.length < 2 ? (
                <span>{MUTATIONS_NOT_ENOUGH_GROUPS_MSG}</span>
            ) : this.props.store.activeGroups.result!.length > 2 ? (
                <span>{MUTATIONS_TOO_MANY_GROUPS_MSG}</span>
            ) : (
                <div style={{ width: 200, paddingBottom: 10 }}>
                    <AsyncSelect
                        name="Select gene"
                        onChange={(option: any | null) => {
                            if (option) {
                                this.props.store.setSelectedMutationMapperGene(
                                    option.value
                                );
                            } else {
                                this.props.store.clearSelectedMutationMapperGene();
                            }
                        }}
                        isClearable={true}
                        isSearchable={true}
                        defaultOptions={this.props.store.availableGenes
                            .result!.slice(0, 200)
                            .map(gene => ({
                                label: gene.hugoGeneSymbol,
                                value: gene,
                            }))}
                        defaultValue={
                            this.props.store.selectedMutationMapperGene
                                ? {
                                      label: this.props.store
                                          .selectedMutationMapperGene
                                          .hugoGeneSymbol,
                                      value: this.props.store
                                          .selectedMutationMapperGene,
                                  }
                                : null
                        }
                        placeholder={'Select a gene'}
                        loadOptions={this.props.store.loadOptions}
                        cacheOptions={true}
                    />
                </div>
            );
        if (this.props.store.selectedMutationMapperGene) {
            const mutationMapperStore = this.mutationMapperToolStore.getMutationMapperStore(
                this.props.store.selectedMutationMapperGene!.hugoGeneSymbol
            );
            return (
                <>
                    {selectorContent}
                    <div>
                        <Loader
                            isLoading={
                                this.mutationMapperToolStore
                                    .mutationMapperStores.isPending &&
                                this.props.store.mutations.isPending
                            }
                        />
                        {mutationMapperStore &&
                            this.props.store.mutations.isComplete &&
                            this.props.store.activeGroups.result!.length ===
                                2 && (
                                <div>
                                    <h3>
                                        {_(
                                            this.props.store.mutationsByGroup
                                                .result!
                                        )
                                            .keys()
                                            .slice(0, 2)
                                            .join(' vs ')}
                                    </h3>
                                    <GroupComparisonMutationMapper
                                        onInit={this.onMutationMapperInit}
                                        {...convertToMutationMapperProps({
                                            ...getServerConfig(),
                                        })}
                                        generateGenomeNexusHgvsgUrl={hgvsg =>
                                            getGenomeNexusHgvsgUrl(
                                                hgvsg,
                                                undefined
                                            )
                                        }
                                        store={mutationMapperStore}
                                        showTranscriptDropDown={true}
                                        plotLollipopTooltipCountInfo={
                                            this.plotLollipopTooltipCountInfo
                                        }
                                    />
                                </div>
                            )}
                    </div>
                </>
            );
        } else {
            return <>{selectorContent}</>;
        }
    }
}
