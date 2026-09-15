import React from 'react';
import { observer } from 'mobx-react-lite';
import PatientHeader from 'pages/patientView/patientHeader/PatientHeader';
import SampleSummaryList from 'pages/patientView/sampleHeader/SampleSummaryList';
import { PatientViewPageStore } from 'pages/patientView/clinicalInformation/PatientViewPageStore';
import { IGenePanelModal } from 'pages/patientView/PatientViewPage';
import { getRemoteDataGroupStatus } from 'cbioportal-utils';

interface IPatientPageHeaderProps {
    handlePatientClick: (id: string) => void;
    pageStore: PatientViewPageStore;
    handleSampleClick: (
        id: string,
        e: React.MouseEvent<HTMLAnchorElement>
    ) => void;
    toggleGenePanelModal: (genePanelId?: string | undefined) => void;
    genePanelModal: IGenePanelModal;
    sampleSummaryOverride?: React.ReactNode;
}

const PatientViewPageHeader: React.FC<IPatientPageHeaderProps> = observer(
    function(props) {
        const { pageStore } = props;
        const patient = pageStore.patientViewData.result.patient;
        const darwinUrl = pageStore.darwinUrl.result;
        const sampleManager = pageStore.sampleManager.result;
        const sampleSummary =
            props.sampleSummaryOverride ||
            (getRemoteDataGroupStatus(
                pageStore.studyMetaData,
                pageStore.hasMutationalSignatureData,
                pageStore.mutationalSignatureDataGroupByVersion,
                pageStore.allSamplesForPatient
            ) === 'complete' && (
                <SampleSummaryList
                    sampleManager={sampleManager!}
                    patientViewPageStore={pageStore}
                    handleSampleClick={props.handleSampleClick}
                    toggleGenePanelModal={props.toggleGenePanelModal}
                    genePanelModal={props.genePanelModal}
                    handlePatientClick={props.handlePatientClick}
                />
            ));

        return (
            <div className="patientDataTable">
                <table>
                    <tbody>
                        <tr>
                            <td>Patient:</td>
                            <td>
                                <PatientHeader
                                    handlePatientClick={(id: string) =>
                                        props.handlePatientClick(id)
                                    }
                                    patient={patient}
                                    studyId={pageStore.studyId}
                                    darwinUrl={darwinUrl}
                                    sampleManager={sampleManager}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td>Samples:</td>
                            <td>
                                <div className="patientSamples">{sampleSummary}</div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
);

export default PatientViewPageHeader;
