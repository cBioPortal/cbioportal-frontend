import * as React from 'react';
import { Observer, observer } from 'mobx-react';
import { MSKTab, MSKTabs } from '../../../shared/components/MSKTabs/MSKTabs';
import AddChartByType from '../../studyView/addChartButton/addChartByType/AddChartByType';
import { action, computed, observable } from 'mobx';
import { DefaultTooltip, remoteData } from 'cbioportal-frontend-commons';
import classNames from 'classnames';
import { serializeEvent } from '../../../shared/lib/tracking';
import autobind from 'autobind-decorator';
import { ResultsViewPageStore } from '../ResultsViewPageStore';
import { ClinicalAttribute } from 'cbioportal-ts-api-client';
import {
    clinicalAttributeIsINCOMPARISONGROUP,
    clinicalAttributeIsPROFILEDIN,
    SpecialAttribute,
} from '../../../shared/cache/ClinicalDataCache';
import * as _ from 'lodash';
import { MakeMobxView } from '../../../shared/components/MobxView';
import LoadingIndicator from '../../../shared/components/loadingIndicator/LoadingIndicator';
import { toggleIncluded } from '../../../shared/lib/ArrayUtils';
import OncoprintDropdownCount from './OncoprintDropdownCount';

export interface IAddClinicalTrackProps {
    store: ResultsViewPageStore;
    selectedClinicalAttributeIds: (string | SpecialAttribute)[];
    onChangeSelectedClinicalTracks: (
        ids: (string | SpecialAttribute)[]
    ) => void;
}

enum Tab {
    CLINICAL = 'Clinical',
    GROUPS = 'Groups',
}

@observer
export default class AddClinicalTracks extends React.Component<
    IAddClinicalTrackProps,
    {}
