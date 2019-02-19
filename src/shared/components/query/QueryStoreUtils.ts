import {CancerStudyQueryUrlParams, normalizeQuery, QueryStore} from "./QueryStore";
import { MolecularProfile, SampleList } from "shared/api/generated/CBioPortalAPI";
import { AlterationTypeConstants } from "pages/resultsView/ResultsViewPageStore";
import * as _ from "lodash";
import { VirtualStudy } from "shared/model/VirtualStudy";

export type NonMolecularProfileQueryParams = Pick<CancerStudyQueryUrlParams,
    'cancer_study_id' | 'cancer_study_list' | 'Z_SCORE_THRESHOLD' | 'RPPA_SCORE_THRESHOLD' | 'data_priority' |
    'case_set_id' | 'case_ids' | 'gene_list' | 'geneset_list' | 'treatment_list' | 'tab_index' | 'transpose_matrix' | 'Action'>;

export type MolecularProfileQueryParams = Pick<CancerStudyQueryUrlParams,
    'genetic_profile_ids_PROFILE_MUTATION_EXTENDED' | 'genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION' |
    'genetic_profile_ids_PROFILE_MRNA_EXPRESSION' | 'genetic_profile_ids_PROFILE_METHYLATION' |
    'genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION' | 'genetic_profile_ids_PROFILE_GENESET_SCORE' |
    'genetic_profile_ids_PROFILE_TREATMENT_RESPONSE' >;


export function currentQueryParams(store:QueryStore) {
    let nonProfileParams = nonMolecularProfileParams(store);
    let profileParams = molecularProfileParams(store);
    return queryParams(nonProfileParams, profileParams);
}

export function queryParams(nonMolecularProfileParams:NonMolecularProfileQueryParams,
                            molecularProfileParams:MolecularProfileQueryParams) {
    let params:CancerStudyQueryUrlParams = Object.assign({}, nonMolecularProfileParams, molecularProfileParams);

    // Remove params with no value, because they may cause problems.
    // For example, the server will always transpose if transpose_matrix is present, no matter the value.
    for (let key in params) {
        if (!(params as any)[key]) {
            delete (params as any)[key];
        }
    }

    return {query:params};
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
        treatment_list: normalizeQuery(store.treatmentQuery) || ' ', //empty string won't work
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
        genetic_profile_ids_PROFILE_GENESET_SCORE: store.getSelectedProfileIdFromMolecularAlterationType("GENESET_SCORE", molecularProfileIds),
        genetic_profile_ids_PROFILE_TREATMENT_RESPONSE: store.getSelectedProfileIdFromMolecularAlterationType("TREATMENT_RESPONSE", molecularProfileIds)
    };
}


export function profileAvailability(molecularProfiles:MolecularProfile[]) {
	let hasMutationProfile = false;
	let hasCNAProfile = false;
	for (const profile of molecularProfiles) {
		if (!profile.showProfileInAnalysisTab)
			continue;

		switch (profile.molecularAlterationType) {
			case AlterationTypeConstants.MUTATION_EXTENDED:
				hasMutationProfile = true;
				break;
			case AlterationTypeConstants.COPY_NUMBER_ALTERATION:
				hasCNAProfile = true;
				break;
		}

		if (hasMutationProfile && hasCNAProfile)
			break;
	}
	return {
		mutation: hasMutationProfile,
		cna: hasCNAProfile
	};
}

