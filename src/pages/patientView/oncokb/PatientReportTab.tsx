import { observer } from 'mobx-react';
import React, { useEffect } from 'react';
import IFrameLoader from 'shared/components/iframeLoader/IFrameLoader';
import WindowStore from 'shared/components/window/WindowStore';
import { CLINICAL_ATTRIBUTE_ID_ENUM } from 'shared/constants';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import { getAnnotatedSamples } from './PatientReportUtils';

interface IPatientReportTabProps {
    patientViewPageStore: PatientViewPageStore;
}

class PatientMetadata {
    id = '';
    name = '';
    age = '';
    sex = '';
}

const IFRAME_NAME = 'patient-report-iframe';

const PatientReportTab = observer(
    ({ patientViewPageStore }: IPatientReportTabProps) => {
        const isDataComplete =
            patientViewPageStore.clinicalDataGroupedBySample.isComplete &&
            patientViewPageStore.patientViewData.isComplete &&
            patientViewPageStore.mutationData.isComplete &&
            patientViewPageStore.oncoKbData.isComplete &&
            patientViewPageStore.discreteCNAData.isComplete &&
            patientViewPageStore.cnaOncoKbData.isComplete &&
            patientViewPageStore.structuralVariantData.isComplete &&
            patientViewPageStore.structuralVariantOncoKbData.isComplete;

        useEffect(() => {
            if (isDataComplete) {
                const patientMetadata = new PatientMetadata();
                patientMetadata.id = patientViewPageStore.patientId;
                patientMetadata.sex =
                    patientViewPageStore.patientViewData.result.patient?.clinicalData.find(
                        data =>
                            data.clinicalAttributeId ===
                            CLINICAL_ATTRIBUTE_ID_ENUM.SEX
                    )?.value ?? '';

                const samples = getAnnotatedSamples(
                    patientViewPageStore.clinicalDataGroupedBySample.result,
                    patientViewPageStore.uniqueSampleKeyToTumorType,
                    patientViewPageStore.mutationData.result,
                    patientViewPageStore.oncoKbData.result,
                    patientViewPageStore.discreteCNAData.result,
                    patientViewPageStore.cnaOncoKbData.result,
                    patientViewPageStore.structuralVariantData.result,
                    patientViewPageStore.structuralVariantOncoKbData.result
                );

                const form = document.createElement('form');
                form.method = 'POST';
                form.action =
                    'https://beta.report.oncokb.org/report/cbioportal';
                form.target = IFRAME_NAME;

                let input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'annotatedSamples';
                input.value = JSON.stringify(samples);
                form.appendChild(input);

                input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'patientMetadata';
                input.value = JSON.stringify(patientMetadata);
                form.appendChild(input);

                document.body.appendChild(form);
                form.submit();
                document.body.removeChild(form);
            }
        }, [isDataComplete]);

        return (
            <div>
                <IFrameLoader
                    height={WindowStore.size.height - 220}
                    name={IFRAME_NAME}
                />
            </div>
        );
    }
);
export default PatientReportTab;
