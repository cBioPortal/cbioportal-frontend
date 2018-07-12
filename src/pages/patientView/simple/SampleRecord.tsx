import React from "react";
import { ClinicalDataBySampleId } from "shared/api/api-types-extended";
import SampleManager from "pages/patientView/sampleManager";
import SampleHeader from "pages/patientView/sampleHeader/SampleHeader";
import { PatientViewPageStore } from "pages/patientView/clinicalInformation/PatientViewPageStore";
import { Mutation, DiscreteCopyNumberData } from "shared/api/generated/CBioPortalAPI";
import { IOncoKbData, IOncoKbDataWrapper } from "shared/model/OncoKB";
import AnnotationColumnFormatter, { IAnnotation } from "shared/components/mutationTable/column/AnnotationColumnFormatter";
import AnnotationColumnFormatterDiscreteCNA from "pages/patientView/copyNumberAlterations/column/AnnotationColumnFormatter";
import DrugInfo from "pages/patientView/simple/DrugInfo";
import classNames from 'classnames';
import OncoKbEvidenceCache from "shared/cache/OncoKbEvidenceCache";
import { Query } from "shared/api/generated/OncoKbAPI";
import OncokbPubMedCache from "shared/cache/PubMedCache";
import { observer } from "mobx-react";

export type ISampleRecordProps = {
    sample: ClinicalDataBySampleId;
    sampleManager?: SampleManager | null;
    studyId: string;
    handleSampleClick: any;
    mutationData: Mutation[];
    discreteCNAData: DiscreteCopyNumberData[];
    cnaStatus: string;
    oncoKbData: IOncoKbDataWrapper;
    cnaOncoKbData: IOncoKbDataWrapper;
    oncoKbAnnotatedGenes: {[entrezGeneId: number]: boolean};
    evidenceCache?: OncoKbEvidenceCache;
    pubMedCache?: OncokbPubMedCache;
    userEmailAddress?:string;
};

interface ISampleRecordState {
    show_mutations: boolean;
    show_cna: boolean;
    show_rearrangements: boolean;
}