> {
    @observable open = false;
    @observable tabId = Tab.CLINICAL;

    @autobind
    @action
    private updateTabId(newId: Tab) {
        this.tabId = newId;
    }

    @autobind
    @action
    private addAll(clinicalAttributeIds: string[]) {
        this.props.onChangeSelectedClinicalTracks(
            _.union(
                this.props.selectedClinicalAttributeIds,
                clinicalAttributeIds
            )
        );
    }

    @autobind
    @action
    private clear(clinicalAttributeIds: string[]) {
        this.props.onChangeSelectedClinicalTracks(
            _.difference(
                this.props.selectedClinicalAttributeIds,
                clinicalAttributeIds
            )
        );
    }

    @autobind
    @action
    private toggleClinicalTrack(clinicalAttributeId: string) {
        this.props.onChangeSelectedClinicalTracks(
            toggleIncluded(
                clinicalAttributeId,
                this.props.selectedClinicalAttributeIds
            )
        );
    }

    @computed get selectedClinicalAttributeIds() {
        return _.keyBy(this.props.selectedClinicalAttributeIds);
    }

    readonly options = remoteData({
        await: () => [
            this.props.store.clinicalAttributes,
            this.clinicalAttributeIdToAvailableFrequency,
        ],
        invoke: () => {
            const uniqueAttributes = _.uniqBy(
                this.props.store.clinicalAttributes.result!,
                a => a.clinicalAttributeId
            );
            const availableFrequency = this
                .clinicalAttributeIdToAvailableFrequency.result!;
            const sortedAttributes = {
                clinical: [] as ClinicalAttribute[],
                groups: [] as ClinicalAttribute[],
            };
            for (const attr of uniqueAttributes) {
                if (clinicalAttributeIsINCOMPARISONGROUP(attr)) {
                    sortedAttributes.groups.push(attr);
                } else {
                    sortedAttributes.clinical.push(attr);
                }
            }
            sortedAttributes.clinical = _.sortBy<ClinicalAttribute>(
                sortedAttributes.clinical,
                [
                    (x: ClinicalAttribute) => {
                        if (
                            x.clinicalAttributeId ===
                            SpecialAttribute.StudyOfOrigin
                        ) {
                            return 0;
                        } else if (
                            x.clinicalAttributeId ===
                            SpecialAttribute.MutationSpectrum
                        ) {
                            return 1;
                        } else if (clinicalAttributeIsPROFILEDIN(x)) {
                            return 2;
                        } else {
                            return 3;
                        }
                    },
                    (x: ClinicalAttribute) => {
                        let freq = availableFrequency[x.clinicalAttributeId];
                        if (freq === undefined) {
                            freq = 0;
                        }
                        return -freq;
                    },
                    (x: ClinicalAttribute) => -x.priority,
                    (x: ClinicalAttribute) => x.displayName.toLowerCase(),
                ]
            );

            sortedAttributes.groups = _.sortBy<ClinicalAttribute>(
                sortedAttributes.groups,
                x => x.displayName.toLowerCase()
            );

            return Promise.resolve(
                _.mapValues(sortedAttributes, attrs => {
                    return attrs.map(attr => ({
                        label: attr.displayName,
                        key: attr.clinicalAttributeId,
                        selected:
                            attr.clinicalAttributeId in
                            this.selectedClinicalAttributeIds,
                    }));
                })
            );
        },
    });

    readonly clinicalAttributeIdToAvailableFrequency = remoteData({
        await: () => [
            this.props.store.clinicalAttributeIdToAvailableSampleCount,
            this.props.store.samples,
        ],
        invoke: () => {
            const numSamples = this.props.store.samples.result!.length;
            return Promise.resolve(
                _.mapValues(
                    this.props.store.clinicalAttributeIdToAvailableSampleCount
                        .result!,
                    count => (100 * count) / numSamples
                )
            );
        },
    });

    readonly addClinicalTracksMenu = MakeMobxView({
        await: () => [this.options],
        render: () => (
            <AddChartByType
                options={this.options.result!.clinical}
                freqPromise={this.clinicalAttributeIdToAvailableFrequency}
                onAddAll={this.addAll}
                onClearAll={this.clear}
                onToggleOption={this.toggleClinicalTrack}
                optionsGivenInSortedOrder={true}
            />
        ),
        renderPending: () => <LoadingIndicator isLoading={true} small={true} />,
        showLastRenderWhenPending: true,
    });

    readonly addGroupTracksMenu = MakeMobxView({
        await: () => [this.options],
        render: () => (
            <AddChartByType
                options={this.options.result!.groups}
                freqPromise={this.clinicalAttributeIdToAvailableFrequency}
                onAddAll={this.addAll}
                onClearAll={this.clear}
                onToggleOption={this.toggleClinicalTrack}
                optionsGivenInSortedOrder={true}
                frequencyHeaderTooltip="% samples in group"
            />
        ),
        renderPending: () => <LoadingIndicator isLoading={true} small={true} />,
        showLastRenderWhenPending: true,
    });

    @autobind
    private getDropdown() {
        if (
            this.props.store.comparisonGroups.isComplete &&
            this.props.store.comparisonGroups.result!.length > 0
        ) {
            return (
                <MSKTabs
                    activeTabId={this.tabId}
                    onTabClick={this.updateTabId}
                    className="mainTabs oncoprintAddClinicalTracks"
                >
                    <MSKTab key={0} id={Tab.CLINICAL} linkText={Tab.CLINICAL}>
                        {this.addClinicalTracksMenu.component}
                    </MSKTab>
                    <MSKTab
                        key={1}
                        id={Tab.GROUPS}
                        linkText={Tab.GROUPS}
                        hide={
                            !this.props.store.comparisonGroups.isComplete ||
                            this.props.store.comparisonGroups.result!.length ===
                                0
                        }
                    >
                        {this.addGroupTracksMenu.component}
                    </MSKTab>
                </MSKTabs>
            );
        } else {
            return (
                <div className="tab-content">
                    <div className="msk-tab">
                        {this.addClinicalTracksMenu.component}
                    </div>
                </div>
            );
        }
    }

    @autobind
    @action
    private onDropdownChange(visible: boolean) {
        this.open = visible;
    }

    render() {
        return (
            <DefaultTooltip
                visible={this.open}
                trigger={['click']}
                onVisibleChange={this.onDropdownChange}
                placement={'bottomRight'}
                destroyTooltipOnHide={true}
                overlay={<Observer>{this.getDropdown}</Observer>}
                align={{
                    overflow: { adjustX: true, adjustY: false },
                }}
                arrowContent={<span />}
                overlayClassName="oncoprintAddClinicalTracksDropdown"
            >
                <button
                    className={classNames('btn btn-default btn-md', {
                        active: this.open,
                    })}
                    data-event={serializeEvent({
                        category: 'resultsView',
                        action: 'addClinicalTrackMenuOpen',
                        label: this.props.store.studyIds.result!.join(','),
                    })}
                    data-test="add-clinical-track-button"
                >
                    Add Clinical Tracks{' '}
                    <OncoprintDropdownCount
                        count={
                            this.options.isComplete
                                ? this.options.result!.clinical.length
                                : undefined
                        }
                    />
                    &nbsp;
                    <span className="caret" />
                    &nbsp;
                </button>
            </DefaultTooltip>
        );
    }
}
