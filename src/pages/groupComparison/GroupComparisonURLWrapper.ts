import URLWrapper, { PropertiesMap } from '../../shared/lib/URLWrapper';
import ExtendedRouterStore from '../../shared/lib/ExtendedRouterStore';
import { computed, makeObservable } from 'mobx';
import { getTabId } from './GroupComparisonUtils';
import { GroupComparisonTab } from './GroupComparisonTabs';
import autobind from 'autobind-decorator';
import { OverlapStrategy } from '../../shared/lib/comparison/ComparisonStore';
import IComparisonURLWrapper from 'pages/groupComparison/IComparisonURLWrapper';
import {
    cnaGroup,
    CopyNumberEnrichmentEventType,
    EnrichmentEventType,
    MutationEnrichmentEventType,
    mutationGroup,
} from 'shared/lib/comparison/ComparisonStoreUtils';
import { getServerConfig } from 'config/config';
import { MapValues } from 'shared/lib/TypeScriptUtils';
import _ from 'lodash';

export enum GroupComparisonURLQueryEnum {
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
    comparison_selectedEnrichmentEventTypes = 'comparison_selectedEnrichmentEventTypes',

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

    pathways_source = 'pathways_source',
}

type StringValuedParams = Exclude<
    keyof typeof GroupComparisonURLQueryEnum,
    'plots_horz_selection' | 'plots_vert_selection' | 'plots_coloring_selection'
>;

export type GroupComparisonURLQuery = {
    [key in StringValuedParams]: string;
} & {
    comparisonId: string;
    groupOrder?: string; // json stringified array of names
    unselectedGroups?: string; // json stringified array of names
    overlapStrategy?: OverlapStrategy;
    patientEnrichments?: string;
    selectedEnrichmentEventTypes: string;
    // plots_horz_selection: PlotsSelectionParam;
    // plots_vert_selection: PlotsSelectionParam;
    // plots_coloring_selection: PlotsColoringParam;
};

// export type PlotsSelectionParam = {
//     selectedGeneOption?: string;
//     selectedGenesetOption?: string;
//     selectedGenericAssayOption?: string;
//     dataType?: string;
//     selectedDataSourceOption?: string;
//     mutationCountBy?: string;
//     structuralVariantCountBy?: string;
//     logScale?: string;
// };

// const PlotsSelectionParamProps: Required<PlotsSelectionParam> = {
//     selectedGeneOption: '',
//     selectedGenesetOption: '',
//     selectedGenericAssayOption: '',
//     dataType: '',
//     selectedDataSourceOption: '',
//     mutationCountBy: '',
//     structuralVariantCountBy: '',
//     logScale: '',
// };

const PlotsColoringParamProps: Required<PlotsColoringParam> = {
    selectedOption: '',
    logScale: '',
    colorByMutationType: '',
    colorByCopyNumber: '',
    colorBySv: '',
};

export type PlotsColoringParam = {
    selectedOption?: string;
    logScale?: string;
    colorByMutationType?: string;
    colorByCopyNumber?: string;
    colorBySv?: string;
};

const shouldForceRemount: {
    [prop in keyof GroupComparisonURLQuery]: boolean;
} = {
    clinicallist: false,
    show_samples: false,
    heatmap_track_groups: false,
    oncoprint_sortby: false,
    oncoprint_cluster_profile: false,
    oncoprint_sort_by_mutation_type: false,
    oncoprint_sort_by_drivers: false,
    generic_assay_groups: false,
    exclude_germline_mutations: false,
    hide_unprofiled_samples: false,
    patient_enrichments: false,

    comparison_subtab: false,
    comparison_overlapStrategy: false,
    comparison_selectedGroups: false,
    comparison_groupOrder: false,
    comparison_selectedEnrichmentEventTypes: false,

    // plots
    // plots_horz_selection: false,
    // plots_vert_selection: false,
    // plots_coloring_selection: false,

    // mutations
    mutations_gene: false,
    mutations_transcript_id: false,

    // pathways
    pathways_source: false,

    // session props here
    gene_list: true,
    cancer_study_list: true,
    case_ids: true,
    sample_list_ids: true,
    case_set_id: true,
    profileFilter: true,
    RPPA_SCORE_THRESHOLD: true,
    Z_SCORE_THRESHOLD: true,
    geneset_list: true,
    genetic_profile_ids_PROFILE_MUTATION_EXTENDED: true,
    genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION: true,
    genetic_profile_ids_PROFILE_MRNA_EXPRESSION: true,
    genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION: true,
    genetic_profile_ids_PROFILE_GENESET_SCORE: true,
    genetic_profile_ids_GENERIC_ASSAY: true,
    genetic_profile_ids: true,
    comparison_createdGroupsSessionId: false,
    comparisonId: true,
    groupOrder: false,
    unselectedGroups: false,
    overlapStrategy: false,
    patientEnrichments: false,
    selectedEnrichmentEventTypes: true,
};

