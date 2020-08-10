import AppConfig from 'appConfig';

export const SHOW_MUTATION_ASSESSOR = RegExp('mutation_assessor', 'gi').test(
    AppConfig.serverConfig.show_genomenexus_annotation_sources
);
