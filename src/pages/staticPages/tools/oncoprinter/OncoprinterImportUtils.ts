import {
    ClinicalTrackDatum,
    GeneticTrackDatum,
    GeneticTrackDatum_Data,
} from '../../../../shared/components/oncoprint/Oncoprint';
import {
    isType2,
    OncoprinterGeneticInputLine,
    OncoprinterGeneticInputLineType2,
} from './OncoprinterGeneticUtils';
import {
    ClinicalAttribute,
    ClinicalData,
    PatientIdentifier,
    SampleIdentifier,
} from 'cbioportal-ts-api-client';
import { isNotGermlineMutation } from '../../../../shared/lib/MutationUtils';
import { AlterationTypeConstants } from '../../../resultsView/ResultsViewPageStore';
import { getOncoprintMutationType } from '../../../../shared/components/oncoprint/DataUtils';
import { cna_profile_data_to_string } from '../../../../shared/lib/oql/AccessorsForOqlFilter';
import {
    ClinicalTrackDataType,
    ONCOPRINTER_CLINICAL_VAL_NA,
    OncoprinterClinicalInputLine,
} from './OncoprinterClinicalUtils';
import _ from 'lodash';
import { PUTATIVE_DRIVER } from '../../../../shared/constants';
import {
    MUTATION_SPECTRUM_CATEGORIES,
    SpecialAttribute,
} from '../../../../shared/cache/ClinicalDataCache';

const geneticAlterationToDataType: {
    [alterationType in OncoprinterGeneticInputLineType2['alteration']]: string;
} = {
    missense: AlterationTypeConstants.MUTATION_EXTENDED,
    inframe: AlterationTypeConstants.MUTATION_EXTENDED,
    fusion: AlterationTypeConstants.FUSION,
    promoter: AlterationTypeConstants.MUTATION_EXTENDED,
    trunc: AlterationTypeConstants.MUTATION_EXTENDED,
    other: AlterationTypeConstants.MUTATION_EXTENDED,
    amp: AlterationTypeConstants.COPY_NUMBER_ALTERATION,
    homdel: AlterationTypeConstants.COPY_NUMBER_ALTERATION,
    gain: AlterationTypeConstants.COPY_NUMBER_ALTERATION,
    hetloss: AlterationTypeConstants.COPY_NUMBER_ALTERATION,
    mrnaHigh: AlterationTypeConstants.MRNA_EXPRESSION,
    mrnaLow: AlterationTypeConstants.MRNA_EXPRESSION,
    protHigh: AlterationTypeConstants.PROTEIN_LEVEL,
    protLow: AlterationTypeConstants.PROTEIN_LEVEL,
};

function getOncoprinterParsedGeneticInputLine(
    d: GeneticTrackDatum_Data,
    caseId: string
): OncoprinterGeneticInputLine {
    const alteration = getOncoprinterGeneticAlteration(d);
    if (alteration) {
        const oncoprinterInput: Partial<OncoprinterGeneticInputLineType2> = {};
        oncoprinterInput.sampleId = caseId;
        oncoprinterInput.hugoGeneSymbol = d.hugoGeneSymbol;
        oncoprinterInput.alteration = alteration;
        oncoprinterInput.proteinChange = d.proteinChange;
        oncoprinterInput.isGermline = !isNotGermlineMutation(d);
        oncoprinterInput.isCustomDriver = d.driverFilter === PUTATIVE_DRIVER;
        return oncoprinterInput as OncoprinterGeneticInputLineType2;
    } else {
        return { sampleId: caseId };
    }
}

function getOncoprinterGeneticAlteration(d: GeneticTrackDatum_Data) {
    let alteration:
        | OncoprinterGeneticInputLineType2['alteration']
        | null = null;
    switch (d.molecularProfileAlterationType) {
        case AlterationTypeConstants.MUTATION_EXTENDED:
            alteration = getOncoprintMutationType(d);
            break;
        case AlterationTypeConstants.COPY_NUMBER_ALTERATION:
            alteration = cna_profile_data_to_string[d.value];
            break;
        case AlterationTypeConstants.MRNA_EXPRESSION:
            if (d.alterationSubType === 'high') {
                alteration = 'mrnaHigh';
            } else if (d.alterationSubType === 'low') {
                alteration = 'mrnaLow';
            }
            break;
        case AlterationTypeConstants.PROTEIN_LEVEL:
            if (d.alterationSubType === 'high') {
                alteration = 'protHigh';
            } else if (d.alterationSubType === 'low') {
                alteration = 'protLow';
            }
            break;
    }
    return alteration;
}

