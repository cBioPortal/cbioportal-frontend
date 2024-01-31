import {
    DownloadControlOption,
    DownloadControls,
} from 'cbioportal-frontend-commons';
import { IMutationMapperProps } from './MutationMapper';

// This is a subset of IServerConfig containing config values used only in Mutation Mapper
export interface IMutationMapperServerConfig {
    skin_custom_driver_description?: string;
    skin_custom_driver_tiers_name?: string;
    skin_custom_driver_tiers_description?: string;
    skin_custom_driver_name?: string;
    show_oncokb?: boolean;
    show_genomenexus?: boolean;
    show_hotspot?: boolean;
    mycancergenome_show?: boolean;
    show_civic?: boolean;
    show_revue?: boolean;
    ptmSources?: string[];
    mygene_info_url: string | null;
    uniprot_id_url: string | null;
    ensembl_transcript_url: string | null;
    genomenexus_isoform_override_source: string | undefined;
    genomenexus_url: string | null;
    skin_hide_download_controls?: string;
}

export function convertToMutationMapperProps(
    config: IMutationMapperServerConfig
): Partial<IMutationMapperProps> {
    return {
        genomeNexusUrl: config.genomenexus_url || undefined,
        isoformOverrideSource: config.genomenexus_isoform_override_source,
        myGeneInfoUrlTemplate: config.mygene_info_url || undefined,
        uniprotIdUrlTemplate: config.uniprot_id_url || undefined,
        transcriptSummaryUrlTemplate:
            config.ensembl_transcript_url || undefined,
        enableOncoKb: config.show_oncokb,
        enableGenomeNexus: config.show_genomenexus,
        enableHotspot: config.show_hotspot,
        enableMyCancerGenome: config.mycancergenome_show,
        enableCivic: config.show_civic,
        enableRevue: config.show_revue,
        showDownload:
            config.skin_hide_download_controls !==
            DownloadControlOption.HIDE_ALL,
        customDriverName: config.skin_custom_driver_name,
        customDriverDescription: config.skin_custom_driver_description,
        customDriverTiersName: config.skin_custom_driver_tiers_name,
        customDriverTiersDescription:
            config.skin_custom_driver_tiers_description,
    };
}
