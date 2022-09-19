import * as React from 'react';
import { FunctionComponent } from 'react';
import { CancerTreeSearchFilter } from 'shared/lib/query/textQueryUtils';
import {
    QueryUpdate,
    SearchClause,
} from 'shared/components/query/filteredSearch/SearchClause';
import { QueryParser } from 'shared/lib/query/QueryParser';
import { FilterFormField } from 'shared/components/query/filteredSearch/field/FilterFormField';

export type FilteredSearchDropdownFormProps = {
    query: SearchClause[];
    filterConfig: CancerTreeSearchFilter[];
    onChange: (change: QueryUpdate) => void;
    parser: QueryParser;
};

/**
 * Rendering of search filters as defined in query parser
 */
export const StudySearchControls: FunctionComponent<FilteredSearchDropdownFormProps> = props => {
    return (
        <ul
            data-test="study-search-controls-container"
            className="dropdown-menu"
            style={{
                width: '300px',
            }}
        >
            {props.filterConfig.map((filter, index, filters) => {
                const notFirst = index !== 0;
                const hasPreviousFilter = filters
                    .slice(0, index)
                    .find(showFilter);
                return (
                    showFilter(filter) && (
                        <div>
                            {notFirst && hasPreviousFilter && (
                                <hr style={{ marginTop: '1em' }} />
                            )}
                            <FilterFormField
                                filter={filter}
                                query={props.query}
                                onChange={props.onChange}
                                parser={props.parser}
                            />
                        </div>
                    )
                );
            })}
        </ul>
    );
};

/**
 * Only render filters with multiple options
 * E.g. show reference genome filter when both hg19 and hg38 used
 */
function showFilter(filter: CancerTreeSearchFilter): boolean {
    return filter.form.options.length >= 2;
}
