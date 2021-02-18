import * as React from 'react';
import { observer } from 'mobx-react';
import { MSKTab, MSKTabs } from '../../../shared/components/MSKTabs/MSKTabs';
import { action, computed, makeObservable, observable } from 'mobx';
import { ResultsViewPageStore } from '../ResultsViewPageStore';
import * as _ from 'lodash';
import OncoprintDropdownCount from './OncoprintDropdownCount';
import CustomDropdown from 'shared/components/oncoprint/controls/CustomDropdown';
import { makeGenericAssayOption } from 'shared/lib/GenericAssayUtils/GenericAssayCommonUtils';
import { deriveDisplayTextFromGenericAssayType } from '../plots/PlotsTabUtils';
import GenericAssaySelection, {
    GenericAssayTrackInfo,
} from 'pages/studyView/addChartButton/genericAssaySelection/GenericAssaySelection';
import {
    IOncoprintControlsHandlers,
    IOncoprintControlsState,
} from 'shared/components/oncoprint/controls/OncoprintControls';
import AddClinicalTracks from './AddClinicalTracks';
import autobind from 'autobind-decorator';
import { getTextWidth, remoteData } from 'cbioportal-frontend-commons';
import {
    clinicalAttributeIsINCOMPARISONGROUP,
    SpecialAttribute,
    clinicalAttributeIsPROFILEDIN,
} from 'shared/cache/ClinicalDataCache';
import { ExtendedClinicalAttribute } from '../ResultsViewPageStoreUtils';
import { ClinicalAttribute } from 'cbioportal-ts-api-client';
export interface IAddTrackProps {
    store: ResultsViewPageStore;
    heatmapMenu: JSX.Element | null;
    handlers: IOncoprintControlsHandlers;
    state: IOncoprintControlsState;
    selectedGenericAssayEntitiesGroupedByGenericAssayTypeFromUrl?: {
        [genericAssayType: string]: string[];
    };
    oncoprinterMode?: boolean;
}

enum Tab {
    CLINICAL = 'Clinical',
    HEATMAP = 'Heatmap',
}

export const MIN_DROPDOWN_WIDTH = 400;
export const CONTAINER_PADDING_WIDTH = 20;
export const TAB_PADDING_WIDTH = 14;
export const COUNT_PADDING_WIDTH = 17;
@observer
export default class AddTracks extends React.Component<IAddTrackProps, {}> {
    @observable tabId: Tab | string = Tab.CLINICAL;

    constructor(props: IAddTrackProps) {
        super(props);
        makeObservable(this);
    }

    @action.bound
    private updateTabId(newId: Tab) {
        this.tabId = newId;
        // update profile if clicked Generic Assay tab
        if (!Object.values(Tab).includes(newId)) {
            if (
                this.isGenericAssayDataComplete &&
                this.profilesByGenericAssayType &&
                !_.isEmpty(this.profilesByGenericAssayType[newId]) &&
                this.props.handlers.onSelectGenericAssayProfile
            ) {
                this.props.handlers.onSelectGenericAssayProfile(
                    this.profilesByGenericAssayType[newId][0].molecularProfileId
                );
            }
        }
    }

    // make sure data from generic assay endpoints fetched
    @computed get isGenericAssayDataComplete() {
        return (
            this.props.store && this.props.store.genericAssayProfiles.isComplete
        );
    }

    @computed get showGenericAssayTabs() {
        // disable for multiple studies query
        if (this.isGenericAssayDataComplete) {
            return (
                _.chain(this.props.store.genericAssayProfiles.result!)
                    .map(profile => profile.studyId)
                    .uniq()
                    .size()
                    .value() == 1
            );
        } else {
            return false;
        }
    }

    @computed get profilesByGenericAssayType() {
        if (this.isGenericAssayDataComplete) {
            return _.groupBy(
                this.props.store.genericAssayProfiles.result,
                profile => profile.genericAssayType
            );
        } else {
            return {};
        }
    }

    @autobind
    private getSelectedClinicalAttributeIds() {
        return this.props.state.selectedClinicalAttributeIds;
    }

    @action.bound
    private onGenericAssaySubmit(info: GenericAssayTrackInfo[]) {
        this.props.handlers.onClickAddGenericAssays &&
            this.props.handlers.onClickAddGenericAssays(info);
    }

