import * as React from 'react';
import { observer, Observer } from 'mobx-react';
import { Helmet } from 'react-helmet';
import { PageLayout } from '../../../../shared/components/PageLayout/PageLayout';
import OncoprinterStore from './OncoprinterStore';
import Oncoprinter from './Oncoprinter';
import { action, observable, runInAction } from 'mobx';
import { Button, ControlLabel, FormControl, FormGroup } from 'react-bootstrap';
import { Collapse } from 'react-collapse';
import autobind from 'autobind-decorator';
import {
    exampleClinicalData,
    exampleGeneticData,
} from './OncoprinterConstants';
import { MSKTab, MSKTabs } from '../../../../shared/components/MSKTabs/MSKTabs';
import MutualExclusivityTab from '../../../resultsView/mutualExclusivity/MutualExclusivityTab';
import { getDataForSubmission } from './OncoprinterToolUtils';
import {
    ClinicalTrackDataType,
    ONCOPRINTER_CLINICAL_VAL_NA,
} from './OncoprinterClinicalUtils';
import styles from './styles.module.scss';
import { getBrowserWindow } from 'cbioportal-frontend-commons';

export interface IOncoprinterToolProps {}

export enum OncoprinterTab {
    ONCOPRINT = 'oncoprint',
    MUTUAL_EXCLUSIVITY = 'mutualExclusivity',
}

