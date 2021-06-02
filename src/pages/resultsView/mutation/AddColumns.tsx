import * as React from 'react';
import * as _ from 'lodash';
import { Checkbox } from 'react-bootstrap';
import { observer } from 'mobx-react';
import { action, computed, makeObservable, observable } from 'mobx';
import { remoteData, getTextWidth } from 'cbioportal-frontend-commons';
import { IColumnVisibilityDef } from 'shared/components/columnVisibilityControls/ColumnVisibilityControls';
import {
    MIN_DROPDOWN_WIDTH,
    CONTAINER_PADDING_WIDTH,
    TAB_PADDING_WIDTH,
    COUNT_PADDING_WIDTH,
} from 'pages/resultsView/oncoprint/AddTracks';
import { MSKTab, MSKTabs } from 'shared/components/MSKTabs/MSKTabs';
import CustomDropdown from 'shared/components/oncoprint/controls/CustomDropdown';
import AddChartByType from '../../studyView/addChartButton/addChartByType/AddChartByType';
import { ChartDataCountSet } from '../../studyView/StudyViewUtils';

export interface IAddColumnsProps {
    className?: string;
    columnVisibility?: IColumnVisibilityDef[];
    onColumnEnabled?: (columnId: string) => void;
    onColumnDisabled?: (columnId: string) => void;
    onColumnToggled?: (
        columnId: string,
        columnVisibility?: IColumnVisibilityDef[]
    ) => void;
    clinicalAttributeIdToAvailableSampleCount?: { [id: string]: number };
    sampleCount?: number;
}

enum Tab {
    MUTATIONS = 'Mutations',
    CLINICAL = 'Clinical',
}

@observer
export default class AddColumns extends React.Component<IAddColumnsProps, {}> {
    @observable tabId: Tab = Tab.MUTATIONS;

    constructor(props: IAddColumnsProps) {
        super(props);
        makeObservable(this);
    }

    @action.bound
    private updateTabId(newId: Tab) {
        this.tabId = newId;
    }

    @computed get clinicalAttributeIdsToNames() {
        const clinicalAttributes = this.props.columnVisibility!.filter(
            col => col.clinicalAttributeId !== undefined
        );

        let map: { [id: string]: string } = {};
        for (let attribute of clinicalAttributes) {
            map[attribute.clinicalAttributeId!] = attribute.name;
        }

        return map;
    }

    @action.bound
    private addAll(ids: string[]) {
        if (this.props.onColumnEnabled && ids) {
            for (let id of ids) {
                this.props.onColumnEnabled(id);
            }
        }
    }

    @action.bound
    private clearAll(ids: string[]) {
        if (this.props.onColumnDisabled && ids) {
            for (let id of ids) {
                this.props.onColumnDisabled(id);
            }
        }
    }

    @action.bound
    private toggle(id: string) {
        if (this.props.onColumnToggled && id) {
            this.props.onColumnToggled(id, this.props.columnVisibility);
        }
    }

    readonly emptyPromise = remoteData({
        invoke: () =>
            new Promise<ChartDataCountSet>(() => {
                return;
            }),
    });

    readonly clinicalAttributeIdToAvailableFrequencyPromise = remoteData({
        invoke: () =>
            Promise.resolve(
                _.mapValues(
                    this.props.clinicalAttributeIdToAvailableSampleCount,
                    count => (100 * count) / this.props.sampleCount!
                )
            ),
    });

    @computed get mutationsOptions() {
        return this.props.columnVisibility
            ?.filter(col => col.clinicalAttributeId === undefined)
            .map(col => ({
                label: col.name,
                key: col.id,
                selected: col.visible,
            }));
    }

