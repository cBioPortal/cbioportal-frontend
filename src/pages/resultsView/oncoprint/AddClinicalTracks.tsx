import * as React from 'react';
import { Observer, observer } from 'mobx-react';
import { MSKTab, MSKTabs } from '../../../shared/components/MSKTabs/MSKTabs';
import AddChartByType from '../../studyView/addChartButton/addChartByType/AddChartByType';
import { action, computed, observable, makeObservable } from 'mobx';
import { remoteData } from 'cbioportal-frontend-commons';
import autobind from 'autobind-decorator';
import { ResultsViewPageStore } from '../ResultsViewPageStore';
import { SpecialAttribute } from '../../../shared/cache/ClinicalDataCache';
import * as _ from 'lodash';
import { MakeMobxView } from '../../../shared/components/MobxView';
import LoadingIndicator from '../../../shared/components/loadingIndicator/LoadingIndicator';
import { toggleIncluded } from '../../../shared/lib/ArrayUtils';
import MobxPromise from 'mobxpromise';
import { ChartDataCountSet } from 'pages/studyView/StudyViewUtils';

export interface IAddClinicalTrackProps {
    store: ResultsViewPageStore;

    // We pass this in as a getter rather than passing the value itself because
    //  mobx considers every prop changed if one prop changes, so it would do
    //  unnecessary recomputation -> some rendering jitters whenever
    //  selected clinical attributes would change. This way, that doesn't happen.
    getSelectedClinicalAttributeIds: () => (string | SpecialAttribute)[];

    onChangeSelectedClinicalTracks: (
        ids: (string | SpecialAttribute)[]
    ) => void;
    clinicalTrackOptionsPromise: MobxPromise<{
        clinical: {
            label: string;
            key: string;
            selected: boolean;
        }[];
        groups: {
            label: string;
            key: string;
            selected: boolean;
        }[];
        customCharts: {
            label: string;
            key: string;
            selected: boolean;
        }[];
    }>;
    clinicalAttributeIdToAvailableFrequencyPromise: MobxPromise<
        ChartDataCountSet
    >;
    width?: number;
}

enum Tab {
    CLINICAL = 'Clinical',
    GROUPS = 'Groups',
    CUSTOM_CHARTS = 'Custom Charts',
}

@observer
export default class AddClinicalTracks extends React.Component<
    IAddClinicalTrackProps,
    {}
> {
    constructor(props: IAddClinicalTrackProps) {
        super(props);

        makeObservable(this);
    }
    @observable open = false;
    @observable tabId = Tab.CLINICAL;

    @action.bound
    private updateTabId(newId: Tab) {
        this.tabId = newId;
    }

    @action.bound
    private addAll(clinicalAttributeIds: string[]) {
        this.props.onChangeSelectedClinicalTracks(
            _.union(
                this.props.getSelectedClinicalAttributeIds(),
                clinicalAttributeIds
            )
        );
    }

    @action.bound
    private clear(clinicalAttributeIds: string[]) {
        this.props.onChangeSelectedClinicalTracks(
            _.difference(
                this.props.getSelectedClinicalAttributeIds(),
                clinicalAttributeIds
            )
        );
    }

    @action.bound
    private toggleClinicalTrack(clinicalAttributeId: string) {
        this.props.onChangeSelectedClinicalTracks(
            toggleIncluded(
                clinicalAttributeId,
                this.props.getSelectedClinicalAttributeIds()
            )
        );
    }

    @computed get selectedClinicalAttributeIds() {
        return _.keyBy(this.props.getSelectedClinicalAttributeIds());
    }

    readonly options = remoteData({
        await: () => [this.props.clinicalTrackOptionsPromise],
        invoke: () => {
            return Promise.resolve(
                _.mapValues(
                    this.props.clinicalTrackOptionsPromise.result,
                    options => {
                        return options.map(option => ({
                            ...option,
                            selected:
                                option.key in this.selectedClinicalAttributeIds,
                        }));
                    }
                )
            );
        },
    });

    readonly addClinicalTracksMenu = MakeMobxView({
        await: () => [this.options],
        render: () => (
            <AddChartByType
                options={this.options.result!.clinical}
                freqPromise={
                    this.props.clinicalAttributeIdToAvailableFrequencyPromise
                }
                onAddAll={this.addAll}
                onClearAll={this.clear}
                onToggleOption={this.toggleClinicalTrack}
                optionsGivenInSortedOrder={true}
                width={this.props.width}
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
                freqPromise={
                    this.props.clinicalAttributeIdToAvailableFrequencyPromise
                }
                onAddAll={this.addAll}
                onClearAll={this.clear}
                onToggleOption={this.toggleClinicalTrack}
                optionsGivenInSortedOrder={true}
                frequencyHeaderTooltip="% samples in group"
                width={this.props.width}
            />
        ),
        renderPending: () => <LoadingIndicator isLoading={true} small={true} />,
        showLastRenderWhenPending: true,
    });

    readonly addChartTracksMenu = MakeMobxView({
        await: () => [this.options],
        render: () => (
            <AddChartByType
                options={this.options.result!.customCharts}
                freqPromise={
                    this.props.clinicalAttributeIdToAvailableFrequencyPromise
                }
                onAddAll={this.addAll}
                onClearAll={this.clear}
                onToggleOption={this.toggleClinicalTrack}
                optionsGivenInSortedOrder={true}
                frequencyHeaderTooltip="% samples in group"
                width={this.props.width}
            />
        ),
        renderPending: () => <LoadingIndicator isLoading={true} small={true} />,
        showLastRenderWhenPending: true,
    });

    @autobind
    private getMenu() {
        const numberOfMenus = this.options.isComplete
            ? _.sum(
                  _.map(
                      this.options.result!,
                      (optionsList: any[]) => +(optionsList.length > 0)
                  )
              )
            : 0;

        if (numberOfMenus > 1) {
            return (
                <MSKTabs
                    activeTabId={this.tabId}
                    onTabClick={this.updateTabId}
                    className="secondaryNavigation oncoprintAddClinicalTracks"
                >
                    <MSKTab
                        key={0}
                        id={Tab.CLINICAL}
                        linkText={Tab.CLINICAL}
                        hide={
                            !this.options.isComplete ||
                            this.options.result!.clinical.length === 0
                        }
                    >
                        {this.addClinicalTracksMenu.component}
                    </MSKTab>
                    <MSKTab
                        key={1}
                        id={Tab.GROUPS}
                        linkText={Tab.GROUPS}
                        hide={
                            !this.options.isComplete ||
                            this.options.result!.groups.length === 0
                        }
                    >
                        {this.addGroupTracksMenu.component}
                    </MSKTab>
                    <MSKTab
                        key={2}
                        id={Tab.CUSTOM_CHARTS}
                        linkText={Tab.CUSTOM_CHARTS}
                        hide={
                            !this.options.isComplete ||
                            this.options.result!.customCharts.length === 0
                        }
                    >
                        {this.addChartTracksMenu.component}
                    </MSKTab>
                </MSKTabs>
            );
        } else {
            return (
                <div className="oncoprintAddClinicalTracks">
                    {this.addClinicalTracksMenu.component}
                </div>
            );
        }
    }

    render() {
        return (
            <div>
                <Observer>{this.getMenu}</Observer>
            </div>
        );
    }
}