@observer
export default class SampleRecord extends React.Component<ISampleRecordProps, ISampleRecordState> {
    constructor(props:ISampleRecordProps) {
        super(props);
        this.state = {
            show_mutations: false,
            show_cna: false,
            show_rearrangements: false
        };
    }
    getDrivers() {
        if (this.props.oncoKbData.result) {
            const drivers = this.props.mutationData.map(
                (m:Mutation) => AnnotationColumnFormatter.getIndicatorData(m, this.props.oncoKbData.result!)
            ).filter(x => x !== undefined && x.oncogenic);
            return drivers;
        } else {
            return [];
        }
    }
    getCNADrivers() {
        if (this.props.cnaOncoKbData.result) {
            const drivers = this.props.discreteCNAData.map(
                (cna:DiscreteCopyNumberData) => AnnotationColumnFormatterDiscreteCNA.getIndicatorData([cna], this.props.cnaOncoKbData.result!)
            ).filter(x => x !== undefined && x.oncogenic);
            return drivers;
        } else {
            return [];
        }

    }
    getDriversWithTreatmentInfo() {
        return this.getDrivers().filter(x => x && x.treatments.length > 0);
    }
    getCNADriversWithTreatmentInfo() {
        return this.getCNADrivers().filter(x => x && x.treatments.length > 0);
    }
    render() {
        const annotationData:IAnnotation = AnnotationColumnFormatter.getData(this.props.mutationData, this.props.oncoKbAnnotatedGenes, undefined, undefined, this.props.oncoKbData);
        const annotationDiscreteCNAData:IAnnotation = AnnotationColumnFormatterDiscreteCNA.getData(this.props.discreteCNAData, this.props.oncoKbAnnotatedGenes, this.props.cnaOncoKbData);

        return (
            <div className="sample-info">
                <div style={{width:"100%",paddingBottom:10}}>
                    <SampleHeader
                        sample={this.props.sample}
                        sampleManager={this.props.sampleManager}
                        handleSampleClick={(() => void 0)}
                        studyId={this.props.studyId}
                    />
                </div>
                {(this.getDriversWithTreatmentInfo().length > 0) && (
                    <div className="flex-row sample-info-record sample-info-record-drugs">
                        <div className='sample-info-card sample-info-drugs'>
                            <div className='sample-info-card-title extra-text-header'>Diagnostic, Therapeutic and/or Prognostic biomarker(s)</div>
                            {annotationData && this.getDriversWithTreatmentInfo().map((driver) => {
                                return driver && (
                                    <DrugInfo 
                                        annotation={annotationData}
                                        indicator={driver}
                                        evidenceCache={this.props.evidenceCache}
                                        evidenceQuery={driver.query}
                                        pubMedCache={this.props.pubMedCache}
                                        userEmailAddress={this.props.userEmailAddress}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
                <div className="flex-row sample-info-record">
                    <div className={classNames('sample-info-card', 'genomic-alterations-card', 'mutations', {'active': this.state.show_mutations})} onClick={() => {this.setState({show_mutations:!this.state.show_mutations});}}>
                        <div className='sample-info-card-title extra-text-header'>Mutations</div>
                        <div className='sample-info-card-number'><div>{this.props.mutationData.length}</div></div>
                        <div className='sample-info-card-extra-info extra-text'>
                            <div className="extra-info-drivers extra-text">
                                {this.getDrivers().length} driver{this.getDrivers().length > 1? "s":""}<br />
                                {this.getDriversWithTreatmentInfo().length} actionable<br />
                            </div>
                            <div className="extra-info-passengers extra-text"><br />TMB: 2.3</div>
                        </div>
                    </div>
                    <div className={classNames('sample-info-card', 'genomic-alterations-card', 'copy-number-changes', {'active': this.state.show_cna})} onClick={() => {this.setState({show_cna:!this.state.show_cna});}}>
                        <div className='sample-info-card-title extra-text-header'>Copy Number Changes</div>
                        <div className='sample-info-card-number'><div>{this.props.cnaStatus === "available"? this.props.discreteCNAData.length : "-"}</div></div>
                        <div className='sample-info-card-extra-info extra-text'>
                            <div className="extra-info-drivers extra-text">
                                {this.getCNADrivers().length} driver{this.getCNADrivers().length > 1? "s":""}<br />
                                {this.getCNADriversWithTreatmentInfo().length} actionable<br />
                            </div>
                            <div className="extra-info-passengers extra-text"></div>
                        </div>
                    </div>
                    <div className={classNames('sample-info-card', 'genomic-alterations-card', 'rearrangements', {active: this.state.show_rearrangements})} onClick={() => {this.setState({show_rearrangements:!this.state.show_rearrangements});}}>
                        <div className='sample-info-card-title extra-text-header'>Rearrangements</div>
                        <div className='sample-info-card-number'><div>-</div></div>
                        <div className='sample-info-card-extra-info extra-text'><div className="extra-info-drivers"></div><div className="extra-info-passengers extra-text">&nbsp;</div></div>
                    </div>
                </div>
            {(this.state.show_cna || this.state.show_mutations || this.state.show_rearrangements) && (<div>{this.getGeneticAlterationsList()}</div>)}
            </div>
        );
    }
    private makeGeneticAlterationSpan(): JSX.Element {
        return <span>mut</span>;
    }
    private getGeneticAlterationsList(): JSX.Element {
        const filteredAlterations:(Mutation)[] = this.props.mutationData;
        return (
            <div className="genetic-alterations-list">
            Mutations: <span className="badge">Actionable</span> <span className="badge">Driver</span> <span className="badge">VUS</span><br />
            Copy Number Changes: <span className="badge">Actionable</span> <span className="badge">Driver</span> <span className="badge">VUS</span><br />
            Rearrangements: <span className="badge">Actionable</span> <span className="badge">Driver</span> <span className="badge">VUS</span><br /><br />
            {filteredAlterations.map((a, index) => {
                return <span className="genetic-alteration-list-item">{(index !== 0) && ", "}<b>{a.gene.hugoGeneSymbol}</b> {a.proteinChange}</span>;
            })}
            </div>
        );
    }
}