    @computed get mutationsTabContent() {
        return (
            <div>
                {this.mutationsOptions && (
                    <AddChartByType
                        options={this.mutationsOptions}
                        freqPromise={this.emptyPromise}
                        onAddAll={this.addAll}
                        onClearAll={this.clearAll}
                        onToggleOption={this.toggle}
                        optionsGivenInSortedOrder={true}
                        width={this.dropdownWidth}
                        excludeFrequency={true}
                    />
                )}
            </div>
        );
    }

    @computed get clinicalOptions() {
        return this.props.columnVisibility
            ?.filter(col => col.clinicalAttributeId !== undefined)
            .map(col => ({
                label: col.name,
                key: col.clinicalAttributeId!,
                selected: col.visible,
            }));
    }

    @computed get clinicalTabContent() {
        return (
            <div>
                {this.props.columnVisibility && this.clinicalOptions && (
                    <AddChartByType
                        options={this.clinicalOptions}
                        freqPromise={
                            this.clinicalAttributeIdToAvailableFrequencyPromise
                        }
                        onAddAll={clinicalAttributeIds =>
                            this.addAll(
                                clinicalAttributeIds.map(
                                    id => this.clinicalAttributeIdsToNames![id]
                                )
                            )
                        }
                        onClearAll={clinicalAttributeIds =>
                            this.clearAll(
                                clinicalAttributeIds.map(
                                    id => this.clinicalAttributeIdsToNames![id]
                                )
                            )
                        }
                        onToggleOption={clinicalAttributeId =>
                            this.toggle(
                                this.clinicalAttributeIdsToNames![
                                    clinicalAttributeId
                                ]
                            )
                        }
                        optionsGivenInSortedOrder={false}
                        width={this.dropdownWidth}
                    />
                )}
            </div>
        );
    }

    @computed get mutationsTabText() {
        return (
            <div>
                {Tab.MUTATIONS}
                <span style={{ paddingLeft: 5 }}>
                    <span className="oncoprintDropdownCount">
                        {this.mutationsOptions?.length}
                    </span>
                </span>
            </div>
        );
    }

    @computed get clinicalTabText() {
        return (
            <div>
                {Tab.CLINICAL}
                <span style={{ paddingLeft: 5 }}>
                    <span className="oncoprintDropdownCount">
                        {this.clinicalOptions?.length}
                    </span>
                </span>
            </div>
        );
    }

    private getTextPixel(text: string | undefined, fontSize: string) {
        // This is a very specified function to calculate the text length in Add Tracks dropdown
        const FRONT_FAMILY = 'Helvetica Neue';
        return Math.floor(
            getTextWidth(text ? text : '', FRONT_FAMILY, fontSize)
        );
    }

    @computed get dropdownWidth() {
        let width = 2 * CONTAINER_PADDING_WIDTH;
        const HEADER_FONT_SIZE = '14px';
        const COUNT_FONT_SIZE = '11px';

        const textWidth =
            this.getTextPixel(Tab.CLINICAL, HEADER_FONT_SIZE) +
            TAB_PADDING_WIDTH;
        const countTextWidth =
            this.getTextPixel(
                this.clinicalOptions?.length.toString(),
                COUNT_FONT_SIZE
            ) + COUNT_PADDING_WIDTH;
        width += textWidth + countTextWidth;

        return Math.max(width, MIN_DROPDOWN_WIDTH);
    }

    render() {
        return (
            <CustomDropdown
                bsStyle="default"
                title="Columns"
                id="addColumnsDropdown"
                className={this.props.className}
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
                        className="mainTabs mutationsTabAddColumnsDropdown"
                    >
                        <MSKTab
                            key={0}
                            id={Tab.MUTATIONS}
                            linkText={this.mutationsTabText}
                        >
                            {this.mutationsTabContent}
                        </MSKTab>
                        <MSKTab
                            key={1}
                            id={Tab.CLINICAL}
                            linkText={this.clinicalTabText}
                        >
                            {this.clinicalTabContent}
                        </MSKTab>
                    </MSKTabs>
                </div>
            </CustomDropdown>
        );
    }
}
