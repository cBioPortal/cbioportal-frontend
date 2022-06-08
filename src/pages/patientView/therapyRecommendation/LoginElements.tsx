import * as React from 'react';
import { Modal, Button } from 'react-bootstrap';

interface ILoginModalProps {
    showLoginModal: boolean;
    handleClose: () => void;
    mtbUrl: string;
}

export class LoginModal extends React.Component<ILoginModalProps, {}> {
    public render() {
        const url = this.props.mtbUrl + 'login';

        return (
            <Modal
                show={this.props.showLoginModal}
                onHide={this.props.handleClose}
            >
                <Modal.Header closeButton>
                    <Modal.Title>MTB User Information</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <iframe
                        src={url}
                        style={{
                            width: 550,
                            height: 460,
                            border: 'none',
                            marginLeft: '10px',
                        }}
                        marginHeight={0}
                        marginWidth={0}
                    >
                        <i className="fa fa-spinner fa-pulse fa-2x" />
                    </iframe>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        type="button"
                        bsStyle="primary"
                        onClick={this.props.handleClose}
                    >
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        );
    }
}

interface IUserInfoButtonProps {
    mtbUrl: string;
    openLoginModal: () => void;
}

export class UserInfoButton extends React.Component<IUserInfoButtonProps, {}> {
    public render() {
        return (
            <i
                className={'fa fa-user-md'}
                style={{
                    float: 'right',
                    fontSize: '30px',
                    marginTop: '12px',
                    marginLeft: '15px',
                }}
                onClick={() => this.props.openLoginModal()}
                title={'Show User Information'}
            />
        );
    }
}
