import * as React from 'react';
import { observer } from 'mobx-react';
import { makeObservable, observable } from 'mobx';
import _ from 'lodash';
import {
    CancerStudy,
    ClinicalData,
    GenePanelData,
    MolecularProfile,
    Mutation,
} from 'cbioportal-ts-api-client';
import { IColumnVisibilityControlsProps } from 'shared/components/columnVisibilityControls/ColumnVisibilityControls';
import SampleManager from '../SampleManager';
import PubMedCache from 'shared/cache/PubMedCache';
import MrnaExprRankCache from 'shared/cache/MrnaExprRankCache';
import { GeneFilterOption } from '../mutation/GeneFilterMenu';
import {
    ICivicGeneIndex,
    ICivicVariantIndex,
    IHotspotIndex,
    IMyCancerGenomeData,
    IMyVariantInfoIndex,
    IOncoKbData,
    RemoteData,
} from 'cbioportal-utils';
import { CancerGene } from 'oncokb-ts-api-client';
import {
    calculateOncoKbContentWidthWithInterval,
    DEFAULT_ONCOKB_CONTENT_WIDTH,
} from 'shared/lib/AnnotationColumnUtils';
import { ILazyMobXTableApplicationDataStore } from 'shared/lib/ILazyMobXTableApplicationDataStore';
import PatientViewMutationTable from './PatientViewMutationTable';
import { getServerConfig, ServerConfigHelpers } from 'config/config';
import VariantCountCache from 'shared/cache/VariantCountCache';
import DiscreteCNACache from 'shared/cache/DiscreteCNACache';
import GenomeNexusCache from 'shared/cache/GenomeNexusCache';
import GenomeNexusMutationAssessorCache from 'shared/cache/GenomeNexusMutationAssessorCache';
import { MutationTableDownloadDataFetcher } from 'shared/lib/MutationTableDownloadDataFetcher';
import { IMutSigData } from 'shared/model/MutSig';
import { ICosmicData } from 'shared/model/Cosmic';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';
import { NamespaceColumnConfig } from 'shared/components/mutationTable/MutationTable';
import MobxPromise from 'mobxpromise';

type IMutationTableWrapperProps = {
    profile: MolecularProfile | undefined;
    genePanelDataByMolecularProfileIdAndSampleId: {
        [profileId: string]: {
            [sampleId: string]: GenePanelData;
        };
    };
    dataStore?: ILazyMobXTableApplicationDataStore<Mutation[]>;
    studyIdToStudy?: { [studyId: string]: CancerStudy };
    sampleManager: SampleManager | null;
    sampleToGenePanelId: { [sampleId: string]: string | undefined };
    genePanelIdToEntrezGeneIds: { [genePanelId: string]: number[] };
    sampleIds: string[];
    uniqueSampleKeyToTumorType?: { [sampleId: string]: string };
    molecularProfileIdToMolecularProfile: {
        [molecularProfileId: string]: MolecularProfile;
    };
    variantCountCache: VariantCountCache;
    indexedVariantAnnotations: RemoteData<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    >;
    indexedMyVariantInfoAnnotations: RemoteData<
        IMyVariantInfoIndex | undefined
    >;
    discreteCNACache?: DiscreteCNACache;
    mrnaExprRankCache?: MrnaExprRankCache;
    pubMedCache?: PubMedCache;
    genomeNexusCache?: GenomeNexusCache;
    genomeNexusMutationAssessorCache?: GenomeNexusMutationAssessorCache;
    mrnaExprRankMolecularProfileId?: string;
    discreteCNAMolecularProfileId?: string;
    data: Mutation[][];
    downloadDataFetcher: MutationTableDownloadDataFetcher;
    mutSigData?: IMutSigData;
    myCancerGenomeData: IMyCancerGenomeData;
    hotspotData?: RemoteData<IHotspotIndex | undefined>;
    cosmicData?: ICosmicData;
    oncoKbData?: RemoteData<IOncoKbData | Error>;
    oncoKbCancerGenes?: RemoteData<CancerGene[] | Error | undefined>;
    usingPublicOncoKbInstance: boolean;
    mergeOncoKbIcons?: boolean;
    onOncoKbIconToggle: (mergeIcons: boolean) => void;
    civicGenes?: RemoteData<ICivicGeneIndex | undefined>;
    civicVariants?: RemoteData<ICivicVariantIndex | undefined>;
    userEmailAddress?: string | undefined;
    enableOncoKb?: boolean;
    enableFunctionalImpact: boolean;
    enableHotspot: boolean | undefined;
    enableMyCancerGenome: boolean | undefined;
    enableCivic?: boolean;
    columnVisibility?: { [columnId: string]: boolean };
    showGeneFilterMenu?: boolean;
    currentGeneFilter: GeneFilterOption;
    onFilterGenes?: (option: GeneFilterOption) => void;
    columnVisibilityProps?: IColumnVisibilityControlsProps;
    onSelectGenePanel?: (name: string) => void;
    disableTooltip?: boolean;
    generateGenomeNexusHgvsgUrl: (hgvsg: string) => string;
    onRowClick?: (d: Mutation[]) => void;
    onRowMouseEnter?: (d: Mutation[]) => void;
    onRowMouseLeave?: (d: Mutation[]) => void;
    sampleIdToClinicalDataMap?: MobxPromise<{ [x: string]: ClinicalData[] }>;
    existsSomeMutationWithAscnProperty: { [property: string]: boolean };
    namespaceColumns: NamespaceColumnConfig;
    columns: string[];
    alleleFreqHeaderRender?: ((name: string) => JSX.Element) | undefined;
    pageMode?: 'sample' | 'patient';
};

