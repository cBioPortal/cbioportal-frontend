import * as React from "react";
import {observer, Observer} from "mobx-react";
import {Helmet} from "react-helmet";
import {PageLayout} from "../../../../shared/components/PageLayout/PageLayout";
import OncoprinterStore from "./OncoprinterStore";
import Oncoprinter from "./Oncoprinter";
import {action, computed, observable} from "mobx";
import {Button,FormGroup, ControlLabel, FormControl} from "react-bootstrap";
import Collapse from "react-collapse";
import autobind from "autobind-decorator";
import {exampleData} from "./OncoprinterConstants";
import $ from "jquery";
import {SyntheticEvent} from "react";
import onMobxPromise from "../../../../shared/lib/onMobxPromise";
import {WindowWidthBox} from "../../../../shared/components/WindowWidthBox/WindowWidthBox";

export interface IOncoprinterToolProps {
}

const helpSection = (
    <div style={{backgroundColor:"#eee", padding:13, borderRadius: 11, marginTop:10}}>
        <h4>Data format</h4>
        Each row of the data can take one of two formats, with tab-delimited columns:<br/>
        <strong>(1)</strong> <code>Sample</code> only (e.g. so that percent altered in your data can be properly calculated by including unaltered samples).<br/>
        <strong>(2)</strong> <code>Sample</code>, <code>Gene</code>, <code>Alteration (defined below)</code>, <code>Type (defined below)</code>.<br/>
        {/*<strong>(3) (MAF format, mutation only)</strong> <code>Sample</code>, <code>Cancer Type</code>, <code>Protein Change</code>, <code>Mutation Type</code>,	<code>Chromosome</code>,
        <code>Start position</code>, <code>End position</code>, <code>Reference allele</code>,	<code>Variant allele</code><br/>
        <br/>*/}
        For rows of type 2, the definition is below:
        <ol>
            <li><code>Sample</code>: Sample ID</li>
            <li><code>Gene</code>: Gene symbol (or other gene identifier)</li>
            <li><code>Alteration</code>: Definition of the alteration event
                <ul>
                    <li>Mutation event: amino acid change or any other information about the mutation</li>
                    <li>Fusion event: fusion information</li>
                    <li>Copy number alteration (CNA) - please use one of the four events below:
                        <ul>
                            <li><code>AMP</code>: high level amplification</li>
                            <li><code>GAIN</code>: low level gain</li>
                            <li><code>HETLOSS</code>: shallow deletion</li>
                            <li><code>HOMDEL</code>: deep deletion</li>
                        </ul>
                    </li>
                    <li>mRNA expression - please use one of the two events below:
                        <ul>
                            <li><code>UP</code>: expression up</li>
                            <li><code>DOWN</code>: expression down</li>
                        </ul>
                    </li>
                    <li>Protein expression - please use one of the two events below:
                        <ul>
                            <li><code>UP</code>: Protein Upregulation</li>
                            <li><code>DOWN</code>: Protein Downregulation</li>
                        </ul>
                    </li>
                </ul>
            </li>
            <li><code>Type</code>: Definition of the alteration type. It has to be one of the following.
                <ul>
                    <li>For a mutation event, please use one of the five mutation types below:
                        <ul>
                            <li><code>MISSENSE</code>: a missense mutation</li>
                            <li><code>INFRAME</code>: a inframe mutation</li>
                            <li><code>TRUNC</code>: a truncation mutation</li>
                            <li><code>PROMOTER</code>: a promoter mutation</li>
                            <li><code>OTHER</code>: any other kind of mutation</li>
                        </ul>
                    </li>
                    <li><code>FUSION</code>: a fusion event
                    </li>
                    <li><code>CNA</code>: a copy number alteration event
                    </li>
                    <li><code>EXP</code>: a expression event
                    </li>
                    <li><code>PROT</code>: a protein expression event
                    </li>
                </ul>
            </li>
        </ol>
    </div>
);

@observer
export default class OncoprinterTool extends React.Component<IOncoprinterToolProps, {}> {
    private store = new OncoprinterStore();
    private oncoprinter:Oncoprinter|null;
    private filesInput:HTMLInputElement|null;

    @autobind
    private oncoprinterRef(o:Oncoprinter|null) {
        this.oncoprinter = o;
    }

    // help
    @observable helpOpened = false;

    // input
    @observable dataInput = "";
    @observable geneOrderInput = "";
    @observable sampleOrderInput = "";

