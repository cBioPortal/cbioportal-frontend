import * as React from 'react';
import { Modal } from 'react-bootstrap';

export interface IAjaxErrorModalProps {
    show: boolean;
    onHide: () => void;
}

export default class AjaxErrorModal extends React.Component<IAjaxErrorModalProps, {}> {

    public render() {
        return (
            <Modal show={this.props.show} onHide={this.props.onHide}>
                <Modal.Header closeButton>
                    <Modal.Title>Sorry, something went wrong!</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Troubleshooting:</p>
                    <ul>
                        <li>Check that your URL parameters are valid.</li>
                        <li>Make sure you are connected to the internet.</li>
                    </ul>
                </Modal.Body>
            </Modal>
        );
    }
}
