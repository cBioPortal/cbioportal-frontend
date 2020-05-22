import {
    CancerStudyQueryUrlParams,
    normalizeQuery,
    QueryStore,
} from './QueryStore';
import { MolecularProfile, SampleList } from 'cbioportal-ts-api-client';
import { AlterationTypeConstants } from 'pages/resultsView/ResultsViewPageStore';
import * as _ from 'lodash';
import { VirtualStudy } from 'shared/model/VirtualStudy';

export function currentQueryParams(store: QueryStore) {
    const selectableSelectedStudyIds = store.selectableSelectedStudyIds;

    // case ids is of format study1:sample1+study2:sample2+...
    const case_ids = store.asyncCustomCaseSet.result
        .map(caseRow => caseRow.studyId + ':' + caseRow.sampleId)
        .join('+');

    // select default profiles for OQL alteration types
    let genetic_profile_ids_PROFILE_MUTATION_EXTENDED = store.getSelectedProfileIdFromMolecularAlterationType(
        'MUTATION_EXTENDED'
    );
    if (
        store.alterationTypesInOQL.haveMutInQuery &&
        !genetic_profile_ids_PROFILE_MUTATION_EXTENDED &&
        store.defaultMutationProfile
    ) {
        genetic_profile_ids_PROFILE_MUTATION_EXTENDED =
            store.defaultMutationProfile.molecularProfileId;
    }

    let genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION = store.getSelectedProfileIdFromMolecularAlterationType(
        'COPY_NUMBER_ALTERATION'
    );
    if (
        store.alterationTypesInOQL.haveCnaInQuery &&
        !genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION &&
        store.defaultCnaProfile
    ) {
        genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION =
            store.defaultCnaProfile.molecularProfileId;
    }

    let genetic_profile_ids_PROFILE_MRNA_EXPRESSION = store.getSelectedProfileIdFromMolecularAlterationType(
        'MRNA_EXPRESSION'
    );
    if (
        store.alterationTypesInOQL.haveMrnaInQuery &&
        !genetic_profile_ids_PROFILE_MRNA_EXPRESSION &&
        store.defaultMrnaProfile
    ) {
        genetic_profile_ids_PROFILE_MRNA_EXPRESSION =
            store.defaultMrnaProfile.molecularProfileId;
    }

    let genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION = store.getSelectedProfileIdFromMolecularAlterationType(
        'PROTEIN_LEVEL'
    );
    if (
        store.alterationTypesInOQL.haveProtInQuery &&
        !genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION &&
        store.defaultProtProfile
    ) {
        genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION =
            store.defaultProtProfile.molecularProfileId;
    }

    const ret: CancerStudyQueryUrlParams = {
        genetic_profile_ids_PROFILE_MUTATION_EXTENDED,
        genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION,
        genetic_profile_ids_PROFILE_MRNA_EXPRESSION,
        genetic_profile_ids_PROFILE_METHYLATION:
            store.getSelectedProfileIdFromMolecularAlterationType(
                'METHYLATION'
            ) ||
            store.getSelectedProfileIdFromMolecularAlterationType(
                'METHYLATION_BINARY'
            ),
        genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION,
        genetic_profile_ids_PROFILE_GENESET_SCORE: store.getSelectedProfileIdFromMolecularAlterationType(
            'GENESET_SCORE'
        ),
        genetic_profile_ids_PROFILE_GENERIC_ASSAY: store.getSelectedProfileIdFromMolecularAlterationType(
            'GENERIC_ASSAY'
        ),
        cancer_study_id:
            selectableSelectedStudyIds.length === 1
                ? selectableSelectedStudyIds[0]
                : 'all',
        cancer_study_list: undefined,
        Z_SCORE_THRESHOLD: store.zScoreThreshold,
        RPPA_SCORE_THRESHOLD: store.rppaScoreThreshold,
        data_priority: store.dataTypePriorityCode,
        profileFilter: store.dataTypePriorityCode,
        case_set_id: store.selectedSampleListId || '-1', // empty string won't work
        case_ids,
        gene_list: normalizeQuery(store.geneQuery) || ' ', // empty string won't work
        geneset_list: normalizeQuery(store.genesetQuery) || ' ', //empty string won't work
        tab_index: store.forDownloadTab
            ? 'tab_download'
            : ('tab_visualize' as any),
        transpose_matrix: store.transposeDataMatrix ? 'on' : undefined,
        Action: 'Submit',
    };

    if (selectableSelectedStudyIds.length !== 1) {
        ret.cancer_study_list = selectableSelectedStudyIds.join(',');
    }

    return { query: ret };
}

