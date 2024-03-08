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

    @observable geneticDataInput = '';
    @observable clinicalDataInput = '';
    @observable heatmapDataInput = '';
    @observable geneOrderInput = '';
    @observable sampleOrderInput = '';

    constructor(props: IOncoprinterToolProps) {
        super(props);
        makeObservable(this);
        (window as any).oncoprinterTool = this;
    }

    componentDidMount() {
        const postData = getBrowserWindow().clientPostedData;
        if (postData) {
            this.geneticDataInput = postData.genetic;
            this.clinicalDataInput = postData.clinical;
            this.heatmapDataInput = postData.heatmap;
            getBrowserWindow().clientPostedData = null;
        }
    }

    render() {
        // const clinical_data = JSON.stringify([700, 5, 300, 900, 850, 517]);

        const code0 = `import pandas as pd\n`;
        const code1 = `pd.read_csv('data/output.csv')\n`;

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
                        Oncoprinter
                    </h1>{' '}
                    Jupyter Notebook for visualization and advance works.
                    <br />
                    <br />
                    <div style={{ marginTop: 10 }}>
                        <iframe
                            src={`https://gautamsarawagi.github.io/my-custome-jupyterlite/repl/index.html?toolbar=1&kernel=python&code=${encodeURIComponent(
                                final_code
                            )}`}
                            width="100%"
                            height="600px"
                        ></iframe>
                    </div>
                </div>
            </PageLayout>
        );
    }
}