export function categorizedSamplesCount(sampleLists: SampleList[], selectedStudies: string[], selectedVirtualStudies: VirtualStudy[]) {
    let mutationSamples: { [studyId: string]: { [sampleId: string]: string } } = {};
    let cnaSamples: { [studyId: string]: { [sampleId: string]: string } } = {};
    let mutationCnaSamples: { [studyId: string]: { [sampleId: string]: string } } = {};
    let allSamples: { [studyId: string]: { [sampleId: string]: string } } = {};

    let filteredMutationSamples: { [studyId: string]: { [sampleId: string]: string } } = {};
    let filteredCnaSamples: { [studyId: string]: { [sampleId: string]: string } } = {};
    let filteredMutationCnaSamples: { [studyId: string]: { [sampleId: string]: string } } = {};
    let filteredallSamples: { [studyId: string]: { [sampleId: string]: string } } = {};

    _.each(sampleLists, sampleList => {
        switch (sampleList.category) {
            case "all_cases_with_mutation_and_cna_data":
                mutationCnaSamples[sampleList.studyId] = _.keyBy(sampleList.sampleIds);
                break;
            case "all_cases_with_mutation_data":
                mutationSamples[sampleList.studyId] = _.keyBy(sampleList.sampleIds);
                break;
            case "all_cases_with_cna_data":
                cnaSamples[sampleList.studyId] = _.keyBy(sampleList.sampleIds);
                break;
            case "all_cases_in_study":
                allSamples[sampleList.studyId] = _.keyBy(sampleList.sampleIds);
                break;
            default: {
                // this in case if the all cases list is tagged under other category
                if (sampleList.sampleListId === sampleList.studyId + '_all') {
                    allSamples[sampleList.studyId] = _.keyBy(sampleList.sampleIds);
                }
            }
        }
    });

    const selectedVirtualStudyIds = _.map(selectedVirtualStudies, virtualStudy => virtualStudy.id);
    const selectedPhysicalStudyIds = selectedStudies.filter(id => !_.includes(selectedVirtualStudyIds, id));

    //add all samples from selected physical studies
    _.forEach(selectedPhysicalStudyIds, studyId => {
        filteredMutationSamples[studyId] = mutationSamples[studyId] || {};
        filteredCnaSamples[studyId] = cnaSamples[studyId] || {};
        filteredMutationCnaSamples[studyId] = mutationCnaSamples[studyId] || {};
        filteredallSamples[studyId] = allSamples[studyId] || {};
    });

    _.forEach(selectedVirtualStudies, virtualStudy => {
        _.forEach(virtualStudy.data.studies, study => {

            // check if the study in this virtual study is already in the selected studies list
            // and only add the samples if its not already present
            if (!_.includes(selectedPhysicalStudyIds, study.id)) {
                filteredMutationSamples[study.id] = filteredMutationSamples[study.id] || {};
                filteredCnaSamples[study.id] = filteredCnaSamples[study.id] || {};
                filteredMutationCnaSamples[study.id] = filteredMutationCnaSamples[study.id] || {};
                filteredallSamples[study.id] = filteredallSamples[study.id] || {};

                _.forEach(study.samples, sampleId => {
                    if (mutationSamples[study.id] && mutationSamples[study.id][sampleId]) {
                        filteredMutationSamples[study.id][sampleId] = sampleId;
                    }
                    if (cnaSamples[study.id] && cnaSamples[study.id][sampleId]) {
                        filteredCnaSamples[study.id][sampleId] = sampleId;
                    }
                    if (mutationCnaSamples[study.id] && mutationCnaSamples[study.id][sampleId]) {
                        filteredMutationCnaSamples[study.id][sampleId] = sampleId;
                    }
                    if (allSamples[study.id] && allSamples[study.id][sampleId]) {
                        filteredallSamples[study.id][sampleId] = sampleId;
                    }
                });
            }
        });
    });

    return {
        w_mut: _.reduce(filteredMutationSamples, (acc: number, next) => acc + Object.keys(next).length, 0),
        w_cna: _.reduce(filteredCnaSamples, (acc: number, next) => acc + Object.keys(next).length, 0),
        w_mut_cna: _.reduce(filteredMutationCnaSamples, (acc: number, next) => acc + Object.keys(next).length, 0),
        all: _.reduce(filteredallSamples, (acc: number, next) => acc + Object.keys(next).length, 0)
    }
}