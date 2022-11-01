import { action, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import AsyncSelect from 'react-select/async';
import GroupComparisonStore from './GroupComparisonStore';

interface ILollipopGeneSelectorProps {
    store: GroupComparisonStore;
}

export const LollipopGeneSelector: React.FC<ILollipopGeneSelectorProps> = ({
    store,
}: ILollipopGeneSelectorProps) => {
    const loadOptions = (inputText: string, callback: any) => {
        if (!inputText) {
            callback([]);
        }
        const stringCompare = (item: any) =>
            item.hugoGeneSymbol.startsWith(inputText.toUpperCase());
        const options = store.availableGenes.result!;
        callback(
            options
                .filter(stringCompare)
                .slice(0, 200)
                .map(g => ({
                    label: g.hugoGeneSymbol,
                    value: g,
                }))
        );
    };

    return (
        <div style={{ width: 200, paddingBottom: 10 }}>
            <AsyncSelect
                name="Select gene"
                onChange={(option: any | null) => {
                    if (option) {
                        store.setSelectedMutationMapperGene(option.value);
                    } else {
                        store.clearSelectedMutationMapperGene();
                    }
                }}
                isClearable={true}
                isSearchable={true}
                defaultOptions={store.availableGenes
                    .result!.slice(0, 200)
                    .map(gene => ({
                        label: gene.hugoGeneSymbol,
                        value: gene,
                    }))}
                defaultValue={
                    store.selectedMutationMapperGene
                        ? {
                              label:
                                  store.selectedMutationMapperGene
                                      .hugoGeneSymbol,
                              value: store.selectedMutationMapperGene,
                          }
                        : null
                }
                placeholder={'Select a gene'}
                loadOptions={loadOptions}
                cacheOptions={true}
            />
        </div>
    );
};
