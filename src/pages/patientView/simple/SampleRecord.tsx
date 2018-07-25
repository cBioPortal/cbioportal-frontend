import React from "react";
import { ClinicalDataBySampleId } from "shared/api/api-types-extended";
import SampleManager from "pages/patientView/sampleManager";
import SampleHeader from "pages/patientView/sampleHeader/SampleHeader";
import { PatientViewPageStore } from "pages/patientView/clinicalInformation/PatientViewPageStore";
import { Mutation, DiscreteCopyNumberData } from "shared/api/generated/CBioPortalAPI";
import { FractionGenomeAltered } from "shared/api/generated/CBioPortalAPIInternal";
import { IOncoKbData, IOncoKbDataWrapper } from "shared/model/OncoKB";
import AnnotationColumnFormatter, { IAnnotation } from "shared/components/mutationTable/column/AnnotationColumnFormatter";
import AnnotationColumnFormatterDiscreteCNA from "pages/patientView/copyNumberAlterations/column/AnnotationColumnFormatter";
import DrugInfo from "pages/patientView/simple/DrugInfo";
import classNames from 'classnames';
import OncoKbEvidenceCache from "shared/cache/OncoKbEvidenceCache";
import { Query } from "shared/api/generated/OncoKbAPI";
import OncokbPubMedCache from "shared/cache/PubMedCache";
import { observer } from "mobx-react";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import AppConfig from 'appConfig';
import PatientViewMutationTable from "pages/patientView/mutation/PatientViewMutationTable";
import CopyNumberTableWrapper from "pages/patientView/copyNumberAlterations/CopyNumberTableWrapper";
import GeneticAlterationTable from "pages/patientView/simple/GeneticAlterationTable";
import { default as ActionableAlterationsTable, MutationAndAnnotation } from "./ActionableAlterationsTable";
import { toFixedWithThreshold } from "shared/lib/FormatUtils";

export type ISampleRecordProps = {
    sample: ClinicalDataBySampleId;
    sampleManager: SampleManager | null;
    studyId: string;
    handleSampleClick: any;
    mutationData: Mutation[];
    discreteCNAData: DiscreteCopyNumberData[];
    cnaStatus:"loading"|"available"|"unavailable";
    oncoKbData: IOncoKbDataWrapper;
    cnaOncoKbData: IOncoKbDataWrapper;
    oncoKbAnnotatedGenes: {[entrezGeneId: number]: boolean};
    evidenceCache?: OncoKbEvidenceCache;
    pubMedCache?: OncokbPubMedCache;
    userEmailAddress?:string;
    patientViewPageStore: PatientViewPageStore;
    fractionGenomeAltered?: FractionGenomeAltered;
};

type DiscreteCopyNumberDataAndAnnotation = {
    discreteCopyNumberData: DiscreteCopyNumberData;
    annotation: IAnnotation;
};


interface ISampleRecordState {
    show_oncogenic_mutations: boolean;
    show_actionable_mutations: boolean;
    show_vus_mutations: boolean;
    show_oncogenic_cna: boolean;
    show_actionable_cna: boolean;
    show_vus_cna: boolean;
}

