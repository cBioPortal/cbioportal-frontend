import * as React from 'react';
import { observer, Observer } from 'mobx-react';
import { Helmet } from 'react-helmet';
import { PageLayout } from '../../../../shared/components/PageLayout/PageLayout';
import OncoprinterStore from './OncoprinterStore';
import Oncoprinter from './Oncoprinter';
import { action, observable, runInAction, makeObservable } from 'mobx';
import { Button, ControlLabel, FormControl, FormGroup } from 'react-bootstrap';
import { Collapse } from 'react-collapse';
import autobind from 'autobind-decorator';
import {
    exampleClinicalData,
    exampleGeneticData,
    exampleHeatmapData,
} from './OncoprinterConstants';
import { MSKTab, MSKTabs } from '../../../../shared/components/MSKTabs/MSKTabs';
import MutualExclusivityTab from '../../../resultsView/mutualExclusivity/MutualExclusivityTab';
import { getDataForSubmission } from './OncoprinterToolUtils';
import {
    ClinicalTrackDataType,
    HeatmapTrackDataType,
    ONCOPRINTER_VAL_NA,
} from './OncoprinterClinicalAndHeatmapUtils';
import styles from './styles.module.scss';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import {
    ClinicalFormatHelp,
    GenomicFormatHelp,
    HeatmapFormatHelp,
} from './OncoprinterHelp';
import { buildCBioLink } from 'shared/api/urls';
import { parseUrl } from 'query-string';

export interface IOncoprinterToolProps {}

export enum OncoprinterTab {
    ONCOPRINT = 'oncoprint',
    MUTUAL_EXCLUSIVITY = 'mutualExclusivity',
}

@observer
export default class OncoprinterTool extends React.Component<
    IOncoprinterToolProps,
    {}
