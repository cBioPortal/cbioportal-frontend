import { Button, ButtonGroup, Modal, Radio } from 'react-bootstrap';
import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons/dist';
import Select from 'react-select';
import styles from './styles.module.scss';
import { POSITIONS } from './Survival';
import ComparisonStore from 'shared/lib/comparison/ComparisonStore';
import _ from 'lodash';
import { observer } from 'mobx-react';
import classNames from 'classnames';

export interface INewSurvivalModalProps {
    pageStore: ComparisonStore;
    onHide: () => void;
}

@observer
export default class NewSurvivalPlotModal extends React.Component<
    INewSurvivalModalProps,
    {}
> {
    constructor(props: any) {
        super(props);
    }

    startSelectRef: any = null;
    endSelectRef: any = null;
    censoredSelectRef: any = null;

    clearSelection = () => {
        this.startSelectRef.select.clearValue();
        this.endSelectRef.select.clearValue();
        this.censoredSelectRef.select.clearValue();
        this.props.pageStore.resetSurvivalPlotSelection();
    };

    render() {
        return (
            <Modal
                onHide={this.props.onHide}
                show={true}
                className={classNames(
                    'cbioportal-frontend',
                    styles.newSurvivalModalWindow
                )}
            >
                <Modal.Header closeButton>
                    <Modal.Title>Create a Survival Plot</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className={styles.clinicalEventSelection}>
                        <div className="form-group">
                            <label>Name:</label>
                            <div className="form-group">
                                <DefaultTooltip
                                    visible={
                                        this.props.pageStore
                                            .doesChartNameAlreadyExists
                                    }
                                    overlay={
                                        <div>
                                            <i
                                                className="fa fa-md fa-exclamation-triangle"
                                                style={{
                                                    color: '#BB1700',
                                                    marginRight: 5,
                                                }}
                                            />
                                            <span>
                                                Already survival plot with same
                                                name exists, please use a
                                                different name
                                            </span>
                                        </div>
                                    }
                                >
                                    <input
                                        placeholder={'Optional'}
                                        style={{
                                            width: '300px',
                                            marginRight: '10px',
                                        }}
                                        type="text"
                                        onInput={
                                            this.props.pageStore
                                                .onKMPlotNameChange
                                        }
                                        value={this.props.pageStore.chartName}
                                        className="form-control input-sm"
                                    />
                                </DefaultTooltip>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Start:</label>
                            <div style={{ display: 'flex' }}>
                                <div className={styles['event-type']}>
                                    <Select
                                        ref={(ref: any) => {
                                            this.startSelectRef = ref;
                                        }}
                                        placeholder="Select clinical event type"
                                        name="clinical-event"
                                        value={
                                            this.props.pageStore
                                                .selectedStartClinicalEventType
                                        }
                                        onChange={
                                            this.props.pageStore
                                                .onStartClinicalEventSelection
                                        }
                                        options={_.values(
                                            this.props.pageStore
                                                .clinicalEventOptions.result
                                        )}
                                        isClearable
                                        isSearchable
                                    />
                                </div>
                                {this.props.pageStore
                                    ._selectedStartClinicalEventType !==
                                    undefined &&
                                    this.props.pageStore.clinicalEventOptions
                                        .result[
                                        this.props.pageStore
                                            ._selectedStartClinicalEventType
                                    ].attributes.length > 0 && (
                                        <div
                                            className={
                                                styles['event-attributes']
                                            }
                                        >
                                            <Select
                                                placeholder="Select clinical event type attributes"
                                                name="clinical-event-attributes"
                                                closeMenuOnSelect={false}
                                                isMulti
                                                value={
                                                    this.props.pageStore
                                                        .selectedStartClinicalEventAttributes
                                                }
                                                onChange={(
                                                    selectedOptions: any
                                                ) => {
                                                    this.props.pageStore.selectedStartClinicalEventAttributes = selectedOptions;
                                                }}
                                                options={
                                                    this.props.pageStore
                                                        .clinicalEventOptions
                                                        .result[
                                                        this.props.pageStore
                                                            ._selectedStartClinicalEventType
                                                    ].attributes
                                                }
                                                isClearable={true}
                                                clearable={true}
                                                searchable={true}
                                                noOptionsMessage={() =>
                                                    'No results'
                                                }
                                            />
                                        </div>
                                    )}
                                <div className={styles['event-position']}>
                                    <ButtonGroup>
                                        {POSITIONS.map((option, i) => {
                                            return (
                                                <Radio
                                                    checked={
                                                        option.value ===
                                                        this.props.pageStore
                                                            .startEventPosition
                                                    }
                                                    onChange={e => {
                                                        this.props.pageStore.startEventPosition = $(
                                                            e.target
                                                        ).attr(
                                                            'data-value'
                                                        ) as any;
                                                    }}
                                                    inline
                                                    data-value={option.value}
                                                >
                                                    {option.label}
                                                </Radio>
                                            );
                                        })}
                                    </ButtonGroup>
                                </div>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>End:</label>
                            <div style={{ display: 'flex' }}>
                                <div className={styles['event-type']}>
                                    <Select
                                        ref={(ref: any) => {
                                            this.endSelectRef = ref;
                                        }}
                                        placeholder="Select clinical event type"
                                        name="clinical-event"
                                        value={
                                            this.props.pageStore
                                                .selectedEndClinicalEventType
                                        }
                                        onChange={
                                            this.props.pageStore
                                                .onEndClinicalEventSelection
                                        }
                                        options={_.values(
                                            this.props.pageStore
                                                .clinicalEventOptions.result
                                        )}
                                        isClearable={true}
                                        clearable={true}
                                        searchable={true}
                                        key={'value'}
                                    />
                                </div>
                                {this.props.pageStore
                                    ._selectedEndClinicalEventType !==
                                    undefined &&
                                    this.props.pageStore.clinicalEventOptions
                                        .result[
                                        this.props.pageStore
                                            ._selectedEndClinicalEventType
                                    ].attributes.length > 0 && (
                                        <div
                                            className={
                                                styles['event-attributes']
                                            }
                                        >
                                            <Select
                                                placeholder="Select clinical event type attributes"
                                                name="clinical-event-attributes"
                                                closeMenuOnSelect={false}
                                                isMulti
                                                value={
                                                    this.props.pageStore
                                                        .selectedEndClinicalEventAttributes
                                                }
                                                onChange={(
                                                    selectedOptions: any
                                                ) => {
                                                    this.props.pageStore.selectedEndClinicalEventAttributes = selectedOptions;
                                                }}
                                                options={
                                                    this.props.pageStore
                                                        .clinicalEventOptions
                                                        .result[
                                                        this.props.pageStore
                                                            ._selectedEndClinicalEventType
                                                    ].attributes
                                                }
                                                isClearable={true}
                                                searchable={true}
                                                noOptionsMessage={() =>
                                                    'No results'
                                                }
                                            />
                                        </div>
                                    )}
                                <div className={styles['event-position']}>
                                    <ButtonGroup>
                                        {POSITIONS.map((option, i) => {
                                            return (
                                                <Radio
                                                    checked={
                                                        option.value ===
                                                        this.props.pageStore
                                                            .endEventPosition
                                                    }
                                                    onChange={e => {
                                                        this.props.pageStore.endEventPosition = $(
                                                            e.target
                                                        ).attr(
                                                            'data-value'
                                                        ) as any;
                                                    }}
                                                    inline
                                                    data-value={option.value}
                                                >
                                                    {option.label}
                                                </Radio>
                                            );
                                        })}
                                    </ButtonGroup>
                                </div>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Censored:</label>
                            <div style={{ display: 'flex' }}>
                                <div className={styles['event-type']}>
                                    <Select
                                        ref={(ref: any) => {
                                            this.censoredSelectRef = ref;
                                        }}
                                        placeholder="Select clinical event type"
                                        name="clinical-event"
                                        value={
                                            this.props.pageStore
                                                .selectedCensoredClinicalEventType
                                        }
                                        onChange={
                                            this.props.pageStore
                                                .onCensoredClinicalEventSelection
                                        }
                                        options={[
                                            {
                                                label: 'any event',
                                                value: 'any',
                                                attributes: [],
                                            } as any,
                                        ].concat(
                                            _.values(
                                                this.props.pageStore
                                                    .clinicalEventOptions.result
                                            )
                                        )}
                                        clearable={false}
                                        searchable={false}
                                    />
                                </div>
                                {this.props.pageStore
                                    .selectedCensoredClinicalEventType !==
                                    undefined &&
                                    this.props.pageStore
                                        .selectedCensoredClinicalEventType
                                        .value !== 'any' &&
                                    this.props.pageStore.clinicalEventOptions
                                        .result[
                                        this.props.pageStore
                                            .selectedCensoredClinicalEventType
                                            .value
                                    ].attributes.length > 0 && (
                                        <div
                                            className={
                                                styles['event-attributes']
                                            }
                                        >
                                            <Select
                                                placeholder="Select clinical event type attributes"
                                                name="clinical-event-attributes"
                                                closeMenuOnSelect={false}
                                                isMulti
                                                value={
                                                    this.props.pageStore
                                                        .selectedCensoredClinicalEventAttributes
                                                }
                                                onChange={(
                                                    selectedOptions: any
                                                ) => {
                                                    this.props.pageStore.selectedCensoredClinicalEventAttributes = selectedOptions;
                                                }}
                                                options={
                                                    this.props.pageStore
                                                        .clinicalEventOptions
                                                        .result[
                                                        this.props.pageStore
                                                            .selectedCensoredClinicalEventType
                                                            .value
                                                    ].attributes
                                                }
                                                isClearable={false}
                                                noOptionsMessage={() =>
                                                    'No results'
                                                }
                                            />
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>
                </Modal.Body>

                <Modal.Footer>
                    <Button
                        onClick={() => {
                            this.props.pageStore.onAddSurvivalPlot();
                            this.props.onHide();
                        }}
                        bsStyle={'primary'}
                        disabled={
                            this.props.pageStore.isAddSurvivalPlotDisabled
                        }
                    >
                        Create
                    </Button>
                    <Button bsStyle={'secondary'} onClick={this.clearSelection}>
                        Reset
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}