const ANNOTATION_ELEMENT_ID = 'mutation-annotation';

@observer
export default class MutationTableWrapper extends React.Component<
    IMutationTableWrapperProps,
    {}
> {
    @observable mergeOncoKbIcons;
    @observable oncokbWidth = DEFAULT_ONCOKB_CONTENT_WIDTH;
    private oncokbInterval: any;

    constructor(props: IMutationTableWrapperProps) {
        super(props);
        makeObservable(this);

        // here we wait for the oncokb icons to fully finish rendering
        // then update the oncokb width in order to align annotation column header icons with the cell content
        this.oncokbInterval = calculateOncoKbContentWidthWithInterval(
            ANNOTATION_ELEMENT_ID,
            oncoKbContentWidth => (this.oncokbWidth = oncoKbContentWidth)
        );

        this.mergeOncoKbIcons = !!props.mergeOncoKbIcons;
    }

    public destroy() {
        clearInterval(this.oncokbInterval);
    }

    public static defaultProps = {
        enableOncoKb: true,
        enableCivic: false,
        showGeneFilterMenu: true,
    };

    public render() {
        const isProfiled = this.props
            .genePanelDataByMolecularProfileIdAndSampleId?.[
            this.props.profile?.molecularProfileId!
        ]?.[this.props.sampleIds?.[0]]?.profiled;

        if (this.props.profile === undefined) {
            return (
                <div className="alert alert-info" role="alert">
                    Study has no Mutation data.
                </div>
            );
        } else if (!isProfiled) {
            return (
                <div className="alert alert-info" role="alert">
                    {this.props.pageMode === 'patient'
                        ? 'Patient is not profiled for Mutations.'
                        : 'Sample is not profiled for Mutations.'}
                </div>
            );
        }
        return (
            <PatientViewMutationTable
                dataStore={this.props.dataStore}
                studyIdToStudy={this.props.studyIdToStudy}
                sampleManager={this.props.sampleManager}
                sampleToGenePanelId={this.props.sampleToGenePanelId}
                genePanelIdToEntrezGeneIds={
                    this.props.genePanelIdToEntrezGeneIds
                }
                sampleIds={this.props.sampleIds}
                uniqueSampleKeyToTumorType={
                    this.props.uniqueSampleKeyToTumorType
                }
                molecularProfileIdToMolecularProfile={
                    this.props.molecularProfileIdToMolecularProfile
                }
                variantCountCache={this.props.variantCountCache}
                indexedVariantAnnotations={this.props.indexedVariantAnnotations}
                indexedMyVariantInfoAnnotations={
                    this.props.indexedMyVariantInfoAnnotations
                }
                discreteCNACache={this.props.discreteCNACache}
                mrnaExprRankCache={this.props.mrnaExprRankCache}
                pubMedCache={this.props.pubMedCache}
                genomeNexusCache={this.props.genomeNexusCache}
                genomeNexusMutationAssessorCache={
                    this.props.genomeNexusMutationAssessorCache
                }
                mrnaExprRankMolecularProfileId={
                    this.props.mrnaExprRankMolecularProfileId
                }
                discreteCNAMolecularProfileId={
                    this.props.discreteCNAMolecularProfileId
                }
                data={this.props.data}
                downloadDataFetcher={this.props.downloadDataFetcher}
                mutSigData={this.props.mutSigData}
                myCancerGenomeData={this.props.myCancerGenomeData}
                hotspotData={this.props.hotspotData}
                cosmicData={this.props.cosmicData}
                oncoKbData={this.props.oncoKbData}
                oncoKbCancerGenes={this.props.oncoKbCancerGenes}
                usingPublicOncoKbInstance={this.props.usingPublicOncoKbInstance}
                mergeOncoKbIcons={this.props.mergeOncoKbIcons}
                onOncoKbIconToggle={this.props.onOncoKbIconToggle}
                civicGenes={this.props.civicGenes}
                civicVariants={this.props.civicVariants}
                userEmailAddress={ServerConfigHelpers.getUserEmailAddress()}
                enableOncoKb={getServerConfig().show_oncokb}
                enableFunctionalImpact={getServerConfig().show_genomenexus}
                enableHotspot={getServerConfig().show_hotspot}
                enableMyCancerGenome={getServerConfig().mycancergenome_show}
                enableCivic={getServerConfig().show_civic}
                columnVisibility={this.props.columnVisibility}
                showGeneFilterMenu={this.props.showGeneFilterMenu}
                currentGeneFilter={this.props.currentGeneFilter}
                onFilterGenes={this.props.onFilterGenes}
                columnVisibilityProps={this.props.columnVisibilityProps}
                onSelectGenePanel={this.props.onSelectGenePanel}
                disableTooltip={this.props.disableTooltip}
                generateGenomeNexusHgvsgUrl={
                    this.props.generateGenomeNexusHgvsgUrl
                }
                onRowClick={this.props.onRowClick}
                onRowMouseEnter={this.props.onRowMouseEnter}
                onRowMouseLeave={this.props.onRowMouseLeave}
                sampleIdToClinicalDataMap={this.props.sampleIdToClinicalDataMap}
                existsSomeMutationWithAscnProperty={
                    this.props.existsSomeMutationWithAscnProperty
                }
                namespaceColumns={this.props.namespaceColumns}
                columns={this.props.columns}
                alleleFreqHeaderRender={this.props.alleleFreqHeaderRender}
            />
        );
    }
}
