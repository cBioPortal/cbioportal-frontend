import * as React from 'react';
import { observer } from 'mobx-react';
import { MSKTabs, MSKTab } from 'shared/components/MSKTabs/MSKTabs';
import { ResultsViewPageStore } from '../ResultsViewPageStore';
import ResultsViewMutationMapper from './ResultsViewMutationMapper';
import { convertToMutationMapperProps } from 'shared/components/mutationMapper/MutationMapperConfig';
import MutationMapperUserSelectionStore from 'shared/components/mutationMapper/MutationMapperUserSelectionStore';
import { observable } from 'mobx';
import { PatientViewPageStore } from '../../../pages/patientView/clinicalInformation/PatientViewPageStore';
import AppConfig from 'appConfig';
import OqlStatusBanner from '../../../shared/components/banners/OqlStatusBanner';
import autobind from 'autobind-decorator';
import { AppStore } from '../../../AppStore';

import './mutations.scss';
import AlterationFilterWarning from '../../../shared/components/banners/AlterationFilterWarning';
import { getOncoKbApiUrl } from 'shared/api/urls';

export interface IMutationsPageProps {
    routing?: any;
    store: ResultsViewPageStore;
    appStore: AppStore;
    sampleIdToClinicalDataMap: {};
}

@observer
export default class Mutations extends React.Component<
    IMutationsPageProps,
    {}
> {
    private userSelectionStore: MutationMapperUserSelectionStore;

    @observable mutationsGeneTab: string;

    constructor(props: IMutationsPageProps) {
        super(props);
        this.handleTabChange.bind(this);
        this.mutationsGeneTab = this.props.store.hugoGeneSymbols![0];
        this.userSelectionStore = new MutationMapperUserSelectionStore();
    }

    @autobind
    private onToggleOql() {
        this.props.store.mutationsTabFilteringSettings.useOql = !this.props
            .store.mutationsTabFilteringSettings.useOql;
    }

    @autobind
    private onToggleVUS() {
        this.props.store.mutationsTabFilteringSettings.excludeVus = !this.props
            .store.mutationsTabFilteringSettings.excludeVus;
    }

    @autobind
    private onToggleGermline() {
        this.props.store.mutationsTabFilteringSettings.excludeGermline = !this
            .props.store.mutationsTabFilteringSettings.excludeGermline;
    }

    public render() {
        // use routing if available, if not fall back to the observable variable
        const activeTabId = this.props.routing
            ? this.props.routing.location.query.mutationsGeneTab
            : this.mutationsGeneTab;

        return (
            <div data-test="mutationsTabDiv">
                {this.props.store.mutationMapperStores.isComplete && (
                    <MSKTabs
                        id="mutationsPageTabs"
                        activeTabId={activeTabId}
                        onTabClick={(id: string) => this.handleTabChange(id)}
                        className="pillTabs resultsPageMutationsGeneTabs"
                        enablePagination={false}
                        arrowStyle={{ 'line-height': 0.8 }}
                        tabButtonStyle="pills"
                        unmountOnHide={true}
                    >
                        {this.generateTabs(this.props.store.hugoGeneSymbols!)}
                    </MSKTabs>
                )}
            </div>
        );
    }

    protected generateTabs(genes: string[]) {
        const tabs: JSX.Element[] = [];

        genes.forEach((gene: string) => {
            const mutationMapperStore = this.props.store.getMutationMapperStore(
                gene
            );

            if (mutationMapperStore) {
                const tabHasMutations =
                    mutationMapperStore.mutations.length > 0;
                // gray out tab if no mutations
                const anchorStyle = tabHasMutations
                    ? undefined
                    : { color: '#bbb' };

                tabs.push(
                    <MSKTab
                        key={gene}
                        id={gene}
                        linkText={gene}
                        anchorStyle={anchorStyle}
                    >
                        <div className={'tabMessageContainer'}>
                            <OqlStatusBanner
                                className="mutations-oql-status-banner"
                                store={this.props.store}
                                tabReflectsOql={
                                    this.props.store
                                        .mutationsTabFilteringSettings.useOql
                                }
                                isUnaffected={
                                    !this.props.store.queryContainsMutationOql
                                }
                                onToggle={this.onToggleOql}
                            />
                            <AlterationFilterWarning
                                store={this.props.store}
                                mutationsTabModeSettings={{
                                    excludeVUS: this.props.store
                                        .mutationsTabFilteringSettings
                                        .excludeVus,
                                    excludeGermline: this.props.store
                                        .mutationsTabFilteringSettings
                                        .excludeGermline,
                                    toggleExcludeVUS: this.onToggleVUS,
                                    toggleExcludeGermline: this
                                        .onToggleGermline,
                                    hugoGeneSymbol: gene,
                                }}
                            />
                        </div>
                        <ResultsViewMutationMapper
                            {...convertToMutationMapperProps(
                                AppConfig.serverConfig
                            )}
                            oncoKbPublicApiUrl={getOncoKbApiUrl()}
                            store={mutationMapperStore}
                            trackVisibility={
                                this.userSelectionStore.trackVisibility
                            }
                            discreteCNACache={this.props.store.discreteCNACache}
                            oncoKbEvidenceCache={
                                this.props.store.oncoKbEvidenceCache
                            }
                            pubMedCache={this.props.store.pubMedCache}
                            cancerTypeCache={this.props.store.cancerTypeCache}
                            mutationCountCache={
                                this.props.store.mutationCountCache
                            }
                            genomeNexusCache={this.props.store.genomeNexusCache}
                            genomeNexusMyVariantInfoCache={
                                this.props.store.genomeNexusMyVariantInfoCache
                            }
                            pdbHeaderCache={this.props.store.pdbHeaderCache}
                            myCancerGenomeData={
                                this.props.store.myCancerGenomeData
                            }
                            userEmailAddress={this.props.appStore.userName!}
                            clinicalDataStore={this.props.store}
                        />
                    </MSKTab>
                );
            }
        });

        return tabs;
    }

    protected handleTabChange(id: string) {
        // update the hash if routing exits
        if (this.props.routing) {
            this.props.routing.updateRoute({ mutationsGeneTab: id });
        }
        // update the observable if no routing
        else {
            this.mutationsGeneTab = id;
        }
    }
}
