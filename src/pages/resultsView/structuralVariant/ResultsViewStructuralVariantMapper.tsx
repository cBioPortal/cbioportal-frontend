/*
 * Copyright (c) 2018 The Hyve B.V.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { observer } from 'mobx-react';
import { action, computed, makeObservable, observable } from 'mobx';
import { StructuralVariant } from 'cbioportal-ts-api-client';

import ResultsViewStructuralVariantTable from './ResultsViewStructuralVariantTable';
import GenePartnerChart from './GenePartnerChart';
import ResultsViewStructuralVariantMapperDataStore from './ResultsViewStructuralVariantMapperDataStore';
import { ResultsViewStructuralVariantMapperStore } from './ResultsViewStructuralVariantMapperStore';

import LoadingIndicator from '../../../shared/components/loadingIndicator/LoadingIndicator';
import {
    getOncoKbIconStyleFromLocalStorage,
    saveOncoKbIconStyleToLocalStorage,
} from 'shared/lib/AnnotationColumnUtils';
import { MakeMobxView } from 'shared/components/MobxView';
import ErrorMessage from 'shared/components/ErrorMessage';

export interface IFusionMapperProps {
    store: ResultsViewStructuralVariantMapperStore;
}

@observer
export default class ResultsViewStructuralVariantMapper extends React.Component<
    IFusionMapperProps,
    {}
> {
    @observable mergeFusionTableOncoKbIcons;

    @observable selectedPartner: string | undefined;

    private dataStore: ResultsViewStructuralVariantMapperDataStore;

    private originalDataFilter: (
        row: StructuralVariant[],
        filterString?: string,
        filterStringUpper?: string,
        filterStringLower?: string
    ) => boolean;

    constructor(props: IFusionMapperProps) {
        super(props);
        makeObservable(this);

        this.mergeFusionTableOncoKbIcons =
            getOncoKbIconStyleFromLocalStorage().mergeIcons;

        this.selectedPartner = undefined;

        this.dataStore = new ResultsViewStructuralVariantMapperDataStore(
            (this.props.store.fusions || []).map(fusion => [fusion])
        );

        this.originalDataFilter = this.dataStore.getFilter();
    }

    @action.bound
    handleOncoKbIconToggle(mergeIcons: boolean) {
        this.mergeFusionTableOncoKbIcons = mergeIcons;
        saveOncoKbIconStyleToLocalStorage({ mergeIcons });
    }

    @action.bound
    handlePartnerSelect(partner: string) {
        if (this.selectedPartner === partner) {
            this.selectedPartner = undefined;
            this.dataStore.setFilter(this.originalDataFilter);
            return;
        }

        this.selectedPartner = partner;

        this.dataStore.setFilter(
            (
                row: StructuralVariant[],
                filterString?: string,
                filterStringUpper?: string,
                filterStringLower?: string
            ) =>
                this.originalDataFilter(
                    row,
                    filterString,
                    filterStringUpper,
                    filterStringLower
                ) &&
                row.some(
                    variant =>
                        variant.site1HugoSymbol === partner ||
                        variant.site2HugoSymbol === partner
                )
        );
    }

    @computed
    get itemsLabelPlural(): string {
        const count =
            this.dataStore.duplicateStructuralVariantCountInMultipleSamples;

        const structuralVariantsLabel =
            count === 1 ? 'structural variant' : 'structural variants';

        const multipleStructuralVariantInfo =
            count > 0
                ? `: includes ${count} duplicate ${structuralVariantsLabel} in patients with multiple samples`
                : '';

        return `Structural Variants${multipleStructuralVariantInfo}`;
    }

    tableUI = MakeMobxView({
        await: () => [
            this.props.store.studyIdToStudy,
            this.props.store.molecularProfileIdToMolecularProfile,
        ],

        render: () => {
            return (
                <>
                    <GenePartnerChart
                        queryGene={this.props.store.gene.hugoGeneSymbol}
                        variants={this.props.store.fusions}
                        selectedPartner={this.selectedPartner}
                        onPartnerSelect={this.handlePartnerSelect}
                    />

                    <ResultsViewStructuralVariantTable
                        dataStore={this.dataStore}
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
                        mergeOncoKbIcons={this.mergeFusionTableOncoKbIcons}
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