function getOncoprinterGeneticInputLine(parsed: OncoprinterGeneticInputLine) {
    const line = [parsed.sampleId];
    if (isType2(parsed)) {
        line.push(parsed.hugoGeneSymbol);
        switch (geneticAlterationToDataType[parsed.alteration]) {
            case AlterationTypeConstants.MUTATION_EXTENDED:
                line.push(parsed.proteinChange || 'mutation');
                line.push(
                    parsed.alteration.toUpperCase() +
                        (parsed.isGermline ? '_GERMLINE' : '') +
                        (parsed.isCustomDriver ? '_DRIVER' : '')
                );
                break;
            case AlterationTypeConstants.COPY_NUMBER_ALTERATION:
                line.push(parsed.alteration.toUpperCase());
                line.push('CNA');
                break;
            case AlterationTypeConstants.MRNA_EXPRESSION:
                line.push(parsed.alteration === 'mrnaHigh' ? 'HIGH' : 'LOW');
                line.push('EXP');
                break;
            case AlterationTypeConstants.PROTEIN_LEVEL:
                line.push(parsed.alteration === 'protHigh' ? 'HIGH' : 'LOW');
                line.push('PROT');
                break;
            case AlterationTypeConstants.FUSION:
                line.push(parsed.proteinChange || 'fusion');
                line.push('FUSION');
                break;
        }
    }
    return line.join('  ');
}

export function getOncoprinterGeneticInput(
    oncoprintData: GeneticTrackDatum[],
    caseIds: string[],
    sampleOrPatient: 'sample' | 'patient'
) {
    const parsedLines = [];
    for (const oncoprintDatum of oncoprintData) {
        parsedLines.push(
            ...oncoprintDatum.data.map(d => {
                return getOncoprinterParsedGeneticInputLine(d, oncoprintDatum[
                    sampleOrPatient
                ] as string);
            })
        );
    }
    return parsedLines
        .map(getOncoprinterGeneticInputLine)
        .concat(caseIds)
        .join('\n');
}

function sanitizeColumnData(s: string) {
    return s.replace(/\s+/g, '_');
}

export function getOncoprinterClinicalInput(
    data: ClinicalTrackDatum[],
    caseIds: string[],
    attributeIds: string[],
    attributeIdToAttribute: { [attributeId: string]: ClinicalAttribute },
    sampleOrPatient: 'sample' | 'patient'
): string {
    const caseToClinicalData = _.groupBy(data, d => d[sampleOrPatient]);

    const rows: any[] = [];
    // header row
    rows.push(
        ['Sample'].concat(
            attributeIds.map(attributeId => {
                const attribute = attributeIdToAttribute[attributeId];
                const name = sanitizeColumnData(attribute.displayName);
                let datatype = attribute.datatype.toLowerCase();
                if (attribute.clinicalAttributeId === 'MUTATION_COUNT') {
                    datatype = ClinicalTrackDataType.LOG_NUMBER;
                }
                if (
                    attribute.clinicalAttributeId ===
                    SpecialAttribute.MutationSpectrum
                ) {
                    datatype = MUTATION_SPECTRUM_CATEGORIES.join('/');
                }
                return `${name}(${datatype})`;
            })
        )
    );
    // data
    for (const caseId of caseIds) {
        rows.push(
            [caseId as any].concat(
                attributeIds.map(attributeId => {
                    const datum =
                        caseToClinicalData[caseId] &&
                        caseToClinicalData[caseId].find(
                            d => d.attr_id === attributeId
                        );

                    if (!datum || datum.na || !datum.attr_val) {
                        return ONCOPRINTER_CLINICAL_VAL_NA;
                    }

                    if (attributeId === SpecialAttribute.MutationSpectrum) {
                        return MUTATION_SPECTRUM_CATEGORIES.map(category => {
                            return (datum.attr_val as ClinicalTrackDatum['attr_val_counts'])[
                                category
                            ];
                        }).join('/');
                    } else {
                        return sanitizeColumnData(datum.attr_val.toString());
                    }
                })
            )
        );
    }

    return rows.map(row => row.join('  ')).join('\n');
}
