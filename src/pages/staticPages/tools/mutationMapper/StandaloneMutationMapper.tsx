import * as React from 'react';
import { observer } from 'mobx-react';
import StandaloneMutationTable from './StandaloneMutationTable';
import {
    IMutationMapperProps,
    default as MutationMapper,
} from 'shared/components/mutationMapper/MutationMapper';
import { MutationTableDownloadDataFetcher } from 'shared/lib/MutationTableDownloadDataFetcher';

export interface IStandaloneMutationMapperProps extends IMutationMapperProps {
    // add standalone view specific props here if needed
    downloadDataFetcher?: MutationTableDownloadDataFetcher;
    generateGenomeNexusHgvsgUrl: (hgvsg: string) => string;
}
@observer
export default class StandaloneMutationMapper extends MutationMapper<
    IStandaloneMutationMapperProps
> {
    constructor(props: IMutationMapperProps) {
        super(props);
    }

    protected get mutationTableComponent(): JSX.Element | null {
        return (
            <StandaloneMutationTable
                uniqueSampleKeyToTumorType={
                    this.props.store.uniqueSampleKeyToTumorType
                }
                oncoKbCancerGenes={this.props.store.oncoKbCancerGenes}
                usingPublicOncoKbInstance={
                    this.props.store.usingPublicOncoKbInstance
                }
                indexedVariantAnnotations={
                    this.props.store.indexedVariantAnnotations
                }
                indexedMyVariantInfoAnnotations={
                    this.props.store.indexedMyVariantInfoAnnotations
                }
                genomeNexusCache={this.props.genomeNexusCache}
                genomeNexusMutationAssessorCache={
                    this.props.genomeNexusMutationAssessorCache
                }
                pubMedCache={this.props.pubMedCache}
                dataStore={this.props.store.dataStore}
                itemsLabelPlural={this.itemsLabelPlural}
                downloadDataFetcher={this.props.downloadDataFetcher}
                myCancerGenomeData={this.props.store.myCancerGenomeData}
                hotspotData={this.props.store.indexedHotspotData}
                oncoKbData={this.props.store.oncoKbData}
                civicVariants={this.props.store.civicVariants}
                civicGenes={this.props.store.civicGenes}
                enableOncoKb={this.props.enableOncoKb}
                enableFunctionalImpact={this.props.enableGenomeNexus}
                enableHotspot={this.props.enableHotspot}
                enableMyCancerGenome={this.props.enableMyCancerGenome}
                enableCivic={this.props.enableCivic}
                generateGenomeNexusHgvsgUrl={
                    this.props.generateGenomeNexusHgvsgUrl
                }
            />
        );
    }
}
