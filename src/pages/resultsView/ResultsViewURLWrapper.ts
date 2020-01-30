import URLWrapper, {
    BooleanString,
    NumberString,
} from '../../shared/lib/URLWrapper';
import ExtendedRouterStore from '../../shared/lib/ExtendedRouterStore';
import { computed } from 'mobx';
import autobind from 'autobind-decorator';
import { ResultsViewTab } from 'pages/resultsView/ResultsViewPageHelpers';
import AppConfig from 'appConfig';

export enum ResultsViewURLQueryEnum {
    clinicallist = 'clinicallist',
    gene_list = 'gene_list',
    cancer_study_list = 'cancer_study_list',
    case_ids = 'case_ids',
    sample_list_ids = 'sample_list_ids',
    case_set_id = 'case_set_id',
    profileFilter = 'profileFilter',
    RPPA_SCORE_THRESHOLD = 'RPPA_SCORE_THRESHOLD',
    Z_SCORE_THRESHOLD = 'Z_SCORE_THRESHOLD',
    geneset_list = 'geneset_list',
    generic_assay_groups = 'generic_assay_groups',
    show_samples = 'show_samples',
    heatmap_track_groups = 'heatmap_track_groups',
    oncoprint_sortby = 'oncoprint_sortby',
    oncoprint_cluster_profile = 'oncoprint_cluster_profile',
    oncoprint_sort_by_mutation_type = 'oncoprint_sort_by_mutation_type',
    oncoprint_sort_by_drivers = 'oncoprint_sort_by_drivers',
    exclude_germline_mutations = 'exclude_germline_mutations',
    patient_enrichments = 'patient_enrichments',

    genetic_profile_ids_PROFILE_MUTATION_EXTENDED = 'genetic_profile_ids_PROFILE_MUTATION_EXTENDED',
    genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION = 'genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION',
    genetic_profile_ids_PROFILE_MRNA_EXPRESSION = 'genetic_profile_ids_PROFILE_MRNA_EXPRESSION',
    genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION = 'genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION',
    genetic_profile_ids_PROFILE_GENESET_SCORE = 'genetic_profile_ids_PROFILE_GENESET_SCORE',
    genetic_profile_ids_GENERIC_ASSAY = 'genetic_profile_ids_GENERIC_ASSAY',
    genetic_profile_ids = 'genetic_profile_ids',
}

export type ResultsViewURLQuery = {
    [key in keyof typeof ResultsViewURLQueryEnum]: string
};

export default class ResultsViewURLWrapper extends URLWrapper<
    ResultsViewURLQuery
> {
    constructor(routing: ExtendedRouterStore) {
        super(
            routing,
            {
                // NON session props here
                // oncoprint props
                clinicallist: { isSessionProp: false },
                show_samples: { isSessionProp: false },
                heatmap_track_groups: { isSessionProp: false },
                oncoprint_sortby: { isSessionProp: false },
                oncoprint_cluster_profile: { isSessionProp: false },
                oncoprint_sort_by_mutation_type: { isSessionProp: false },
                oncoprint_sort_by_drivers: { isSessionProp: false },
                generic_assay_groups: { isSessionProp: false },
                exclude_germline_mutations: { isSessionProp: false },
                patient_enrichments: { isSessionProp: false },

                // session props here
                gene_list: { isSessionProp: true },
                cancer_study_list: {
                    isSessionProp: true,
                    aliases: ['cancer_study_id'],
                },
                case_ids: { isSessionProp: true },
                sample_list_ids: { isSessionProp: true },
                case_set_id: { isSessionProp: true },
                profileFilter: {
                    isSessionProp: true,
                    aliases: ['data_priority'],
                },
                RPPA_SCORE_THRESHOLD: { isSessionProp: true },
                Z_SCORE_THRESHOLD: { isSessionProp: true },
                geneset_list: { isSessionProp: true },
                genetic_profile_ids_PROFILE_MUTATION_EXTENDED: {
                    isSessionProp: true,
                },
                genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION: {
                    isSessionProp: true,
                },
                genetic_profile_ids_PROFILE_MRNA_EXPRESSION: {
                    isSessionProp: true,
                },
                genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION: {
                    isSessionProp: true,
                },
                genetic_profile_ids_PROFILE_GENESET_SCORE: {
                    isSessionProp: true,
                },
                genetic_profile_ids_GENERIC_ASSAY: { isSessionProp: true },
                genetic_profile_ids: { isSessionProp: true },
            },
            true,
            AppConfig.serverConfig.session_url_length_threshold
                ? parseInt(AppConfig.serverConfig.session_url_length_threshold)
                : undefined
        );
    }

    pathContext = '/results';

    @computed public get tabId() {
        return this.pathName.split('/').pop();
    }

    @autobind
    public setTabId(tabId: ResultsViewTab, replace?: boolean) {
        this.updateURL({}, `comparison/${tabId}`, false, replace);
    }
}