    @computed get inputError() {
        /*if (this.store.parsedInputLines.isError) {
            return this.store.parsedInputLines.error;
        } else {*/
            return null;
        //}
    }

    @autobind
    private toggleHelpOpened() {
        this.helpOpened = !this.helpOpened;
    }

    @autobind
    private populateExampleData() {
        this.dataInput = exampleData;
    }

    @autobind
    private onDataInputChange(e: any) {
        this.dataInput = e.currentTarget.value;
    }

    @autobind
    private onGeneOrderInputChange(e: any) {
        this.geneOrderInput = e.currentTarget.value;
    }

    @autobind
    private onSampleOrderInputChange(e: any) {
        this.sampleOrderInput = e.currentTarget.value;
    }

    @action private doSubmit(dataInput:string) {
        this.store.setInput(dataInput, this.geneOrderInput, this.sampleOrderInput);

        onMobxPromise(this.store.alteredSampleIds,
            (alteredUids:string[])=>{
                this.oncoprinter && this.oncoprinter.oncoprint.setHorzZoomToFit(alteredUids);
            });

    }

    @autobind private filesInputRef(input:HTMLInputElement|null) {
        this.filesInput = input;
    }

    @autobind
    @action private onClickSubmit() {
        if (this.filesInput && this.filesInput.files && this.filesInput.files.length > 0) {
            // get data from file upload
            const fileReader = new FileReader();
            fileReader.onload = ()=>{
                const data = fileReader.result;
                this.doSubmit(data);
            };
            fileReader.readAsText(this.filesInput.files[0]);
        } else {
            // get data from text input
            this.doSubmit(this.dataInput);
        }
    }

    @autobind
    private getHelpSection() {
        return (
            <div>
                <span>Please input <strong>tab-delimited</strong> genomic alteration events.</span>
                <Button style={{marginLeft:7}} bsStyle="primary" bsSize="small" onClick={this.toggleHelpOpened}>{`${this.helpOpened ? "Close" : "Open"} data format help`}</Button>
                <Collapse isOpened={this.helpOpened}>
                    {helpSection}
                </Collapse>
            </div>
        );
    }

    @autobind
    private getInputSection() {
        return (
            <FormGroup>
                <ControlLabel>Input genomic alteration data:<Button className="oncoprinterExampleData" style={{marginLeft:7}} bsStyle="primary" bsSize="small" onClick={this.populateExampleData}>Load example data</Button></ControlLabel>
                <FormControl
                    className="oncoprinterDataInput"
                    componentClass="textarea"
                    value={this.dataInput}
                    placeholder="Enter data here..."
                    onChange={this.onDataInputChange}
                    style={{"height":500, width:"100%"}}
                />
                <ControlLabel>or input data from file:</ControlLabel>
                <input ref={this.filesInputRef} type="file"/>
                <br/>
                <ControlLabel>Please define the order of genes (optional):</ControlLabel>
                <FormControl
                    className="oncoprinterGenesInput"
                    componentClass="textarea"
                    value={this.geneOrderInput}
                    placeholder="Enter genes here, comma- or whitespace-delimited..."
                    onChange={this.onGeneOrderInputChange}
                    style={{"height":35, width:475}}
                />
                <br/>
                <ControlLabel>Please define the order of samples (optional):</ControlLabel>
                <FormControl
                    className="oncoprinterSamplesInput"
                    componentClass="textarea"
                    value={this.sampleOrderInput}
                    placeholder="Enter samples here, comma- or whitespace-delimited..."
                    onChange={this.onSampleOrderInputChange}
                    style={{"height":35, width:475}}
                />
                <br/>
                <Button className="oncoprinterSubmit" bsStyle="default" onClick={this.onClickSubmit} disabled={!!this.inputError}>Submit</Button>
            </FormGroup>
        );
    }

    render() {
        return (
            <PageLayout className={'whiteBackground staticPage'}>
                <Helmet>
                    <title>{'cBioPortal for Cancer Genomics::Oncoprinter'}</title>
                </Helmet>
                <WindowWidthBox offset={60}>
                    <div className="cbioportal-frontend">
                        <h1 style={{display: "inline"}}>Oncoprinter</h1> generates Oncoprints from your own data.
                        <br/><br/>
                        <Observer>
                            {this.getHelpSection}
                        </Observer>
                        <Observer>
                            {this.getInputSection}
                        </Observer>
                        <Oncoprinter
                            ref={this.oncoprinterRef}
                            divId="oncoprinter"
                            store={this.store}
                        />
                    </div>
                </WindowWidthBox>
            </PageLayout>
        );
    }
}