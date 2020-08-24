import * as React from 'react';
import { observer } from 'mobx-react';
import { MSKTabs, MSKTab } from 'shared/components/MSKTabs/MSKTabs';
import { ResultsViewPageStore } from '../ResultsViewPageStore';
import ResultsViewMutationMapper from './ResultsViewMutationMapper';
import { convertToMutationMapperProps } from 'shared/components/mutationMapper/MutationMapperConfig';
import MutationMapperUserSelectionStore from 'shared/components/mutationMapper/MutationMapperUserSelectionStore';
import { computed, action } from 'mobx';
import AppConfig from 'appConfig';
import OqlStatusBanner from '../../../shared/components/banners/OqlStatusBanner';
import autobind from 'autobind-decorator';
import { AppStore } from '../../../AppStore';
import { DataType } from 'cbioportal-frontend-commons';
import { tsvFormat } from 'd3-dsv';

import './mutations.scss';
import AlterationFilterWarning from '../../../shared/components/banners/AlterationFilterWarning';
import {
    getMutationAlignerUrlTemplate,
    getOncoKbApiUrl,
} from 'shared/api/urls';
import CaseFilterWarning from '../../../shared/components/banners/CaseFilterWarning';
import { Mutation } from 'cbioportal-ts-api-client';
import _ from 'lodash';
import ResultsViewURLWrapper from '../ResultsViewURLWrapper';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';

export interface IMutationsPageProps {
    routing?: any;
    store: ResultsViewPageStore;
    appStore: AppStore;
    urlWrapper: ResultsViewURLWrapper;
}

@observer
export default class Mutations extends React.Component<
    IMutationsPageProps,
    {}
