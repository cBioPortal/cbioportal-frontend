import * as React from 'react';
import { Observer, observer } from 'mobx-react';
import { computed, action, makeObservable, observable } from 'mobx';
import {
    IMutationalSignature,
    IMutationalCounts,
} from 'shared/model/MutationalSignature';
import ClinicalInformationMutationalSignatureTable from '../clinicalInformation/ClinicalInformationMutationalSignatureTable';
import Select from 'react-select';
import autobind from 'autobind-decorator';
import FeatureInstruction from 'shared/FeatureInstruction/FeatureInstruction';

import {
    ClinicalDataBySampleId,
    MolecularProfile,
    Sample,
} from 'cbioportal-ts-api-client';
import {
    getVersionOption,
    getVersionOptions,
    getSampleOptions,
    getSampleOption,
    MutationalSignaturesVersion,
} from 'shared/lib/GenericAssayUtils/MutationalSignaturesUtils';
import _ from 'lodash';
import { ButtonGroup, Button } from 'react-bootstrap';

import MutationalBarChart from 'pages/patientView/mutationalSignatures/MutationalSignatureBarChart';
import { getPercentageOfMutationalCount } from './MutationalSignatureBarChartUtils';
import {
    DefaultTooltip,
    placeArrowBottomLeft,
    DownloadControls,
} from 'cbioportal-frontend-commons';
import classNames from 'classnames';
import { MutationalSignatureTableDataStore } from 'pages/patientView/mutationalSignatures/MutationalSignaturesDataStore';

export interface IMutationalSignaturesContainerProps {
    data: { [version: string]: IMutationalSignature[] };
    profiles: MolecularProfile[];
    version: string;
    sample: string;
    samples: string[];
    onVersionChange: (version: string) => void;
    onSampleChange: (sample: string) => void;
    dataCount: { [version: string]: IMutationalCounts[] };
}

const CONTENT_TO_SHOW_ABOVE_TABLE =
    'Click on mutational signature to open modal and update reference plot';

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
    @observable signatureProfile: string = this.props.data[
        this.props.version
    ][0].meta.name;
    private plotSvg: SVGElement | null = null;
    @observable signatureURL: string;
    @observable signatureDescription: string;
    @observable isSignatureInformationToolTipVisible: boolean = false;
    @observable updateReferencePlot: boolean = false;
    public static defaultProps: Partial<IAxisScaleSwitchProps> = {
        selectedScale: AxisScale.COUNT,
    };

    @observable
    public mutationalSignatureDataStore: MutationalSignatureTableDataStore = new MutationalSignatureTableDataStore(
        () => this.props.data[this.props.version].map(x => [x])
    );
    @observable
    selectedScale: string = AxisScale.COUNT;

    mutationalProfileSelection = (
        childData: string,
        visibility: boolean,
        updateReference: boolean
    ) => {
        this.signatureProfile = childData;
        this.updateReferencePlot = updateReference;
        this.isSignatureInformationToolTipVisible = visibility;
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
    @observable yAxisLabel: string = 'Mutational count (value)';

    @action.bound
    private handlePercentClick() {
        this.selectedScale = AxisScale.PERCENT;
        this.yAxisLabel = 'Mutational count (%)';
    }

    @action.bound
    private handleCountClick() {
        this.selectedScale = AxisScale.COUNT;
        this.yAxisLabel = 'Mutational count (value)';
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
    @computed get mutationalSignatureCountDataGroupedByVersionForSample() {
        const sampleIdToFilter = this.props.samples.includes(this.props.sample)
            ? this.props.sample
            : undefined;
        return (
            this._mutationalSignatureCountDataGroupedByVersionForSample ||
            this.props.dataCount[this.props.version]
                .map(item => item)
                .filter(subItem => subItem.sampleId === sampleIdToFilter)
        );
    }

    @action.bound
    private onVersionChange(option: { label: string; value: string }): void {
        this.props.onVersionChange(option.value);
        this.signatureProfile = this.props.data[option.value][0].meta.name;
        this.isSignatureInformationToolTipVisible = false;
    }

    @autobind
    private onSampleChange(sample: { label: string; value: string }): void {
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

    public render() {
        return (
            <div data-test="MutationalSignaturesContainer">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div
                            style={{
                                display: 'inline-block',
                                marginLeft: 5,
                                width: 800,
                            }}
                        >
                            <div
                                style={{
                                    float: 'left',
                                    width: 300,
                                    paddingBottom: 10,
                                }}
                            >
                                Version:
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
                                        width: 800,
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
                                    <DownloadControls
                                        filename="mutationalBarChart"
                                        getSvg={this.getSvg}
                                        buttons={['SVG', 'PNG']}
                                        type="button"
                                        dontFade
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            right: 0,
                                            paddingBottom: 10,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {this.props.data && (
                    <div>
                        {!_.isEmpty(this.props.dataCount) && (
                            <MutationalBarChart
                                signature={this.signatureProfile}
                                height={220}
                                width={1200}
                                refStatus={false}
                                svgId={'MutationalBarChart'}
                                svgRef={this.assignPlotSvgRef}
                                data={this.getDataForGraph}
                                version={this.props.version}
                                sample={this.props.sample}
                                label={this.yAxisLabel}
                                updateReference={this.updateReferencePlot}
                                initialReference={
                                    this.props.data[this.props.version][0].meta
                                        .name
                                }
                            />
                        )}

                        <div>
                            <FeatureInstruction
                                content={CONTENT_TO_SHOW_ABOVE_TABLE}
                            >
                                <ClinicalInformationMutationalSignatureTable
                                    data={this.props.data[this.props.version]}
                                    parentCallback={
                                        this.mutationalProfileSelection
                                    }
                                    dataStore={
                                        this.mutationalSignatureDataStore
                                    }
                                    url={this.signatureURL}
                                    description={this.signatureDescription}
                                    signature={this.signatureProfile}
                                    samples={this.props.samples}
                                />
                            </FeatureInstruction>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}
