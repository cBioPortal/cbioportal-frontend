import React, { useEffect } from 'react';
import {
    deriveStructuralVariantType,
    generateQueryStructuralVariantId,
    generateQueryVariantId,
} from 'oncokb-frontend-commons';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import { IndicatorQueryResp } from 'oncokb-ts-api-client';
import { getAlterationString } from 'shared/lib/CopyNumberUtils';
import { CLINICAL_ATTRIBUTE_ID_ENUM } from 'shared/constants';
import { ClinicalData } from 'cbioportal-ts-api-client';
import WindowStore from 'shared/components/window/WindowStore';
import IFrameLoader from 'shared/components/iframeLoader/IFrameLoader';
import { observer } from 'mobx-react';

interface IPatientReportTabProps {
    patientViewPageStore: PatientViewPageStore;
}

class PatientMetadata {
    id = '';
    name = '';
    age = '';
    sex = '';
}

class AnnotatedSample {
    id: string;
    tumorType: string;
    sampleMetadata: {
        primarySite?: string;
        metastaticSite?: string;
        specimenType?: string;
    } = {};
    mutations: IndicatorQueryResp[] = [];
    copyNumberAlterations: IndicatorQueryResp[] = [];
    structuralVariants: IndicatorQueryResp[] = [];
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
                const clinicalDataGroupedBySample =
                    patientViewPageStore.clinicalDataGroupedBySample.result;

                const patientMetadata = new PatientMetadata();
                patientMetadata.id = patientViewPageStore.patientId;
                patientMetadata.sex =
                    patientViewPageStore.patientViewData.result.patient?.clinicalData.find(
                        data =>
                            data.clinicalAttributeId ===
                            CLINICAL_ATTRIBUTE_ID_ENUM.SEX
                    )?.value ?? '';

