import * as _ from 'lodash';
import { Mutation } from 'cbioportal-ts-api-client';

/**
 * Utility functions to generate mock data.
 *
 * @author Selcuk Onur Sumer
 */

export function emptyMutation(): Mutation {
    return {
        aminoAcidChange: '',
        center: '',
        endPosition: -1,
        entrezGeneId: -1,
        fisValue: -1,
        functionalImpactScore: '',
        gene: {
            geneticEntityId: -1,
            entrezGeneId: -1,
            hugoGeneSymbol: '',
            type: '',
        },
        alleleSpecificCopyNumber: {
            ascnIntegerCopyNumber: -1,
            ascnMethod: '',
            ccfMCopies: -1,
            ccfMCopiesUpper: -1,
            clonal: false,
            minorCopyNumber: -1,
            mutantCopies: -1,
            totalCopyNumber: -1,
        },
        molecularProfileId: '',
        keyword: '',
        linkMsa: '',
        linkPdb: '',
        linkXvar: '',
        mutationStatus: '',
        mutationType: '',
        ncbiBuild: '',
        normalAltCount: -1,
        normalRefCount: -1,
        proteinChange: '',
        proteinPosEnd: -1,
        proteinPosStart: -1,
        referenceAllele: '',
        refseqMrnaId: '',
        sampleId: '',
        patientId: '',
        studyId: '',
        uniqueSampleKey: '',
        uniquePatientKey: '',
        startPosition: -1,
        tumorAltCount: -1,
        tumorRefCount: -1,
        validationStatus: '',
        variantAllele: '',
        variantType: '',
        driverFilter: '',
        driverFilterAnnotation: '',
        driverTiersFilter: '',
        driverTiersFilterAnnotation: '',
        chr: '',
        /*wildType:false,
        sequenced:true*/
    };
}

/**
 * Initializes an empty mutation and overrides the values with the given props.
 *
 * @param props
 * @returns {Mutation}
 */
export function initMutation(props: { [key: string]: any }): Mutation {
    const mutation = emptyMutation();

    // TODO this is not a type safe operation since the property values can be anything
    _.merge(mutation, props);

    return mutation;
}
