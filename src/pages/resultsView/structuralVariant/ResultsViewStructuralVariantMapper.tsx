/**
 * Copyright (c) 2018 The Hyve B.V.
 * This code is licensed under the GNU Affero General Public License (AGPL),
 * version 3, or (at your option) any later version.
 *
 * This file is part of cBioPortal.
 *
 * cBioPortal is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 **/

import * as React from 'react';
import ResultsViewStructuralVariantTable from './ResultsViewStructuralVariantTable';
import { observer } from 'mobx-react';
import { ResultsViewStructuralVariantMapperStore } from './ResultsViewStructuralVariantMapperStore';
import LoadingIndicator from '../../../shared/components/loadingIndicator/LoadingIndicator';
import {
    action,
    computed,
    IReactionDisposer,
    makeObservable,
    observable,
    reaction,
} from 'mobx';
import {
    getOncoKbIconStyleFromLocalStorage,
    saveOncoKbIconStyleToLocalStorage,
} from 'shared/lib/AnnotationColumnUtils';
import { MakeMobxView } from 'shared/components/MobxView';
import ErrorMessage from 'shared/components/ErrorMessage';
import { StructuralVariant } from 'cbioportal-ts-api-client';
import { Column } from 'shared/components/lazyMobXTable/LazyMobXTable';
import FilterIconModal from 'shared/components/filterIconModal/FilterIconModal';
import DoubleHandleSlider from 'shared/components/doubleHandleSlider/DoubleHandleSlider';
import CategoricalFilterMenu from 'shared/components/categoricalFilterMenu/CategoricalFilterMenu';
import { FusionTableColumnType } from 'shared/components/structuralVariantTable/StructuralVariantTable';
import AnnotationColumnFormatter from 'pages/patientView/structuralVariant/column/AnnotationColumnFormatter';
import { isSomaticIndicator } from 'oncokb-frontend-commons';
import {
    CategoricalColumnFilter,
    NumericColumnFilter,
    numericColumns,
    structuralVariantColumnValue,
    StructuralVariantFilterContext,
} from './StructuralVariantFilters';

export interface IFusionMapperProps {
    store: ResultsViewStructuralVariantMapperStore;
}

@observer
export default class ResultsViewStructuralVariantMapper extends React.Component<
    IFusionMapperProps,
    {}
