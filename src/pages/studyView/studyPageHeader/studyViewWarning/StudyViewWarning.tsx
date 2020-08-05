import * as React from 'react';
import { Alert, Button, Modal, Checkbox, ButtonGroup } from 'react-bootstrap';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import { observable } from 'mobx';
import AppConfig from 'appConfig';

export interface IStudyViewWarningBannerProps {
    message: string;
}

@observer
export default class StudyViewWarning extends React.Component<
    IStudyViewWarningBannerProps,
    {}
> {
    @observable
    show: boolean = true;
    @observable
    modalShow: boolean = false;
    @observable
    agreementOne: boolean = false;
    @observable
    agreementTwo: boolean = false;

    @autobind
    handleDismiss() {
        this.show = false;
        this.modalShow = false;
        localStorage.setItem('private_study_link_warning', 'Yes');
    }

    @autobind
    handleHide() {
        this.show = false;
    }
    @autobind
    handleShow() {
        this.show = true;
    }
    @autobind
    handleModalShow() {
        this.modalShow = true;
    }
    @autobind
    handleModalHide() {
        this.modalShow = false;
    }
    @autobind
    handleChecked(item: string) {
        switch (item) {
            case 'ItemOne':
                this.agreementOne = !this.agreementTwo;
                break;
            case 'ItemTwo':
                this.agreementTwo = !this.agreementTwo;
                break;
        }
    }

    render() {
        if (
            this.show &&
            ['triage-portal', 'mskcc-portal'].includes(
                AppConfig.serverConfig.app_name!
            )
        ) {
            return (
                <>
                    <Alert
                        bsStyle="warning"
                        style={{
                            position: 'absolute',
                            zIndex: 999,
                            width: '100%',
                            textAlign: 'center',
                        }}
                    >
                        <span style={{ color: 'red', fontSize: '12px' }}>
                            WARNING{' '}
                        </span>
                        <span style={{ fontSize: '12px' }}>
                            {this.props.message}
                        </span>
                        <ButtonGroup style={{ marginLeft: '10px' }}>
                            <Button
                                bsStyle="danger"
                                bsSize="xsmall"
                                onClick={this.handleModalShow}
                            >
                                Dismiss
                            </Button>
                            <Button bsSize="xsmall" onClick={this.handleHide}>
                                Hide
                            </Button>
                        </ButtonGroup>
                    </Alert>

                    <Modal
                        show={this.modalShow}
                        onHide={this.handleModalHide}
                        container={this}
                        aria-labelledby="contained-modal-title"
                    >
                        <Modal.Header closeButton>
                            <Modal.Title
                                id="contained-modal-title"
                                style={{ textAlign: 'center' }}
                            >
                                Dismiss Agreement
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body style={{ textAlign: 'left' }}>
                            <Checkbox
                                onClick={() => {
                                    this.handleChecked('ItemOne');
                                }}
                            >
                                When adding a link to a cBioPortal cohort in a
                                manuscript,{' '}
                                <strong>
                                    I will not link to the internal MSK portal (
                                    <a
                                        href="https://cbioportal.mskcc.org/"
                                        target="_blank"
                                    >
                                        cbioportal.mskcc.org
                                    </a>
                                    )
                                </strong>
                                , but will instead link to this study on the
                                public cBioPortal (
                                <a
                                    href="https://www.cbioportal.org/"
                                    target="_blank"
                                >
                                    cbioportal.org
                                </a>
                                ). Contact{' '}
                                <a href="mailto:cbioportal@cbio.mskcc.org">
                                    cbioportal@cbio.mskcc.org
                                </a>{' '}
                                with any questions about getting the data
                                transferred to the public cBioPortal.
                            </Checkbox>
                            <Checkbox
                                onClick={() => {
                                    this.handleChecked('ItemTwo');
                                }}
                            >
                                I have read the{' '}
                                <a
                                    href="https://cmo.mskcc.org/cmo/initiatives/msk-impact/"
                                    target="_blank"
                                >
                                    MSK-IMPACT Data publication guidelines
                                </a>
                                .
                            </Checkbox>
                        </Modal.Body>
                        <Modal.Footer>
                            {this.agreementOne && this.agreementTwo ? (
                                <Button
                                    bsStyle="primary"
                                    onClick={this.handleDismiss}
                                >
                                    I Agree
                                </Button>
                            ) : (
                                <Button
                                    bsStyle="primary"
                                    onClick={this.handleDismiss}
                                    disabled
                                >
                                    I Agree
                                </Button>
                            )}
                        </Modal.Footer>
                    </Modal>
                </>
            );
        }
        return <div></div>;
    }
}
