import * as React from 'react';
import * as _ from 'lodash';
import { action, computed, observable } from 'mobx';
import { observer } from 'mobx-react';
import { MSKTabs, MSKTab } from 'shared/components/MSKTabs/MSKTabs';
import { CancerSummaryContent, IAlterationData } from './CancerSummaryContent';
import { ExtendedSample, ResultsViewPageStore } from '../ResultsViewPageStore';
import { default as LoadingIndicator } from '../../../shared/components/loadingIndicator/LoadingIndicator';
import { Gene } from 'cbioportal-ts-api-client';
import './styles.scss';
import {
    getAlterationCountsForCancerTypesByGene,
    getAlterationCountsForCancerTypesForAllGenes,
} from '../../../shared/lib/alterationCountHelpers';
import OqlStatusBanner from '../../../shared/components/banners/OqlStatusBanner';
import { getRemoteDataGroupStatus } from 'cbioportal-utils';
import AlterationFilterWarning from '../../../shared/components/banners/AlterationFilterWarning';
import { ResultsViewURLQueryEnum } from 'pages/resultsView/ResultsViewURLWrapper';
import { buildCBioPortalPageUrl } from 'shared/api/urls';
import autobind from 'autobind-decorator';
import { OncoprintAnalysisCaseType } from '../ResultsViewPageStoreUtils';
import CaseFilterWarning from '../../../shared/components/banners/CaseFilterWarning';

interface ICancerSummaryContainerProps {
    store: ResultsViewPageStore;
}

export const CANCER_SUMMARY_ALL_GENES = 'all';

@observer
export default class CancerSummaryContainer extends React.Component<
    ICancerSummaryContainerProps,
    {}
