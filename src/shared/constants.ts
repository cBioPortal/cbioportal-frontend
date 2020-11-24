export const MOLECULAR_PROFILE_MUTATIONS_SUFFIX = '_mutations';
export const MOLECULAR_PROFILE_UNCALLED_MUTATIONS_SUFFIX = `${MOLECULAR_PROFILE_MUTATIONS_SUFFIX}_uncalled`;
export const MUTATION_STATUS_GERMLINE = 'Germline';

export const SAMPLE_CANCER_TYPE_UNKNOWN = 'Unknown';

/* cbioportal api request arguments */
export const enum REQUEST_ARG_ENUM {
    PROJECTION_META = 'META',
    PROJECTION_SUMMARY = 'SUMMARY',
    PROJECTION_DETAILED = 'DETAILED',
    CLINICAL_DATA_TYPE_PATIENT = 'PATIENT',
    CLINICAL_DATA_TYPE_SAMPLE = 'SAMPLE',
}

/* cbioportal api responses */

/* cbioportal api responses - general response values */
export const RESPONSE_VALUE_NA = 'NA';

/* cbioportal api responses - clinical attribute identifiers */
export const enum CLINICAL_ATTRIBUTE_ID_ENUM {
    CANCER_TYPE = 'CANCER_TYPE',
    CANCER_TYPE_DETAILED = 'CANCER_TYPE_DETAILED',
    ASCN_PURITY = 'ASCN_PURITY',
    ASCN_WGD = 'ASCN_WGD',
    MSI_SCORE = 'MSI_SCORE',
    TMB_SCORE = 'CVR_TMB_SCORE',
}

export const MSI_H_THRESHOLD = 10;
export const TMB_H_THRESHOLD = 10;

/* cbioportal api responses - clinical attribute fields and subfields */
export const enum CLINICAL_ATTRIBUTE_FIELD_ENUM {
    ID = 'clinicalAttributeId',
    DATATYPE_NUMBER = 'NUMBER',
    DATATYPE_STRING = 'STRING',
    DATATYPE_COUNTS_MAP = 'COUNTS_MAP',
}

/* cbioportal api responses - mutation data fields and subfields */
export const enum MUTATION_DATA_FIELD_ENUM {
    ASCN_INTEGER_COPY_NUMBER = 'ascnIntegerCopyNumber',
    TOTAL_COPY_NUMBER = 'totalCopyNumber',
    MINOR_COPY_NUMBER = 'minorCopyNumber',
    EXPECTED_ALT_COPIES = 'expectedAltCopies',
}

/* cbioportal api responses - genetic profile fields and subfields */
export const enum GENETIC_PROFILE_FIELD_ENUM {
    MOLECULAR_ALTERATION_TYPE = 'molecularAlterationType',
    STUDY_ID = 'studyId',
}

/* genome nexus api request arguments */
export const enum GENOME_NEXUS_ARG_FIELD_ENUM {
    ANNOTATION_SUMMARY = 'annotation_summary',
    HOTSPOTS = 'hotspots',
    MUTATION_ASSESSOR = 'mutation_assessor',
    MY_VARIANT_INFO = 'my_variant_info',
}