const helpSection = (
    <div className={styles.dataFormatHelp}>
        <div className={styles.dataFormatHelpSection}>
            <h4>Genomic data format</h4>
            Each row of the data can take one of two formats, with tab- or
            space-delimited columns:
            <br />
            <strong>(1)</strong> <code>Sample</code> only (e.g. so that percent
            altered in your data can be properly calculated by including
            unaltered samples).
            <br />
            <strong>(2)</strong> <code>Sample</code>&#9;<code>Gene</code>&#9;
            <code>Alteration (defined below)</code>&#9;
            <code>Type (defined below)</code>
            <br />
            {/*<strong>(3) (MAF format, mutation only)</strong> <code>Sample</code>, <code>Cancer Type</code>, <code>Protein Change</code>, <code>Mutation Type</code>,	<code>Chromosome</code>,
            <code>Start position</code>, <code>End position</code>, <code>Reference allele</code>,	<code>Variant allele</code><br/>
            <br/>*/}
            For rows of type 2, the definition is below:
            <ol>
                <li>
                    <code>Sample</code>: Sample ID
                </li>
                <li>
                    <code>Gene</code>: Gene symbol (or other gene identifier)
                </li>
                <li>
                    <code>Alteration</code>: Definition of the alteration event
                    <ul>
                        <li>
                            Mutation event: amino acid change or any other
                            information about the mutation
                        </li>
                        <li>Fusion event: fusion information</li>
                        <li>
                            Copy number alteration (CNA) - please use one of the
                            four events below:
                            <ul>
                                <li>
                                    <code>AMP</code>: high level amplification
                                </li>
                                <li>
                                    <code>GAIN</code>: low level gain
                                </li>
                                <li>
                                    <code>HETLOSS</code>: shallow deletion
                                </li>
                                <li>
                                    <code>HOMDEL</code>: deep deletion
                                </li>
                            </ul>
                        </li>
                        <li>
                            mRNA expression - please use one of the two events
                            below:
                            <ul>
                                <li>
                                    <code>HIGH</code>: expression high
                                </li>
                                <li>
                                    <code>LOW</code>: expression low
                                </li>
                            </ul>
                        </li>
                        <li>
                            Protein expression - please use one of the two
                            events below:
                            <ul>
                                <li>
                                    <code>HIGH</code>: Protein high
                                </li>
                                <li>
                                    <code>LOW</code>: Protein low
                                </li>
                            </ul>
                        </li>
                    </ul>
                </li>
                <li>
                    <code>Type</code>: Definition of the alteration type. It has
                    to be one of the following.
                    <ul>
                        <li>
                            For a mutation event, please use one of the five
                            mutation types below:
                            <ul>
                                <li>
                                    <code>MISSENSE</code>: a missense mutation
                                </li>
                                <li>
                                    <code>INFRAME</code>: a inframe mutation
                                </li>
                                <li>
                                    <code>TRUNC</code>: a truncation mutation
                                </li>
                                <li>
                                    <code>PROMOTER</code>: a promoter mutation
                                </li>
                                <li>
                                    <code>OTHER</code>: any other kind of
                                    mutation
                                </li>
                            </ul>
                            <br />
                            In addition, mutation types can be augmented with
                            the modifiers{' '}
                            <span style={{ whiteSpace: 'nowrap' }}>
                                <code>_GERMLINE</code> and <code>_DRIVER</code>
                            </span>
                            to indicate that they are, respectively, germline
                            and driver mutations.
                            <br />
                            For example: <code>INFRAME_GERMLINE</code> or{' '}
                            <code>MISSENSE_GERMLINE_DRIVER</code> or{' '}
                            <code>TRUNC_DRIVER</code>.
                            <br />
                        </li>
                        <li>
                            <code>FUSION</code>: a fusion event
                        </li>
                        <li>
                            <code>CNA</code>: a copy number alteration event
                        </li>
                        <li>
                            <code>EXP</code>: a expression event
                        </li>
                        <li>
                            <code>PROT</code>: a protein expression event
                        </li>
                    </ul>
                </li>
            </ol>
        </div>
        <div className={styles.dataFormatHelpBorder} />
        <div className={styles.dataFormatHelpSection}>
            <h4>Clinical data format</h4>
            All rows are tab- or space-delimited.
            <br />
            The first (header) row gives the names of the clinical attributes,
            as well as their data type ({ClinicalTrackDataType.NUMBER},{' '}
            {ClinicalTrackDataType.LOG_NUMBER}, or{' '}
            {ClinicalTrackDataType.STRING}, default is
            {ClinicalTrackDataType.STRING}). Additionally, you can enter a
            /-delimited list of labels to create a stacked-bar-chart track (see
            example data below). An example first row is:
            <br />
            <code>Sample</code>&#9;
            <code>Age({ClinicalTrackDataType.NUMBER})</code>&#9;
            <code>Cancer_Type({ClinicalTrackDataType.STRING})</code>&#9;
            <code>Mutation_Count({ClinicalTrackDataType.LOG_NUMBER})</code>&#9;
            <code>Mutation_Spectrum(C>A/C>G/C>T/T>A/T>C/T>G)</code>
            <br />
            Each following row gives the sample id, then the value for each
            clinical attribute, or the special value{' '}
            {ONCOPRINTER_CLINICAL_VAL_NA} which indicates that there's no data.
            <br />
            Some example data rows would then be:
            <br />
            <code>sample1</code>&#9;<code>30</code>&#9;
            <code>{ONCOPRINTER_CLINICAL_VAL_NA}</code>&#9;<code>1</code>
            &#9;<code>1/8/3/0/9/2</code>
            <br />
            <code>sample2</code>&#9;<code>27</code>&#9;<code>Colorectal</code>
            &#9;<code>100</code>&#9;<code>5/1/4/2/0/3</code>
            <br />
            <code>sample3</code>&#9;<code>{ONCOPRINTER_CLINICAL_VAL_NA}</code>
            &#9;<code>Breast</code>&#9;
            <code>{ONCOPRINTER_CLINICAL_VAL_NA}</code>&#9;
            <code>{ONCOPRINTER_CLINICAL_VAL_NA}</code>
            <br />
        </div>
    </div>
);

@observer
export default class OncoprinterTool extends React.Component<
    IOncoprinterToolProps,
    {}