> {
    @observable mergeFusionTableOncoKbIcons;
    private filterContextReaction: IReactionDisposer;

    constructor(props: IFusionMapperProps) {
        super(props);
        makeObservable(this);

        this.mergeFusionTableOncoKbIcons = getOncoKbIconStyleFromLocalStorage().mergeIcons;
        this.filterContextReaction = reaction(
            () => ({
                transcriptToExons: this.props.store.transcriptToExons,
                studyIdToStudy: this.props.store.studyIdToStudy.result,
            }),
            ({ transcriptToExons, studyIdToStudy }) => {
                this.props.store.dataStore.setFilterContext({
                    transcriptToExons,
                    studyIdToStudy,
                    uniqueSampleKeyToTumorType: this.props.store
                        .uniqueSampleKeyToTumorType,
                    annotationValue: this.annotationValue,
                });
            },
            { fireImmediately: true }
        );
    }

    @action.bound
    handleOncoKbIconToggle(mergeIcons: boolean) {
        this.mergeFusionTableOncoKbIcons = mergeIcons;
        saveOncoKbIconStyleToLocalStorage({ mergeIcons });
    }

    componentWillUnmount() {
        this.filterContextReaction();
    }

    private annotationValue = (row: StructuralVariant[]) => {
        const annotation = AnnotationColumnFormatter.getData(
            row,
            this.props.store.oncoKbCancerGenes,
            this.props.store.structuralVariantOncoKbData,
            this.props.store.usingPublicOncoKbInstance,
            this.props.store.uniqueSampleKeyToTumorType,
            this.props.store.studyIdToStudy.result
        );
        const indicator = annotation.oncoKbIndicator;
        return indicator && isSomaticIndicator(indicator) && indicator.oncogenic
            ? indicator.oncogenic
            : annotation.isOncoKbCancerGene
            ? 'Cancer gene'
            : 'Unannotated';
    };

    private getContext(): StructuralVariantFilterContext {
        return {
            studyIdToStudy: this.props.store.studyIdToStudy.result,
            transcriptToExons: this.props.store.transcriptToExons,
            uniqueSampleKeyToTumorType: this.props.store
                .uniqueSampleKeyToTumorType,
            annotationValue: this.annotationValue,
        };
    }

    private valuesFor(
        column: FusionTableColumnType
    ): (string | number | null)[] {
        const context = this.getContext();
        return this.props.store.dataStore.allData.map(row =>
            structuralVariantColumnValue(row, column, context)
        );
    }

    private numericMenu(column: FusionTableColumnType) {
        const values = this.valuesFor(column);
        let min = Infinity;
        let max = -Infinity;
        values.forEach(value => {
            if (value !== null && Number.isFinite(Number(value))) {
                min = Math.min(min, Number(value));
                max = Math.max(max, Number(value));
            }
        });
        if (min === Infinity) {
            min = 0;
            max = 0;
        }
        const hasEmptyValues = values.some(value => value === null);
        const filter = this.props.store.dataStore.columnFilters[column] as
            | NumericColumnFilter
            | undefined;
        const update = (changes: Partial<NumericColumnFilter>) => {
            const next: NumericColumnFilter = {
                kind: 'numeric',
                lowerBound: min,
                upperBound: max,
                hideEmptyValues: false,
                ...filter,
                ...changes,
            };
            this.props.store.dataStore.setColumnFilter(
                column,
                next.lowerBound === min &&
                    next.upperBound === max &&
                    !next.hideEmptyValues
                    ? undefined
                    : next
            );
        };
        return (
            <div>
                <DoubleHandleSlider
                    id={`sv-${column}`}
                    min={String(min)}
                    max={String(max)}
                    lowerValue={filter?.lowerBound}
                    upperValue={filter?.upperBound}
                    callbackLowerValue={lowerBound => update({ lowerBound })}
                    callbackUpperValue={upperBound => update({ upperBound })}
                />
                {hasEmptyValues && (
                    <label style={{ fontWeight: 100 }}>
                        <input
                            type="checkbox"
                            checked={filter?.hideEmptyValues || false}
                            onChange={e =>
                                update({ hideEmptyValues: e.target.checked })
                            }
                            data-test="numerical-filter-menu-remove-empty-rows"
                        />
                        {'Hide empty values'}
                    </label>
                )}
            </div>
        );
    }

    private categoricalMenu(column: FusionTableColumnType) {
        const choices = new Set(
            this.valuesFor(column).map(value =>
                value === null ? '(Blanks)' : String(value)
            )
        );
        const filter = this.props.store.dataStore.columnFilters[column] as
            | CategoricalColumnFilter
            | undefined;
        const update = (changes: Partial<CategoricalColumnFilter>) => {
            const next: CategoricalColumnFilter = {
                kind: 'categorical',
                filterCondition: 'contains',
                filterString: '',
                selections: choices,
                ...filter,
                ...changes,
            };
            const allSelected =
                choices.size === next.selections.size &&
                Array.from(choices).every(value => next.selections.has(value));
            this.props.store.dataStore.setColumnFilter(
                column,
                allSelected &&
                    !next.filterString &&
                    next.filterCondition === 'contains'
                    ? undefined
                    : next
            );
        };
        return (
            <CategoricalFilterMenu
                id={`sv-${column}`}
                emptyFilterString={!filter}
                currSelections={filter?.selections || choices}
                allSelections={choices}
                updateFilterCondition={filterCondition =>
                    update({ filterCondition })
                }
                updateFilterString={filterString => update({ filterString })}
                toggleSelections={toggledSelections => {
                    const selections = new Set(filter?.selections || choices);
                    toggledSelections.forEach(value => {
                        if (selections.has(value)) selections.delete(value);
                        else selections.add(value);
                    });
                    update({ selections });
                }}
            />
        );
    }

    private columnToHeaderFilterIconModal = (
        tableColumn: Column<StructuralVariant[]>
    ) => {
        const column = tableColumn.name as FusionTableColumnType;
        if (!Object.values(FusionTableColumnType).includes(column))
            return undefined;
        const dataStore = this.props.store.dataStore;
        return (
            <FilterIconModal
                id={`sv-${column}`}
                label={column}
                filterIsActive={!!dataStore.columnFilters[column]}
                deactivateFilter={() => dataStore.setColumnFilter(column)}
                setupFilter={() => undefined}
                menuComponent={
                    numericColumns.has(column)
                        ? this.numericMenu(column)
                        : this.categoricalMenu(column)
                }
            />
        );
    };

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
                        mergeOncoKbIcons={this.mergeFusionTableOncoKbIcons}
                        onOncoKbIconToggle={this.handleOncoKbIconToggle}
                        columnToHeaderFilterIconModal={
                            this.columnToHeaderFilterIconModal
                        }
                        deactivateColumnFilter={columnId =>
                            this.props.store.dataStore.setColumnFilter(
                                columnId as FusionTableColumnType
                            )
                        }
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
