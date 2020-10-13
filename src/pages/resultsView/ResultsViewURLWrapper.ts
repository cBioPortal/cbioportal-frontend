import URLWrapper from '../../shared/lib/URLWrapper';
import ExtendedRouterStore from '../../shared/lib/ExtendedRouterStore';
import { computed } from 'mobx';
import autobind from 'autobind-decorator';
import {
    oldTabToNewTabRoute,
    ResultsViewTab,
} from 'pages/resultsView/ResultsViewPageHelpers';
import AppConfig from 'appConfig';
import { GroupComparisonTab } from 'pages/groupComparison/GroupComparisonTabs';

export type PlotsSelectionParam = {
    selectedGeneOption?: string;
    selectedGenesetOption?: string;
    selectedGenericAssayOption?: string;
    dataType?: string;
    selectedDataSourceOption?: string;
    mutationCountBy?: string;
    structuralVariantCountBy?: string;
    logScale?: string;
};

const PlotsSelectionParamProps: Required<PlotsSelectionParam> = {
    selectedGeneOption: '',
    selectedGenesetOption: '',
    selectedGenericAssayOption: '',
    dataType: '',
    selectedDataSourceOption: '',
    mutationCountBy: '',
    structuralVariantCountBy: '',
    logScale: '',
};

export type PlotsColoringParam = {
    selectedOption?: string;
    logScale?: string;
    colorByMutationType?: string;
    colorByCopyNumber?: string;
    colorBySv?: string;
};

const PlotsColoringParamProps: Required<PlotsColoringParam> = {
    selectedOption: '',
    logScale: '',
    colorByMutationType: '',
    colorByCopyNumber: '',
    colorBySv: '',
};

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
    hide_unprofiled_samples = 'hide_unprofiled_samples',
    patient_enrichments = 'patient_enrichments',

    comparison_subtab = 'comparison_subtab',
    comparison_overlapStrategy = 'comparison_overlapStrategy',
    comparison_selectedGroups = 'comparison_selectedGroups',
    comparison_groupOrder = 'comparison_groupOrder',
    comparison_createdGroupsSessionId = 'comparison_createdGroupsSessionId',

    plots_horz_selection = 'plots_horz_selection',
    plots_vert_selection = 'plots_vert_selection',
    plots_coloring_selection = 'plots_coloring_selection',

    genetic_profile_ids_PROFILE_MUTATION_EXTENDED = 'genetic_profile_ids_PROFILE_MUTATION_EXTENDED',
    genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION = 'genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION',
    genetic_profile_ids_PROFILE_MRNA_EXPRESSION = 'genetic_profile_ids_PROFILE_MRNA_EXPRESSION',
    genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION = 'genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION',
    genetic_profile_ids_PROFILE_GENESET_SCORE = 'genetic_profile_ids_PROFILE_GENESET_SCORE',
    genetic_profile_ids_GENERIC_ASSAY = 'genetic_profile_ids_GENERIC_ASSAY',
    genetic_profile_ids = 'genetic_profile_ids',

    mutations_gene = 'mutations_gene',
    mutations_transcript_id = 'mutations_transcript_id',
}

type StringValuedParams = Exclude<
    keyof typeof ResultsViewURLQueryEnum,
    'plots_horz_selection' | 'plots_vert_selection' | 'plots_coloring_selection'
>;

export type ResultsViewURLQuery = {
    [key in StringValuedParams]: string;
} & {
    plots_horz_selection: PlotsSelectionParam;
    plots_vert_selection: PlotsSelectionParam;
    plots_coloring_selection: PlotsColoringParam;
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
                hide_unprofiled_samples: { isSessionProp: false },
                patient_enrichments: { isSessionProp: false },

                comparison_subtab: { isSessionProp: false },
                comparison_overlapStrategy: { isSessionProp: false },
                comparison_selectedGroups: { isSessionProp: false },
                comparison_groupOrder: { isSessionProp: false },

                // plots
                plots_horz_selection: {
                    isSessionProp: false,
                    nestedObjectProps: PlotsSelectionParamProps,
                },
                plots_vert_selection: {
                    isSessionProp: false,
                    nestedObjectProps: PlotsSelectionParamProps,
                },
                plots_coloring_selection: {
                    isSessionProp: false,
                    nestedObjectProps: PlotsColoringParamProps,
                },

                // mutations
                mutations_gene: {
                    isSessionProp: false,
                },
                mutations_transcript_id: {
                    isSessionProp: false,
                },

                // session props here
                gene_list: { isSessionProp: true, doubleURIEncode: true },
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
                comparison_createdGroupsSessionId: { isSessionProp: true },
            },
            true,
            AppConfig.serverConfig.session_url_length_threshold
                ? parseInt(AppConfig.serverConfig.session_url_length_threshold)
                : undefined
        );
    }

    pathContext = '/results';

    @computed public get tabId() {
        const tabInPath = this.pathName.split('/').pop();
        if (tabInPath && tabInPath in oldTabToNewTabRoute) {
            // map legacy tab ids
            return oldTabToNewTabRoute[tabInPath];
        } else {
            return tabInPath;
        }
    }

    @computed public get comparisonSubTabId() {
        return this.query.comparison_subtab || GroupComparisonTab.OVERLAP;
    }

    @autobind
    public setTabId(tabId: ResultsViewTab, replace?: boolean) {
        this.updateURL({}, `results/${tabId}`, false, replace);
    }

    @autobind
    public setComparisonSubTabId(tabId: GroupComparisonTab) {
        this.updateURL({ comparison_subtab: tabId });
    }
}
