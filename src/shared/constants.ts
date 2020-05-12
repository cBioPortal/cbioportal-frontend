export const MOLECULAR_PROFILE_MUTATIONS_SUFFIX = '_mutations';
export const MOLECULAR_PROFILE_UNCALLED_MUTATIONS_SUFFIX = `${MOLECULAR_PROFILE_MUTATIONS_SUFFIX}_uncalled`;
export const MUTATION_STATUS_GERMLINE = 'Germline';
export const PUTATIVE_DRIVER = 'Putative_Driver';

export const SAMPLE_CANCER_TYPE_UNKNOWN = 'Unknown';

/* cbioportal api request arguments */

export const RARG_PROJECTION_META = 'META';
export const RARG_PROJECTION_SUMMARY = 'SUMMARY';
export const RARG_PROJECTION_DETAILED = 'DETAILED';
export const RARG_CASE_TYPE_PATIENT = 'PATIENT';
export const RARG_CASE_TYPE_SAMPLE = 'SAMPLE';
export const RARG_CLINICAL_DATA_TYPE_PATIENT = 'PATIENT';
export const RARG_CLINICAL_DATA_TYPE_SAMPLE = 'SAMPLE';

/* cbioportal api responses */

/* cbioportal api responses - general response values */
export const RV_NA = 'NA';

/* cbioportal api responses - clinical attribute identifiers */
export const CAID_CANCER_TYPE = 'CANCER_TYPE';
export const CAID_CANCER_TYPE_DETAILED = 'CANCER_TYPE_DETAILED';
export const CAID_FACETS_PURITY = 'FACETS_PURITY';
export const CAID_FACETS_WGD = 'FACETS_WGD';

/* cbioportal api responses - clinical attribute fields and subfields */
export const CAF_ID = 'clinicalAttributeId';
export const CAF_DATATYPE_NUMBER = 'NUMBER';
export const CAF_DATATYPE_STRING = 'STRING';
export const CAF_DATATYPE_COUNTS_MAP = 'COUNTS_MAP';

/* cbioportal api responses - mutation data fields and subfields */
export const MDF_ASCN_INTEGER_COPY_NUMBER = 'ascnIntegerCopyNumber';
export const MDF_TOTAL_COPY_NUMBER = 'totalCopyNumber';
export const MDF_MINOR_COPY_NUMBER = 'minorCopyNumber';
export const MDF_MUTANT_COPIES = 'mutantCopies';

/* cbioportal api responses - genetic profile fields and subfields */
export const GPF_MOLECULAR_ALTERATION_TYPE = 'molecularAlterationType';
export const GPF_STUDY_ID = 'studyId';

/* genome nexus api request arguments */
export const GNARG_FIELD_ANNOTATION_SUMMARY = 'annotation_summary';
export const GNARG_FIELD_HOTSPOTS = 'hotspots';
export const GNARG_FIELD_MUTATION_ASSESSOR = 'mutation_assessor';
export const GNARG_FIELD_MY_VARIANT_INFO = 'my_variant_info';
