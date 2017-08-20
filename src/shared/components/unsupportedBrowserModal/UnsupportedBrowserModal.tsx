import * as React from 'react';
import { Modal } from 'react-bootstrap';
import browser from 'detect-browser';


interface IBrowserState {
    show: boolean;
    name: string;
    version: string;
}

export default class UnsupportedBrowserModal extends React.Component<{}, IBrowserState> {

  constructor() {
      super();

      if (!browser)  {
          this.state = {
              name: "Unsupported",
              show: true,
              version: ""
          };
      } else {
          this.state = {
              name: browser.name,
              show: false,
               version: browser.version
          };
      }
  }

  componentDidMount() {
      this.handleUnsupportedBrowsers(this.state.name, this.state.version);
  }

  handleUnsupportedBrowsers(name:string, version: string) {
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
              this.setState({show: false});
              window.sessionStorage.browserError = true;
          }
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
                       <li>It looks like your using an {this.state.name === 'ie' ? ' old version of Internet Explorer' : 'unsupported browser'}.</li>
                       <li>Please consider using IE11, Chrome, Safari, or Firefox.</li>
                   </ul>
               </Modal.Body>
          </Modal>
        );
  }
}