> {
    @observable private activeTab: string = CANCER_SUMMARY_ALL_GENES;
    @observable private resultsViewPageWidth: number = 1150;
    @observable private groupAlterationsBy_userSelection: keyof ExtendedSample;

    private resultsViewPageContent: HTMLElement;

    constructor(props: ICancerSummaryContainerProps) {
        super(props);
        this.handleTabClick = this.handleTabClick.bind(this);
        this.pivotData = this.pivotData.bind(this);
        this.mapStudyIdToShortName = this.mapStudyIdToShortName.bind(this);
    }

    private handleTabClick(id: string) {
        this.activeTab = id;
    }

    private get defaultTabId(): string {
        return CANCER_SUMMARY_ALL_GENES;
    }

    public pivotData(str: keyof ExtendedSample) {
        this.groupAlterationsBy_userSelection = str;
    }

    public get groupAlterationsBy(): keyof ExtendedSample {
        if (this.groupAlterationsBy_userSelection === undefined) {
            if (this.props.store.studies.result!.length > 1) {
                return 'studyId';
            } else {
                const cancerTypes = _.chain(
                    this.props.store.filteredSamplesExtendedWithClinicalData
                        .result!
                )
                    .map((sample: ExtendedSample) => sample.cancerType)
                    .uniq()
                    .value();
                return cancerTypes.length === 1
                    ? 'cancerTypeDetailed'
                    : 'cancerType';
            }
        } else {
            return this.groupAlterationsBy_userSelection;
        }
    }

    // this is used to map study id to study shortname
    private mapStudyIdToShortName(str: string) {
        if (str in this.props.store.physicalStudySet) {
            return this.props.store.physicalStudySet[str].shortName;
        } else {
            return str;
        }
    }

    @computed
    private get tabs() {
        // if we're grouping by cancer study, we need to use study shortName property instead of studyId
        const labelTransformer =
            this.groupAlterationsBy === 'studyId'
                ? this.mapStudyIdToShortName
                : undefined;

        const alterationCountsForCancerTypesByGene = getAlterationCountsForCancerTypesByGene(
            this.props.store.oqlFilteredAlterationsByGeneBySampleKey.result!,
            this.props.store.filteredSamplesExtendedWithClinicalData.result!,
            this.groupAlterationsBy,
            this.props.store.selectedMolecularProfileIdsByAlterationType
                .result!,
            this.props.store.coverageInformation.result!
        );

        const geneTabs = _.map(this.props.store.genes.result!, (gene: Gene) => {
            const geneData =
                alterationCountsForCancerTypesByGene[gene.hugoGeneSymbol];
            // count how many alterations there are across all cancer types for this gene
            const alterationCountAcrossCancerType = _.reduce(
                geneData,
                (count, alterationData: IAlterationData) => {
                    return count + alterationData.alterationTotal;
                },
                0
            );

            // if there are no alterations for this gene, grey out text
            const anchorStyle =
                alterationCountAcrossCancerType === 0
                    ? { color: '#bbb' }
                    : undefined;

            return (
                <MSKTab
                    key={gene.hugoGeneSymbol}
                    id={'summaryTab' + gene.hugoGeneSymbol}
                    linkText={gene.hugoGeneSymbol}
                    {...{ anchorStyle }}
                >
                    <CancerSummaryContent
                        groupedAlterationData={
                            alterationCountsForCancerTypesByGene[
                                gene.hugoGeneSymbol
                            ]
                        }
                        handleStudyLinkout={this.handleStudyLinkout}
                        groupAlterationsBy={this.groupAlterationsBy}
                        gene={gene.hugoGeneSymbol}
                        labelTransformer={labelTransformer}
                        handlePivotChange={this.pivotData}
                        width={this.resultsViewPageWidth}
                    />
                </MSKTab>
            );
        });

        // only add combined gene tab if there's more than one gene
        if (geneTabs.length > 1) {
            const groupedAlterationDataForAllGenes = getAlterationCountsForCancerTypesForAllGenes(
                this.props.store.oqlFilteredAlterationsByGeneBySampleKey
                    .result!,
                this.props.store.filteredSamplesExtendedWithClinicalData
                    .result!,
                this.groupAlterationsBy,
                this.props.store.selectedMolecularProfileIdsByAlterationType
                    .result!,
                this.props.store.coverageInformation.result!
            );
            geneTabs.unshift(
                <MSKTab
                    key={CANCER_SUMMARY_ALL_GENES}
                    id="allGenes"
                    linkText="All Queried Genes"
                >
                    <CancerSummaryContent
                        gene={CANCER_SUMMARY_ALL_GENES}
                        width={this.resultsViewPageWidth}
                        groupedAlterationData={groupedAlterationDataForAllGenes}
                        handlePivotChange={this.pivotData}
                        labelTransformer={labelTransformer}
                        groupAlterationsBy={this.groupAlterationsBy}
                        handleStudyLinkout={this.handleStudyLinkout}
                    />
                </MSKTab>
            );
        }
        return geneTabs;
    }

    @autobind
    public handleStudyLinkout(studyId: string, gene?: string) {
        const params: any = Object.assign(
            {},
            this.props.store.urlWrapper.query,
            {
                [ResultsViewURLQueryEnum.cancer_study_list]: studyId,
                [ResultsViewURLQueryEnum.gene_list]:
                    gene || this.props.store.urlWrapper.query.gene_list,
            }
        );

        const studyWindow = window.open(
            buildCBioPortalPageUrl('/results')
        ) as any;

        studyWindow.clientPostedData = params;
    }

    public render() {
        const status = getRemoteDataGroupStatus(
            this.props.store.filteredSamplesExtendedWithClinicalData,
            this.props.store.oqlFilteredAlterationsByGeneBySampleKey,
            this.props.store.studies,
            this.props.store.filteredSequencedSampleKeysByGene,
            this.props.store.selectedMolecularProfileIdsByAlterationType,
            this.props.store.coverageInformation
        );

        switch (status) {
            case 'pending':
                return (
                    <LoadingIndicator
                        isLoading={true}
                        center={true}
                        size={'big'}
                    />
                );
            case 'error':
                return null;
            case 'complete':
                return (
                    <div
                        ref={(el: HTMLDivElement) =>
                            (this.resultsViewPageContent = el)
                        }
                        data-test="cancerTypeSummaryWrapper"
                    >
                        <div className={'tabMessageContainer'}>
                            <OqlStatusBanner
                                className="cancer-types-summary-oql-status-banner"
                                store={this.props.store}
                                tabReflectsOql={true}
                            />
                            <AlterationFilterWarning store={this.props.store} />
                            <CaseFilterWarning store={this.props.store} />
                        </div>
                        <MSKTabs
                            onTabClick={this.handleTabClick}
                            unmountOnHide={true}
                            arrowStyle={{ 'line-height': 0.8 }}
                            tabButtonStyle="pills"
                            activeTabId={this.activeTab}
                            className="pillTabs"
                        >
                            {this.tabs}
                        </MSKTabs>
                    </div>
                );
        }
    }
}
