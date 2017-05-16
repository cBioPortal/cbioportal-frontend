import * as React from 'react';
import { Modal } from 'react-bootstrap';
import browser from 'detect-browser';


interface IBrowserState {
    show: boolean;
    name: string;
}

export default class UnsupportedBrowserModal extends React.Component<{}, IBrowserState> {

    constructor() {
        super();

        this.state = {
            name: browser.name,
            show: false
        };

    }

    componentDidMount() {
        this.handleUnsupportedBrowsers(this.state.name);
    }

    handleUnsupportedBrowsers(name:string) {
        const localStorage = window.localStorage.browserError || false;
        if (localStorage === true) {
            this.setState({show: false});
        } else if (name.toLowerCase() === 'ie') {
            window.localStorage.browserError = true;
            this.setState({show: true});
        } else {
            this.setState({show: false});
            window.localStorage.browserError = true;
        }
    }

    public render() {
        return (
            <Modal show={this.state.show} onHide={() => this.setState({show: false})}>
                <Modal.Header closeButton>
                    <Modal.Title>Sorry, we do not support your browser version!</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <ul>
                        <li>It looks like your using an old version of Internet Explorer.</li>
                        <li>Please consider updating to IE 11 or using a different browser.</li>
                    </ul>
                </Modal.Body>
            </Modal>
        );
    }
}
