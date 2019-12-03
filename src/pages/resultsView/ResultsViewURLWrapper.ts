import URLWrapper, {BooleanString, NumberString} from "../../shared/lib/URLWrapper";
import ExtendedRouterStore from "../../shared/lib/ExtendedRouterStore";
import {computed} from "mobx";
import autobind from "autobind-decorator";
import {ResultsViewTab} from "pages/resultsView/ResultsViewPageHelpers";
import AppConfig from "appConfig";

export enum ResultsViewURLQueryEnum {
    clinicallist = "clinicallist",
    gene_list = "gene_list",
    cancer_study_list = "cancer_study_list",
    case_ids = "case_ids",
    sample_list_ids = "sample_list_ids",
    case_set_id = "case_set_id",
    profileFilter =  "profileFilter",
    RPPA_SCORE_THRESHOLD = "RPPA_SCORE_THRESHOLD",
    Z_SCORE_THRESHOLD = "Z_SCORE_THRESHOLD",
    geneset_list = "geneset_list",
    treatment_list = "treatment_list",
    show_samples = "show_samples",
    heatmap_track_groups = "heatmap_track_groups",
    oncoprint_sortby = "oncoprint_sortby",
    oncoprint_cluster_profile = "oncoprint_cluster_profile",
    oncoprint_sort_by_mutation_type = "oncoprint_sort_by_mutation_type",
    oncoprint_sort_by_drivers = "oncoprint_sort_by_drivers",

    genetic_profile_ids_PROFILE_MUTATION_EXTENDED = "genetic_profile_ids_PROFILE_MUTATION_EXTENDED",
    genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION = "genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION",
    genetic_profile_ids_PROFILE_MRNA_EXPRESSION = "genetic_profile_ids_PROFILE_MRNA_EXPRESSION",
    genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION = "genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION",
    genetic_profile_ids_PROFILE_GENESET_SCORE = "genetic_profile_ids_PROFILE_GENESET_SCORE",
    genetic_profile_ids_GENERIC_ASSAY = "genetic_profile_ids_GENERIC_ASSAY",
    genetic_profile_ids = "genetic_profile_ids"

};

export type ResultsViewURLQuery = { [key in keyof typeof ResultsViewURLQueryEnum] : string }


export default class ResultsViewURLWrapper extends URLWrapper<ResultsViewURLQuery> {
    constructor(routing:ExtendedRouterStore) {
        super(routing, [

            // NON session props here
            // oncoprint props
            { name: "clinicallist", isSessionProp:false },
            { name: "show_samples", isSessionProp:false },
            { name: "heatmap_track_groups", isSessionProp:false },
            { name: "oncoprint_sortby", isSessionProp:false },
            { name: "oncoprint_cluster_profile", isSessionProp:false},
            { name: "oncoprint_sort_by_mutation_type", isSessionProp:false },
            { name: "oncoprint_sort_by_drivers", isSessionProp:false},
            { name: "treatment_list", isSessionProp:false },

            // session props here
            { name: "gene_list", isSessionProp:true },
            { name: "cancer_study_list", isSessionProp:true, aliases:["cancer_study_id"] },
            { name: "case_ids", isSessionProp:true },
            { name: "sample_list_ids", isSessionProp:true },
            { name: "case_set_id", isSessionProp:true },
            { name: "profileFilter", isSessionProp:true },
            { name: "RPPA_SCORE_THRESHOLD", isSessionProp:true },
            { name: "Z_SCORE_THRESHOLD", isSessionProp:true },
            { name: "geneset_list", isSessionProp:true },
            { name: "genetic_profile_ids_PROFILE_MUTATION_EXTENDED", isSessionProp:true },
            { name: "genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION", isSessionProp:true },
            { name: "genetic_profile_ids_PROFILE_MRNA_EXPRESSION", isSessionProp:true },
            { name: "genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION", isSessionProp:true },
            { name: "genetic_profile_ids_PROFILE_GENESET_SCORE", isSessionProp:true },
            { name: "genetic_profile_ids_GENERIC_ASSAY", isSessionProp:true },
            { name: "genetic_profile_ids", isSessionProp:true },
            ],
              true,
              AppConfig.serverConfig.session_url_length_threshold ? parseInt(AppConfig.serverConfig.session_url_length_threshold) : undefined
        );
    }

    pathContext = "/results";

    @computed public get tabId() {
        return this.pathName.split("/").pop();
    }

    @autobind
    public setTabId(tabId:ResultsViewTab, replace?:boolean) {
        this.updateURL({}, `comparison/${tabId}`, false, replace);
    }
}