export function profileAvailability(molecularProfiles: MolecularProfile[]) {
    let hasMutationProfile = false;
    let hasCNAProfile = false;
    for (const profile of molecularProfiles) {
        if (!profile.showProfileInAnalysisTab) continue;

        switch (profile.molecularAlterationType) {
            case AlterationTypeConstants.MUTATION_EXTENDED:
                hasMutationProfile = true;
                break;
            case AlterationTypeConstants.COPY_NUMBER_ALTERATION:
                hasCNAProfile = true;
                break;
        }

        if (hasMutationProfile && hasCNAProfile) break;
    }
    return {
        mutation: hasMutationProfile,
        cna: hasCNAProfile,
    };
}

export function categorizedSamplesCount(
    sampleLists: SampleList[],
    selectedStudies: string[],
    selectedVirtualStudies: VirtualStudy[]
) {
    let mutationSamples: {
        [studyId: string]: { [sampleId: string]: string };
    } = {};
    let cnaSamples: { [studyId: string]: { [sampleId: string]: string } } = {};
    let mutationCnaSamples: {
        [studyId: string]: { [sampleId: string]: string };
    } = {};
    let allSamples: { [studyId: string]: { [sampleId: string]: string } } = {};

    let filteredMutationSamples: {
        [studyId: string]: { [sampleId: string]: string };
    } = {};
    let filteredCnaSamples: {
        [studyId: string]: { [sampleId: string]: string };
    } = {};
    let filteredMutationCnaSamples: {
        [studyId: string]: { [sampleId: string]: string };
    } = {};
    let filteredallSamples: {
        [studyId: string]: { [sampleId: string]: string };
    } = {};

    _.each(sampleLists, sampleList => {
        switch (sampleList.category) {
            case 'all_cases_with_mutation_and_cna_data':
                mutationCnaSamples[sampleList.studyId] = _.keyBy(
                    sampleList.sampleIds
                );
                break;
            case 'all_cases_with_mutation_data':
                mutationSamples[sampleList.studyId] = _.keyBy(
                    sampleList.sampleIds
                );
                break;
            case 'all_cases_with_cna_data':
                cnaSamples[sampleList.studyId] = _.keyBy(sampleList.sampleIds);
                break;
            case 'all_cases_in_study':
                allSamples[sampleList.studyId] = _.keyBy(sampleList.sampleIds);
                break;
            default: {
                // this in case if the all cases list is tagged under other category
                if (sampleList.sampleListId === sampleList.studyId + '_all') {
                    allSamples[sampleList.studyId] = _.keyBy(
                        sampleList.sampleIds
                    );
                }
            }
        }
    });

    const selectedVirtualStudyIds = _.map(
        selectedVirtualStudies,
        virtualStudy => virtualStudy.id
    );
    const selectedPhysicalStudyIds = selectedStudies.filter(
        id => !_.includes(selectedVirtualStudyIds, id)
    );

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
                filteredMutationSamples[study.id] =
                    filteredMutationSamples[study.id] || {};
                filteredCnaSamples[study.id] =
                    filteredCnaSamples[study.id] || {};
                filteredMutationCnaSamples[study.id] =
                    filteredMutationCnaSamples[study.id] || {};
                filteredallSamples[study.id] =
                    filteredallSamples[study.id] || {};

                _.forEach(study.samples, sampleId => {
                    if (
                        mutationSamples[study.id] &&
                        mutationSamples[study.id][sampleId]
                    ) {
                        filteredMutationSamples[study.id][sampleId] = sampleId;
                    }
                    if (
                        cnaSamples[study.id] &&
                        cnaSamples[study.id][sampleId]
                    ) {
                        filteredCnaSamples[study.id][sampleId] = sampleId;
                    }
                    if (
                        mutationCnaSamples[study.id] &&
                        mutationCnaSamples[study.id][sampleId]
                    ) {
                        filteredMutationCnaSamples[study.id][
                            sampleId
                        ] = sampleId;
                    }
                    if (
                        allSamples[study.id] &&
                        allSamples[study.id][sampleId]
                    ) {
                        filteredallSamples[study.id][sampleId] = sampleId;
                    }
                });
            }
        });
    });

    return {
        w_mut: _.reduce(
            filteredMutationSamples,
            (acc: number, next) => acc + Object.keys(next).length,
            0
        ),
        w_cna: _.reduce(
            filteredCnaSamples,
            (acc: number, next) => acc + Object.keys(next).length,
            0
        ),
        w_mut_cna: _.reduce(
            filteredMutationCnaSamples,
            (acc: number, next) => acc + Object.keys(next).length,
            0
        ),
        all: _.reduce(
            filteredallSamples,
            (acc: number, next) => acc + Object.keys(next).length,
            0
        ),
    };
}
