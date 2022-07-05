import * as React from 'react';
import { FunctionComponent } from 'react';
import { CancerTreeSearchFilter } from 'shared/lib/query/textQueryUtils';
import {
    SearchClause,
    QueryUpdate,
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
                const appendDivider = index < filters.length - 1;
                // When all studies map to the same value
                // for the variable, do not render the form field.
                return filter.form.options.length < 2 ? null : (
                    <div>
                        <FilterFormField
                            filter={filter}
                            query={props.query}
                            onChange={props.onChange}
                            parser={props.parser}
                        />
                        {appendDivider === true && (
                            <hr style={{ margin: '1em' }} />
                        )}
                    </div>
                );
            })}
        </ul>
    );
};
