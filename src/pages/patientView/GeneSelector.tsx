import * as React from 'react';
import { observer } from 'mobx-react';
import Select from 'react-select';
import { Gene } from 'cbioportal-ts-api-client';
import { MobxPromise } from 'cbioportal-frontend-commons';
import AsyncSelect from 'react-select/async';

interface GeneSelectorProps {
    allGenes: Gene[];
    onGeneSelect: (entrezGeneId: number | undefined) => void;
    selectedGeneEntrezId?: number;
}

@observer
export default class GeneSelector extends React.Component<GeneSelectorProps> {
    render() {
        const { allGenes, onGeneSelect, selectedGeneEntrezId } = this.props;

        const selectedGene = selectedGeneEntrezId
            ? allGenes.find(gene => gene.entrezGeneId === selectedGeneEntrezId)
            : undefined;

        const loadOptions = (inputText: string, callback: any) => {
            if (!inputText) {
                callback([]);
            }
            const stringCompare = (item: any) =>
                item.hugoGeneSymbol.startsWith(inputText.toUpperCase());
            const options = this.props.allGenes;
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

        const defaultOptions = this.props.allGenes.slice(0, 200).map(gene => ({
            label: gene.hugoGeneSymbol,
            value: gene,
        }));

        return (
            <div
                data-test="GeneSelector"
                style={{ width: 200, paddingRight: 10 }}
            >
                <AsyncSelect
                    name="Select gene"
                    onChange={(option: any | null) => {
                        this.props.onGeneSelect(
                            option ? option.value.entrezGeneId : undefined
                        );
                    }}
                    isClearable={true}
                    isSearchable={true}
                    defaultOptions={defaultOptions}
                    value={
                        this.props.selectedGeneEntrezId
                            ? {
                                  label: selectedGene!.hugoGeneSymbol,
                                  value: selectedGene,
                              }
                            : null
                    }
                    placeholder={'Search genes'}
                    loadOptions={loadOptions}
                    cacheOptions={true}
                />
            </div>
        );
    }
}
