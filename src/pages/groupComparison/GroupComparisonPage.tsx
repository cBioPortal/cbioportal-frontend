import * as React from 'react';
import { inject, observer } from 'mobx-react';
import GroupComparisonStore from './GroupComparisonStore';
import { MSKTab, MSKTabs } from '../../shared/components/MSKTabs/MSKTabs';
import { PageLayout } from '../../shared/components/PageLayout/PageLayout';
import Survival from './Survival';
import Overlap from './Overlap';
import MRNAEnrichments from './MRNAEnrichments';
import ProteinEnrichments from './ProteinEnrichments';
import { MakeMobxView } from '../../shared/components/MobxView';
import LoadingIndicator from '../../shared/components/loadingIndicator/LoadingIndicator';
import ErrorMessage from '../../shared/components/ErrorMessage';
import GroupSelector from './groupSelector/GroupSelector';
import {
    GENOMIC_ALTERATIONS_TAB_NAME,
    GroupComparisonTab,
} from './GroupComparisonTabs';
import { StudyLink } from 'shared/components/StudyLink/StudyLink';
import {
    action,
    computed,
    IReactionDisposer,
    observable,
    reaction,
    makeObservable,
} from 'mobx';
import autobind from 'autobind-decorator';
import { AppStore } from '../../AppStore';
import ClinicalData from './ClinicalData';
import ReactSelect from 'react-select';
import { trackEvent } from 'shared/lib/tracking';
import GroupComparisonURLWrapper from './GroupComparisonURLWrapper';
import styles from './styles.module.scss';
import { OverlapStrategy } from '../../shared/lib/comparison/ComparisonStore';
import { buildCBioPortalPageUrl } from 'shared/api/urls';
import MethylationEnrichments from './MethylationEnrichments';
import AlterationEnrichments from './AlterationEnrichments';
import AlterationEnrichmentTypeSelector from '../../shared/lib/comparison/AlterationEnrichmentTypeSelector';
import { AlterationFilterMenuSection } from 'pages/groupComparison/GroupComparisonUtils';
import { getServerConfig } from 'config/config';
import {
    buildCustomTabs,
    prepareCustomTabConfigurations,
} from 'shared/lib/customTabs/customTabHelpers';
import { getSortedGenericAssayAllTabSpecs } from 'shared/lib/GenericAssayUtils/GenericAssayCommonUtils';
import { HelpWidget } from 'shared/components/HelpWidget/HelpWidget';
import GroupComparisonPathwayMapper from './pathwayMapper/GroupComparisonPathwayMapper';
import GroupComparisonMutationsTab from './GroupComparisonMutationsTab';
import GroupComparisonPathwayMapperUserSelectionStore from './pathwayMapper/GroupComparisonPathwayMapperUserSelectionStore';
import { Tour } from 'tours';
import GenericAssayEnrichmentCollections from './GenericAssayEnrichmentCollections';

export interface IGroupComparisonPageProps {
    routing: any;
    appStore: AppStore;
}

@inject('routing', 'appStore')
@observer
export default class GroupComparisonPage extends React.Component<
    IGroupComparisonPageProps,
    {}
