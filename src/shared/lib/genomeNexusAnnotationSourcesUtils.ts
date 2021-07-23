import AppConfig from 'appConfig';

export function shouldShowMutationAssessor() {
    return RegExp('mutation_assessor', 'gi').test(
        AppConfig.serverConfig.show_genomenexus_annotation_sources
    );
}
