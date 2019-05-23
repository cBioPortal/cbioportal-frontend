import _ from "lodash";

import DataStore from "../model/DataStore";
import {DataFilter} from "../model/DataFilter";

export function updatePositionSelectionFilters(dataStore: DataStore,
                                               position: number,
                                               isMultiSelect: boolean = false,
                                               defaultFilterProps: Partial<DataFilter> = {})
{
    const currentlySelected = dataStore.isPositionSelected(position);
    let selectedPositions: number[] = [];

    if (isMultiSelect) {
        // we need to keep previous positions if shift pressed,
        // but we still want to clear other filters tied with these positions
        selectedPositions = findAllUniquePositions(dataStore.selectionFilters);

        // remove current position if already selected
        if (currentlySelected) {
            selectedPositions = _.without(selectedPositions, position);
        }
    }

    // add current position into list if not selected
    if (!currentlySelected) {
        selectedPositions.push(position);
    }

    const positionFilter = {...defaultFilterProps, position: selectedPositions};
    // we want to keep other filters (filters not related to positions) as is
    const otherFilters = dataStore.selectionFilters.filter(f => f.position === undefined);

    // reset filters
    dataStore.clearSelectionFilters();
    dataStore.setSelectionFilters([positionFilter, ...otherFilters]);
}

export function updatePositionHighlightFilters(dataStore: DataStore,
                                               position: number,
                                               defaultFilterProps: Partial<DataFilter> = {})
{
    dataStore.clearHighlightFilters();
    dataStore.setHighlightFilters([{...defaultFilterProps, position: [position]}]);
}

export function findAllUniquePositions(filters: DataFilter[]): number[]
{
    return _.uniq(_.flatten(
        filters
            // remove filters with undefined positions
            .filter(f => f.position !== undefined)
            .map(f => [...f.position!])
    ));
}
