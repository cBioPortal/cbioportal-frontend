import * as React from 'react';
import { observer } from 'mobx-react';
import { Helmet } from 'react-helmet';
import { PageLayout } from '../../../../shared/components/PageLayout/PageLayout';
import { observable, makeObservable, action, computed } from 'mobx';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import ProgressIndicator, {
    IProgressIndicatorItem,
} from 'shared/components/progressIndicator/ProgressIndicator';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { createNotebookContent } from './notebookContent';

export interface IOncoprinterToolProps {}

type FileDetailProps = {
    fileContent: string;
    filename: string;
    folderName: string;
};

@observer
export default class JupyterNotebookTool extends React.Component<
    IOncoprinterToolProps,
    {}
> {
    private fileDetails: FileDetailProps | null = null;
    private jupyterIframe: Window | null = null;
    private timeShownInterval: ReturnType<typeof setInterval> | undefined;

    @observable private isActivated: boolean = false;
    @observable private timeShown: number = 0;

    constructor(props: IOncoprinterToolProps) {
        super(props);
        makeObservable(this);
        (window as any).oncoprinterTool = this;
    }

    componentDidMount() {
        const incomingData = localStorage.getItem('jupyterData');

        console.log({ incomingData });

        localStorage.removeItem('jupyterData');
        if (incomingData) {
            this.fileDetails = JSON.parse(incomingData);
        }

        const iframe = document.getElementById(
            'jupyterIframe'
        ) as HTMLIFrameElement;
        this.jupyterIframe = iframe.contentWindow;
        window.addEventListener('message', this.handleMessageFromIframe);

        this.timeShownInterval = setInterval(() => {
            if (!this.isActivated) {
                this.timeShown += 1;
            }
        }, 1000);
    }

    componentWillUnmount() {
        window.removeEventListener('message', this.handleMessageFromIframe);
        if (this.timeShownInterval) {
            clearInterval(this.timeShownInterval);
        }
    }

    @action
    sendFileToJupyter = () => {
        console.log('checking it while sending the file', this.fileDetails);
        if (this.fileDetails && this.jupyterIframe) {
            this.jupyterIframe.postMessage(
                {
                    type: 'from-host-to-iframe-for-file-saving',
                    filename: this.fileDetails.filename,
                    fileContent: this.fileDetails.fileContent,
                    folderName: this.fileDetails.folderName,
                },
                '*'
            );
        }
    };

    openDemoExecution = () => {
        const notebookContent = createNotebookContent({
            filename: this.fileDetails?.filename,
        });
        this.jupyterIframe?.postMessage(
            {
                type: 'from-host-to-iframe-for-file-execution',
                folderName: this.fileDetails?.folderName,
                notebookContent: notebookContent,
            },
            '*'
        );
    };

    @action
    handleMessageFromIframe = (event: MessageEvent) => {
        switch (event.data.type) {
            case 'file-communication':
                if (
                    event.data.message ===
                    'JupyterLab extension jupyterlab-iframe-bridge-example is activated!'
                ) {
                    this.isActivated = true;
                    this.sendFileToJupyter();
                }
                break;
            case 'from-iframe-to-host-about-file-status':
                if (event.data.message === 'File saved successfully') {
                    this.openDemoExecution();
                }
                break;

            case 'from-iframe-to-host-about-file-execution':
                console.log('Final Execution Message : ', event.data.message);
                break;
            default:
                console.warn('Unhandled message type:', event.data.type);
        }
    };

    @computed get progressItems(): IProgressIndicatorItem[] {
        const ret: IProgressIndicatorItem[] = [];

        if (!this.isActivated) {
            ret.push({
                label: 'Initializing JupyterLab extension...',
                promises: [],
                hideIcon: true,
                style: { fontWeight: 'bold' },
            });

            if (this.timeShown > 2) {
                ret.push({
                    label: ' - this can take several seconds',
                    promises: [],
                    hideIcon: true,
                });
            }
        } else {
            ret.push({
                label: 'JupyterLab extension is activated',
                promises: [],
                style: { fontWeight: 'bold' },
            });
        }

        ret.push({
            label: 'Rendering',
        });

        return ret as IProgressIndicatorItem[];
    }

    render() {
        return (
            <PageLayout className={'whiteBackground staticPage'}>
                <Helmet>
                    <title>
                        {'cBioPortal for Cancer Genomics::JupyterNotebook'}
                    </title>
                </Helmet>
                <div className="cbioportal-frontend">
                    <LoadingIndicator
                        isLoading={!this.isActivated}
                        size={'big'}
                        centerRelativeToContainer={false}
                        center={true}
                        className="jupyterNotebookLoadingIndicator"
                        noFade={true}
                    >
                        <ProgressIndicator
                            getItems={() => this.progressItems}
                            show={!this.isActivated}
                            sequential={true}
                        />
                    </LoadingIndicator>

                    <div
                        style={{
                            marginTop: 10,
                            width: '100%',
                            height: '100vh',
                        }}
                    >
                        <iframe
                            id="jupyterIframe"
                            // src={`https://rad-haupia-36408a.netlify.app/lite/lab/index.html`}
                            // src={`http://127.0.0.1:8000/lite/lab/index.html`}
                            // src={'http://localhost:8080/lite/lab/index.html'}
                            src={
                                'https://shimmering-kelpie-dfb478.netlify.app/lite/lab/index.html'
                            }
                            width="100%"
                            height="100%"
                            style={{
                                border: 'none',
                                boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
                                borderRadius: '8px',
                            }}
                            allow="cross-origin-isolated"
                        ></iframe>
                    </div>
                </div>
            </PageLayout>
        );
    }
}