> {
    private store = new OncoprinterStore();
    private geneticFileInput: HTMLInputElement | null;
    private clinicalFileInput: HTMLInputElement | null;
    private heatmapFileInput: HTMLInputElement | null;
    @observable private activeTabId: OncoprinterTab = OncoprinterTab.ONCOPRINT;

    @observable dataInputOpened = true;
    @observable geneticHelpOpened = false;
    @observable clinicalHelpOpened = false;
    @observable heatmapHelpOpened = false;

    // help
    @observable helpOpened = false;

    // input
    @observable geneticDataInput = '';
    @observable clinicalDataInput = '';
    @observable heatmapDataInput = '';
    @observable geneOrderInput = '';
    @observable sampleOrderInput = '';

    constructor(props: IOncoprinterToolProps) {
        super(props);

        makeObservable(this);

        const data = parseUrl(getBrowserWindow().location.href).query.data;
        //@ts-ignore
        if (getBrowserWindow().parent && getBrowserWindow().parent[data]) {
            debugger;

            getBrowserWindow().clientPostedData = JSON.parse(
                //@ts-ignore
                getBrowserWindow().parent[data]
            );
        }

        (window as any).oncoprinterTool = this;
    }

    componentDidMount() {
        // Load posted data, if it exists
        const postData = getBrowserWindow().parent.shmoo;

        if (postData) {
            this.geneticDataInput = postData.genetic.replace(/\/\n/g, '\n');
            this.clinicalDataInput = postData.clinical.replace(/\/\n/g, '\n');
            this.heatmapDataInput = postData.heatmap.replace(/\/\n/g, '\n');

            //console.log(this.geneticDataInput);
            //console.log(this.clinicalDataInput);
            this.geneticDataInput = `TCGA-AA-3532  KRAS  G12D  MISSENSE  KRAS
            TCGA-AA-3673  KRAS  G12D  MISSENSE  KRAS
            TCGA-AA-3842  KRAS  G13D  MISSENSE  KRAS
            TCGA-AA-3851  KRAS  G12D  MISSENSE  KRAS
            TCGA-AA-3975  KRAS  R68S  MISSENSE  KRAS
            TCGA-AA-3979  KRAS  A146T  MISSENSE  KRAS
            TCGA-AA-A01G  KRAS  K117N  MISSENSE  KRAS
            TCGA-AA-A01K  KRAS  G12V  MISSENSE  KRAS
            TCGA-AA-A02W  KRAS  G12C  MISSENSE  KRAS
            TCGA-AG-3726  KRAS  G12V  MISSENSE  KRAS
            TCGA-AG-3887  KRAS  G12D  MISSENSE  KRAS
            TCGA-AG-3999  KRAS  G12S  MISSENSE  KRAS
            TCGA-AG-3999  KRAS  AMP  CNA  KRAS
            TCGA-AG-4005  KRAS  G12V  MISSENSE  KRAS
            TCGA-AG-4008  KRAS  G12F  MISSENSE  KRAS
            TCGA-AG-A00H  KRAS  A146T  MISSENSE  KRAS
            TCGA-AG-A014  KRAS  G12S  MISSENSE  KRAS
            TCGA-A6-2683  KRAS  G12V  MISSENSE  KRAS
            TCGA-AA-3521  KRAS  Q61L  MISSENSE  KRAS
            TCGA-AA-3530  KRAS  G12V  MISSENSE  KRAS
            TCGA-AA-3560  KRAS  G12D  MISSENSE  KRAS
            TCGA-AA-3561  KRAS  G12D  MISSENSE  KRAS
            TCGA-AA-3814  KRAS  G12S  MISSENSE  KRAS
            TCGA-AA-3848  KRAS  G12D  MISSENSE  KRAS
            TCGA-AA-A00Q  KRAS  G12D  MISSENSE  KRAS
            TCGA-AA-A01F  KRAS  G12V  MISSENSE  KRAS
            TCGA-AG-3581  KRAS  G13D  MISSENSE  KRAS
            TCGA-AG-3583  KRAS  G12D  MISSENSE  KRAS
            TCGA-AG-3602  KRAS  G12D  MISSENSE  KRAS
            TCGA-AG-3611  KRAS  A146V  MISSENSE  KRAS
            TCGA-AG-3727  KRAS  G13D  MISSENSE  KRAS
            TCGA-AG-3896  KRAS  G12C  MISSENSE  KRAS
            TCGA-AG-3909  KRAS  A146T  MISSENSE  KRAS
            TCGA-AG-A008  KRAS  G12V  MISSENSE  KRAS
            TCGA-AG-A00C  KRAS  G12V  MISSENSE  KRAS
            TCGA-AG-A015  KRAS  G12D  MISSENSE  KRAS
            TCGA-AG-A02X  KRAS  Q61L  MISSENSE  KRAS
            TCGA-AG-A032  KRAS  G12C  MISSENSE  KRAS
            TCGA-AA-3680  KRAS  G13D  MISSENSE  KRAS
            TCGA-AA-3994  KRAS  G12D  MISSENSE  KRAS
            TCGA-AG-3878  KRAS  G12D  MISSENSE  KRAS
            TCGA-AG-3901  KRAS  A146T  MISSENSE  KRAS
            TCGA-AG-A025  KRAS  Q22K  MISSENSE  KRAS
            TCGA-AA-3520  KRAS  G12V  MISSENSE  KRAS
            TCGA-AA-3522  KRAS  G12C  MISSENSE  KRAS
            TCGA-AA-3681  KRAS  A146T  MISSENSE  KRAS
            TCGA-AA-3696  KRAS  G12C  MISSENSE  KRAS
            TCGA-AA-3818  KRAS  G12D  MISSENSE  KRAS
            TCGA-AA-3837  KRAS  G12V  MISSENSE  KRAS
            TCGA-AA-3930  KRAS  G12D  MISSENSE  KRAS
            TCGA-AA-3939  KRAS  G12D  MISSENSE  KRAS
            TCGA-AA-3986  KRAS  A146T  MISSENSE  KRAS
            TCGA-AA-A01I  KRAS  G12V  MISSENSE  KRAS
            TCGA-AG-3599  KRAS  G12D  MISSENSE  KRAS
            TCGA-AG-3605  KRAS  G13D  MISSENSE  KRAS
            TCGA-AA-3556  KRAS  G12R  MISSENSE  KRAS
            TCGA-AA-3558  KRAS  G12V  MISSENSE  KRAS
            TCGA-AA-3852  KRAS  G12A  MISSENSE  KRAS
            TCGA-AA-3854  KRAS  G12V  MISSENSE  KRAS
            TCGA-AA-3870  KRAS  G12D  MISSENSE  KRAS
            TCGA-AA-A00K  KRAS  G12V  MISSENSE  KRAS
            TCGA-AA-A029  KRAS  G12V  MISSENSE  KRAS
            TCGA-AG-3586  KRAS  G12V  MISSENSE  KRAS
            TCGA-AG-3594  KRAS  G12V  MISSENSE  KRAS
            TCGA-AG-3902  KRAS  G13D  MISSENSE  KRAS
            TCGA-AA-3548  KRAS  G12D  MISSENSE  KRAS
            TCGA-AA-3695  KRAS  G12D  MISSENSE  KRAS
            TCGA-AF-2689  KRAS  G13D  MISSENSE  KRAS
            TCGA-AF-2691  KRAS  G12D  MISSENSE  KRAS
            TCGA-AF-2692  KRAS  G12V  MISSENSE  KRAS
            TCGA-AG-3575  KRAS  G12V  MISSENSE  KRAS
            TCGA-AG-3580  KRAS  G12D  MISSENSE  KRAS
            TCGA-AA-3976  NRAS  Q61K  MISSENSE  NRAS
            TCGA-AF-3913  NRAS  Q61H  MISSENSE  NRAS
            TCGA-AA-3549  NRAS  Q61K  MISSENSE  NRAS
            TCGA-AA-3666  NRAS  Q61K  MISSENSE  NRAS
            TCGA-AA-3819  NRAS  Q61L  MISSENSE  NRAS
            TCGA-AA-3972  NRAS  G12D  MISSENSE  NRAS
            TCGA-AA-3973  NRAS  G12D  MISSENSE  NRAS
            TCGA-AA-A00F  NRAS  Q61K  MISSENSE  NRAS
            TCGA-AA-A02F  NRAS  G13R  MISSENSE  NRAS
            TCGA-AG-A01L  NRAS  Q61K  MISSENSE  NRAS
            TCGA-AG-A02G  NRAS  AMP  CNA  NRAS
            TCGA-AA-A024  NRAS  G13R  MISSENSE  NRAS
            TCGA-A6-2678  NRAS  Q61L  MISSENSE  NRAS
            TCGA-AG-3894  NRAS  Q61K  MISSENSE  NRAS
            TCGA-AA-3558  NRAS  G12C  MISSENSE  NRAS
            TCGA-AF-2691  NRAS  G12C  MISSENSE  NRAS
            TCGA-AA-A00D  BRAF  V600E  MISSENSE  BRAF
            TCGA-AA-3684  BRAF  V600E  MISSENSE  BRAF
            TCGA-AA-3664  BRAF  V600E  MISSENSE  BRAF
            TCGA-AA-A01D  BRAF  V600E  MISSENSE  BRAF
            TCGA-AG-3578  BRAF  V600E  MISSENSE  BRAF
            TCGA-A6-2670
            TCGA-A6-2677
            TCGA-AA-3524
            TCGA-AA-3529
            TCGA-AA-3532
            TCGA-AA-3538
            TCGA-AA-3544
            TCGA-AA-3552
            TCGA-AA-3553
            TCGA-AA-3562
            TCGA-AA-3667
            TCGA-AA-3673
            TCGA-AA-3678
            TCGA-AA-3692
            TCGA-AA-3842
            TCGA-AA-3851
            TCGA-AA-3856
            TCGA-AA-3858
            TCGA-AA-3869
            TCGA-AA-3872
            TCGA-AA-3956
            TCGA-AA-3971
            TCGA-AA-3975
            TCGA-AA-3976
            TCGA-AA-3979
            TCGA-AA-A004
            TCGA-AA-A00D
            TCGA-AA-A00U
            TCGA-AA-A017
            TCGA-AA-A01G
            TCGA-AA-A01K
            TCGA-AA-A02J
            TCGA-AA-A02W
            TCGA-AF-3913
            TCGA-AG-3582
            TCGA-AG-3584
            TCGA-AG-3587
            TCGA-AG-3598
            TCGA-AG-3600
            TCGA-AG-3601
            TCGA-AG-3612
            TCGA-AG-3726
            TCGA-AG-3883
            TCGA-AG-3887
            TCGA-AG-3999
            TCGA-AG-4005
            TCGA-AG-4008
            TCGA-AG-4015
            TCGA-AG-A00H
            TCGA-AG-A011
            TCGA-AG-A014
            TCGA-AG-A016
            TCGA-AY-4070
            TCGA-A6-2683
            TCGA-A6-3807
            TCGA-AA-3517
            TCGA-AA-3519
            TCGA-AA-3521
            TCGA-AA-3530
            TCGA-AA-3531
            TCGA-AA-3549
            TCGA-AA-3560
            TCGA-AA-3561
            TCGA-AA-3666
            TCGA-AA-3679
            TCGA-AA-3688
            TCGA-AA-3693
            TCGA-AA-3814
            TCGA-AA-3819
            TCGA-AA-3846
            TCGA-AA-3848
            TCGA-AA-3855
            TCGA-AA-3860
            TCGA-AA-3866
            TCGA-AA-3955
            TCGA-AA-3972
            TCGA-AA-3973
            TCGA-AA-3989
            TCGA-AA-A00F
            TCGA-AA-A00L
            TCGA-AA-A00O
            TCGA-AA-A00Q
            TCGA-AA-A00W
            TCGA-AA-A00Z
            TCGA-AA-A01F
            TCGA-AA-A02F
            TCGA-AA-A02H
            TCGA-AG-3581
            TCGA-AG-3583
            TCGA-AG-3593
            TCGA-AG-3602
            TCGA-AG-3608
            TCGA-AG-3609
            TCGA-AG-3611
            TCGA-AG-3727
            TCGA-AG-3882
            TCGA-AG-3890
            TCGA-AG-3893
            TCGA-AG-3896
            TCGA-AG-3898
            TCGA-AG-3909
            TCGA-AG-4001
            TCGA-AG-A008
            TCGA-AG-A00C
            TCGA-AG-A015
            TCGA-AG-A01L
            TCGA-AG-A02G
            TCGA-AG-A02X
            TCGA-AG-A032
            TCGA-AY-4071
            TCGA-AA-3527
            TCGA-AA-3680
            TCGA-AA-3684
            TCGA-AA-3831
            TCGA-AA-3994
            TCGA-AA-A024
            TCGA-AG-3878
            TCGA-AG-3901
            TCGA-AG-A025
            TCGA-A6-2674
            TCGA-A6-2678
            TCGA-AA-3520
            TCGA-AA-3522
            TCGA-AA-3534
            TCGA-AA-3681
            TCGA-AA-3696
            TCGA-AA-3812
            TCGA-AA-3818
            TCGA-AA-3837
            TCGA-AA-3875
            TCGA-AA-3930
            TCGA-AA-3939
            TCGA-AA-3952
            TCGA-AA-3986
            TCGA-AA-A01I
            TCGA-AG-3599
            TCGA-AG-3605
            TCGA-AG-3894
            TCGA-AA-3514
            TCGA-AA-3556
            TCGA-AA-3558
            TCGA-AA-3664
            TCGA-AA-3852
            TCGA-AA-3854
            TCGA-AA-3870
            TCGA-AA-A00K
            TCGA-AA-A01D
            TCGA-AA-A029
            TCGA-AG-3586
            TCGA-AG-3594
            TCGA-AG-3881
            TCGA-AG-3902
            TCGA-AA-3526
            TCGA-AA-3542
            TCGA-AA-3548
            TCGA-AA-3685
            TCGA-AA-3695
            TCGA-AF-2689
            TCGA-AF-2691
            TCGA-AF-2692
            TCGA-AF-3400
            TCGA-AG-3574
            TCGA-AG-3575
            TCGA-AG-3578
            TCGA-AG-3580`;

            this.doSubmit(
                this.geneticDataInput,
                this.clinicalDataInput,
                this.heatmapDataInput
            );
            getBrowserWindow().clientPostedData = null;
        }
    }

    @action.bound
    private toggleHelpOpened() {
        this.helpOpened = !this.helpOpened;
    }

    @action.bound
    private populateGeneticExampleData() {
        this.geneticDataInput = exampleGeneticData;
    }

    @action.bound
    private populateClinicalExampleData() {
        this.clinicalDataInput = exampleClinicalData;
    }

    @action.bound
    private populateHeatmapExampleData() {
        this.heatmapDataInput = exampleHeatmapData;
    }

    @action.bound
    public onGeneticDataInputChange(e: any) {
        this.geneticDataInput = e.currentTarget.value;
    }

    @action.bound
    private onClinicalDataInputChange(e: any) {
        this.clinicalDataInput = e.currentTarget.value;
    }

    @action.bound
    private onHeatmapDataInputChange(e: any) {
        this.heatmapDataInput = e.currentTarget.value;
    }

    @action.bound
    private onGeneOrderInputChange(e: any) {
        this.geneOrderInput = e.currentTarget.value;
    }

    @action.bound
    private onSampleOrderInputChange(e: any) {
        this.sampleOrderInput = e.currentTarget.value;
    }

    @action.bound
    private toggleGeneticHelp() {
        this.geneticHelpOpened = !this.geneticHelpOpened;
    }

    @action.bound
    private toggleClinicalHelp() {
        this.clinicalHelpOpened = !this.clinicalHelpOpened;
    }

    @action.bound
    private toggleHeatmapHelp() {
        this.heatmapHelpOpened = !this.heatmapHelpOpened;
    }

    @action private doSubmit(
        geneticDataInput: string,
        clinicalDataInput: string,
        heatmapDataInput: string
    ) {
        this.store.setInput(
            geneticDataInput,
            clinicalDataInput,
            heatmapDataInput,
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

    @autobind private heatmapFileInputRef(input: HTMLInputElement | null) {
        this.heatmapFileInput = input;
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
    private getHeatmapDataForSubmission() {
        return getDataForSubmission(
            this.heatmapFileInput,
            this.heatmapDataInput
        );
    }

    @action.bound
    private async onClickSubmit() {
        const geneticData = await this.getGeneticDataForSubmission();
        const clinicalData = await this.getClinicalDataForSubmission();
        const heatmapData = await this.getHeatmapDataForSubmission();

        this.doSubmit(geneticData, clinicalData, heatmapData);
    }

    private openDataFormat(tab: 'genomic' | 'clinical' | 'heatmap') {
        window.open(`oncoprinterDataFormat?tab=${tab}`, '_blank');
    }

    @autobind
    private getInputSection() {
        return (
            <FormGroup
                style={{ display: this.dataInputOpened ? undefined : 'none' }}
            >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div>
                        <ControlLabel style={{ marginBottom: 7 }}>
                            Step 1) Input genomic alteration data (optional):
                        </ControlLabel>
                        <Button
                            className="oncoprinterGeneticExampleData"
                            style={{ marginLeft: 7 }}
                            bsStyle="primary"
                            bsSize="xs"
                            onClick={this.populateGeneticExampleData}
                        >
                            Load example data
                        </Button>
                        <Button
                            className="oncoprinterGeneticHelp"
                            style={{ marginLeft: 7 }}
                            bsStyle="primary"
                            bsSize="xs"
                            onClick={this.toggleGeneticHelp}
                        >
                            {this.geneticHelpOpened ? 'Close ' : 'View '}data
                            format
                        </Button>
                        <Collapse isOpened={this.geneticHelpOpened}>
                            <div style={{ paddingBottom: 10 }}>
                                {GenomicFormatHelp}
                            </div>
                        </Collapse>
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
                    <hr style={{ width: '100%' }} />
                    <div>
                        <ControlLabel style={{ marginBottom: 7 }}>
                            Step 2) Input clinical data (optional):
                        </ControlLabel>
                        <Button
                            className="oncoprinterClinicalExampleData"
                            style={{ marginLeft: 7 }}
                            bsStyle="primary"
                            bsSize="xs"
                            onClick={this.populateClinicalExampleData}
                        >
                            Load example data
                        </Button>
                        <Button
                            className="oncoprinterClinicalHelp"
                            style={{ marginLeft: 7 }}
                            bsStyle="primary"
                            bsSize="xs"
                            onClick={this.toggleClinicalHelp}
                        >
                            {this.clinicalHelpOpened ? 'Close ' : 'View '}data
                            format
                        </Button>
                        <Collapse isOpened={this.clinicalHelpOpened}>
                            <div style={{ paddingBottom: 10 }}>
                                {ClinicalFormatHelp}
                            </div>
                        </Collapse>
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
                    <hr style={{ width: '100%' }} />
                    <div>
                        <ControlLabel style={{ marginBottom: 7 }}>
                            Step 3) Input heatmap data (optional):
                        </ControlLabel>
                        <Button
                            className="oncoprinterHeatmapExampleData"
                            style={{ marginLeft: 7 }}
                            bsStyle="primary"
                            bsSize="xs"
                            onClick={this.populateHeatmapExampleData}
                        >
                            Load example data
                        </Button>
                        <Button
                            className="oncoprinterHeatmapHelp"
                            style={{ marginLeft: 7 }}
                            bsStyle="primary"
                            bsSize="xs"
                            onClick={this.toggleHeatmapHelp}
                        >
                            {this.heatmapHelpOpened ? 'Close ' : 'View '}data
                            format
                        </Button>
                        <Collapse isOpened={this.heatmapHelpOpened}>
                            <div style={{ paddingBottom: 10 }}>
                                {HeatmapFormatHelp}
                            </div>
                        </Collapse>
                        <FormControl
                            className="oncoprinterHeatmapDataInput"
                            componentClass="textarea"
                            value={this.heatmapDataInput}
                            placeholder="Enter data here..."
                            onChange={this.onHeatmapDataInputChange}
                            style={{ height: 200, width: '100%' }}
                        />
                        <ControlLabel>or input data from file:</ControlLabel>
                        <input ref={this.heatmapFileInputRef} type="file" />
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
                        this.clinicalDataInput.trim().length === 0 &&
                        this.heatmapDataInput.trim().length === 0
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
            // <PageLayout className={'whiteBackground staticPage'}>
            //     <Helmet>
            //         <title>
            //             {'cBioPortal for Cancer Genomics::Oncoprinter'}
            //         </title>
            //     </Helmet>
            //     <div className="cbioportal-frontend">
            //         <h1 style={{ display: 'inline', marginRight: 10 }}>
            //             Oncoprinter
            //         </h1>{' '}
            //         Generate Oncoprints and perform mutual exclusivity analysis
            //         from your own data.
            //         <br />
            //         <br />
            //         <Observer>{this.getInputSection}</Observer>
            //         {!this.dataInputOpened && (
            //             <button
            //                 className="btn btn-primary btn-lg oncoprinterModifyInput"
            //                 style={{
            //                     paddingLeft: 50,
            //                     paddingRight: 50,
            //                     marginBottom: 15,
            //                 }}
            //                 onClick={() => {
            //                     this.dataInputOpened = true;
            //                 }}
            //             >
            //                 Modify Input
            //             </button>
            //         )}
            //
            //     </div>
            // </PageLayout>
            <>
                <div
                    style={{
                        display:
                            this.store.hasData() &&
                            !this.store.parseErrors.length
                                ? 'block'
                                : 'none',
                    }}
                >
                    <Oncoprinter divId="oncoprinter" store={this.store} />

                    {/*<MSKTabs*/}
                    {/*    activeTabId={this.activeTabId}*/}
                    {/*    unmountOnHide={false}*/}
                    {/*    onTabClick={(id: string) => {*/}
                    {/*        this.activeTabId = id as OncoprinterTab;*/}
                    {/*    }}*/}
                    {/*    className="mainTabs"*/}
                    {/*>*/}
                    {/*    <MSKTab*/}
                    {/*        key={0}*/}
                    {/*        id={OncoprinterTab.ONCOPRINT}*/}
                    {/*        linkText="Oncoprint"*/}
                    {/*    >*/}
                    {/*        {numCells > 100000 && (*/}
                    {/*            <div className="alert alert-warning">*/}
                    {/*                Warning: Because your inputted data is*/}
                    {/*                very large, the Oncoprinter may be slow,*/}
                    {/*                and downloaded PDF, SVG, and PNG may be*/}
                    {/*                huge and unresponsive. We recommend*/}
                    {/*                plotting data for fewer genes at a time.*/}
                    {/*            </div>*/}
                    {/*        )}*/}
                    {/*        <div style={{ marginTop: 10 }}>*/}
                    {/*            */}
                    {/*        </div>*/}
                    {/*    </MSKTab>*/}
                    {/*    <MSKTab*/}
                    {/*        key={1}*/}
                    {/*        id={OncoprinterTab.MUTUAL_EXCLUSIVITY}*/}
                    {/*        linkText="Mutual Exclusivity"*/}
                    {/*    >*/}
                    {/*        <MutualExclusivityTab*/}
                    {/*            isSampleAlteredMap={*/}
                    {/*                this.store.isSampleAlteredMap*/}
                    {/*            }*/}
                    {/*        />*/}
                    {/*    </MSKTab>*/}
                    {/*</MSKTabs>*/}
                </div>
            </>
        );
    }
}
