import * as _ from 'lodash';
import { ClinicalData, ClinicalAttribute } from 'cbioportal-ts-api-client';

/**
 * Utility functions to generate mock data.
 *
 * @author Rob Sheridan, Manda Wilson
 */

export function emptyClinicalData(): ClinicalData {
    return {
        clinicalAttribute: {
            clinicalAttributeId: '',
            datatype: '',
            description: '',
            displayName: '',
            patientAttribute: false,
            priority: '',
            studyId: '',
        },
        clinicalAttributeId: '',
        patientId: '',
        sampleId: '',
        studyId: '',
        uniquePatientKey: '',
        uniqueSampleKey: '',
        value: '',
    };
}

/**
 * Initializes an empty ClinicalData instance and overrides the values with the given props.
 *
 * @param props
 * @returns {Mutation}
 */
export function initClinicalData(props: { [key: string]: any }): ClinicalData {
    const clinicalData = emptyClinicalData();

    // TODO this is not a type safe operation since the property values can be anything
    _.merge(clinicalData, props);

    return clinicalData;
}
