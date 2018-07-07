import * as React from 'react';
import { observer } from "mobx-react";
import StandaloneMutationTable from "./StandaloneMutationTable";
import {
    IMutationMapperProps, default as MutationMapper
} from "shared/components/mutationMapper/MutationMapper";


@observer
export default class StandaloneMutationMapper extends MutationMapper<IMutationMapperProps>
{
    constructor(props: IMutationMapperProps) {
        super(props);
    }

    protected mutationTableComponent(): JSX.Element|null
    {
        return (
            <StandaloneMutationTable
                uniqueSampleKeyToTumorType={this.props.store.uniqueSampleKeyToTumorType}
                oncoKbAnnotatedGenes={this.props.store.oncoKbAnnotatedGenes}
                genomeNexusEnrichmentCache={this.props.genomeNexusEnrichmentCache}
                oncoKbEvidenceCache={this.props.oncoKbEvidenceCache}
                pubMedCache={this.props.pubMedCache}
                dataStore={this.props.store.dataStore}
                itemsLabelPlural={this.itemsLabelPlural}
                downloadDataFetcher={this.props.store.downloadDataFetcher}
                myCancerGenomeData={this.props.myCancerGenomeData}
                hotspotData={this.props.store.indexedHotspotData}
                oncoKbData={this.props.store.oncoKbData}
                enableOncoKb={this.props.config.showOncoKB}
                enableFunctionalImpact={this.props.config.showGenomeNexus}
                enableHotspot={this.props.config.showHotspot}
                enableMyCancerGenome={this.props.config.showMyCancerGenome}
                enableCivic={false}
            />
        );
    }
}