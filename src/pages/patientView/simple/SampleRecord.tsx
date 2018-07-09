import React from "react";
import { ClinicalDataBySampleId } from "shared/api/api-types-extended";
import SampleManager from "pages/patientView/sampleManager";
import SampleHeader from "pages/patientView/sampleHeader/SampleHeader";
import { PatientViewPageStore } from "pages/patientView/clinicalInformation/PatientViewPageStore";
import { Mutation, DiscreteCopyNumberData } from "shared/api/generated/CBioPortalAPI";
import { IOncoKbData } from "shared/model/OncoKB";
import AnnotationColumnFormatter from "shared/components/mutationTable/column/AnnotationColumnFormatter";
import DrugInfo from "pages/patientView/simple/DrugInfo";

export type ISampleRecordProps = {
    sample: ClinicalDataBySampleId;
    sampleManager?: SampleManager | null;
    studyId: string;
    handleSampleClick: any;
    mutationData: Mutation[];
    discreteCNAData: DiscreteCopyNumberData[];
    cnaStatus: string;
    oncoKbData: IOncoKbData;
};

export default class SampleRecord extends React.Component<ISampleRecordProps, {}> {
    getDrivers() {
        const drivers = this.props.mutationData.map(
            (m:Mutation) => AnnotationColumnFormatter.getIndicatorData(m, this.props.oncoKbData)
        ).filter(x => x !== undefined && x.oncogenic);
        return drivers;
    }
    getDriversWithTreatmentInfo() {
        return this.getDrivers().filter(x => x && x.treatments.length > 0);
    }
    render() {
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
                <div className="flex-row sample-info-record">
                    <div className='sample-info-card'>
                        <div className='sample-info-card-title extra-text-header'>Mutations</div>
                        <div className='sample-info-card-number'><div>{this.props.mutationData.length}</div></div>
                        <div className='sample-info-card-extra-info extra-text'><div className="extra-info-drivers extra-text">{this.getDrivers().length} driver{this.getDrivers().length > 1? "s":""}</div><div className="extra-info-passengers extra-text"></div></div>
                    </div>
                    <div className='sample-info-card'>
                        <div className='sample-info-card-title extra-text-header'>Copy number</div>
                        <div className='sample-info-card-number'><div>{this.props.cnaStatus === "available"? this.props.discreteCNAData.length : "-"}</div></div>
                        <div className='sample-info-card-extra-info extra-text'><div className="extra-info-drivers extra-text"></div><div className="extra-info-passengers extra-text"></div></div>
                    </div>
                    <div className='sample-info-card'>
                        <div className='sample-info-card-title extra-text-header'>Rearrangements</div>
                        <div className='sample-info-card-number'><div>-</div></div>
                        <div className='sample-info-card-extra-info extra-text'><div className="extra-info-drivers"></div><div className="extra-info-passengers extra-text">&nbsp;</div></div>
                    </div>
                </div>
                {(this.getDriversWithTreatmentInfo().length > 0) && (
                    <div className="flex-row sample-info-record sample-info-record-drugs">
                        <div className='sample-info-card sample-info-drugs'>
                            <div className='sample-info-card-title extra-text-header'>Drug info</div>
                            {this.getDriversWithTreatmentInfo().map((driver) => {
                                return <DrugInfo indicator={driver} />;
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    }
}