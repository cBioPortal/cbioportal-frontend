import * as React from 'react';
import _ from 'lodash';
import { ChartMeta, customBinsAreValid } from 'pages/studyView/StudyViewUtils';
import autobind from 'autobind-decorator';
import { observable, computed, makeObservable, action } from 'mobx';
import { observer } from 'mobx-react';
import { Modal } from 'react-bootstrap';
import LabeledCheckbox from 'shared/components/labeledCheckbox/LabeledCheckbox';
import { BinsGeneratorConfig } from 'cbioportal-ts-api-client/dist/generated/CBioPortalAPIInternal';
import {
    BinMethodOption,
    StudyViewPageStore,
} from 'pages/studyView/StudyViewPageStore';

export type ICustomBinsProps = {
    show: boolean;
    onHide: () => void;
    chartMeta: ChartMeta;
    currentBins: number[];
    updateCustomBins: (
        uniqueKey: string,
        bins: number[],
        binMethod: string,
        binsGeneratorConfig: BinsGeneratorConfig
    ) => void;
    updateGenerateBinsConfig: (binSize: number, anchorValue: number) => void;
    store: StudyViewPageStore;
};

@observer
export default class CustomBinsModal extends React.Component<
    ICustomBinsProps,
    {}
> {
    binSeparator: string = ',';
    @observable private currentBinsValue = '';
    @observable private currentBinsGeneratorConfig: BinsGeneratorConfig;

    constructor(props: Readonly<ICustomBinsProps>) {
        super(props);
        makeObservable(this);
        if (this.props.currentBins) {
            const bins = _.sortBy(this.props.currentBins);
            this.currentBinsValue = bins.join(`${this.binSeparator} `);
        }
        this.currentBinsGeneratorConfig = this.props.store.binsGeneratorConfig;
    }

    @autobind
    updateCurrentBinsValue() {
        let newBins: number[] = [];
        if (this.props.store.binMethod === BinMethodOption.CUSTOM) {
            newBins = _.sortBy(
                this.newStringBins
                    .filter(item => item !== '')
                    .map(item => Number(item.trim()))
            );
            this.currentBinsValue = newBins.join(`${this.binSeparator} `);
        }

        this.props.updateGenerateBinsConfig(
            this.currentBinsGeneratorConfig.binSize,
            this.currentBinsGeneratorConfig.anchorValue
        );

        this.props.updateCustomBins(
            this.props.chartMeta.uniqueKey,
            newBins,
            this.props.store.binMethod,
            this.currentBinsGeneratorConfig
        );

        this.props.onHide();
    }

    @computed
    get newStringBins() {
        return this.currentBinsValue.trim().split(this.binSeparator);
    }

    @computed
    get contentIsValid(): boolean {
        return customBinsAreValid(this.newStringBins);
    }

    changeBinsCheckbox(option: BinMethodOption) {
        this.props.store.binMethod = option;
    }

    @action
    updateBinSize(value: number) {
        this.currentBinsGeneratorConfig.binSize = value;
    }

    @action
    updateAnchorValue(value: number) {
        this.currentBinsGeneratorConfig.anchorValue = value;
    }

    render() {
        return (
            <Modal
                bsSize={'small'}
                show={this.props.show}
                onHide={this.props.onHide}
                keyboard
            >
                <Modal.Header closeButton>
                    <Modal.Title>Custom Bins</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div>
                        <LabeledCheckbox
                            checked={
                                this.props.store.binMethod ===
                                BinMethodOption.QUARTILE
                            }
                            onChange={event =>
                                this.changeBinsCheckbox(
                                    BinMethodOption.QUARTILE
                                )
                            }
                        >
                            Quartiles
                        </LabeledCheckbox>
                    </div>
                    <div>
                        <LabeledCheckbox
                            checked={
                                this.props.store.binMethod ===
                                BinMethodOption.MEDIAN
                            }
                            onChange={event =>
                                this.changeBinsCheckbox(BinMethodOption.MEDIAN)
                            }
                        >
                            Median split
                        </LabeledCheckbox>
                    </div>
                    <div>
                        <LabeledCheckbox
                            checked={
                                this.props.store.binMethod ===
                                BinMethodOption.GENERATE
                            }
                            onChange={event =>
                                this.changeBinsCheckbox(
                                    BinMethodOption.GENERATE
                                )
                            }
                        >
                            Generate bins
                        </LabeledCheckbox>
                        <div style={{ marginLeft: 50 }}>
                            <span>Bin size</span>
                            <textarea
                                style={{
                                    display: 'inline',
                                    resize: 'none',
                                    width: '50px',
                                    verticalAlign: 'middle',
                                    textAlign: 'center',
                                    marginLeft: '20px',
                                }}
                                rows={1}
                                value={this.currentBinsGeneratorConfig.binSize}
                                className="form-control input-sm"
                                onChange={event =>
                                    this.updateBinSize(
                                        Number(event.currentTarget.value)
                                    )
                                }
                            />
                        </div>
                        <div style={{ paddingLeft: 50 }}>
                            <span>Min value</span>
                            <textarea
                                style={{
                                    display: 'inline',
                                    resize: 'none',
                                    width: '50px',
                                    verticalAlign: 'middle',
                                    textAlign: 'center',
                                    marginLeft: '9px',
                                }}
                                rows={1}
                                value={
                                    this.currentBinsGeneratorConfig.anchorValue
                                }
                                className="form-control input-sm"
                                onChange={event =>
                                    this.updateAnchorValue(
                                        Number(event.currentTarget.value)
                                    )
                                }
                            />
                        </div>
                    </div>
                    <div>
                        <LabeledCheckbox
                            checked={
                                this.props.store.binMethod ===
                                BinMethodOption.CUSTOM
                            }
                            onChange={event =>
                                this.changeBinsCheckbox(BinMethodOption.CUSTOM)
                            }
                        >
                            Custom bins
                        </LabeledCheckbox>
                    </div>
                    <div>Please specify bin boundaries of the x axis</div>
                    <textarea
                        style={{ resize: 'none' }}
                        rows={5}
                        value={this.currentBinsValue}
                        className="form-control input-sm"
                        onChange={event =>
                            (this.currentBinsValue = event.currentTarget.value)
                        }
                    />
                    {!this.contentIsValid && (
                        <div
                            className="alert alert-danger"
                            role="alert"
                            style={{ marginTop: '10px', marginBottom: '0' }}
                        >
                            Invalid bins
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={this.updateCurrentBinsValue}
                        disabled={!this.contentIsValid}
                        style={{ marginTop: '10px', marginBottom: '0' }}
                    >
                        Update
                    </button>
                </Modal.Footer>
            </Modal>
        );
    }
}
