import * as React from 'react';
import { inject, observer } from 'mobx-react';
import { action, computed, observable, makeObservable } from 'mobx';
import autobind from 'autobind-decorator';
import { Collapse } from 'react-collapse';
import {
    ControlLabel,
    FormControl,
    FormGroup,
    ButtonGroup,
    Radio,
} from 'react-bootstrap';
import { PageLayout } from 'shared/components/PageLayout/PageLayout';
import Helmet from 'react-helmet';

import Loader from 'shared/components/loadingIndicator/LoadingIndicator';
import { MSKTab, MSKTabs } from 'shared/components/MSKTabs/MSKTabs';
import { convertToMutationMapperProps } from 'shared/components/mutationMapper/MutationMapperConfig';
import MutationMapperUserSelectionStore from 'shared/components/mutationMapper/MutationMapperUserSelectionStore';
import { parseInput } from 'shared/lib/MutationInputParser';

// import StandaloneMutationMapper from './StandaloneMutationMapper';
// import MutationMapperToolStore from './MutationMapperToolStore';

import {
    getGenomeNexusHgvsgUrl,
    getMutationAlignerUrlTemplate,
    getOncoKbApiUrl,
} from 'shared/api/urls';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { REFERENCE_GENOME } from 'shared/lib/referenceGenomeUtils';
import { getServerConfig } from 'config/config';
import { updateOncoKbIconStyle } from 'shared/lib/AnnotationColumnUtils';
import GroupComparisonMutationMapperStore from './GroupComparisonMutationMapperStore';
import GroupComparisonMutationMapper from './GroupComparisonMutationMapper';
import { Mutation } from 'cbioportal-ts-api-client';
import ResultsViewMutationMapper from 'pages/resultsView/mutation/ResultsViewMutationMapper';
import MutationMapperToolStore from 'pages/staticPages/tools/mutationMapper/MutationMapperToolStore';
import GroupComparisonStore from './GroupComparisonStore';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { DataFilter, DataFilterType } from 'react-mutation-mapper';

interface IMutationProps {
    store: GroupComparisonStore;
    mutations: Mutation[];
    filters?: any;
}

const ONCOKB_URL = 'https://www.oncokb.org/';
const CIVIC_URL = 'https://civicdb.org/';
const CANCER_HOTSPOTS_URL = 'https://www.cancerhotspots.org/';
const MY_CANCER_GENOME_URL = 'https://www.mycancergenome.org/';
const GROUP_COMPARISON_FILTER_TYPE = 'GroupComparisonFilter';

@inject('routing')
@observer
export default class Mutations extends React.Component<IMutationProps, {}> {
    @observable.ref geneTab: string | undefined = undefined;
    private mutationMapperStore: MutationMapperToolStore;

    constructor(props: IMutationProps) {
        super(props);
        makeObservable(this);
        this.mutationMapperStore = new MutationMapperToolStore(
            this.props.mutations,
            this.props.filters || null
        );
    }

    @computed get tabs() {
        const tabs: JSX.Element[] = [];

        this.mutationMapperStore.hugoGeneSymbols.result.forEach(
            (gene: string) => {
                const mutationMapperStore = this.mutationMapperStore.getMutationMapperStore(
                    gene
                );
                if (mutationMapperStore) {
                    tabs.push(
                        <MSKTab key={gene} id={gene} linkText={gene}>
                            <GroupComparisonMutationMapper
                                {...convertToMutationMapperProps({
                                    ...getServerConfig(),
                                })}
                                mutationData={this.props.store.mutations.result}
                                generateGenomeNexusHgvsgUrl={hgvsg =>
                                    getGenomeNexusHgvsgUrl(hgvsg, undefined)
                                }
                                store={mutationMapperStore}
                                showTranscriptDropDown={true}
                            />
                        </MSKTab>
                    );
                }
            }
        );

        return tabs;
    }

    public render() {
        if (
            this.mutationMapperStore.hugoGeneSymbols.isComplete &&
            this.mutationMapperStore.hugoGeneSymbols.result &&
            this.mutationMapperStore.hugoGeneSymbols.result.length > 0
        ) {
            const activeTabId =
                this.activeTabId ||
                this.mutationMapperStore.hugoGeneSymbols.result[0];
            return (
                <div>
                    <Loader
                        isLoading={
                            this.mutationMapperStore.mutationMapperStores
                                .isPending &&
                            this.props.store.mutations.isPending
                        }
                    />
                    <MSKTabs
                        id="mutationMapperToolTabs"
                        activeTabId={activeTabId}
                        onTabClick={(id: string) => this.handleTabChange(id)}
                        className="pillTabs"
                        arrowStyle={{ 'line-height': 0.8 }}
                        tabButtonStyle="pills"
                        unmountOnHide={true}
                    >
                        {this.tabs}
                    </MSKTabs>
                </div>
            );
        } else {
            return null;
        }
    }

    @computed get activeTabId(): string | undefined {
        return this.geneTab;
    }

    @action.bound
    protected handleTabChange(id: string | undefined) {
        this.geneTab = id;
    }
}
