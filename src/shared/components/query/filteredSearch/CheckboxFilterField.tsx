import { FunctionComponent } from 'react';
import {
    AndSearchClause,
    ISearchClause,
    NotSearchClause,
    Phrase,
    QueryUpdate,
} from 'shared/components/query/SearchClause';
import * as React from 'react';
import { FieldProps } from 'shared/components/query/filteredSearch/FilteredSearchDropdownForm';
import { createPhrase } from 'shared/lib/query/textQueryUtils';

export type CheckboxFilterField = {
    input: typeof FilterCheckbox;
    label: string;
    options: string[];
};

export const FilterCheckbox: FunctionComponent<FieldProps> = props => {
    const form = props.filter.form as CheckboxFilterField;
    const prefix = props.filter.phrasePrefix || '';
    let checkedPhrases: Phrase[] = [];
    let uncheckedPhrases: Phrase[] = [];

    const phrases = props.filter.form.options.map(option =>
        createPhrase(prefix, option, props.filter.nodeFields)
    );
    const relevantClauses = props.query.filter(c =>
        phrases.find(p => c.contains(p))
    );
    for (const phrase of phrases) {
        const isChecked = isOptionChecked(phrase, relevantClauses);
        if (isChecked) {
            checkedPhrases.push(phrase);
        } else {
            uncheckedPhrases.push(phrase);
        }
    }

    return (
        <div className="filter-checkbox">
            <span>{form.label}</span>
            <div>
                {phrases.map((option: Phrase) => {
                    const id = `input-${option.phrase}`;
                    let isChecked = checkedPhrases.includes(option);
                    return (
                        <div
                            style={{
                                display: 'inline-block',
                                padding: '0 1em 0 0',
                            }}
                        >
                            <input
                                type="checkbox"
                                id={id}
                                value={option.phrase}
                                checked={isChecked}
                                onClick={() => {
                                    isChecked = !isChecked;
                                    updatePhrases(option, isChecked);
                                    const update = createUpdate(
                                        uncheckedPhrases,
                                        checkedPhrases
                                    );
                                    props.onChange(update);
                                }}
                                style={{
                                    display: 'inline-block',
                                }}
                            />
                            <label
                                htmlFor={id}
                                style={{
                                    display: 'inline-block',
                                    padding: '0 0 0 0.2em',
                                }}
                            >
                                {option.phrase}
                            </label>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    function updatePhrases(phrase: Phrase, checked?: boolean) {
        if (checked) {
            checkedPhrases.push(phrase);
            uncheckedPhrases = uncheckedPhrases.filter(as => as !== phrase);
        } else {
            uncheckedPhrases.push(phrase);
            checkedPhrases = checkedPhrases.filter(as => as !== phrase);
        }
    }
};

function isOptionChecked(
    phrase: Phrase,
    relevantClauses: ISearchClause[]
): boolean {
    const clause = relevantClauses.find(c => c.contains(phrase));
    if (clause && clause.isAnd()) {
        return true;
    }
    if (clause && clause.isNot()) {
        return false;
    }
    // option is checked when all others are not-clauses:
    return (
        relevantClauses.length === relevantClauses.filter(c => c.isNot()).length
    );
}

/**
 * Create query update while trying
 * to keep the query as short as possible
 */
export function createUpdate(not: Phrase[], and: Phrase[]): QueryUpdate {
    const toAdd: ISearchClause[] = [];
    const toRemove: Phrase[] = [];

    // if only and: remove all
    if (!not.length) {
        and.forEach(p => toRemove.push(p));
    }
    // if only not: create not
    else if (!and.length) {
        not.forEach(p => toAdd.push(new NotSearchClause(p)));
    }
    // if more and: create not, remove and
    else if (and.length <= not.length) {
        and.forEach(p => toAdd.push(new AndSearchClause([p])));
        not.forEach(p => toRemove.push(p));
    }
    // if more not: create and, remove not
    else {
        and.forEach(p => toRemove.push(p));
        not.forEach(p => toAdd.push(new NotSearchClause(p)));
    }
    return { toAdd, toRemove };
}
