import URLWrapper, {BooleanString, NumberString} from "../../shared/lib/URLWrapper";
import ExtendedRouterStore from "../../shared/lib/ExtendedRouterStore";
import {computed} from "mobx";
import autobind from "autobind-decorator";
import {ResultsViewTab} from "pages/resultsView/ResultsViewPageHelpers";

export type ResultsViewURLQuery = {
    clinicallist:string;
    gene_list:string;
    cancer_study_list:string;
    case_ids:string;
    sample_list_ids:string;
    case_set_id:string;
    profileFilter:string;
    RPPA_SCORE_THRESHOLD:NumberString;
    Z_SCORE_THRESHOLD:NumberString;
    geneset_list:string;
    treatment_list: string;
    show_samples:BooleanString;
    heatmap_track_groups:string;
    oncoprint_sortby:"case_id"|"case_list"|"cluster"|"";
    oncoprint_cluster_profile:string;
    oncoprint_sort_by_mutation_type:BooleanString;
    oncoprint_sort_by_drivers:BooleanString;

    genetic_profile_ids_PROFILE_MUTATION_EXTENDED:string;
    genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION:string;
    genetic_profile_ids_PROFILE_MRNA_EXPRESSION:string;
    genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION:string;
    genetic_profile_ids_PROFILE_GENESET_SCORE:string;
    genetic_profile_ids_GENERIC_ASSAY:string;
    genetic_profile_ids:string;

};

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
              2000
        );
    }

    pathContext = "/results";

    @computed public get tabId() {
        return this.pathName.split("/").pop();
    }

    @autobind
    public setTabId(tabId:ResultsViewTab, replace?:boolean) {
        this.routing.updateRoute({}, `comparison/${tabId}`, false, replace);
    }
}