                const samples: AnnotatedSample[] = [];
                for (const mutation of patientViewPageStore.mutationData
                    .result) {
                    const tumorType =
                        patientViewPageStore.uniqueSampleKeyToTumorType[
                            mutation.uniqueSampleKey
                        ];
                    const id = generateQueryVariantId(
                        mutation.entrezGeneId,
                        tumorType,
                        mutation.proteinChange,
                        mutation.mutationType
                    );
                    const oncoKbData = patientViewPageStore.oncoKbData.result;
                    if (
                        oncoKbData instanceof Error ||
                        !oncoKbData.indicatorMap
                    ) {
                        continue;
                    }
                    const annotation = oncoKbData.indicatorMap[id];

                    const existingSample = samples.find(
                        sample => sample.id === mutation.sampleId
                    );
                    if (existingSample) {
                        existingSample.mutations.push(annotation);
                    } else {
                        const clinicalData = getClinicalData(
                            clinicalDataGroupedBySample,
                            mutation.sampleId
                        );
                        const sample = new AnnotatedSample();
                        sample.id = mutation.sampleId;
                        sample.tumorType = tumorType;
                        sample.mutations.push(annotation);
                        sample.sampleMetadata.primarySite =
                            clinicalData.PRIMARY_SITE;
                        sample.sampleMetadata.metastaticSite =
                            clinicalData.METASTATIC_SITE;
                        sample.sampleMetadata.specimenType =
                            clinicalData.SPECIMEN_TYPE;
                        samples.push(sample);
                    }
                }
                for (const copyNumberAlteration of patientViewPageStore
                    .discreteCNAData.result) {
                    const tumorType =
                        patientViewPageStore.uniqueSampleKeyToTumorType[
                            copyNumberAlteration.uniqueSampleKey
                        ];
                    const id = generateQueryVariantId(
                        copyNumberAlteration.entrezGeneId,
                        tumorType,
                        getAlterationString(copyNumberAlteration.alteration)
                    );
                    const oncoKbData =
                        patientViewPageStore.cnaOncoKbData.result;
                    if (
                        oncoKbData instanceof Error ||
                        !oncoKbData.indicatorMap
                    ) {
                        continue;
                    }
                    const annotation = oncoKbData.indicatorMap[id];

                    const existingSample = samples.find(
                        sample => sample.id === copyNumberAlteration.sampleId
                    );
                    if (existingSample) {
                        existingSample.copyNumberAlterations.push(annotation);
                    } else {
                        const clinicalData = getClinicalData(
                            clinicalDataGroupedBySample,
                            copyNumberAlteration.sampleId
                        );
                        const sample = new AnnotatedSample();
                        sample.id = copyNumberAlteration.sampleId;
                        sample.tumorType = tumorType;
                        sample.copyNumberAlterations.push(annotation);
                        sample.sampleMetadata.primarySite =
                            clinicalData.PRIMARY_SITE;
                        sample.sampleMetadata.metastaticSite =
                            clinicalData.METASTATIC_SITE;
                        sample.sampleMetadata.specimenType =
                            clinicalData.SPECIMEN_TYPE;
                        samples.push(sample);
                    }
                }
                for (const structuralVariant of patientViewPageStore
                    .structuralVariantData.result) {
                    const tumorType =
                        patientViewPageStore.uniqueSampleKeyToTumorType[
                            structuralVariant.uniqueSampleKey
                        ];
                    const id = generateQueryStructuralVariantId(
                        structuralVariant.site1EntrezGeneId,
                        structuralVariant.site2EntrezGeneId,
                        tumorType,
                        deriveStructuralVariantType(structuralVariant)
                    );
                    const oncoKbData =
                        patientViewPageStore.structuralVariantOncoKbData.result;
                    if (
                        oncoKbData instanceof Error ||
                        !oncoKbData.indicatorMap
                    ) {
                        continue;
                    }
                    const annotation = oncoKbData.indicatorMap[id];

                    const existingSample = samples.find(
                        sample => sample.id === structuralVariant.sampleId
                    );
                    if (existingSample) {
                        existingSample.structuralVariants.push(annotation);
                    } else {
                        const clinicalData = getClinicalData(
                            clinicalDataGroupedBySample,
                            structuralVariant.sampleId
                        );
                        const sample = new AnnotatedSample();
                        sample.id = structuralVariant.sampleId;
                        sample.tumorType = tumorType;
                        sample.structuralVariants.push(annotation);
                        sample.sampleMetadata.primarySite =
                            clinicalData.PRIMARY_SITE;
                        sample.sampleMetadata.metastaticSite =
                            clinicalData.METASTATIC_SITE;
                        sample.sampleMetadata.specimenType =
                            clinicalData.SPECIMEN_TYPE;
                        samples.push(sample);
                    }
                }

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

type RelevantClinicalData = {
    [key in
        | CLINICAL_ATTRIBUTE_ID_ENUM.PRIMARY_SITE
        | CLINICAL_ATTRIBUTE_ID_ENUM.METASTATIC_SITE
        | CLINICAL_ATTRIBUTE_ID_ENUM.SPECIMEN_TYPE]: string | undefined;
};

function getClinicalData(
    clinicalDataGroupedBySample: { id: string; clinicalData: ClinicalData[] }[],
    sampleId: string
): RelevantClinicalData {
    const clinicalData: RelevantClinicalData = {
        [CLINICAL_ATTRIBUTE_ID_ENUM.PRIMARY_SITE]: undefined,
        [CLINICAL_ATTRIBUTE_ID_ENUM.METASTATIC_SITE]: undefined,
        [CLINICAL_ATTRIBUTE_ID_ENUM.SPECIMEN_TYPE]: undefined,
    };

    const data = clinicalDataGroupedBySample.find(data => data.id === sampleId);
    if (!data) {
        return clinicalData;
    }

    for (const d of data.clinicalData) {
        switch (d.clinicalAttributeId) {
            case CLINICAL_ATTRIBUTE_ID_ENUM.PRIMARY_SITE:
                clinicalData[CLINICAL_ATTRIBUTE_ID_ENUM.PRIMARY_SITE] = d.value;
                break;
            case CLINICAL_ATTRIBUTE_ID_ENUM.METASTATIC_SITE:
                clinicalData[CLINICAL_ATTRIBUTE_ID_ENUM.METASTATIC_SITE] =
                    d.value;
                break;
            case CLINICAL_ATTRIBUTE_ID_ENUM.SPECIMEN_TYPE:
                clinicalData[CLINICAL_ATTRIBUTE_ID_ENUM.SPECIMEN_TYPE] =
                    d.value;
        }
    }

    return clinicalData;
}
