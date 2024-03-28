import * as React from 'react';
import { observer } from 'mobx-react';
import { Helmet } from 'react-helmet';
import { PageLayout } from '../../../../shared/components/PageLayout/PageLayout';
import OncoprinterStore from './OncoprinterStore';
import { observable, makeObservable } from 'mobx';
import { getBrowserWindow } from 'cbioportal-frontend-commons';

export interface IOncoprinterToolProps {}

@observer
export default class JupyterNotebookTool extends React.Component<
    IOncoprinterToolProps,
    {}
> {
    private store = new OncoprinterStore();
    private jupyterIframe: Window | null = null;

    constructor(props: IOncoprinterToolProps) {
        super(props);
        makeObservable(this);
        (window as any).oncoprinterTool = this;
    }

    componentDidMount() {
        const iframe = document.getElementById(
            'jupyterIframe'
        ) as HTMLIFrameElement;
        this.jupyterIframe = iframe.contentWindow;

        window.addEventListener('message', this.handleMessageFromIframe);
        window.addEventListener('message', event => {
            if (
                event.data.type === 'file-communication' &&
                event.data.message ===
                    'JupyterLab extension jupyterlab-iframe-bridge-example is activated!'
            ) {
                this.sendFileToJupyter();
            }
        });
    }

    componentWillUnmount() {
        window.removeEventListener('message', this.handleMessageFromIframe);
    }

    sendFileToJupyter = () => {
        const data = getBrowserWindow().clientPostedData;
        if (data && data.data && this.jupyterIframe) {
            this.jupyterIframe.postMessage(
                {
                    type: 'from-host-to-iframe-for-file',
                    filePath: 'output.tsv',
                    fileContent: data.data,
                },
                '*'
            );
        }
    };

    handleMessageFromIframe = (event: MessageEvent) => {
        if (event.data.type === 'from-iframe-to-host-for-file') {
            const messageElement = document.getElementById('message');
            if (messageElement) {
                messageElement.innerText = event.data.message;
            }
        }
    };

    render() {
        const code0 = `import pandas as pd\n`;
        const code1 = `pd.read_csv('output.csv')\n`;
        const final_code = [code0, code1].join('\n');

        return (
            <PageLayout className={'whiteBackground staticPage'}>
                <Helmet>
                    <title>
                        {'cBioPortal for Cancer Genomics::JupyterNotebook'}
                    </title>
                </Helmet>
                <div className="cbioportal-frontend">
                    <h1 style={{ display: 'inline', marginRight: 10 }}>
                        {' '}
                        Oncoprinter{' '}
                    </h1>{' '}
                    <div id="message"></div>
                    <div style={{ marginTop: 10 }}>
                        <iframe
                            id="jupyterIframe"
                            src={`https://master--regal-malabi-ea7e9f.netlify.app/lite/lab/index.html`}
                            width="100%"
                            height="900px"
                        ></iframe>
                    </div>
                </div>
            </PageLayout>
        );
    }
}
