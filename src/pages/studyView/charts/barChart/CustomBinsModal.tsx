import * as React from 'react';
import * as _ from 'lodash';
import { ChartMeta, customBinsAreValid } from 'pages/studyView/StudyViewUtils';
import autobind from 'autobind-decorator';
import { observable, computed, makeObservable } from 'mobx';
import { observer } from 'mobx-react';
import { Modal, Button } from 'react-bootstrap';

export type ICustomBinsProps = {
    show: boolean;
    onHide: () => void;
    chartMeta: ChartMeta;
    currentBins: number[];
    updateCustomBins: (uniqueKey: string, bins: number[]) => void;
};

@observer
export default class CustomBinsModal extends React.Component<
    ICustomBinsProps,
    {}
> {
    binSeparator: string = ',';
    @observable private currentBinsValue = '';

    constructor(props: Readonly<ICustomBinsProps>) {
        super(props);
        makeObservable(this);
        if (this.props.currentBins) {
            this.currentBinsValue = _.sortBy(this.props.currentBins).join(
                `${this.binSeparator} `
            );
        }
    }

    @autobind
    updateCurrentBinsValue() {
        const newBins = _.sortBy(
            this.newStringBins.map(item => Number(item.trim()))
        );
        this.currentBinsValue = newBins.join(`${this.binSeparator} `);
        this.props.updateCustomBins(this.props.chartMeta.uniqueKey, newBins);
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