> {
    @observable.ref private store: GroupComparisonStore;
    private queryReaction: IReactionDisposer;
    private urlWrapper: GroupComparisonURLWrapper;
    private pathwayMapperUserSelectionStore: GroupComparisonPathwayMapperUserSelectionStore;
    constructor(props: IGroupComparisonPageProps) {
        super(props);
        makeObservable(this);
        this.urlWrapper = new GroupComparisonURLWrapper(props.routing);
        this.pathwayMapperUserSelectionStore = new GroupComparisonPathwayMapperUserSelectionStore();
        this.queryReaction = reaction(
            () => this.urlWrapper.query.comparisonId,
            sessionId => {
                if (
                    !props.routing.location.pathname.includes('/comparison') ||
                    !sessionId
                ) {
                    return;
                }

                if (this.store) {
                    this.store.destroy();
                }

                this.store = new GroupComparisonStore(
                    sessionId,
                    this.props.appStore,
                    this.urlWrapper
                );
                (window as any).groupComparisonStore = this.store;
            },
            { fireImmediately: true }
        );

        (window as any).groupComparisonPage = this;
    }

    @computed get alterationEnrichmentTabName() {
        return GENOMIC_ALTERATIONS_TAB_NAME;
    }

    @computed get selectedGroupsKey() {
        // for components which should remount whenever selected groups change
        const selectedGroups = this.store._selectedGroups.result || [];
        return JSON.stringify(selectedGroups.map(g => g.uid));
    }

    componentWillUnmount() {
        this.queryReaction && this.queryReaction();
        this.store && this.store.destroy();
        this.urlWrapper.destroy();
    }

    @computed get customTabs() {
        return prepareCustomTabConfigurations(
            getServerConfig().custom_tabs,
            'COMPARISON_PAGE'
        );
    }

    readonly tabs = MakeMobxView({
        await: () => [
            // this.store._activeGroupsNotOverlapRemoved,
            // this.store.activeGroups,
            // this.store.mutationEnrichmentProfiles,
            // this.store.structuralVariantEnrichmentProfiles,
            // this.store.copyNumberEnrichmentProfiles,
            // this.store.mRNAEnrichmentProfiles,
            // this.store.proteinEnrichmentProfiles,
            // this.store.methylationEnrichmentProfiles,
            // this.store.survivalClinicalDataExists,
            // this.store.genericAssayEnrichmentProfilesGroupedByGenericAssayType,
            // this.store
            //     .genericAssayBinaryEnrichmentProfilesGroupedByGenericAssayType,
            // this.store.alterationsEnrichmentData,
            // this.store.alterationsEnrichmentAnalysisGroups,
            // this.store.genesSortedByMutationFrequency,
            // this.store.genesSortedByAlterationFrequency,
        ],
        render: () => {
            return (
                <MSKTabs
                    unmountOnHide={false}
                    activeTabId={this.urlWrapper.tabId}
                    onTabClick={this.urlWrapper.setTabId}
                    className="primaryTabs mainTabs"
                    hrefRoot={buildCBioPortalPageUrl('comparison')}
                    contentWindowExtra={
                        <HelpWidget
                            path={this.props.routing.location.pathname}
                        />
                    }
                >
                    <MSKTab id={GroupComparisonTab.OVERLAP} linkText="Overlap">
                        <Overlap
                            key={this.selectedGroupsKey}
                            store={this.store}
                        />
                    </MSKTab>
                    <MSKTab
                        id={GroupComparisonTab.SURVIVAL}
                        linkText="Survival"
                        anchorClassName={
                            !this.store.showSurvivalTab ||
                            this.store.survivalTabUnavailable
                                ? 'greyedOut'
                                : ''
                        }
                    >
                        <Survival store={this.store} />
                    </MSKTab>
                    <MSKTab
                        id={GroupComparisonTab.CLINICAL}
                        linkText="Clinical"
                        anchorClassName={
                            this.store.clinicalTabUnavailable ? 'greyedOut' : ''
                        }
                    >
                        <ClinicalData store={this.store} />
                    </MSKTab>
                    <MSKTab
                        id={GroupComparisonTab.ALTERATIONS}
                        linkText={this.alterationEnrichmentTabName}
                        anchorClassName={
                            !this.store.showAlterationsTab ||
                            this.store.alterationsTabUnavailable
                                ? 'greyedOut'
                                : ''
                        }
                    >
                        {(getServerConfig().skin_show_settings_menu && (
                            <AlterationFilterMenuSection
                                store={this.store}
                                updateSelectedEnrichmentEventTypes={
                                    this.store
                                        .updateSelectedEnrichmentEventTypes
                                }
                            />
                        )) || (
                            <AlterationEnrichmentTypeSelector
                                classNames={
                                    styles.inlineAlterationTypeSelectorMenu
                                }
                                store={this.store}
                                updateSelectedEnrichmentEventTypes={
                                    this.store
                                        .updateSelectedEnrichmentEventTypes
                                }
                                showMutations={
                                    this.store.hasMutationEnrichmentData
                                }
                                showCnas={this.store.hasCnaEnrichmentData}
                                showStructuralVariants={
                                    this.store.hasStructuralVariantData
                                }
                            />
                        )}
                        <AlterationEnrichments store={this.store} />
                    </MSKTab>
                    <MSKTab
                        id={GroupComparisonTab.MUTATIONS}
                        linkText={
                            <span>
                                Mutations{' '}
                                <strong className={'beta-text'}>Beta!</strong>
                            </span>
                        }
                        anchorClassName={
                            !this.store.showMutationsTab ? 'greyedOut' : ''
                        }
                    >
                        <GroupComparisonMutationsTab
                            store={this.store}
                            urlWrapper={this.urlWrapper}
                        />
                        {/* stacked lollipop plots for > 2 groups */}
                        {/* {this.store.activeGroups.result!.map(g => {
                            return (
                                <div>
                                    <h3>{g.name}</h3>
                                    <Mutations
                                        store={this.store}
                                        mutations={
                                            this.store.mutationsByGroup
                                                .result![g.uid]
                                        }
                                        filters={{}}
                                    />
                                </div>
                            );
                        })} */}
                    </MSKTab>
                    {this.props.appStore.featureFlagStore.has(
                        'group_comparison_pathways'
                    ) && (
                        <MSKTab
                            id={GroupComparisonTab.PATHWAYS}
                            linkText={'Pathways'}
                        >
                            {this.store.activeGroups.isComplete &&
                            this.store.genesSortedByAlterationFrequency
                                .isComplete ? (
                                <GroupComparisonPathwayMapper
                                    genomicData={
                                        this.store.alterationEnrichmentRowData
                                            .result || []
                                    }
                                    activeGroups={
                                        this.store.activeGroups.result
                                    }
                                    groupComparisonStore={this.store}
                                    userSelectionStore={
                                        this.pathwayMapperUserSelectionStore
                                    }
                                />
                            ) : (
                                <LoadingIndicator
                                    center={true}
                                    isLoading={true}
                                    size={'big'}
                                />
                            )}
                        </MSKTab>
                    )}
                    <MSKTab
                        id={GroupComparisonTab.MRNA}
                        linkText="mRNA"
                        anchorClassName={
                            !this.store.showMRNATab ||
                            this.store.mRNATabUnavailable
                                ? 'greyedOut'
                                : ''
                        }
                    >
                        <MRNAEnrichments store={this.store} />
                    </MSKTab>
                    <MSKTab
                        id={GroupComparisonTab.PROTEIN}
                        linkText="Protein"
                        anchorClassName={
                            !this.store.showProteinTab ||
                            this.store.proteinTabUnavailable
                                ? 'greyedOut'
                                : ''
                        }
                    >
                        <ProteinEnrichments store={this.store} />
                    </MSKTab>
                    <MSKTab
                        id={GroupComparisonTab.DNAMETHYLATION}
                        linkText="DNA Methylation"
                        anchorClassName={
                            !this.store.showMethylationTab ||
                            this.store.methylationTabUnavailable
                                ? 'greyedOut'
                                : ''
                        }
                    >
                        <MethylationEnrichments store={this.store} />
                    </MSKTab>
                    {(this.store.showGenericAssayCategoricalTab ||
                        this.store.showGenericAssayBinaryTab ||
                        this.store.showGenericAssayTab) &&
                        getSortedGenericAssayAllTabSpecs(
                            this.store
                                .genericAssayAllEnrichmentProfilesGroupedByGenericAssayType
                                .result
                        ).map(genericAssayAllTabSpecs => {
                            return (
                                <MSKTab
                                    id={`${
                                        GroupComparisonTab.GENERIC_ASSAY_PREFIX
                                    }_${genericAssayAllTabSpecs.genericAssayType.toLowerCase()}`}
                                    linkText={genericAssayAllTabSpecs.linkText}
                                    anchorClassName={
                                        this.store
                                            .genericAssayCategoricalTabUnavailable &&
                                        this.store
                                            .genericAssayBinaryTabUnavailable &&
                                        this.store.genericAssayTabUnavailable
                                            ? 'greyedOut'
                                            : ''
                                    }
                                >
                                    <GenericAssayEnrichmentCollections
                                        store={this.store}
                                        genericAssayType={
                                            genericAssayAllTabSpecs.genericAssayType
                                        }
                                    />
                                </MSKTab>
                            );
                        })}
                    {buildCustomTabs(this.customTabs)}
                </MSKTabs>
            );
        },
        renderPending: () => (
            <LoadingIndicator center={true} isLoading={true} size={'big'} />
        ),
        renderError: () => {
            return <ErrorMessage />;
        },
    });

    readonly studyLink = MakeMobxView({
        await: () => [this.store.displayedStudies],
        render: () => {
            const studies = this.store.displayedStudies.result!;
            let studyHeader = <span />;
            switch (studies.length) {
                case 0:
                    studyHeader = <span />;
                    break;
                case 1:
                    studyHeader = (
                        <h3 data-tour="single-study-group-comparison-header">
                            <StudyLink studyId={studies[0].studyId}>
                                {studies[0].name}
                            </StudyLink>
                        </h3>
                    );
                    break;
                default:
                    studyHeader = (
                        <h4>
                            <a
                                href={buildCBioPortalPageUrl(`study`, {
                                    id: studies
                                        .map(study => study.studyId)
                                        .join(','),
                                })}
                                target="_blank"
                            >
                                Multiple studies
                            </a>
                        </h4>
                    );
            }
            let ret;
            if (this.store.sessionClinicalAttributeName) {
                ret = (
                    <span>
                        {studyHeader}Groups from{' '}
                        <span
                            data-tour="single-study-group-comparison-attribute"
                            style={{ fontWeight: 'bold', fontStyle: 'italic' }}
                        >
                            {this.store.sessionClinicalAttributeName}
                        </span>
                    </span>
                );
            } else {
                ret = studyHeader;
            }
            return ret;
        },
    });

    @action.bound
    public onOverlapStrategySelect(option: any) {
        trackEvent({
            category: 'groupComparison',
            action: 'setOverlapStrategy',
            label: option.value,
        });
        this.store.updateOverlapStrategy(option.value as OverlapStrategy);
    }

    readonly overlapStrategySelector = MakeMobxView({
        await: () => [this.store.overlapComputations],
        render: () => {
            if (
                !this.store.overlapComputations.result!.totalSampleOverlap &&
                !this.store.overlapComputations.result!.totalPatientOverlap
            ) {
                return null;
            } else {
                const includeLabel = 'Include overlapping samples and patients';
                const excludeLabel = 'Exclude overlapping samples and patients';
                return (
                    <div style={{ minWidth: 355, width: 355, zIndex: 20 }}>
                        <ReactSelect
                            name="select overlap strategy"
                            onChange={(option: any | null) => {
                                if (option) {
                                    this.onOverlapStrategySelect(option);
                                }
                            }}
                            options={[
                                {
                                    label: includeLabel,
                                    value: OverlapStrategy.INCLUDE,
                                },
                                {
                                    label: excludeLabel,
                                    value: OverlapStrategy.EXCLUDE,
                                },
                            ]}
                            clearable={false}
                            searchable={false}
                            value={{
                                label:
                                    this.store.overlapStrategy ===
                                    OverlapStrategy.EXCLUDE
                                        ? excludeLabel
                                        : includeLabel,
                                value: this.store.overlapStrategy,
                            }}
                        />
                    </div>
                );
            }
        },
    });

    @autobind private isGroupDeletable() {
        return (
            this.store._originalGroups.isComplete &&
            this.store._originalGroups.result!.length > 2
        );
    }

    render() {
        if (!this.store) {
            return null;
        }

        return (
            <PageLayout
                noMargin={true}
                hideFooter={true}
                className={'subhead-dark'}
            >
                <div>
                    <LoadingIndicator
                        center={true}
                        isLoading={this.store.newSessionPending}
                        size={'big'}
                    />
                    <div className={'headBlock'}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                            }}
                        >
                            {this.studyLink.component}
                            {this.overlapStrategySelector.component}
                        </div>
                        <div>
                            <div className={styles.headerControls}>
                                <GroupSelector
                                    store={this.store}
                                    isGroupDeletable={this.isGroupDeletable}
                                />
                            </div>
                        </div>
                    </div>
                    <div>{this.tabs.component}</div>
                    {this.tabs.isComplete && <Tour />}
                </div>
            </PageLayout>
        );
    }
}
