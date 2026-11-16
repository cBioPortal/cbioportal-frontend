import React from 'react';
import { observer } from 'mobx-react-lite';
import PatientHeader from 'pages/patientView/patientHeader/PatientHeader';
import SampleSummaryList from 'pages/patientView/sampleHeader/SampleSummaryList';
import { PatientViewPageStore } from 'pages/patientView/clinicalInformation/PatientViewPageStore';
import { IGenePanelModal } from 'pages/patientView/PatientViewPage';
import { getRemoteDataGroupStatus } from 'cbioportal-utils';
import ImmuneSignatureClassBar from 'pages/patientView/immuneSignature/ImmuneSignatureClassBar';

interface IPatientPageHeaderProps {
    handlePatientClick: (id: string) => void;
    pageStore: PatientViewPageStore;
    handleSampleClick: (
        id: string,
        e: React.MouseEvent<HTMLAnchorElement>
    ) => void;
    toggleGenePanelModal: (genePanelId?: string | undefined) => void;
    genePanelModal: IGenePanelModal;
}

const PatientViewPageHeader: React.FC<IPatientPageHeaderProps> = observer(
    function(props) {
        const sampleManager = props.pageStore.sampleManager.result;
        const immuneSignatureBySample =
            props.pageStore.immuneSignatureStore.immuneSignatureBySample.result;
        const activeSampleIds = sampleManager
            ? sampleManager.getActiveSampleIdsInOrder()
            : [];
        const immuneSignatureSampleIds = activeSampleIds.some(
            id => id in immuneSignatureBySample
        )
            ? activeSampleIds
            : [];
        return (
            <div className="patientDataTable">
                <table>
                    <tr>
                        <td>Patient:</td>
                        <td>
                            <PatientHeader
                                handlePatientClick={(id: string) =>
                                    props.handlePatientClick(id)
                                }
                                patient={
                                    props.pageStore.patientViewData.result
                                        .patient
                                }
                                studyId={props.pageStore.studyId}
                                darwinUrl={props.pageStore.darwinUrl.result}
                                sampleManager={
                                    props.pageStore.sampleManager.result
                                }
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>Samples:</td>
                        <td>
                            <div className="patientSamples">
                                {getRemoteDataGroupStatus(
                                    props.pageStore.studyMetaData,
                                    props.pageStore.hasMutationalSignatureData,
                                    props.pageStore
                                        .mutationalSignatureDataGroupByVersion,
                                    props.pageStore.allSamplesForPatient
                                ) === 'complete' && (
                                    <SampleSummaryList
                                        sampleManager={
                                            props.pageStore.sampleManager
                                                .result!
                                        }
                                        patientViewPageStore={props.pageStore}
                                        handleSampleClick={
                                            props.handleSampleClick
                                        }
                                        toggleGenePanelModal={
                                            props.toggleGenePanelModal
                                        }
                                        genePanelModal={props.genePanelModal}
                                        handlePatientClick={
                                            props.handlePatientClick
                                        }
                                    />
                                )}
                            </div>
                        </td>
                    </tr>
                    {immuneSignatureSampleIds.length > 0 && (
                        <tr>
                            <td>Immune Signature:</td>
                            <td>
                                {immuneSignatureSampleIds.map(sampleId => (
                                    <span
                                        key={sampleId}
                                        style={{ marginRight: 16 }}
                                    >
                                        {sampleManager!.getComponentForSample(
                                            sampleId
                                        )}{' '}
                                        {immuneSignatureBySample[sampleId] ? (
                                            <ImmuneSignatureClassBar
                                                signature={
                                                    immuneSignatureBySample[
                                                        sampleId
                                                    ]
                                                }
                                            />
                                        ) : (
                                            <span
                                                data-test="immune-signature-header-no-data"
                                                style={{ color: '#999' }}
                                            >
                                                No data
                                            </span>
                                        )}
                                    </span>
                                ))}
                            </td>
                        </tr>
                    )}
                </table>
            </div>
        );
    }
);

export default PatientViewPageHeader;
