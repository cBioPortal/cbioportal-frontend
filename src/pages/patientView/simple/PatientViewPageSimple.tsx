import * as React from 'react';
import { default as ReactBootstrap, Grid, Row, Col, Label} from 'react-bootstrap';
import PatientViewPage, { IPatientViewPageProps } from './../PatientViewPage';

import './patientSimple.scss';

import {observer, inject } from "mobx-react";
import SampleManager from 'pages/patientView/sampleManager';
import PatientHeader from 'pages/patientView/patientHeader/PatientHeader';
import SampleHeader from 'pages/patientView/sampleHeader/SampleHeader';
import SampleRecord from 'pages/patientView/simple/SampleRecord';
import _ from 'lodash';
import { ClinicalDataBySampleId } from 'shared/api/api-types-extended';
import { computed } from 'mobx';
import AppConfig from 'appConfig';

@inject('routing')
@observer
export default class PatientViewPageSimple extends React.Component<IPatientViewPageProps, {}> {
    static readonly patientViewPageStore = PatientViewPage.patientViewPageStore;

    constructor(props: IPatientViewPageProps) {
        super(props);
        PatientViewPage.initPatientViewPage(props, PatientViewPageSimple.patientViewPageStore);
        (window as any).patientViewPageStore = PatientViewPage.patientViewPageStore;
    }

    @computed get cnaStatus() {
        if (PatientViewPage.patientViewPageStore.molecularProfileIdDiscrete.isComplete) {
            if (PatientViewPage.patientViewPageStore.molecularProfileIdDiscrete.result === undefined) {
                return "unavailable";
            } else if (PatientViewPage.patientViewPageStore.discreteCNAData.isComplete) {
                return "available";
            } else {
                return "loading";
            }
        } else {
            return "loading";
        }
    }

    public render() {
        const patientViewPageStore = PatientViewPage.patientViewPageStore;

        let sampleManager: SampleManager | null = null;

        if (patientViewPageStore.patientViewData.isComplete && patientViewPageStore.studyMetaData.isComplete) {
            const patientData = patientViewPageStore.patientViewData.result;
            if (patientViewPageStore.clinicalEvents.isComplete && patientViewPageStore.clinicalEvents.result.length > 0) {
                sampleManager = new SampleManager(patientData.samples!, patientViewPageStore.clinicalEvents.result);
            } else {
                sampleManager = new SampleManager(patientData.samples!);
            }
            (window as any).sampleManager = sampleManager;
        }

        const sampleRecords = _.map(sampleManager!.samples, (sample: ClinicalDataBySampleId) => {
                return (
                    <SampleRecord
                        sample={sample}
                        sampleManager={sampleManager}
                        handleSampleClick={(() => void 0)}
                        studyId={patientViewPageStore.studyMetaData.result!.studyId}
                        mutationData={patientViewPageStore.mutationData.result!.filter(((mut) => mut.sampleId === sample.id))}
                        cnaStatus={this.cnaStatus}
                        discreteCNAData={patientViewPageStore.discreteCNAData.result}
                        oncoKbData={patientViewPageStore.oncoKbData}
                        cnaOncoKbData={patientViewPageStore.cnaOncoKbData}
                        oncoKbAnnotatedGenes={patientViewPageStore.oncoKbAnnotatedGenes.result}
                        evidenceCache={patientViewPageStore.oncoKbEvidenceCache}
                        pubMedCache={patientViewPageStore.pubMedCache}
                        userEmailAddress={AppConfig.userEmailAddress}
                        patientViewPageStore={patientViewPageStore}
                    />
                );
        });

        return (
            <div className="flex-container">
                <div className="flex-row">
                    <div className="patient-header">
                        <div className="patient-text">
                            {  (patientViewPageStore.patientViewData.isComplete) && (
                                <PatientHeader
                                            handlePatientClick={((id: string) => void 0)}
                                            patient={patientViewPageStore.patientViewData.result.patient}
                                            studyId={patientViewPageStore.studyId}
                                            darwinUrl={patientViewPageStore.darwinUrl.result}
                                            sampleManager={sampleManager}
                                            showIcon={true}/>
                            ) }
                        </div>
                    </div>
                </div>
                {sampleRecords.map((rec:JSX.Element) => {
                    return (
                        <div>
                            <div className="flex-row">
                                <div className="line-in-middle">
                                &nbsp;
                                </div>
                            </div>
                            {rec}
                        </div>
                    );
                })}
            </div>
        );
    }
}