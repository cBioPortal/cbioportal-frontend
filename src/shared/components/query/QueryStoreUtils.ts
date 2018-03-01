import {CancerStudyQueryUrlParams, normalizeQuery, QueryStore} from "./QueryStore";

export type NonMolecularProfileQueryParams = Pick<CancerStudyQueryUrlParams,
    'cancer_study_id' | 'cancer_study_list' | 'Z_SCORE_THRESHOLD' | 'RPPA_SCORE_THRESHOLD' | 'data_priority' |
    'case_set_id' | 'case_ids' | 'gene_list' | 'geneset_list' | 'tab_index' | 'transpose_matrix' | 'Action'>;

export type MolecularProfileQueryParams = Pick<CancerStudyQueryUrlParams,
    'genetic_profile_ids_PROFILE_MUTATION_EXTENDED' | 'genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION' |
    'genetic_profile_ids_PROFILE_MRNA_EXPRESSION' | 'genetic_profile_ids_PROFILE_METHYLATION' |
    'genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION' | 'genetic_profile_ids_PROFILE_GENESET_SCORE'>;


export function currentQueryParams(store:QueryStore) {
    let nonProfileParams = nonMolecularProfileParams(store);
    let profileParams = molecularProfileParams(store);
    let path = queryUrl(store, nonProfileParams);
    return queryParams(nonProfileParams, profileParams, path);
}

export function queryUrl(store:QueryStore, nonMolecularProfileParams:NonMolecularProfileQueryParams) {

    /*if (store.selectedStudyIds.length != 1)
    {
        let studyIds = store.selectedStudyIds;
        if (!studyIds.length) {
            studyIds = store.cancerStudies.result.map(study => study.studyId);
        }

        const hash = `crosscancer/overview/${nonMolecularProfileParams.data_priority}/${encodeURIComponent(nonMolecularProfileParams.gene_list)}/${encodeURIComponent(studyIds.join(","))}`;
        return `cross_cancer.do?#${hash}`;
    } else {
        return 'index.do';
    }*/
    return 'index.do';
}

export function queryParams(nonMolecularProfileParams:NonMolecularProfileQueryParams,
                            molecularProfileParams:MolecularProfileQueryParams,
                            path:string) {
    let params:CancerStudyQueryUrlParams = Object.assign({}, nonMolecularProfileParams, molecularProfileParams);

    // Remove params with no value, because they may cause problems.
    // For example, the server will always transpose if transpose_matrix is present, no matter the value.
    for (let key in params) {
        if (!(params as any)[key]) {
            delete (params as any)[key];
        }
    }

    return {pathname: path, query:params};
}

export function nonMolecularProfileParams(store:QueryStore, whitespace_separated_case_ids?:string):NonMolecularProfileQueryParams {
    const selectedStudyIds = store.allSelectedStudyIds;

    // case ids is of format study1:sample1+study2:sample2+...
    const case_ids = whitespace_separated_case_ids ?
                    whitespace_separated_case_ids.replace(/\s+/g, '+') :
                    store.asyncCustomCaseSet.result.map(caseRow => (caseRow.studyId + ':' + caseRow.sampleId)).join('+');

    let ret:NonMolecularProfileQueryParams = {
        cancer_study_id: selectedStudyIds.length === 1 ? selectedStudyIds[0] : 'all',
        Z_SCORE_THRESHOLD: store.zScoreThreshold,
        RPPA_SCORE_THRESHOLD: store.rppaScoreThreshold,
        data_priority: store.dataTypePriorityCode,
        case_set_id: store.selectedSampleListId || '-1', // empty string won't work
        case_ids,
        gene_list: encodeURIComponent(normalizeQuery(store.geneQuery) || ' '), // empty string won't work
        geneset_list: normalizeQuery(store.genesetQuery) || ' ', //empty string won't work
        tab_index: store.forDownloadTab ? 'tab_download' : 'tab_visualize' as any,
        transpose_matrix: store.transposeDataMatrix ? 'on' : undefined,
        Action: 'Submit',
    };

    if (selectedStudyIds.length !== 1) {
        ret.cancer_study_list = selectedStudyIds.join(",");
    }

    return ret;
}

export function molecularProfileParams(store:QueryStore, molecularProfileIds?:ReadonlyArray<string>) {
    return {
        genetic_profile_ids_PROFILE_MUTATION_EXTENDED: store.getSelectedProfileIdFromMolecularAlterationType("MUTATION_EXTENDED", molecularProfileIds),
        genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION: store.getSelectedProfileIdFromMolecularAlterationType("COPY_NUMBER_ALTERATION", molecularProfileIds),
        genetic_profile_ids_PROFILE_MRNA_EXPRESSION: store.getSelectedProfileIdFromMolecularAlterationType("MRNA_EXPRESSION", molecularProfileIds),
        genetic_profile_ids_PROFILE_METHYLATION: store.getSelectedProfileIdFromMolecularAlterationType("METHYLATION", molecularProfileIds) || store.getSelectedProfileIdFromMolecularAlterationType("METHYLATION_BINARY", molecularProfileIds),
        genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION: store.getSelectedProfileIdFromMolecularAlterationType("PROTEIN_LEVEL", molecularProfileIds),
        genetic_profile_ids_PROFILE_GENESET_SCORE: store.getSelectedProfileIdFromMolecularAlterationType("GENESET_SCORE", molecularProfileIds)
    };
}
