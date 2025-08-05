import * as React from 'react';
import ResultsViewStructuralVariantTable from './ResultsViewStructuralVariantTable';
import { observer } from 'mobx-react';
import { ResultsViewStructuralVariantMapperStore } from './ResultsViewStructuralVariantMapperStore';
import LoadingIndicator from '../../../shared/components/loadingIndicator/LoadingIndicator';
import { action, computed, makeObservable, observable } from 'mobx';
import {
    getOncoKbIconStyleFromLocalStorage,
    saveOncoKbIconStyleToLocalStorage,
} from 'shared/lib/AnnotationColumnUtils';
import { MakeMobxView } from 'shared/components/MobxView';
import ErrorMessage from 'shared/components/ErrorMessage';
import ChromoscopeView from 'shared/components/chromoscope/ChromoscopeView';
import { StructuralVariant } from 'cbioportal-ts-api-client';
import {
    transformStructuralVariantsForVisualization,
    filterStructuralVariantsByGene,
    GenomeVisualizationSV,
} from 'shared/lib/goslingTransforms/goslingStructuralVariantTransform';

export interface IStructuralVariantMapperProps {
    store: ResultsViewStructuralVariantMapperStore;
}

@observer
export default class ResultsViewStructuralVariantMapper extends React.Component<
    IStructuralVariantMapperProps,
    {}
> {
    @observable mergeStructuralVariantTableOncoKbIcons;
    @observable selectedStructuralVariant: StructuralVariant | null = null;

    constructor(props: IStructuralVariantMapperProps) {
        super(props);
        makeObservable(this);

        this.mergeStructuralVariantTableOncoKbIcons = getOncoKbIconStyleFromLocalStorage().mergeIcons;
    }

    @action.bound
    handleOncoKbIconToggle(mergeIcons: boolean) {
        this.mergeStructuralVariantTableOncoKbIcons = mergeIcons;
        saveOncoKbIconStyleToLocalStorage({ mergeIcons });
    }

    /**
     * Handle structural variant selection from Chromoscope visualization
     */
    @action.bound
    handleSVSelection(svId: string) {
        const sv = this.props.store.structuralVariants.find(variant => {
            const transformedSV = this.transformedSVData.find(
                transformed => transformed.sv_id === svId
            );
            return (
                transformedSV &&
                variant.sampleId === transformedSV.sampleId &&
                variant.site1Position === transformedSV.start1 &&
                variant.site2Position === transformedSV.start2
            );
        });

        if (sv) {
            this.selectedStructuralVariant = sv;
        }
    }

    @computed get itemsLabelPlural(): string {
        const count = this.props.store.dataStore
            .duplicateStructuralVariantCountInMultipleSamples;
        const structuralVariantsLabel =
            count === 1 ? 'structural variant' : 'structural variants';

        const multipleStructuralVariantInfo =
            count > 0
                ? `: includes ${count} duplicate ${structuralVariantsLabel} in patients with multiple samples`
                : '';

        return `Structural Variants${multipleStructuralVariantInfo}`;
    }

    /**
     * Transform structural variant data for visualization
     */
    @computed get transformedSVData(): GenomeVisualizationSV[] {
        return transformStructuralVariantsForVisualization(
            this.props.store.structuralVariants
        );
    }

    /**
     * Filter structural variants by current gene
     */
    @computed get filteredSVData(): GenomeVisualizationSV[] {
        return filterStructuralVariantsByGene(
            this.transformedSVData,
            this.props.store.gene.hugoGeneSymbol
        );
    }

    /**
     * Generate selected SV ID for visualization highlighting
     */
    @computed get selectedSvId(): string | undefined {
        if (!this.selectedStructuralVariant) return undefined;

        const sv = this.selectedStructuralVariant;
        const transformedSV = this.transformedSVData.find(
            transformed =>
                transformed.sampleId === sv.sampleId &&
                transformed.start1 === sv.site1Position &&
                transformed.start2 === sv.site2Position
        );

        return transformedSV?.sv_id;
    }

    tableUI = MakeMobxView({
        await: () => [
            this.props.store.studyIdToStudy,
            this.props.store.molecularProfileIdToMolecularProfile,
        ],

        render: () => {
            return (
                <>
                    <ChromoscopeView
                        data={this.filteredSVData}
                        assembly="hg38"
                        width={1200}
                        height={400}
                        selectedId={this.selectedSvId}
                        onClick={this.handleSVSelection}
                    />

                    <ResultsViewStructuralVariantTable
                        dataStore={this.props.store.dataStore}
                        itemsLabelPlural={this.itemsLabelPlural}
                        studyIdToStudy={this.props.store.studyIdToStudy.result}
                        molecularProfileIdToMolecularProfile={
                            this.props.store
                                .molecularProfileIdToMolecularProfile.result
                        }
                        transcriptToExons={this.props.store.transcriptToExons}
                        uniqueSampleKeyToTumorType={
                            this.props.store.uniqueSampleKeyToTumorType
                        }
                        structuralVariantOncoKbData={
                            this.props.store.structuralVariantOncoKbData
                        }
                        oncoKbCancerGenes={this.props.store.oncoKbCancerGenes}
                        usingPublicOncoKbInstance={
                            this.props.store.usingPublicOncoKbInstance
                        }
                        mergeOncoKbIcons={
                            this.mergeStructuralVariantTableOncoKbIcons
                        }
                        onOncoKbIconToggle={this.handleOncoKbIconToggle}
                    />
                </>
            );
        },

        renderPending: () => (
            <LoadingIndicator center={true} isLoading={true} size={'big'} />
        ),
        renderError: () => <ErrorMessage />,
    });

    public render() {
        return this.tableUI.component;
    }
}