const propertiesMap = _.mapValues(
    {
        // NON session props here
        // oncoprint props
        clinicallist: { isSessionProp: false },
        show_samples: { isSessionProp: false },
        heatmap_track_groups: { isSessionProp: false },
        oncoprint_sortby: { isSessionProp: false },
        oncoprint_cluster_profile: { isSessionProp: false },
        oncoprint_sort_by_mutation_type: {
            isSessionProp: false,
        },
        oncoprint_sort_by_drivers: { isSessionProp: false },
        generic_assay_groups: { isSessionProp: false },
        exclude_germline_mutations: { isSessionProp: false },
        hide_unprofiled_samples: { isSessionProp: false },
        patient_enrichments: { isSessionProp: false },

        comparison_subtab: { isSessionProp: false },
        comparison_overlapStrategy: { isSessionProp: false },
        comparison_selectedGroups: { isSessionProp: false },
        comparison_groupOrder: { isSessionProp: false },
        comparison_selectedEnrichmentEventTypes: {
            isSessionProp: true,
        },

        // plots
        // plots_horz_selection: {
        //     isSessionProp: false,
        //     nestedObjectProps: PlotsSelectionParamProps,
        // },
        // plots_vert_selection: {
        //     isSessionProp: false,
        //     nestedObjectProps: PlotsSelectionParamProps,
        // },
        // plots_coloring_selection: {
        //     isSessionProp: false,
        //     nestedObjectProps: PlotsColoringParamProps,
        // },

        // mutations
        mutations_gene: {
            isSessionProp: false,
        },
        mutations_transcript_id: {
            isSessionProp: false,
        },

        // pathways
        pathways_source: {
            isSessionProp: false,
        },

        // session props here
        gene_list: {
            isSessionProp: true,
            doubleURIEncode: true,
        },
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
        genetic_profile_ids_GENERIC_ASSAY: {
            isSessionProp: true,
        },
        genetic_profile_ids: { isSessionProp: true },
        comparison_createdGroupsSessionId: {
            isSessionProp: true,
        },
        comparisonId: { isSessionProp: true, aliases: ['sessionId'] },
        groupOrder: { isSessionProp: false },
        unselectedGroups: { isSessionProp: false },
        overlapStrategy: { isSessionProp: false },
        patientEnrichments: { isSessionProp: false },
        selectedEnrichmentEventTypes: { isSessionProp: true },
    } as PropertiesMap<GroupComparisonURLQuery>,
    (propertySpec, propertyName) => {
        propertySpec.isHashedProp =
            shouldForceRemount[propertyName as keyof GroupComparisonURLQuery];
        return propertySpec;
    }
) as PropertiesMap<GroupComparisonURLQuery>;

export default class GroupComparisonURLWrapper
    extends URLWrapper<GroupComparisonURLQuery>
    implements IComparisonURLWrapper {
    constructor(routing: ExtendedRouterStore) {
        super(
            routing,
            propertiesMap,
            true,
            getServerConfig().session_url_length_threshold
                ? parseInt(getServerConfig().session_url_length_threshold)
                : undefined
        );
        makeObservable(this);
    }

    @computed public get tabId() {
        return getTabId(this.pathName) || GroupComparisonTab.OVERLAP;
    }

    @autobind
    public setTabId(tabId: GroupComparisonTab, replace?: boolean) {
        this.updateURL({}, `comparison/${tabId}`, false, replace);
    }

    @computed public get selectedEnrichmentEventTypes() {
        if (this.query.selectedEnrichmentEventTypes) {
            return JSON.parse(this.query.selectedEnrichmentEventTypes) as (
                | MutationEnrichmentEventType
                | CopyNumberEnrichmentEventType
            )[];
        } else {
            return undefined;
        }
    }

    @autobind
    public updateSelectedEnrichmentEventTypes(t: EnrichmentEventType[]) {
        this.updateURL({
            selectedEnrichmentEventTypes: JSON.stringify(t),
        });
    }
}
