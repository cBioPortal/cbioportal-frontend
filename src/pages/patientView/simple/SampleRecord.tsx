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
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import AppConfig from 'appConfig';
import PatientViewMutationTable from "pages/patientView/mutation/PatientViewMutationTable";
import CopyNumberTableWrapper from "pages/patientView/copyNumberAlterations/CopyNumberTableWrapper";
import GeneticAlterationTable from "pages/patientView/simple/GeneticAlterationTable";
import { default as ActionableAlterationsTable, MutationAndAnnotation } from "./ActionableAlterationsTable";

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
};

type DiscreteCopyNumberDataAndAnnotation = {
    discreteCopyNumberData: DiscreteCopyNumberData;
    annotation: IAnnotation;
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
    getNumberOfAlterations() {
        return this.props.mutationData.length + this.props.discreteCNAData.length;
    }
    getNumberOfDriverAlterations() {
        return this.getDrivers().length + this.getCNADrivers().length;
    }
    getNumberOfDriverAlterationsWithTreatmentInfo() {
        return this.getDriversWithTreatmentInfo().length + this.getCNADriversWithTreatmentInfo().length;
    }
    getDrivers() {
        if (this.props.oncoKbData.result) {
            const drivers = this.props.mutationData.map(
                (m:Mutation) => {
                    return {
                        "mutation":m, 
                        "annotation":AnnotationColumnFormatter.getData([m], this.props.oncoKbAnnotatedGenes, undefined, undefined, this.props.oncoKbData)
                    };
                }
            ).filter(x => x.annotation !== undefined && x.annotation.oncoKbIndicator && x.annotation.oncoKbIndicator.oncogenic);
            return drivers;
        } else {
            return [];
        }
    }
    getCNADrivers() {
        if (this.props.cnaOncoKbData.result) {
            const drivers = this.props.discreteCNAData.map(
                (cna:DiscreteCopyNumberData) => {
                    return {
                        "discreteCopyNumberData":cna,
                        "annotation":AnnotationColumnFormatterDiscreteCNA.getData([cna], this.props.oncoKbAnnotatedGenes, this.props.cnaOncoKbData)
                    };
                }
            ).filter(x => x.annotation !== undefined && x.annotation.oncoKbIndicator && x.annotation.oncoKbIndicator.oncogenic);
            return drivers;
        } else {
            return [];
        }

    }
    getDriversWithTreatmentInfo() {
        return this.getDrivers().filter(x => x.annotation.oncoKbIndicator && x.annotation.oncoKbIndicator.treatments.length > 0);
    }
    getCNADriversWithTreatmentInfo() {
        return this.getCNADrivers().filter(x => x.annotation.oncoKbIndicator && x.annotation.oncoKbIndicator.treatments.length > 0);
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
                    <p><span><b>Summary: </b></span>{this.getNumberOfAlterations()} alterations detected, including <b>{this.getNumberOfDriverAlterations()} known oncogenic</b> of which <b>{this.getNumberOfDriverAlterationsWithTreatmentInfo()} are actionable</b>.</p>
                    <div className="flex-row sample-info-record sample-info-record-drugs">
                        <div className='sample-info-card sample-info-drugs'>
                            <div className='sample-info-card-title extra-text-header'>Actionable Alterations</div>
                            <div style={{padding:20,width:900,margin:"0 auto",fontSize:"medium"}}>
                                {(this.getDriversWithTreatmentInfo().length > 0) && (
                                    <div style={{paddingTop:10}}>
                                        <ActionableAlterationsTable
                                            actionableAlterations={this.getDriversWithTreatmentInfo()}
                                            evidenceCache={this.props.evidenceCache}
                                            pubMedCache={this.props.pubMedCache}
                                            userEmailAddress={this.props.userEmailAddress}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div style={{paddingTop:15}} className="flex-row sample-info-record">
                        <div className={classNames('sample-info-card', 'genomic-alterations-card', 'mutations', {'active': this.state.show_mutations})} onClick={() => {this.setState({show_mutations:!this.state.show_mutations});}}>
                            <div className='sample-info-card-title extra-text-header'>Mutations</div>
                            <div className='sample-info-card-number'><div>{this.props.mutationData.length}</div></div>
                            <div className='sample-info-card-extra-info extra-text'>
                                <div className="extra-info-drivers extra-text">
                                    {this.getDrivers().length} oncogenic<br />
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
                                    {this.getCNADrivers().length} oncogenic<br />
                                    {this.getCNADriversWithTreatmentInfo().length} actionable<br />
                                </div>
                                <div className="extra-info-passengers extra-text"><br />FGA: 0.2</div>
                            </div>
                        </div>
                        <div className={classNames('sample-info-card', 'genomic-alterations-card', 'rearrangements', {active: this.state.show_rearrangements})} onClick={() => {this.setState({show_rearrangements:!this.state.show_rearrangements});}}>
                            <div className='sample-info-card-title extra-text-header'>Rearrangements</div>
                            <div className='sample-info-card-number'><div>-</div></div>
                            <div className='sample-info-card-extra-info extra-text'><div className="extra-info-drivers"></div><div className="extra-info-passengers extra-text">&nbsp;</div></div>
                        </div>
                    </div>
                    <div style={{width:"100%"}}>
                        {(this.state.show_mutations || this.state.show_rearrangements || this.state.show_cna) && (
                            this.getGeneticAlterationTable()
                        )}
                        {/*(this.state.show_mutations || this.state.show_rearrangements) && (
                            this.getMutationTable()
                        )}
                        {(this.state.show_cna) && (
                            this.getCopyNumberTable()
                        )*/}
                    </div>
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
            <div style={{paddingTop:30}}>
                <LoadingIndicator 
                    isLoading={(
                        (this.props.cnaStatus === 'loading') ||
                        patientViewPageStore.mutationData.isPending ||
                        patientViewPageStore.uncalledMutationData.isPending ||
                        patientViewPageStore.oncoKbAnnotatedGenes.isPending
                    )}
                />
                <GeneticAlterationTable
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
                    data={[...patientViewPageStore.mergedDiscreteCNAData, ...patientViewPageStore.mergedMutationDataIncludingUncalled]}
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