@observer
export default class SampleRecord extends React.Component<ISampleRecordProps, ISampleRecordState> {
    constructor(props:ISampleRecordProps) {
        super(props);
        this.state = {
            show_oncogenic_mutations: false,
            show_actionable_mutations: false,
            show_vus_mutations: false,
            show_oncogenic_cna: false,
            show_actionable_cna: false,
            show_vus_cna: false
        };
    }
    getNumberOfAlterations() {
        return this.props.mutationData.length + this.props.discreteCNAData.length;
    }
    getNumberOfDriverAlterations() {
        return this.getDrivers().length + this.getCNADrivers().length;
    }
    getNumberOfDriverAlterationsWithTreatmentInfo() {
        return this.getDriversWithTreatmentInfo().length + this.getCNADriversWithTreatmentInfo().length;
    }
    getMutationsAnnotated() {
        if (this.props.oncoKbData.result) {
            return this.props.mutationData.map(
                (m:Mutation) => {
                    return {
                        "mutation":m, 
                        "annotation":AnnotationColumnFormatter.getData([m], this.props.oncoKbAnnotatedGenes, undefined, undefined, this.props.oncoKbData)
                    };
                }
            );
        } else {
            return [];
        }
    }
    getCNAAnnotated() {
        if (this.props.cnaOncoKbData.result) {
            const drivers = this.props.discreteCNAData.map(
                (cna:DiscreteCopyNumberData) => {
                    return {
                        "discreteCopyNumberData":cna,
                        "annotation":AnnotationColumnFormatterDiscreteCNA.getData([cna], this.props.oncoKbAnnotatedGenes, this.props.cnaOncoKbData)
                    };
                }
            );
            return drivers;
        } else {
            return [];
        }
    }
    getDrivers() {
        if (this.props.oncoKbData.result) {
            const drivers = this.getMutationsAnnotated().filter(this.isOncogenic);
            return drivers;
        } else {
            return [];
        }
    }
    isActionable(x:MutationAndAnnotation|{"discreteCopyNumberData":DiscreteCopyNumberData,"annotation":IAnnotation}) {
        return x.annotation !== undefined && x.annotation.oncoKbIndicator && x.annotation.oncoKbIndicator.treatments.length > 0;
    }
    isOncogenic(x:MutationAndAnnotation|{"discreteCopyNumberData":DiscreteCopyNumberData,"annotation":IAnnotation}) {
        return x.annotation !== undefined && x.annotation.oncoKbIndicator && x.annotation.oncoKbIndicator.oncogenic;
    }
    isOncogenicNotActionable(x:MutationAndAnnotation|{"discreteCopyNumberData":DiscreteCopyNumberData,"annotation":IAnnotation}) {
        return this.isOncogenic(x) && !this.isActionable(x);
    }
    isVUS(x:MutationAndAnnotation|{"discreteCopyNumberData":DiscreteCopyNumberData,"annotation":IAnnotation}) {
        return !this.isOncogenic(x);
    }
    getCNADrivers() {
        if (this.props.cnaOncoKbData.result) {
            const drivers = this.getCNAAnnotated().filter(this.isOncogenic);
            return drivers;
        } else {
            return [];
        }

    }
    getDriversWithTreatmentInfo() {
        return this.getDrivers().filter(this.isActionable);
    }
    getCNADriversWithTreatmentInfo() {
        return this.getCNADrivers().filter(this.isActionable);
    }
    getGeneticAlterationDataFiltered() {
        const mutationAnns = this.getMutationsAnnotated();
        const mutationDataFiltered = mutationAnns.filter((ann:MutationAndAnnotation) => {
            return (this.state.show_oncogenic_mutations && this.isOncogenicNotActionable(ann)) ||
                   (this.state.show_actionable_mutations && this.isActionable(ann)) ||
                   (this.state.show_vus_mutations && this.isVUS(ann));
        });
        const discreteCNAAns = this.getCNAAnnotated();
        const CNADataFiltered = discreteCNAAns.filter((ann:{"discreteCopyNumberData":DiscreteCopyNumberData,"annotation":IAnnotation}) => {
            return (this.state.show_oncogenic_cna && this.isOncogenicNotActionable(ann)) ||
                   (this.state.show_actionable_cna && this.isActionable(ann)) ||
                   (this.state.show_vus_cna && this.isVUS(ann));
        });
        return [...mutationDataFiltered.map(x => [x.mutation]), ...CNADataFiltered.map(x => [x.discreteCopyNumberData])];
    }
    hasAnyCheckboxSelected() {
        return this.state.show_actionable_mutations || this.state.show_oncogenic_mutations || this.state.show_vus_mutations ||
               this.state.show_actionable_cna || this.state.show_oncogenic_cna || this.state.show_vus_cna;
    }
    hasAllCheckboxSelected() {
        return this.state.show_actionable_mutations && this.state.show_oncogenic_mutations && this.state.show_vus_mutations &&
               this.state.show_actionable_cna && this.state.show_oncogenic_cna && this.state.show_vus_cna;
    }
    showAll() {
        this.setState({
            show_oncogenic_mutations: true,
            show_actionable_mutations: true,
            show_vus_mutations: true,
            show_oncogenic_cna: true,
            show_actionable_cna: true,
            show_vus_cna: true
        });
    }
    showNone() {
        this.setState({
            show_oncogenic_mutations: false,
            show_actionable_mutations: false,
            show_vus_mutations: false,
            show_oncogenic_cna: false,
            show_actionable_cna: false,
            show_vus_cna: false
        });
    }
    render() {
        return (
            <div className="sample-report sample-info">
                <div style={{width:"100%",fontSize:"medium"}}>
                    <SampleHeader
                        sample={this.props.sample}
                        sampleManager={this.props.sampleManager}
                        handleSampleClick={(() => void 0)}
                        studyId={this.props.studyId}
                        iconSize={14}
                    />
                </div>
                <div style={{paddingLeft:10,width:"100%"}}>
                    <p><span style={{fontSize:"medium"}}><b>Summary: </b></span>{this.getNumberOfAlterations()} alterations detected, including <b>{this.getNumberOfDriverAlterations()} known oncogenic</b> of which <b>{this.getNumberOfDriverAlterationsWithTreatmentInfo()} are actionable</b>.</p>
                    {(this.getNumberOfDriverAlterationsWithTreatmentInfo() > 0) && (
                        <div className="flex-row sample-info-record sample-info-record-drugs">
                            <div className='sample-info-card sample-info-drugs'>
                                <div className='sample-info-card-title extra-text-header'>Actionable Alterations</div>
                                <div style={{padding:20,width:900,margin:"0 auto",fontSize:"medium"}}>
                                    <div style={{paddingTop:10}}>
                                        <ActionableAlterationsTable
                                            actionableAlterations={[...this.getDriversWithTreatmentInfo(), ...this.getCNADriversWithTreatmentInfo()]}
                                            evidenceCache={this.props.evidenceCache}
                                            pubMedCache={this.props.pubMedCache}
                                            userEmailAddress={this.props.userEmailAddress}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="flex-row sample-info-record">
                        <div style={{width:"100%",backgroundColor:"#F5F7F9",fontWeight:400,border:"solid 1px #ddd",textAlign:"center",padding:5,fontSize:"medium"}}>All alterations</div>
                        <div className={classNames('sample-info-card', 'genomic-alterations-card', 'mutations')}>
                            <div className='sample-info-card-title extra-text-header'>Mutations</div>
                            <div className='sample-info-card-number'><div>{this.props.mutationData.length}</div></div>
                            <div className='sample-info-card-extra-info extra-text'>
                                {/*<span style={{lineHeight:2}}>TMB 2.3</span><br />*/}
                                <span style={{float:"left"}}><input className={classNames("alteration-filter-checkbox", this.hasAnyCheckboxSelected()? "visible": "")} type="checkbox" checked={this.state.show_oncogenic_mutations} onClick={() => {this.setState({show_oncogenic_mutations:!this.state.show_oncogenic_mutations,show_actionable_mutations:!this.state.show_oncogenic_mutations});}}></input> oncogenic</span><span style={{float:"right"}}>{this.getDrivers().length}</span><br />
                                <span style={{float:"left"}}><input className={classNames("alteration-filter-checkbox", this.hasAnyCheckboxSelected()? "visible": "")} type="checkbox" checked={this.state.show_actionable_mutations} onClick={() => {this.setState({show_actionable_mutations:!this.state.show_actionable_mutations});}}></input> actionable</span><span style={{float:"right"}}>{this.getDriversWithTreatmentInfo().length}</span><br />
                                <span style={{float:"left"}}><input className={classNames("alteration-filter-checkbox", this.hasAnyCheckboxSelected()? "visible": "")} type="checkbox" checked={this.state.show_vus_mutations} onClick={() => {this.setState({show_vus_mutations:!this.state.show_vus_mutations});}}></input> VUS</span><span style={{float:"right"}}>{this.props.mutationData.length - this.getDrivers().length}</span><br />

                                {/*<div className="extra-info-drivers extra-text">
                                    {this.getDrivers().length} oncogenic<br />
                                    {this.getDriversWithTreatmentInfo().length} actionable<br />
                                </div>
                                <div className="extra-info-passengers extra-text"><br />TMB: 2.3</div>*/}
                            </div>
                        </div>
                        <div className={classNames('sample-info-card', 'genomic-alterations-card', 'copy-number-changes')}>
                            <div className='sample-info-card-title extra-text-header'>Copy Number Changes</div>
                            <div className='sample-info-card-number'><div>{this.props.cnaStatus === "available"? this.props.discreteCNAData.length : "-"}</div></div>
                            <div className='sample-info-card-extra-info extra-text'>
                                    {/*<span style={{lineHeight:2}}>{this.props.fractionGenomeAltered? `FGA ${toFixedWithThreshold(this.props.fractionGenomeAltered.value, 2)}` : '\u00A0'}</span><br />}*/}
                                    <span style={{float:"left"}}><input className={classNames("alteration-filter-checkbox", this.hasAnyCheckboxSelected()? "visible": "")} type="checkbox" checked={this.state.show_oncogenic_cna} onClick={() => {this.setState({show_oncogenic_cna:!this.state.show_oncogenic_cna,show_actionable_cna:!this.state.show_oncogenic_cna});}}></input> oncogenic</span><span style={{float:"right"}}>{this.getCNADrivers().length}</span><br />
                                    <span style={{float:"left"}}><input className={classNames("alteration-filter-checkbox", this.hasAnyCheckboxSelected()? "visible": "")} type="checkbox" checked={this.state.show_actionable_cna} onClick={() => {this.setState({show_actionable_cna:!this.state.show_actionable_cna});}}></input> actionable</span><span style={{float:"right"}}>{this.getCNADriversWithTreatmentInfo().length}</span><br />
                                    <span style={{float:"left"}}><input className={classNames("alteration-filter-checkbox", this.hasAnyCheckboxSelected()? "visible": "")} type="checkbox" checked={this.state.show_vus_cna} onClick={() => {this.setState({show_vus_cna:!this.state.show_vus_cna});}}></input> VUS</span><span style={{float:"right"}}>{this.props.discreteCNAData.length - this.getCNADrivers().length}</span><br />
                            </div>
                        </div>
                        <div className={classNames('sample-info-card', 'genomic-alterations-card', 'rearrangements')}>
                            <div className='sample-info-card-title extra-text-header'>Rearrangements</div>
                            <div className='sample-info-card-number'><div>-</div></div>
                            <div className='sample-info-card-extra-info extra-text'>
                                        {/*<span style={{lineHeight:2}}>&nbsp;</span><br />*/}
                                        <span style={{float:"left"}}>&nbsp;</span><span style={{float:"right"}}>&nbsp;</span><br />
                                        <span style={{float:"left"}}>&nbsp;</span><span style={{float:"right"}}>&nbsp;</span><br />
                                        <span style={{float:"left"}}>&nbsp;</span><span style={{float:"right"}}>&nbsp;</span><br />
                            </div>
                        </div>
                    </div>
                    <div style={{width:"100%",padding: this.hasAnyCheckboxSelected()? 20: 0,border:"dotted 1px #ddd",borderTop:"none",borderBottom:"none",paddingBottom: this.hasAnyCheckboxSelected()? 10: 0}}>
                        {this.hasAnyCheckboxSelected() && (
                            this.getGeneticAlterationTable()
                        )}
                        {/*(this.state.show_mutations || this.state.show_rearrangements) && (
                            this.getMutationTable()
                        )}
                        {(this.state.show_cna) && (
                            this.getCopyNumberTable()
                        )*/}
                    </div>
                    {this.hasAnyCheckboxSelected() && (
                        <div style={{padding:5,backgroundColor:"#F5F7F9",width:"100%",textAlign:"center",fontWeight:400,border:"solid 1px #ddd",fontSize:"medium",cursor:"pointer"}} onClick={() => this.showNone()}>Close&nbsp;<i className="fa fa-angle-up"></i></div>
                    ) || (
                        <div style={{padding:5,backgroundColor:"#F5F7F9",width:"100%",textAlign:"center",fontWeight:400,border:"solid 1px #ddd",fontSize:"medium",cursor:"pointer"}} onClick={() => this.showAll()}>Expand&nbsp;<i className="fa fa-angle-down"></i></div>
                    )}
                </div>
            </div>
        );
    }
    private makeGeneticAlterationSpan(): JSX.Element {
        return <span>mut</span>;
    }
    private getMutationTable(): JSX.Element {
        const patientViewPageStore = this.props.patientViewPageStore;
        const sampleManager = this.props.sampleManager;

        return (
            <div style={{paddingTop:10}}>
                <LoadingIndicator isLoading={patientViewPageStore.mutationData.isPending || patientViewPageStore.uncalledMutationData.isPending || patientViewPageStore.oncoKbAnnotatedGenes.isPending} />
                {
                    (patientViewPageStore.oncoKbAnnotatedGenes.isComplete && patientViewPageStore.mutationData.isComplete && patientViewPageStore.uncalledMutationData.isComplete && !!sampleManager) && (
                        <PatientViewMutationTable
                            sampleManager={sampleManager}
                            sampleIds={sampleManager ? sampleManager.getSampleIdsInOrder() : []}
                            uniqueSampleKeyToTumorType={patientViewPageStore.uniqueSampleKeyToTumorType}
                            molecularProfileIdToMolecularProfile={patientViewPageStore.molecularProfileIdToMolecularProfile.result}
                            variantCountCache={patientViewPageStore.variantCountCache}
                            genomeNexusEnrichmentCache={patientViewPageStore.genomeNexusEnrichmentCache}
                            discreteCNACache={patientViewPageStore.discreteCNACache}
                            mrnaExprRankCache={patientViewPageStore.mrnaExprRankCache}
                            oncoKbEvidenceCache={patientViewPageStore.oncoKbEvidenceCache}
                            pubMedCache={patientViewPageStore.pubMedCache}
                            mrnaExprRankMolecularProfileId={patientViewPageStore.mrnaRankMolecularProfileId.result || undefined}
                            discreteCNAMolecularProfileId={patientViewPageStore.molecularProfileIdDiscrete.result}
                            data={patientViewPageStore.mergedMutationDataIncludingUncalled}
                            downloadDataFetcher={patientViewPageStore.downloadDataFetcher}
                            mutSigData={patientViewPageStore.mutSigData.result}
                            myCancerGenomeData={patientViewPageStore.myCancerGenomeData}
                            hotspotData={patientViewPageStore.indexedHotspotData}
                            cosmicData={patientViewPageStore.cosmicData.result}
                            oncoKbData={patientViewPageStore.oncoKbData}
                            oncoKbAnnotatedGenes={patientViewPageStore.oncoKbAnnotatedGenes.result}
                            civicGenes={patientViewPageStore.civicGenes}
                            civicVariants={patientViewPageStore.civicVariants}
                            userEmailAddress={AppConfig.userEmailAddress}
                            enableOncoKb={AppConfig.showOncoKB}
                            enableFunctionalImpact={AppConfig.showGenomeNexus}
                            enableHotspot={AppConfig.showHotspot}
                            enableMyCancerGenome={AppConfig.showMyCancerGenome}
                            enableCivic={AppConfig.showCivic}
                        />
                    )
                
                }
            </div>
        );
    }
    private getCopyNumberTable(): JSX.Element {
        const patientViewPageStore = this.props.patientViewPageStore;
        const sampleManager = this.props.sampleManager;

        return (
            <div style={{paddingTop:30}}>
                <LoadingIndicator isLoading={(this.props.cnaStatus === 'loading')} />
                <CopyNumberTableWrapper
                    sampleIds={sampleManager ? sampleManager.getSampleIdsInOrder() : []}
                    sampleManager={sampleManager}
                    cnaOncoKbData={patientViewPageStore.cnaOncoKbData}
                    cnaCivicGenes={patientViewPageStore.cnaCivicGenes}
                    cnaCivicVariants={patientViewPageStore.cnaCivicVariants}
                    oncoKbEvidenceCache={patientViewPageStore.oncoKbEvidenceCache}
                    oncoKbAnnotatedGenes={patientViewPageStore.oncoKbAnnotatedGenes.result}
                    enableOncoKb={AppConfig.showOncoKB}
                    enableCivic={AppConfig.showCivic}
                    userEmailAddress={AppConfig.userEmailAddress}
                    pubMedCache={patientViewPageStore.pubMedCache}
                    data={patientViewPageStore.mergedDiscreteCNAData}
                    copyNumberCountCache={patientViewPageStore.copyNumberCountCache}
                    mrnaExprRankCache={patientViewPageStore.mrnaExprRankCache}
                    gisticData={patientViewPageStore.gisticData.result}
                    mrnaExprRankMolecularProfileId={patientViewPageStore.mrnaRankMolecularProfileId.result || undefined}
                    status={this.props.cnaStatus}
                />
            </div>
        );
    }
    private getGeneticAlterationTable(): JSX.Element {
        const patientViewPageStore = this.props.patientViewPageStore;
        const sampleManager = this.props.sampleManager;

        return (
            <div>
                <LoadingIndicator 
                    isLoading={(
                        (this.props.cnaStatus === 'loading') ||
                        patientViewPageStore.mutationData.isPending ||
                        patientViewPageStore.uncalledMutationData.isPending ||
                        patientViewPageStore.oncoKbAnnotatedGenes.isPending
                    )}
                />
                <GeneticAlterationTable
                    /*sampleIds={sampleManager ? sampleManager.getSampleIdsInOrder() : []}*/
                    sampleIds={[this.props.sample.id]}
                    sampleManager={sampleManager}
                    cnaOncoKbData={patientViewPageStore.cnaOncoKbData}
                    cnaCivicGenes={patientViewPageStore.cnaCivicGenes}
                    cnaCivicVariants={patientViewPageStore.cnaCivicVariants}
                    oncoKbEvidenceCache={patientViewPageStore.oncoKbEvidenceCache}
                    oncoKbAnnotatedGenes={patientViewPageStore.oncoKbAnnotatedGenes.result}
                    enableOncoKb={AppConfig.showOncoKB}
                    enableCivic={AppConfig.showCivic}
                    userEmailAddress={AppConfig.userEmailAddress}
                    pubMedCache={patientViewPageStore.pubMedCache}
                    data={this.getGeneticAlterationDataFiltered()}
                    copyNumberCountCache={patientViewPageStore.copyNumberCountCache}
                    mrnaExprRankCache={patientViewPageStore.mrnaExprRankCache}
                    gisticData={patientViewPageStore.gisticData.result}
                    mrnaExprRankMolecularProfileId={patientViewPageStore.mrnaRankMolecularProfileId.result || undefined}
                    status={this.props.cnaStatus}
                    // mutation annotation info
                    hotspotData={patientViewPageStore.indexedHotspotData}
                    myCancerGenomeData={patientViewPageStore.myCancerGenomeData}
                    oncoKbData={patientViewPageStore.oncoKbData}
                    civicGenes={patientViewPageStore.civicGenes}
                    civicVariants={patientViewPageStore.civicVariants}
                    enableHotspot={AppConfig.showHotspot}
                    enableMyCancerGenome={AppConfig.showMyCancerGenome}
                />
                {!this.hasAllCheckboxSelected() && (<div style={{textAlign:"center",paddingTop:5}}>Showing {this.getGeneticAlterationDataFiltered().length} of {this.getNumberOfAlterations()} alterations (<a onClick={() => this.showAll()}>Show all)</a></div>)}
            </div>
        );
    }
    private getGeneticAlterationsList(): JSX.Element {
        const filteredAlterations:(Mutation)[] = this.props.mutationData;
        return (
            <div className="genetic-alterations-list">
                Mutations: <span className="badge genetic-alteration-filter mutations actionable">Actionable</span> <span className="badge genetic-alteration-filter mutations driver">Driver</span> <span className="badge genetic-alteration-filter mutations vus">VUS</span><br />
                Copy Number Changes: <span className="badge genetic-alteration-filter copy-number-changes actionable">Actionable</span> <span className="badge genetic-alteration-filter copy-number-changes driver">Driver</span> <span className="badge genetic-alteration-filter copy-number-changes vus">VUS</span><br />
                Rearrangements: <span className="badge rearrangements genetic-alteration-filter actionable">Actionable</span> <span className="badge genetic-alteration-filter rearrangements driver">Driver</span> <span className="badge genetic-alteration-filter rearrangements vus">VUS</span><br /><br />
                {filteredAlterations.map((a, index) => {
                    return <span className="genetic-alterations-list-item">{(index !== 0) && ", "}<b>{a.gene.hugoGeneSymbol}</b> {a.proteinChange}</span> ;
                })}
            </div>
        );
    }
}