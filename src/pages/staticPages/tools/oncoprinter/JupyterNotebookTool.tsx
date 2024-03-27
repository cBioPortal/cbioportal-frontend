import * as React from 'react';
import { observer } from 'mobx-react';
import { Helmet } from 'react-helmet';
import { PageLayout } from '../../../../shared/components/PageLayout/PageLayout';
import OncoprinterStore from './OncoprinterStore';
import { observable, makeObservable, action } from 'mobx';
import { getBrowserWindow } from 'cbioportal-frontend-commons';

export interface IOncoprinterToolProps {}

@observer
export default class JupyterNotebookTool extends React.Component<
    IOncoprinterToolProps,
    {}
> {
    private store = new OncoprinterStore();
    private jupyterIframe: Window | null = null;

    @observable private isLoading: boolean = true;
    @observable private main_data_file: string =
        getBrowserWindow()?.clientPostedData?.fileName || '';

    private notebookContentToExecute = {
        metadata: {
            nbformat: 4,
            nbformat_minor: 4,
        },
        cells: [
            {
                cell_type: 'code',
                execution_count: 1,
                source: [
                    'import pandas as pd\n',
                    `data = pd.read_csv('${this.main_data_file}')\n`,
                    'data.head()',
                ],
                outputs: [],
            },
        ],
    };

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

    @action
    sendFileToJupyter = () => {
        const fileDetails = getBrowserWindow().clientPostedData;
        if (fileDetails && fileDetails.fileContent && this.jupyterIframe) {
            this.jupyterIframe.postMessage(
                {
                    type: 'from-host-to-iframe-for-file-saving',
                    filePath: fileDetails.fileName,
                    fileContent: fileDetails.fileContent,
                },
                '*'
            );
            this.main_data_file = fileDetails.fileName;
        }
    };

    openDemoExecution = () => {
        this.jupyterIframe?.postMessage(
            {
                type: 'from-host-to-iframe-for-file-execution',
                filePath: 'main.ipynb',
                fileContent: JSON.stringify(this.notebookContentToExecute),
            },
            '*'
        );
    };

    @action
    handleMessageFromIframe = (event: MessageEvent) => {
        if (event.data.type === 'from-iframe-to-host-about-file-status') {
            if (event.data.message === 'File saved successfully') {
                this.openDemoExecution();
                setTimeout(() => {
                    this.isLoading = false;
                }, 10000);
            }
        }

        if (event.data.type === 'from-iframe-to-host-about-file-execution') {
            console.log('Id for the execution : ', event.data.message);
        }
    };

    render() {
        console.log('main file: ', this.main_data_file);
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
                        {this.isLoading
                            ? 'Syncing the Contents....'
                            : 'Contents Synced with the Latest Data'}
                    </h1>{' '}
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
