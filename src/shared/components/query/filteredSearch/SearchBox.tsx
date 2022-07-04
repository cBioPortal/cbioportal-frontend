import * as React from 'react';
import { FunctionComponent, useEffect, useState } from 'react';
import { useDebounce } from 'shared/components/query/filteredSearch/useDebounce';

type SearchBoxProps = {
    queryString: string;
    onType: (changed: string) => void;
    onFocus: () => void;
};

export const SearchBox: FunctionComponent<SearchBoxProps> = props => {
    const [inputValue, setInputValue] = useState(props.queryString);
    const debouncedInput: string = useDebounce<string>(inputValue, 500);

    useEffect(() => {
        if (debouncedInput !== props.queryString) {
            props.onType(debouncedInput);
        }
    }, [debouncedInput]);

    useEffect(() => {
        setInputValue(props.queryString);
    }, [props.queryString]);

    return (
        <>
            <input
                autoComplete="off"
                spellCheck="false"
                className="form-control"
                placeholder="Search..."
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onFocus={props.onFocus}
                style={{
                    width: '300px',
                }}
            />
        </>
    );
};
