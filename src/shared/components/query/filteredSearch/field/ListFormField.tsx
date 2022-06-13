import { FieldProps } from 'shared/components/query/filteredSearch/field/FilterFormField';
import * as React from 'react';
import { FunctionComponent } from 'react';
import { ISearchClause, Phrase } from 'shared/components/query/SearchClause';

export type ListFilterField = {
    label: string;
    input: typeof FilterList;
    options: string[];
};

export const FilterList: FunctionComponent<FieldProps> = props => {
    const form = props.filter.form as ListFilterField;

    return (
        <div className="filter-list">
            <span>{form.label}</span>
            {form.options.map(option => {
                const update = props.parser.parseSearchQuery(option);
                const queryPhrases = toUniquePhrases(props.query);
                return (
                    <li className="dropdown-item">
                        <a
                            style={{
                                display: 'block',
                                padding: '5px',
                            }}
                            tabIndex={-1}
                            onClick={() =>
                                props.onChange({
                                    toAdd: update,
                                    toRemove: queryPhrases,
                                })
                            }
                        >
                            {option}
                        </a>
                    </li>
                );
            })}
        </div>
    );
};

function toUniquePhrases(query: ISearchClause[]): Phrase[] {
    return query.reduce<Phrase[]>((accumulator, clause) => {
        accumulator.push(...clause.getPhrases());
        return [...new Set(accumulator)];
    }, []);
}