    readonly clinicalTrackOptions = remoteData({
        await: () => [
            this.props.store.clinicalAttributes,
            this.clinicalAttributeIdToAvailableFrequency,
            this.props.store.clinicalAttributes_customCharts,
        ],
        invoke: () => {
            const uniqueAttributes = _.uniqBy(
                this.props.store.clinicalAttributes.result!,
                a => a.clinicalAttributeId
            );
            const availableFrequency = this
                .clinicalAttributeIdToAvailableFrequency.result!;
            const sortedAttributes = {
                clinical: [] as ExtendedClinicalAttribute[],
                groups: [] as ExtendedClinicalAttribute[],
                customCharts: [] as ExtendedClinicalAttribute[],
            };

            const customChartClinicalAttributeIds = _.keyBy(
                this.props.store.clinicalAttributes_customCharts.result!,
                a => a.clinicalAttributeId
            );

            for (const attr of uniqueAttributes) {
                if (clinicalAttributeIsINCOMPARISONGROUP(attr)) {
                    sortedAttributes.groups.push(attr);
                } else if (
                    attr.clinicalAttributeId in customChartClinicalAttributeIds
                ) {
                    sortedAttributes.customCharts.push(attr);
                } else {
                    sortedAttributes.clinical.push(attr);
                }
            }
            sortedAttributes.clinical = _.sortBy<ExtendedClinicalAttribute>(
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

            sortedAttributes.groups = _.sortBy<ExtendedClinicalAttribute>(
                sortedAttributes.groups,
                x => x.displayName.toLowerCase()
            );

            sortedAttributes.customCharts = _.sortBy<ExtendedClinicalAttribute>(
                sortedAttributes.customCharts,
                x => x.displayName.toLowerCase()
            );

            return Promise.resolve(
                _.mapValues(sortedAttributes, attrs => {
                    return attrs.map(attr => ({
                        label: attr.displayName,
                        key: attr.clinicalAttributeId,
                        selected:
                            // set false by default
                            // manipulate this case by case
                            false,
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

    @computed get clinicalTracksMenu() {
        // TODO: put onFocus handler on CheckedSelect when possible
        // TODO: pass unmodified string array as value prop when possible
        // TODO: remove labelKey specification, leave to default prop, when possible
        if (
            this.props.store &&
            this.props.state.selectedClinicalAttributeIds &&
            this.props.handlers.onChangeSelectedClinicalTracks
        ) {
            return (
                <AddClinicalTracks
                    store={this.props.store}
                    getSelectedClinicalAttributeIds={
                        this.getSelectedClinicalAttributeIds as () => string[]
                    }
                    onChangeSelectedClinicalTracks={
                        this.props.handlers.onChangeSelectedClinicalTracks
                    }
                    clinicalTrackOptionsPromise={this.clinicalTrackOptions}
                    clinicalAttributeIdToAvailableFrequencyPromise={
                        this.clinicalAttributeIdToAvailableFrequency
                    }
                    width={this.dropdownWidth}
                />
            );
        } else {
            return null;
        }
    }

    @computed
    private get genericAssayTabs() {
        let tabs = [];
        if (this.isGenericAssayDataComplete && this.showGenericAssayTabs) {
            const genericAssayEntitiesGroupedByGenericAssayType = this.props
                .store.genericAssayEntitiesGroupedByGenericAssayType.result;
            // create one tab for each generic assay type
            tabs = _.map(this.profilesByGenericAssayType, (profiles, type) => {
                const profileOptions = _.map(profiles, profile => {
                    return {
                        value: profile.molecularProfileId,
                        label: profile.name,
                    };
                });
                const entityOptions = _.map(
                    genericAssayEntitiesGroupedByGenericAssayType[type],
                    entity => makeGenericAssayOption(entity, false)
                );
                const linkText = (
                    <div>
                        {deriveDisplayTextFromGenericAssayType(type)}
                        <span style={{ paddingLeft: 5 }}>
                            <OncoprintDropdownCount count={profiles.length} />
                        </span>
                    </div>
                );

                return (
                    <MSKTab
                        key={type}
                        id={type}
                        className="oncoprintGenericAssayTab"
                        linkText={linkText}
                    >
                        <GenericAssaySelection
                            molecularProfileOptions={profileOptions}
                            submitButtonText={'Add Track'}
                            genericAssayType={type}
                            genericAssayEntityOptions={entityOptions}
                            initialGenericAssayEntityIds={
                                this.props
                                    .selectedGenericAssayEntitiesGroupedByGenericAssayTypeFromUrl &&
                                this.props
                                    .selectedGenericAssayEntitiesGroupedByGenericAssayTypeFromUrl[
                                    type
                                ]
                                    ? this.props
                                          .selectedGenericAssayEntitiesGroupedByGenericAssayTypeFromUrl[
                                          type
                                      ]
                                    : []
                            }
                            onSelectGenericAssayProfile={
                                this.props.handlers.onSelectGenericAssayProfile
                            }
                            onTrackSubmit={this.onGenericAssaySubmit}
                            allowEmptySubmission={true}
                        />
                    </MSKTab>
                );
            });
            return tabs;
        } else {
            return null;
        }
    }

    @computed get clinicalTabText() {
        if (
            this.clinicalTrackOptions.result &&
            !_.isEmpty(this.clinicalTrackOptions.result.clinical)
        ) {
            return (
                <div>
                    {Tab.CLINICAL}
                    <span style={{ paddingLeft: 5 }}>
                        <OncoprintDropdownCount
                            count={
                                this.clinicalTrackOptions.result.clinical.length
                            }
                        />
                    </span>
                </div>
            );
        } else {
            return Tab.CLINICAL;
        }
    }

    @computed get heatmapTabText() {
        if (!_.isEmpty(this.props.store.heatmapMolecularProfiles.result)) {
            return (
                <div>
                    {Tab.HEATMAP}
                    <span style={{ paddingLeft: 5 }}>
                        <OncoprintDropdownCount
                            count={
                                this.props.store.heatmapMolecularProfiles
                                    .result!.length
                            }
                        />
                    </span>
                </div>
            );
        } else {
            return Tab.HEATMAP;
        }
    }

    private getTextPixel(text: string, fontSize: string) {
        // This is a very specified function to calculate the text length in Add Tracks dropdown
        const FRONT_FAMILY = 'Helvetica Neue';
        return Math.floor(getTextWidth(text, FRONT_FAMILY, fontSize));
    }

    @computed get dropdownWidth() {
        let width = 2 * CONTAINER_PADDING_WIDTH;
        const HEADER_FONT_SIZE = '14px';
        const COUNT_FONT_SIZE = '11px';
        if (
            this.clinicalTrackOptions.result &&
            !_.isEmpty(this.clinicalTrackOptions.result.clinical)
        ) {
            const textWidth =
                this.getTextPixel(Tab.CLINICAL, HEADER_FONT_SIZE) +
                TAB_PADDING_WIDTH;
            const countTextWidth =
                this.getTextPixel(
                    this.clinicalTrackOptions.result.clinical.length.toString(),
                    COUNT_FONT_SIZE
                ) + COUNT_PADDING_WIDTH;
            width += textWidth + countTextWidth;
        }
        if (
            this.props.heatmapMenu &&
            !_.isEmpty(this.props.store.heatmapMolecularProfiles.result)
        ) {
            const textWidth =
                this.getTextPixel(Tab.HEATMAP, HEADER_FONT_SIZE) +
                TAB_PADDING_WIDTH;
            const countTextWidth =
                this.getTextPixel(
                    this.props.store.heatmapMolecularProfiles.result!.length.toString(),
                    COUNT_FONT_SIZE
                ) + COUNT_PADDING_WIDTH;
            width += textWidth + countTextWidth;
        }
        if (this.showGenericAssayTabs) {
            // showGenericAssayTabs is true means we have more than one generic assay tabs are showing
            // and we know this.profilesByGenericAssayType is loaded completely
            const genericAssayText = this.genericAssayTabs!.map(tab =>
                deriveDisplayTextFromGenericAssayType(tab.key as string)
            ).join();
            const genericAssayTabsCount = this.genericAssayTabs!.length;
            const genericAssayCountTextWidth = _.reduce(
                this.profilesByGenericAssayType,
                (width, profiles) => {
                    return (width +=
                        this.getTextPixel(
                            profiles.length.toString(),
                            COUNT_FONT_SIZE
                        ) + COUNT_PADDING_WIDTH);
                },
                0
            );
            const genericAssayTabsWidth =
                this.getTextPixel(genericAssayText, HEADER_FONT_SIZE) +
                genericAssayTabsCount * TAB_PADDING_WIDTH +
                genericAssayCountTextWidth;
            width += genericAssayTabsWidth;
        }

        return Math.max(width, MIN_DROPDOWN_WIDTH);
    }

    render() {
        return (
            <CustomDropdown
                bsStyle="default"
                title="Add Tracks"
                id="addTracksDropdown"
                className="oncoprintAddTracksDropdown"
                styles={{ minWidth: MIN_DROPDOWN_WIDTH, width: 'auto' }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <MSKTabs
                        activeTabId={this.tabId}
                        onTabClick={this.updateTabId}
                        unmountOnHide={false}
                        className="mainTabs oncoprintAddTracks"
                    >
                        <MSKTab
                            key={0}
                            id={Tab.CLINICAL}
                            linkText={this.clinicalTabText}
                            hide={!this.clinicalTracksMenu}
                        >
                            {this.clinicalTracksMenu}
                        </MSKTab>
                        <MSKTab
                            key={1}
                            id={Tab.HEATMAP}
                            linkText={this.heatmapTabText}
                            hide={!this.props.heatmapMenu}
                        >
                            {this.props.heatmapMenu}
                        </MSKTab>
                        {this.genericAssayTabs}
                    </MSKTabs>
                </div>
            </CustomDropdown>
        );
    }
}
