import * as React from 'react';
import { observer } from 'mobx-react';
import { computed, action, makeObservable, observable } from 'mobx';
import {
    IMutationalSignature,
    IMutationalCounts,
} from 'shared/model/MutationalSignature';
import ClinicalInformationMutationalSignatureTable, {
    IMutationalSignatureRow,
} from '../clinicalInformation/ClinicalInformationMutationalSignatureTable';
import Select from 'react-select';
import autobind from 'autobind-decorator';
import FeatureInstruction from 'shared/FeatureInstruction/FeatureInstruction';

import { MolecularProfile } from 'cbioportal-ts-api-client';
import {
    getVersionOption,
    getVersionOptions,
    getSampleOptions,
    getSampleOption,
} from 'shared/lib/GenericAssayUtils/MutationalSignaturesUtils';
import _ from 'lodash';
import { ButtonGroup } from 'react-bootstrap';

import MutationalBarChart from 'pages/patientView/mutationalSignatures/MutationalSignatureBarChart';
import {
    formatMutationalSignatureLabel,
    getPercentageOfMutationalCount,
    prepareMutationalSignatureDataForTable,
} from './MutationalSignatureBarChartUtils';
import {
    DefaultTooltip,
    DownloadControlOption,
    DownloadControls,
} from 'cbioportal-frontend-commons';
import classNames from 'classnames';
import { MutationalSignatureTableDataStore } from 'pages/patientView/mutationalSignatures/MutationalSignaturesDataStore';
import WindowStore from 'shared/components/window/WindowStore';
import { getServerConfig } from 'config/config';

export interface IMutationalSignaturesContainerProps {
    data: { [version: string]: IMutationalSignature[] };
    profiles: MolecularProfile[];
    version: string;
    sample: string;
    samples: string[];
    samplesNotProfiled: string[];
    onVersionChange: (version: string) => void;
    onSampleChange: (sample: string) => void;
    dataCount: { [version: string]: IMutationalCounts[] };
}

const CONTENT_TO_SHOW_ABOVE_TABLE =
    'Click on a mutational signature to update reference plot';

interface IAxisScaleSwitchProps {
    onChange: (selectedScale: AxisScale) => void;
    selectedScale: AxisScale;
}

export enum AxisScale {
    PERCENT = '%',
    COUNT = '#',
}

@observer
export default class MutationalSignaturesContainer extends React.Component<
    IMutationalSignaturesContainerProps,
    {}
