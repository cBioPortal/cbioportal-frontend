import React, { useEffect } from 'react';
import {
    deriveStructuralVariantType,
    generateQueryStructuralVariantId,
    generateQueryVariantId,
    IOncoKbData,
} from 'oncokb-frontend-commons';
import { PatientViewPageStore } from '../clinicalInformation/PatientViewPageStore';
import { IndicatorQueryResp } from 'oncokb-ts-api-client';
import { Alterations, getAlterationString } from 'shared/lib/CopyNumberUtils';
import {
    AlterationTypeConstants,
    CLINICAL_ATTRIBUTE_ID_ENUM,
} from 'shared/constants';
import {
    ClinicalData,
    DiscreteCopyNumberData,
    Mutation,
    StructuralVariant,
} from 'cbioportal-ts-api-client';
import WindowStore from 'shared/components/window/WindowStore';
import IFrameLoader from 'shared/components/iframeLoader/IFrameLoader';
import { observer } from 'mobx-react';
import { buildProteinChange } from 'shared/lib/StoreUtils';

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

type RelevantClinicalData = {
    [key in
        | CLINICAL_ATTRIBUTE_ID_ENUM.PRIMARY_SITE
        | CLINICAL_ATTRIBUTE_ID_ENUM.METASTATIC_SITE
        | CLINICAL_ATTRIBUTE_ID_ENUM.SPECIMEN_TYPE]: string | undefined;
};

function getAnnotatedSamples(
    clinicalDataGroupedBySample: { id: string; clinicalData: ClinicalData[] }[],
    uniqueSampleKeyToTumorType: { [sampleId: string]: string },
    mutations: Mutation[],
    mutationsOncoKbData: Error | IOncoKbData,
    copyNumberAlterations: DiscreteCopyNumberData[],
    copyNumberAlterationsOncoKbData: Error | IOncoKbData,
    structuralVariants: StructuralVariant[],
    structuralVariantsOncoKbData: Error | IOncoKbData
) {
    const samples: AnnotatedSample[] = [];

    if (
        !(mutationsOncoKbData instanceof Error) &&
        mutationsOncoKbData.indicatorMap
    ) {
        for (const mutation of mutations) {
            const tumorType =
                uniqueSampleKeyToTumorType[mutation.uniqueSampleKey];
            const id = generateQueryVariantId(
                mutation.entrezGeneId,
                tumorType,
                mutation.proteinChange,
                mutation.mutationType
            );
            const annotation =
                mutationsOncoKbData.indicatorMap[id] ||
                constructIndicatorQueryResp(mutation);

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
                sample.sampleMetadata.primarySite = clinicalData.PRIMARY_SITE;
                sample.sampleMetadata.metastaticSite =
                    clinicalData.METASTATIC_SITE;
                sample.sampleMetadata.specimenType = clinicalData.SPECIMEN_TYPE;
                samples.push(sample);
            }
        }
    }

    if (
        !(copyNumberAlterationsOncoKbData instanceof Error) &&
        copyNumberAlterationsOncoKbData.indicatorMap
    ) {
        for (const copyNumberAlteration of copyNumberAlterations) {
            const tumorType =
                uniqueSampleKeyToTumorType[
                    copyNumberAlteration.uniqueSampleKey
                ];
            const id = generateQueryVariantId(
                copyNumberAlteration.entrezGeneId,
                tumorType,
                getAlterationString(copyNumberAlteration.alteration)
            );
            const annotation =
                copyNumberAlterationsOncoKbData.indicatorMap[id] ||
                constructIndicatorQueryResp(copyNumberAlteration);

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
                sample.sampleMetadata.primarySite = clinicalData.PRIMARY_SITE;
                sample.sampleMetadata.metastaticSite =
                    clinicalData.METASTATIC_SITE;
                sample.sampleMetadata.specimenType = clinicalData.SPECIMEN_TYPE;
                samples.push(sample);
            }
        }
    }

    if (
        !(structuralVariantsOncoKbData instanceof Error) &&
        structuralVariantsOncoKbData.indicatorMap
    ) {
        for (const structuralVariant of structuralVariants) {
            const tumorType =
                uniqueSampleKeyToTumorType[structuralVariant.uniqueSampleKey];
            const id = generateQueryStructuralVariantId(
                structuralVariant.site1EntrezGeneId,
                structuralVariant.site2EntrezGeneId,
                tumorType,
                deriveStructuralVariantType(structuralVariant)
            );
            const annotation =
                structuralVariantsOncoKbData.indicatorMap[id] ||
                constructIndicatorQueryResp(structuralVariant);

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
                sample.sampleMetadata.primarySite = clinicalData.PRIMARY_SITE;
                sample.sampleMetadata.metastaticSite =
                    clinicalData.METASTATIC_SITE;
                sample.sampleMetadata.specimenType = clinicalData.SPECIMEN_TYPE;
                samples.push(sample);
            }
        }
    }

    return samples;
}

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

function constructIndicatorQueryResp(
    alt: Mutation | DiscreteCopyNumberData | StructuralVariant
): IndicatorQueryResp {
    const isStructuralVariant = 'site1HugoSymbol' in alt;

    let hugoSymbol = '';
    let entrezGeneId = 0;
    if ('gene' in alt) {
        hugoSymbol = alt.gene.hugoGeneSymbol;
        entrezGeneId = alt.gene.entrezGeneId;
    } else if (isStructuralVariant) {
        hugoSymbol = alt.site1HugoSymbol;
        entrezGeneId = alt.site1EntrezGeneId;
    }

    let alteration = '';
    if ('proteinChange' in alt) {
        alteration = alt.proteinChange;
    } else if ('alteration' in alt) {
        alteration =
            Object.keys(Alterations).find(
                cna =>
                    Alterations[cna as keyof typeof Alterations] ===
                    alt.alteration
            ) || '';
    } else if (isStructuralVariant) {
        alteration = buildProteinChange(alt);
    }

    let alterationType = '';
    if ('mutationType' in alt) {
        alterationType = alt.mutationType;
    } else if ('site2HugoSymbol' in alt) {
        alterationType = AlterationTypeConstants.STRUCTURAL_VARIANT;
    }

    return {
        query: {
            id: '',
            referenceGenome: 'GRCh37', // TODO
            hugoSymbol,
            entrezGeneId,
            alteration,
            alterationType,
            svType:
                'variantClass' in alt
                    ? (alt.variantClass as IndicatorQueryResp['query']['svType'])
                    : 'UNKNOWN',
            tumorType: '',
            consequence: isStructuralVariant ? 'fusion' : '',
            proteinStart: 0,
            proteinEnd: 0,
            hgvs: '',
        },
        geneExist: false,
        variantExist: false,
        alleleExist: false,
        oncogenic: 'Unknown',
        mutationEffect: {
            knownEffect: 'Unknown',
            description: '',
            citations: {
                pmids: [],
                abstracts: [],
            },
        },
        highestSensitiveLevel: 'NO',
        highestResistanceLevel: 'NO',
        highestDiagnosticImplicationLevel: 'NO',
        highestPrognosticImplicationLevel: 'NO',
        highestFdaLevel: 'NO',
        otherSignificantSensitiveLevels: [],
        otherSignificantResistanceLevels: [],
        hotspot: false,
        geneSummary: '',
        variantSummary: '',
        tumorTypeSummary: '',
        prognosticSummary: '',
        diagnosticSummary: '',
        diagnosticImplications: [],
        prognosticImplications: [],
        treatments: [],
        dataVersion: '',
        lastUpdate: '',
        vus: false,
    };
}
