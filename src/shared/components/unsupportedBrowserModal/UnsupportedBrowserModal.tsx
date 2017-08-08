import * as React from 'react';
import { Modal } from 'react-bootstrap';
import browser from 'detect-browser';

interface IBrowserState {
    show: boolean;
    name: string;
    version: string;
    noShowModal: boolean;
}

export default class UnsupportedBrowserModal extends React.Component<{}, IBrowserState> {

    constructor() {
        super();

        let state;
        if (!browser)  {
            state = {
                name: "Unsupported",
                show: true,
                version: ""
            };
        } else {
            state = {
                name: browser.name,
                show: false,
                version: browser.version
            };
        }
        this.state = {
            noShowModal: window.localStorage.noShowModal || false,
            ...state
        };

        this.handleCheckboxChange = this.handleCheckboxChange.bind(this);
        this.handleHideClick = this.handleHideClick.bind(this);
    }

    componentDidMount() {
        this.handleUnsupportedBrowsers(this.state.name, this.state.version, this.state.noShowModal);
    }

    handleCheckboxChange(e:any) {
        this.setState({noShowModal: e.target.checked});
    }

    componentWillUnmount() {
        window.localStorage.noShowModal = this.state.noShowModal;
    }

    handleUnsupportedBrowsers(name:string, version: string, localStorage: boolean) {
        if (localStorage) {
            this.setState({show: false});
            return;
        }
        const sessionStorage = window.sessionStorage.browserError || false;
        if (sessionStorage === true) {
            this.setState({show: false});
        } else {
            const isIE11 = String(name) === "ie" && Number(version.slice(0,2)) === 11;
            name = name.toLowerCase();

            if (String(name) === 'unsupported') {
                window.sessionStorage.browserError = true;
                this.setState({show: true});
            } else if (!(name === "chrome" || name === "firefox" || name === "edge" || name === "safari" || isIE11))  {
                window.sessionStorage.browserError = true;
                this.setState({show: true});
            } else {
                this.setState({show: false})
                window.sessionStorage.browserError = true;
            }
        }
    }

    handleHideClick() {
        this.setState({show: false});
        window.localStorage.noShowModal = this.state.noShowModal;
    }

    public render() {
        return (
            <Modal show={this.state.show} onHide={this.handleHideClick}>
                <Modal.Header closeButton>
                    <Modal.Title>Sorry, we do not support your browser version!</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <ul>
                        <li>It looks like your using an {this.state.name === 'ie' ? ' old version of Internet Explorer' : 'unsupported browser'}.</li>
                        <li>Please consider using the latest version of Chrome, Safari, Firefox or Microsoft Edge.</li>
                    </ul>
                    <div style={{paddingLeft: 22}}>
                        <input type="checkbox" onChange={this.handleCheckboxChange} checked={this.state.noShowModal}/>
                        <span style={{paddingLeft: 10}}>Do not show me this pop-up again.</span>
                    </div>
                </Modal.Body>
            </Modal>
        );
    }
}