> {
    private userSelectionStore: MutationMapperUserSelectionStore;

    @computed get selectedGeneSymbol() {
        return this.props.urlWrapper.query.mutations_gene &&
            this.props.store.hugoGeneSymbols.includes(
                this.props.urlWrapper.query.mutations_gene
            )
            ? this.props.urlWrapper.query.mutations_gene
            : this.props.store.hugoGeneSymbols[0];
    }

    @computed get selectedGene() {
        return _.find(
            this.props.store.genes.result,
            gene => gene.hugoGeneSymbol === this.selectedGeneSymbol
        );
    }

    constructor(props: IMutationsPageProps) {
        super(props);
        this.handleTabChange.bind(this);
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

    @action
    public setSelectedGeneSymbol(hugoGeneSymbol: string) {
        this.props.urlWrapper.updateURL({
            mutations_gene: hugoGeneSymbol,
        });
    }

    public render() {
        const activeTabId = this.selectedGeneSymbol;

        return (
            <div data-test="mutationsTabDiv">
                {this.props.store.mutationsByGene.isComplete && (
                    <MSKTabs
                        id="mutationsPageTabs"
                        activeTabId={activeTabId}
                        onTabClick={(id: string) => this.handleTabChange(id)}
                        className="pillTabs resultsPageMutationsGeneTabs"
                        arrowStyle={{ 'line-height': 0.8 }}
                        tabButtonStyle="pills"
                        unmountOnHide={true}
                    >
                        {this.generateTabs(
                            this.props.store.hugoGeneSymbols,
                            this.props.store.mutationsByGene.result
                        )}
                    </MSKTabs>
                )}
                {this.props.store.mutationsByGene.isPending && (
                    <LoadingIndicator
                        center={true}
                        size="big"
                        isLoading={true}
                    />
                )}
            </div>
        );
    }

    protected generateTabs(
        genes: string[],
        mutationsByGene: {
            [hugoGeneSymbol: string]: Mutation[];
        }
    ) {
        const tabs: JSX.Element[] = [];

        genes.forEach((gene: string) => {
            if (mutationsByGene[gene]) {
                const tabHasMutations = mutationsByGene[gene].length > 0;
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
                        {this.selectedGeneSymbol === gene &&
                            this.geneTabContent}
                    </MSKTab>
                );
            }
        });

        return tabs;
    }

    protected handleTabChange(id: string) {
        this.setSelectedGeneSymbol(id);
    }

    @computed get geneTabContent() {
        if (
            this.selectedGene &&
            this.props.store.getMutationMapperStore(this.selectedGene)
        ) {
            const mutationMapperStore = this.props.store.getMutationMapperStore(
                this.selectedGene
            )!;
            return (
                <div>
                    <div className={'tabMessageContainer'}>
                        <OqlStatusBanner
                            className="mutations-oql-status-banner"
                            store={this.props.store}
                            tabReflectsOql={
                                this.props.store.mutationsTabFilteringSettings
                                    .useOql
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
                                    .mutationsTabFilteringSettings.excludeVus,
                                excludeGermline: this.props.store
                                    .mutationsTabFilteringSettings
                                    .excludeGermline,
                                toggleExcludeVUS: this.onToggleVUS,
                                toggleExcludeGermline: this.onToggleGermline,
                                hugoGeneSymbol: this.selectedGene
                                    .hugoGeneSymbol,
                            }}
                        />
                        <CaseFilterWarning store={this.props.store} />
                    </div>
                    <ResultsViewMutationMapper
                        {...convertToMutationMapperProps({
                            ...AppConfig.serverConfig,
                            // override ensemblLink
                            ensembl_transcript_url: this.props.store
                                .ensemblLink,
                            // only disable oncokb and hotspots track if
                            // non-canonical transcript is selected
                            show_oncokb: mutationMapperStore.isCanonicalTranscript
                                ? AppConfig.serverConfig.show_oncokb
                                : false,
                            show_hotspot: mutationMapperStore.isCanonicalTranscript
                                ? AppConfig.serverConfig.show_hotspot
                                : false,
                        })}
                        oncoKbPublicApiUrl={getOncoKbApiUrl()}
                        store={mutationMapperStore}
                        trackVisibility={
                            this.userSelectionStore.trackVisibility
                        }
                        discreteCNACache={this.props.store.discreteCNACache}
                        pubMedCache={this.props.store.pubMedCache}
                        cancerTypeCache={this.props.store.cancerTypeCache}
                        mutationCountCache={this.props.store.mutationCountCache}
                        genomeNexusCache={this.props.store.genomeNexusCache}
                        genomeNexusMutationAssessorCache={
                            this.props.store.genomeNexusMutationAssessorCache
                        }
                        pdbHeaderCache={this.props.store.pdbHeaderCache}
                        userEmailAddress={this.props.appStore.userName!}
                        generateGenomeNexusHgvsgUrl={
                            this.props.store.generateGenomeNexusHgvsgUrl
                        }
                        mutationAlignerUrlTemplate={getMutationAlignerUrlTemplate()}
                        showTranscriptDropDown={
                            AppConfig.serverConfig.show_transcript_dropdown
                        }
                        getDownloadData={this.getDownloadData}
                        onTranscriptChange={this.onTranscriptChange}
                    />
                </div>
            );
        } else {
            return null;
        }
    }

    @action
    public getDownloadData(dataType?: DataType): string {
        var flatdata: any = '';
        var mutations;
        /*if (
            this.selectedGene &&
            this.props.store.getMutationMapperStore(this.selectedGene)
        ) {
             mutationMapperStore = this.props.store.getMutationMapperStore(
                this.selectedGene
            )!;
        }*/
        mutations = this.props.store.mutations.result || [];
        flatdata = tsvFormat(this.convertDataToDownloadMMSData(mutations));
        /*
        if (mutationMapperStore == undefined) flatdata = 'undefined';
        else
            flatdata = tsvFormat(
                this.convertDataToDownloadMMSData(
                    mutations
                )
            );
        */
        return flatdata;
    }

    protected convertDataToDownloadMMSData(mutations: Mutation[]) {
        // if (mms && mms.mutationData) {
        let data = mutations || [];
        let downloadData: any[] = [];
        data.forEach(m => {
            downloadData.push(m);
        });
        return downloadData;
        //} else return ' ';
    }

    @autobind
    @action
    protected onTranscriptChange(transcriptId: string) {
        this.props.urlWrapper.updateURL({
            mutations_transcript_id: transcriptId,
        });
    }
}