> {
    public mutationalSignatureTableStore: MutationalSignatureTableDataStore;
    @observable signatureProfile: string = this.props.data[
        this.props.version
    ][0].meta.name;
    @observable signatureToPlot: string = this.props.data[this.props.version][0]
        .meta.name;
    private plotSvg: SVGElement | null = null;
    @observable signatureURL: string;
    @observable signatureDescription: string;
    @observable isSignatureInformationToolTipVisible: boolean = false;
    @observable updateReferencePlot: boolean = false;
    public static defaultProps: Partial<IAxisScaleSwitchProps> = {
        selectedScale: AxisScale.COUNT,
    };

    @observable
    selectedScale: string = AxisScale.PERCENT;

    mutationalProfileSelection = (
        childData: string,
        visibility: boolean,
        updateReference: boolean
    ) => {
        this.signatureProfile = childData;
        this.updateReferencePlot = updateReference;
        this.isSignatureInformationToolTipVisible = visibility;
        this.signatureToPlot = updateReference
            ? childData
            : this.signatureToPlot;
        this.signatureURL =
            this.props.data[this.props.version].filter(obj => {
                return childData === obj.meta.name;
            }).length > 0
                ? this.props.data[this.props.version].filter(obj => {
                      return childData === obj.meta.name;
                  })[0].meta.url
                : '';
        this.signatureDescription =
            this.props.data[this.props.version].filter(obj => {
                return childData === obj.meta.name;
            }).length > 0
                ? this.props.data[this.props.version].filter(obj => {
                      return childData === obj.meta.name;
                  })[0].meta.description
                : 'No description available';
    };
    constructor(props: IMutationalSignaturesContainerProps) {
        super(props);
        makeObservable(this);

        this.mutationalSignatureTableStore = new MutationalSignatureTableDataStore(
            () => {
                return this.mutationalSignatureDataForTable;
            }
        );
    }

    @observable _selectedData: IMutationalCounts[] = this.props.dataCount[
        this.props.version
    ];
    @computed get availableVersions() {
        // mutational signatures version is stored in the profile id
        // split the id by "_", the last part is the version info
        // we know split will always have results
        // use uniq function to get all unique versions
        return _.chain(this.props.profiles)
            .map(profile => _.last(profile.molecularProfileId.split('_'))!)
            .filter(item => item in this.props.data)
            .uniq()
            .value();
    }

    @computed get selectURLSignature(): string {
        return this.props.data[this.props.version][0].meta.url;
    }
    @computed get selectDescriptionSignature(): string {
        return this.props.data[this.props.version][0].meta.description;
    }

    @computed get selectedVersion(): string {
        // all versions is defined in the MutationalSignaturesVersion
        return (
            _.find(
                this.availableVersions,
                version => version === this.props.version
            ) || this.availableVersions[0]
        );
    }

    public toggleButton(scale: AxisScale, onClick: () => void) {
        return (
            <button
                className={classNames(
                    {
                        'btn-secondary': this.selectedScale === scale,
                        'btn-outline-secondary': this.selectedScale !== scale,
                    },
                    'btn',
                    'btn-sm',
                    'btn-axis-switch'
                )}
                data-test={`AxisScaleSwitch${scale}`}
                style={{
                    lineHeight: 1,
                    cursor:
                        this.selectedScale === scale ? 'default' : 'pointer',
                    fontWeight:
                        this.selectedScale === scale ? 'bolder' : 'normal',
                    color: this.selectedScale === scale ? '#fff' : '#6c757d',
                    backgroundColor:
                        this.selectedScale === scale ? '#6c757d' : '#fff',
                    borderColor: '#6c757d',
                }}
                onClick={onClick}
            >
                {scale}
            </button>
        );
    }

    @observable currentVersion: string = this.props.version;
    @observable yLabelString: string = this.updateYaxisLabel;
    @observable yAxisLabel: string = this.yLabelString;

    @action.bound
    private handlePercentClick() {
        this.selectedScale = AxisScale.PERCENT;
        this.yAxisLabel = this.updateYaxisLabel;
    }

    @computed get updateYaxisLabel() {
        const unitAxis = this.selectedScale == '%' ? ' (%)' : ' (count)';
        const yLabel =
            this.currentVersion == 'SBS'
                ? 'Single Base Substitution'
                : this.currentVersion == 'DBS'
                ? 'Double Base Substitutions'
                : 'Indels';
        return yLabel + unitAxis;
    }

    @action.bound
    private handleCountClick() {
        this.selectedScale = AxisScale.COUNT;
        this.yAxisLabel = this.updateYaxisLabel;
    }

    @computed get getDataForGraph(): IMutationalCounts[] {
        if (this.selectedScale == AxisScale.PERCENT) {
            return getPercentageOfMutationalCount(
                this.mutationalSignatureCountDataGroupedByVersionForSample
            );
        } else {
            return this.mutationalSignatureCountDataGroupedByVersionForSample;
        }
    }
    @observable
    _mutationalSignatureCountDataGroupedByVersionForSample: IMutationalCounts[];
    @computed
    get mutationalSignatureCountDataGroupedByVersionForSample(): IMutationalCounts[] {
        return (
            this._mutationalSignatureCountDataGroupedByVersionForSample ||
            this.props.dataCount[this.props.version]
                .map((obj, index) => {
                    obj[
                        'mutationalSignatureLabel'
                    ] = formatMutationalSignatureLabel(
                        obj.mutationalSignatureLabel,
                        this.props.version
                    );
                    return obj;
                })
                .filter(subItem => subItem.sampleId === this.sampleIdToFilter)
        );
    }

    @action.bound
    private onVersionChange(option: { label: string; value: string }): void {
        this.props.onVersionChange(option.value);
        this.signatureProfile = this.props.data[option.value][0].meta.name;
        this.signatureToPlot = this.props.data[option.value][0].meta.name;
        this.updateReferencePlot = false;
        this.isSignatureInformationToolTipVisible = false;
        this.currentVersion = option.value;
        this.yAxisLabel = this.updateYaxisLabel;
    }

    @autobind
    private onSampleChange(sample: { label: string; value: string }): void {
        this.getTotalMutationalCount;
        this.props.onSampleChange(sample.value);
    }

    @autobind
    private assignPlotSvgRef(el: SVGElement | null) {
        this.plotSvg = el;
    }
    @autobind
    private getSvg() {
        return this.plotSvg;
    }

    @autobind
    onMutationalSignatureTableRowClick(d: IMutationalSignatureRow) {
        this.signatureProfile = d.name;
        this.signatureURL = d.url;
        this.signatureProfile = d.name;
        this.signatureToPlot = d.name;
        this.updateReferencePlot = true;
        this.mutationalSignatureTableStore.setSelectedMutSig(d);
        if (this.mutationalSignatureTableStore.selectedMutSig.length > 0) {
            this.mutationalSignatureTableStore.setclickedMutSig(d);
            this.mutationalSignatureTableStore.toggleSelectedMutSig(
                this.mutationalSignatureTableStore.selectedMutSig[0]
            );
        }
    }

    @autobind
    onMutationalSignatureTableMouseOver(d: IMutationalSignatureRow) {
        this.signatureProfile = d.name;
        this.signatureURL = d.url;
        this.signatureProfile = d.name;
    }

    @computed get mutationalSignatureDataForTable() {
        return prepareMutationalSignatureDataForTable(
            this.props.data[this.props.version],
            this.props.samples
        );
    }

    @computed get sampleIdToFilter() {
        return this.props.samples.includes(this.props.sample)
            ? this.props.sample
            : undefined;
    }

    @computed get getTotalMutationalCount() {
        const countPerVersion = this.props.dataCount[this.props.version]
            .filter(subItem => subItem.sampleId === this.sampleIdToFilter)
            .map(item => {
                return item.value;
            });
        const mutTotalCount = countPerVersion.reduce((a, b) => a + b, 0);
        return [this.props.version, mutTotalCount];
    }

    public render() {
        return (
            <div data-test="MutationalSignaturesContainer">
                <div>
                    {this.props.samplesNotProfiled.length > 0 && (
                        <div className={'alert alert-info'}>
                            <span>
                                {this.props.samplesNotProfiled.length > 1
                                    ? this.props.samplesNotProfiled.join(',')
                                    : this.props.samplesNotProfiled}{' '}
                                {this.props.samplesNotProfiled.length > 1
                                    ? ' are'
                                    : ' is'}{' '}
                                not profiled for mutational signatures
                            </span>
                        </div>
                    )}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                        }}
                    >
                        <div
                            style={{
                                display: 'inline-block',
                                marginLeft: 5,
                                width: 1000,
                            }}
                        >
                            <div
                                style={{
                                    float: 'left',
                                    width: 300,
                                    paddingBottom: 10,
                                }}
                            >
                                Variant Class:
                                <DefaultTooltip
                                    placement="right"
                                    overlay={
                                        <span>
                                            <b>
                                                Mutational signature description
                                                (COSMIC):{' '}
                                            </b>{' '}
                                            <br />
                                            <b>SBS</b>: Single Base Substitution{' '}
                                            <br />
                                            <b>DBS</b>: Double Base Substitution{' '}
                                            <br />
                                            <b>ID</b>: Small Insertions and
                                            Deletions <br />
                                        </span>
                                    }
                                    destroyTooltipOnHide={true}
                                >
                                    <i
                                        className="fa fa-lg fa-question-circle"
                                        style={{ paddingLeft: 5 }}
                                    ></i>
                                </DefaultTooltip>
                                <Select
                                    className="basic-single"
                                    name={'mutationalSignaturesVersionSelector'}
                                    classNamePrefix={
                                        'mutationalSignaturesVersionSelector'
                                    }
                                    value={getVersionOption(this.props.version)}
                                    onChange={this.onVersionChange}
                                    options={getVersionOptions(
                                        this.availableVersions
                                    )}
                                    searchable={false}
                                    clearable={false}
                                />
                            </div>

                            {this.props.samples.length > 1 && (
                                <div
                                    style={{
                                        float: 'left',
                                        width: 300,
                                        paddingLeft: 10,
                                        marginLeft: 10,
                                        paddingBottom: 10,
                                    }}
                                >
                                    Sample:
                                    <Select
                                        className="basic-single"
                                        name={
                                            'mutationalSignatureSampleSelector'
                                        }
                                        classNamePrefix={
                                            'mutationalSignatureSampleSelector'
                                        }
                                        value={getSampleOption(
                                            this.props.sample
                                        )}
                                        options={getSampleOptions(
                                            this.props.samples
                                        )}
                                        onChange={this.onSampleChange}
                                        searchable={false}
                                        clearable={false}
                                    />
                                </div>
                            )}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'inline-block',
                                        marginLeft: 5,
                                        width: 100,
                                        paddingBottom: 10,
                                    }}
                                >
                                    {!_.isEmpty(this.props.dataCount) && (
                                        <div
                                            style={{
                                                float: 'left',
                                                width: 100,
                                                paddingLeft: 10,
                                            }}
                                        >
                                            Y-Axis:
                                            <ButtonGroup aria-label="">
                                                {this.toggleButton(
                                                    AxisScale.PERCENT,
                                                    this.handlePercentClick
                                                )}
                                                {this.toggleButton(
                                                    AxisScale.COUNT,
                                                    this.handleCountClick
                                                )}
                                            </ButtonGroup>
                                        </div>
                                    )}
                                </div>
                                {!_.isEmpty(this.props.dataCount) && (
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'row',
                                            width: WindowStore.size.width - 100,
                                        }}
                                    >
                                        <div
                                            style={{
                                                float: 'left',
                                                paddingLeft: 10,
                                                width: 100,
                                                boxSizing: 'border-box',
                                            }}
                                        >
                                            <h5>Sample</h5>
                                            {this.props.sample}
                                        </div>
                                        <div>
                                            <h5>Mutational count</h5>
                                            {this.getTotalMutationalCount[0]}:
                                            {this.getTotalMutationalCount[1]}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {this.props.data && (
                    <div>
                        {!_.isEmpty(this.props.dataCount) && (
                            <div
                                className={'borderedChart'}
                                style={{ marginLeft: 10 }}
                            >
                                <div
                                    style={{
                                        zIndex: 10,
                                        position: 'absolute',
                                        right: 10,
                                        top: 10,
                                    }}
                                >
                                    <DownloadControls
                                        filename="mutationalBarChart"
                                        getSvg={this.getSvg}
                                        buttons={['SVG', 'PNG', 'PDF']}
                                        type="button"
                                        dontFade
                                        showDownload={
                                            getServerConfig()
                                                .skin_hide_download_controls ===
                                            DownloadControlOption.SHOW_ALL
                                        }
                                    />
                                </div>
                                <div style={{ overflow: 'auto' }}>
                                    <MutationalBarChart
                                        signature={this.signatureToPlot}
                                        height={220}
                                        width={WindowStore.size.width - 100}
                                        refStatus={false}
                                        svgId={'MutationalBarChart'}
                                        svgRef={this.assignPlotSvgRef}
                                        data={this.getDataForGraph}
                                        version={this.props.version}
                                        sample={this.props.sample}
                                        label={this.yAxisLabel}
                                        selectedScale={this.selectedScale}
                                        updateReference={
                                            this.updateReferencePlot
                                        }
                                        initialReference={
                                            this.props.data[
                                                this.props.version
                                            ][0].meta.name
                                        }
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <FeatureInstruction
                                content={CONTENT_TO_SHOW_ABOVE_TABLE}
                            >
                                <ClinicalInformationMutationalSignatureTable
                                    data={this.mutationalSignatureDataForTable}
                                    url={this.signatureURL}
                                    description={this.signatureDescription}
                                    signature={this.signatureProfile}
                                    samples={this.props.samples}
                                    onRowClick={
                                        this.onMutationalSignatureTableRowClick
                                    }
                                    onRowMouseEnter={
                                        this.onMutationalSignatureTableMouseOver
                                    }
                                    dataStore={
                                        this.mutationalSignatureTableStore
                                    }
                                />
                            </FeatureInstruction>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}
