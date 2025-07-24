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

export interface IStructuralVariantMapperProps {
    store: ResultsViewStructuralVariantMapperStore;
}

@observer
export default class ResultsViewStructuralVariantMapper extends React.Component<
    IStructuralVariantMapperProps,
    {}
> {
    @observable mergeStructuralVariantTableOncoKbIcons;

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

    tableUI = MakeMobxView({
        await: () => [
            this.props.store.studyIdToStudy,
            this.props.store.molecularProfileIdToMolecularProfile,
        ],

        render: () => {
            return (
                <>
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
