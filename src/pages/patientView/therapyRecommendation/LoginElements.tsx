import * as React from 'react';
import * as request from 'superagent';
import { Modal, Button } from 'react-bootstrap';
import { DropdownButton, MenuItem } from 'react-bootstrap';

interface ILoginModalProps {
    showLoginModal: boolean;
    handleClose: () => void;
    mtbUrl: string;
}

export class LoginModal extends React.Component<ILoginModalProps, {}> {
    private openInTab = () => {
        let url = this.props.mtbUrl + 'login';
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
        if (newWindow) newWindow.opener = null;
    };

    public render() {
        const url = this.props.mtbUrl + 'login';

        return (
            <Modal
                show={this.props.showLoginModal}
                onHide={this.props.handleClose}
            >
                <Modal.Header closeButton>
                    <Modal.Title>MTB Login</Modal.Title>
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
                        bsStyle="link"
                        onClick={this.openInTab}
                    >
                        Open in new tab
                    </Button>
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

interface ILoginButtonProps {
    className: string;
    openLoginModal: () => void;
}

export class LoginButton extends React.Component<ILoginButtonProps, {}> {
    public render() {
        return (
            <Button
                type="button"
                className={this.props.className}
                onClick={() => this.props.openLoginModal()}
            >
                MTB Login
            </Button>
        );
    }
}

interface IUserInfoButtonProps {
    className: string;
    mtbUrl: string;
    openLoginModal: () => void;
    checkPermission: () => void;
}

export class UserInfoButton extends React.Component<IUserInfoButtonProps, {}> {
    private logout() {
        let seqParam = 'seq=' + new Date().getTime();
        let logoutUrl = this.props.mtbUrl + 'logout' + '?' + seqParam;
        console.log('### logout() ### requesting Logout Url: ' + logoutUrl);
        request
            .get(logoutUrl)
            .then(() => {
                this.props.checkPermission();
            })
            .catch(err => {
                console.group('### MTB ### ERROR catched GETting ' + logoutUrl);
                console.log(err);
                console.groupEnd();
                this.props.checkPermission();
            });
    }

    public render() {
        return (
            <DropdownButton
                id="drop1"
                className={this.props.className}
                title="User Info / MTB Logout"
            >
                <MenuItem onClick={() => this.props.openLoginModal()}>
                    Show User Information
                </MenuItem>
                <MenuItem onClick={() => this.logout()}>MTB Logout</MenuItem>
            </DropdownButton>
        );
    }
}
