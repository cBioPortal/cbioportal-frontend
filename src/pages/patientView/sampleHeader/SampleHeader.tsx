import SampleManager from "pages/patientView/sampleManager";
import { ClinicalDataBySampleId } from "shared/api/api-types-extended";
import React from "react";
import { getMouseIcon } from "pages/patientView/SVGIcons";
import { getSpanElementsFromCleanData } from "pages/patientView/clinicalInformation/lib/clinicalAttributesUtil";
import SignificantMutationalSignatures from "./SignificantMutationalSignatures";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import {PatientViewPageStore} from "./../clinicalInformation/PatientViewPageStore";

export type ISampleHeaderProps = {
    sample: ClinicalDataBySampleId;
    sampleManager?: SampleManager | null;
    studyId: string;
    handleSampleClick: any;
    iconSize?: number;
    patientViewPageStore: PatientViewPageStore;
};

export default class SampleHeader extends React.Component<ISampleHeaderProps, {}> {
    render() {
        const sampleManager = this.props.sampleManager;
        const sample = this.props.sample;
        const studyId = this.props.studyId;
        const patientViewPageStore = this.props.patientViewPageStore;

        const isPDX:boolean = (sampleManager &&
            sampleManager.clinicalDataLegacyCleanAndDerived &&
            sampleManager.clinicalDataLegacyCleanAndDerived[sample.id] &&
            sampleManager.clinicalDataLegacyCleanAndDerived[sample.id].DERIVED_NORMALIZED_CASE_TYPE === 'Xenograft'
        );

        return (
            <div className="patientSample">
                <span className='clinical-spans'>
                    {
                        this.props.sampleManager!.getComponentForSample(
                            this.props.sample.id, 1, '',
                            <span style={{display:'inline-flex'}}>
                                {'\u00A0'}
                                {isPDX && getMouseIcon()}
                                {isPDX && '\u00A0'}
                                <a
                                    href={`case.do?#/patient?sampleId=${sample.id}&studyId=${studyId}`}
                                    target="_blank"
                                    onClick={(e: React.MouseEvent<HTMLAnchorElement>) => this.props.handleSampleClick(sample.id, e)}
                                >
                                    {sample.id}
                                </a>
                                {sampleManager &&
                                sampleManager.clinicalDataLegacyCleanAndDerived[sample.id] &&
                                getSpanElementsFromCleanData(sampleManager.clinicalDataLegacyCleanAndDerived[sample.id], studyId)}
                            </span>,
                            this.props.iconSize
                        )
                    }
                </span>
                {patientViewPageStore.hasMutationalSignatureData.result === true &&
                <LoadingIndicator isLoading={patientViewPageStore.mutationalSignatureData.isPending && patientViewPageStore.mutationalSignatureMetaData.isPending}/>}

                {patientViewPageStore.hasMutationalSignatureData.result === true &&
                patientViewPageStore.clinicalDataGroupedBySample.isComplete && patientViewPageStore.mutationalSignatureData.isComplete &&
                patientViewPageStore.mutationalSignatureMetaData.isComplete &&
                (<SignificantMutationalSignatures data={patientViewPageStore.mutationalSignatureData.result}
                                                  metadata={patientViewPageStore.mutationalSignatureMetaData.result} uniqueSampleKey={sample.id}/>)}
            </div>
        );
    }
}