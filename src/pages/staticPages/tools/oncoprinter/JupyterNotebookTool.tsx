import * as React from 'react';
import { observer } from 'mobx-react';
import { Helmet } from 'react-helmet';
import { PageLayout } from '../../../../shared/components/PageLayout/PageLayout';
import { observable, makeObservable, action } from 'mobx';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { folder } from 'jszip';

export interface IOncoprinterToolProps {}

@observer
export default class JupyterNotebookTool extends React.Component<
    IOncoprinterToolProps,
    {}
> {
    private fileDetails = getBrowserWindow().clientPostedData;

    private jupyterIframe: Window | null = null;

    @observable private isLoading: boolean = true;

    @observable private folder_used: string =
        getBrowserWindow()?.clientPostedData?.folderName || '';
    @observable private file_to_execute: string =
        getBrowserWindow()?.clientPostedData?.filename || '';

    private notebookContentToExecute = {
        nbformat: 4,
        nbformat_minor: 4,
        metadata: {},
        cells: [
            {
                cell_type: 'code',
                execution_count: 1,
                source: [
                    'import pandas as pd\n',
                    'import numpy as np\n',
                    'from sklearn.cluster import KMeans\n',
                    'from sklearn.preprocessing import MinMaxScaler\n',
                    'import matplotlib.pyplot as plt\n',
                    'from mpl_toolkits.mplot3d import Axes3D\n',
                ],
            },
            {
                cell_type: 'code',
                execution_count: 2,
                source: [
                    `df = pd.read_csv("${this.file_to_execute}")\n`,
                    'numerical_columns = ["startPosition", "endPosition", "proteinPosStart", "proteinPosEnd"]\n',
                    'X = df[numerical_columns]\n',
                    'X = X.fillna(X.mean())\n',
                ],
            },
            {
                cell_type: 'code',
                execution_count: 3,
                source: [
                    'scaler = MinMaxScaler()\n',
                    'X_normalized = scaler.fit_transform(X)\n',
                    'n_clusters = 3  # You can adjust this number\n',
                    'kmeans = KMeans(n_clusters=n_clusters, n_init="auto", random_state=42)\n',
                    'df["Cluster"] = kmeans.fit_predict(X_normalized)\n',
                ],
            },
            {
                cell_type: 'code',
                execution_count: 4,
                source: [
                    'fig = plt.figure(figsize=(12, 10))\n',
                    'ax = fig.add_subplot(111, projection="3d")\n',
                    'colors = ["r", "g", "b"]\n',
                    'for i in range(n_clusters):\n',
                    '    cluster_points = X_normalized[df["Cluster"] == i]\n',
                    '    ax.scatter(cluster_points[:, 0], cluster_points[:, 1], cluster_points[:, 2],\n',
                    '               c=colors[i], label=f"Cluster {i}", alpha=0.7)\n',
                    'ax.set_xlabel(f"{numerical_columns[0]} (normalized)")\n',
                    'ax.set_ylabel(f"{numerical_columns[1]} (normalized)")\n',
                    'ax.set_zlabel(f"{numerical_columns[2]} (normalized)")\n',
                    'ax.legend()\n',
                    'plt.title("3D Scatter Plot of Normalized Mutation Data")\n',
                ],
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
        console.table('File Saved SuccessFully');
        if (
            this.fileDetails &&
            this.fileDetails.fileContent &&
            this.jupyterIframe
        ) {
            this.jupyterIframe.postMessage(
                {
                    type: 'from-host-to-iframe-for-file-saving',
                    filename: this.fileDetails.filename,
                    fileContent: this.fileDetails.fileContent,
                    folderName: this.fileDetails.folderName,
                },
                '*'
            );
            this.file_to_execute = this.fileDetails.filename;
            this.folder_used = this.fileDetails.folderName;
        }
    };

    openDemoExecution = () => {
        console.log('Execution taking place');
        this.jupyterIframe?.postMessage(
            {
                type: 'from-host-to-iframe-for-file-execution',
                folderName: this.folder_used,
                notebookContent: this.notebookContentToExecute,
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
        return (
            <PageLayout className={'whiteBackground staticPage'}>
                <Helmet>
                    <title>
                        {'cBioPortal for Cancer Genomics::JupyterNotebook'}
                    </title>
                </Helmet>
                <div className="cbioportal-frontend">
                    {/* <h1 style={{ display: 'inline', marginRight: 10 }}>
                        {' '}
                        {this.isLoading
                            ? 'Syncing the Contents....'
                            : 'Contents Synced with the Latest Data'}
                    </h1>{' '} */}
                    <div
                        style={{
                            marginTop: 10,
                            width: '100%',
                            height: '100vh',
                        }}
                    >
                        <iframe
                            id="jupyterIframe"
                            src={`https://rad-haupia-36408a.netlify.app/lite/lab/index.html`}
                            // src={`http://127.0.0.1:8000/lite/lab/index.html`}
                            width="100%"
                            height="100%"
                            style={{
                                border: 'none',
                                boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.1)',
                                borderRadius: '8px',
                            }}
                        ></iframe>
                    </div>
                </div>
            </PageLayout>
        );
    }
}
