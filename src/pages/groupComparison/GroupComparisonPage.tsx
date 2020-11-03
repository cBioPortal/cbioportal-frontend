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
import { GroupComparisonTab } from './GroupComparisonTabs';
import { StudyLink } from 'shared/components/StudyLink/StudyLink';
import {
    action,
    computed,
    IReactionDisposer,
    observable,
    reaction,
} from 'mobx';
import autobind from 'autobind-decorator';
import { AppStore } from '../../AppStore';
import ClinicalData from './ClinicalData';
import ReactSelect from 'react-select';
import { trackEvent } from 'shared/lib/tracking';
import URL from 'url';
import GroupComparisonURLWrapper from './GroupComparisonURLWrapper';

import styles from './styles.module.scss';
import { OverlapStrategy } from '../../shared/lib/comparison/ComparisonStore';
import { buildCBioPortalPageUrl } from 'shared/api/urls';
import MethylationEnrichments from './MethylationEnrichments';
import GenericAssayEnrichments from './GenericAssayEnrichments';
import _ from 'lodash';
import { deriveDisplayTextFromGenericAssayType } from 'pages/resultsView/plots/PlotsTabUtils';
import AlterationsEnrichments from './AlterationsEnrichments';
import AlterationEnrichmentTypeSelector, {
    IAlterationEnrichmentTypeSelectorHandlers,
} from './AlterationEnrichmentTypeSelector';
import { buildAlterationEnrichmentTypeSelectorHandlers } from 'pages/resultsView/comparison/ComparisonTabUtils';

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
    private alterationEnrichmentTypeSelectorHandlers: IAlterationEnrichmentTypeSelectorHandlers;

    constructor(props: IGroupComparisonPageProps) {
        super(props);
        this.urlWrapper = new GroupComparisonURLWrapper(props.routing);
        this.queryReaction = reaction(
            () => this.urlWrapper.query.sessionId,
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

        this.alterationEnrichmentTypeSelectorHandlers = buildAlterationEnrichmentTypeSelectorHandlers(
            this.store
        );

        (window as any).groupComparisonPage = this;
    }

    @autobind
    private getTabHref(tabId: string) {
        return URL.format({
            pathname: tabId,
            query: this.props.routing.location.query,
            hash: this.props.routing.location.hash,
        });
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

    readonly tabs = MakeMobxView({
        await: () => [
            this.store._activeGroupsNotOverlapRemoved,
            this.store.activeGroups,
            this.store.mutationEnrichmentProfiles,
            this.store.copyNumberEnrichmentProfiles,
            this.store.mRNAEnrichmentProfiles,
            this.store.proteinEnrichmentProfiles,
            this.store.methylationEnrichmentProfiles,
            this.store.survivalClinicalDataExists,
            this.store.genericAssayEnrichmentProfilesGroupByGenericAssayType,
        ],
        render: () => {
            return (
                <MSKTabs
                    unmountOnHide={false}
                    activeTabId={this.urlWrapper.tabId}
                    onTabClick={this.urlWrapper.setTabId}
                    className="primaryTabs mainTabs"
                    getTabHref={this.getTabHref}
                >
                    <MSKTab id={GroupComparisonTab.OVERLAP} linkText="Overlap">
                        <Overlap
                            key={this.selectedGroupsKey}
                            store={this.store}
                        />
                    </MSKTab>
                    {this.store.showSurvivalTab && (
                        <MSKTab
                            id={GroupComparisonTab.SURVIVAL}
                            linkText="Survival"
                            anchorClassName={
                                this.store.survivalTabUnavailable
                                    ? 'greyedOut'
                                    : ''
                            }
                        >
                            <Survival store={this.store} />
                        </MSKTab>
                    )}
                    <MSKTab
                        id={GroupComparisonTab.CLINICAL}
                        linkText="Clinical"
                        anchorClassName={
                            this.store.clinicalTabUnavailable ? 'greyedOut' : ''
                        }
                    >
                        <ClinicalData store={this.store} />
                    </MSKTab>
                    {this.store.showAlterationsTab && (
                        <MSKTab
                            id={GroupComparisonTab.ALTERATIONS}
                            linkText="Alterations"
                            anchorClassName={
                                this.store.alterationsTabUnavailable
                                    ? 'greyedOut'
                                    : ''
                            }
                        >
                            <AlterationEnrichmentTypeSelector
                                handlers={
                                    this
                                        .alterationEnrichmentTypeSelectorHandlers!
                                }
                            />
                            <AlterationsEnrichments store={this.store} />
                        </MSKTab>
                    )}
                    {this.store.showMRNATab && (
                        <MSKTab
                            id={GroupComparisonTab.MRNA}
                            linkText="mRNA"
                            anchorClassName={
                                this.store.mRNATabUnavailable ? 'greyedOut' : ''
                            }
                        >
                            <MRNAEnrichments store={this.store} />
                        </MSKTab>
                    )}
                    {this.store.showProteinTab && (
                        <MSKTab
                            id={GroupComparisonTab.PROTEIN}
                            linkText="Protein"
                            anchorClassName={
                                this.store.proteinTabUnavailable
                                    ? 'greyedOut'
                                    : ''
                            }
                        >
                            <ProteinEnrichments store={this.store} />
                        </MSKTab>
                    )}
                    {this.store.showMethylationTab && (
                        <MSKTab
                            id={GroupComparisonTab.DNAMETHYLATION}
                            linkText="DNA Methylation"
                            anchorClassName={
                                this.store.methylationTabUnavailable
                                    ? 'greyedOut'
                                    : ''
                            }
                        >
                            <MethylationEnrichments store={this.store} />
                        </MSKTab>
                    )}
                    {this.store.showGenericAssayTab &&
                        _.keys(
                            this.store
                                .genericAssayEnrichmentProfilesGroupByGenericAssayType
                                .result
                        ).map(genericAssayType => {
                            return (
                                <MSKTab
                                    id={`${
                                        GroupComparisonTab.GENERIC_ASSAY_PREFIX
                                    }_${genericAssayType.toLowerCase()}`}
                                    linkText={deriveDisplayTextFromGenericAssayType(
                                        genericAssayType
                                    )}
                                    anchorClassName={
                                        this.store.genericAssayTabUnavailable
                                            ? 'greyedOut'
                                            : ''
                                    }
                                >
                                    <GenericAssayEnrichments
                                        store={this.store}
                                        genericAssayType={genericAssayType}
                                    />
                                </MSKTab>
                            );
                        })}
                </MSKTabs>
            );
        },
        renderPending: () => (
            <LoadingIndicator center={true} isLoading={true} size={'big'} />
        ),
        renderError: () => <ErrorMessage />,
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
                        <h3>
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

    @autobind
    @action
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
                </div>
            </PageLayout>
        );
    }
}