> {
    private store = new OncoprinterStore();
    private geneticFileInput: HTMLInputElement | null;
    private clinicalFileInput: HTMLInputElement | null;
    @observable private activeTabId: OncoprinterTab = OncoprinterTab.ONCOPRINT;

    @observable dataInputOpened = true;

    // help
    @observable helpOpened = false;

    // input
    @observable geneticDataInput = '';
    @observable clinicalDataInput = '';
    @observable geneOrderInput = '';
    @observable sampleOrderInput = '';

    componentDidMount() {
        // Load posted data, if it exists
        const postData = getBrowserWindow().clientPostedData;
        if (postData) {
            this.geneticDataInput = postData.genetic;
            this.clinicalDataInput = postData.clinical;
            this.doSubmit(this.geneticDataInput, this.clinicalDataInput);
            getBrowserWindow().clientPostedData = null;
        }
    }

    @autobind
    private toggleHelpOpened() {
        this.helpOpened = !this.helpOpened;
    }

    @autobind
    private populateGeneticExampleData() {
        this.geneticDataInput = exampleGeneticData;
    }

    @autobind
    private populateClinicalExampleData() {
        this.clinicalDataInput = exampleClinicalData;
    }

    @autobind
    private onGeneticDataInputChange(e: any) {
        this.geneticDataInput = e.currentTarget.value;
    }

    @autobind
    private onClinicalDataInputChange(e: any) {
        this.clinicalDataInput = e.currentTarget.value;
    }

    @autobind
    private onGeneOrderInputChange(e: any) {
        this.geneOrderInput = e.currentTarget.value;
    }

    @autobind
    private onSampleOrderInputChange(e: any) {
        this.sampleOrderInput = e.currentTarget.value;
    }

    @action private doSubmit(
        geneticDataInput: string,
        clinicalDataInput: string
    ) {
        this.store.setInput(
            geneticDataInput,
            clinicalDataInput,
            this.geneOrderInput,
            this.sampleOrderInput
        );

        if (this.store.parseErrors.length === 0) {
            this.dataInputOpened = false;
        }
    }

    @autobind private geneticFileInputRef(input: HTMLInputElement | null) {
        this.geneticFileInput = input;
    }

    @autobind private clinicalFileInputRef(input: HTMLInputElement | null) {
        this.clinicalFileInput = input;
    }

    @autobind
    private getGeneticDataForSubmission() {
        return getDataForSubmission(
            this.geneticFileInput,
            this.geneticDataInput
        );
    }

    @autobind
    private getClinicalDataForSubmission() {
        return getDataForSubmission(
            this.clinicalFileInput,
            this.clinicalDataInput
        );
    }

    @autobind
    @action
    private async onClickSubmit() {
        const geneticData = await this.getGeneticDataForSubmission();
        const clinicalData = await this.getClinicalDataForSubmission();

        this.doSubmit(geneticData, clinicalData);
    }

    @autobind
    private getHelpSection() {
        return (
            <div style={{ marginBottom: 7 }}>
                <span>
                    Please input{' '}
                    <strong>tab-delimited or space-delimited</strong> data.
                </span>
                <Button
                    style={{ marginLeft: 7 }}
                    bsStyle="primary"
                    bsSize="small"
                    onClick={this.toggleHelpOpened}
                >{`${
                    this.helpOpened ? 'Close' : 'Open'
                } data format help`}</Button>
                <Collapse isOpened={this.helpOpened}>{helpSection}</Collapse>
            </div>
        );
    }

    @autobind
    private getInputSection() {
        return (
            <FormGroup
                style={{ display: this.dataInputOpened ? undefined : 'none' }}
            >
                <div
                    style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                    <div style={{ width: '45%' }}>
                        <ControlLabel style={{ marginBottom: 7 }}>
                            Input genomic alteration data (optional):
                            <Button
                                className="oncoprinterGeneticExampleData"
                                style={{ marginLeft: 7 }}
                                bsStyle="primary"
                                bsSize="small"
                                onClick={this.populateGeneticExampleData}
                            >
                                Load example data
                            </Button>
                        </ControlLabel>
                        <FormControl
                            className="oncoprinterGeneticDataInput"
                            componentClass="textarea"
                            value={this.geneticDataInput}
                            placeholder="Enter data here..."
                            onChange={this.onGeneticDataInputChange}
                            style={{ height: 200, width: '100%' }}
                        />
                        <ControlLabel>or input data from file:</ControlLabel>
                        <input ref={this.geneticFileInputRef} type="file" />
                    </div>
                    <div style={{ width: '45%' }}>
                        <ControlLabel style={{ marginBottom: 7 }}>
                            Input clinical data (optional):
                            <Button
                                className="oncoprinterClinicalExampleData"
                                style={{ marginLeft: 7 }}
                                bsStyle="primary"
                                bsSize="small"
                                onClick={this.populateClinicalExampleData}
                            >
                                Load example data
                            </Button>
                        </ControlLabel>
                        <FormControl
                            className="oncoprinterClinicalDataInput"
                            componentClass="textarea"
                            value={this.clinicalDataInput}
                            placeholder="Enter data here..."
                            onChange={this.onClinicalDataInputChange}
                            style={{ height: 200, width: '100%' }}
                        />
                        <ControlLabel>or input data from file:</ControlLabel>
                        <input ref={this.clinicalFileInputRef} type="file" />
                    </div>
                </div>
                <br />
                <ControlLabel>
                    Please define the order of genes (optional):
                </ControlLabel>
                <FormControl
                    className="oncoprinterGenesInput"
                    componentClass="textarea"
                    value={this.geneOrderInput}
                    placeholder="Enter genes here, comma- or whitespace-delimited..."
                    onChange={this.onGeneOrderInputChange}
                    style={{ height: 35, width: 475 }}
                />
                <br />
                <ControlLabel>
                    Please define the order of samples (optional):
                </ControlLabel>
                <FormControl
                    className="oncoprinterSamplesInput"
                    componentClass="textarea"
                    value={this.sampleOrderInput}
                    placeholder="Enter samples here, comma- or whitespace-delimited..."
                    onChange={this.onSampleOrderInputChange}
                    style={{ height: 35, width: 475 }}
                />
                <br />
                <Button
                    className="oncoprinterSubmit"
                    bsSize="large"
                    bsStyle="primary"
                    disabled={
                        this.geneticDataInput.trim().length === 0 &&
                        this.clinicalDataInput.trim().length === 0
                    }
                    onClick={this.onClickSubmit}
                    style={{ marginBottom: 20 }}
                >
                    Submit
                </Button>
                {this.store.parseErrors.length > 0 && (
                    <div
                        className="alert alert-danger"
                        style={{ marginTop: 5, whiteSpace: 'pre-wrap' }}
                    >
                        {this.store.parseErrors.map(err => (
                            <div>{err}</div>
                        ))}
                    </div>
                )}
            </FormGroup>
        );
    }

    render() {
        const numCells =
            this.store.hugoGeneSymbols.length * this.store.sampleIds.length;
        return (
            <PageLayout className={'whiteBackground staticPage'}>
                <Helmet>
                    <title>
                        {'cBioPortal for Cancer Genomics::Oncoprinter'}
                    </title>
                </Helmet>
                <div className="cbioportal-frontend">
                    <h1 style={{ display: 'inline', marginRight: 10 }}>
                        Oncoprinter
                    </h1>{' '}
                    Generate Oncoprints and perform mutual exclusivity analysis
                    from your own data.
                    <br />
                    <br />
                    <Observer>{this.getHelpSection}</Observer>
                    <Observer>{this.getInputSection}</Observer>
                    {!this.dataInputOpened && (
                        <button
                            className="btn btn-primary btn-lg oncoprinterModifyInput"
                            style={{
                                paddingLeft: 50,
                                paddingRight: 50,
                                marginBottom: 15,
                            }}
                            onClick={() => {
                                this.dataInputOpened = true;
                            }}
                        >
                            Modify Input
                        </button>
                    )}
                    <div
                        style={{
                            display:
                                this.store.hasData() &&
                                !this.store.parseErrors.length
                                    ? 'block'
                                    : 'none',
                        }}
                    >
                        <MSKTabs
                            activeTabId={this.activeTabId}
                            unmountOnHide={false}
                            onTabClick={(id: string) => {
                                this.activeTabId = id as OncoprinterTab;
                            }}
                            className="mainTabs"
                        >
                            <MSKTab
                                key={0}
                                id={OncoprinterTab.ONCOPRINT}
                                linkText="Oncoprint"
                            >
                                {numCells > 100000 && (
                                    <div className="alert alert-warning">
                                        Warning: Because your inputted data is
                                        very large, the Oncoprinter may be slow,
                                        and downloaded PDF, SVG, and PNG may be
                                        huge and unresponsive. We recommend
                                        plotting data for fewer genes at a time.
                                    </div>
                                )}
                                <div style={{ marginTop: 10 }}>
                                    <Oncoprinter
                                        divId="oncoprinter"
                                        store={this.store}
                                    />
                                </div>
                            </MSKTab>
                            <MSKTab
                                key={1}
                                id={OncoprinterTab.MUTUAL_EXCLUSIVITY}
                                linkText="Mutual Exclusivity"
                            >
                                <MutualExclusivityTab
                                    isSampleAlteredMap={
                                        this.store.isSampleAlteredMap
                                    }
                                />
                            </MSKTab>
                        </MSKTabs>
                    </div>
                </div>
            </PageLayout>
        );
    }
}
