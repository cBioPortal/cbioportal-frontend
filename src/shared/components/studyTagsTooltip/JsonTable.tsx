import * as React from 'react';

type JsonValue = any;

function isNested(value: JsonValue): boolean {
    return value !== null && typeof value === 'object';
}

function isPlainObject(value: JsonValue): boolean {
    return isNested(value) && !Array.isArray(value);
}

function formatPrimitive(value: JsonValue): string {
    return value === null || value === undefined ? '' : String(value);
}

const ObjectTable: React.FunctionComponent<{
    value: { [key: string]: JsonValue };
}> = ({ value }) => (
    <table>
        <tbody>
            {Object.keys(value).map(key =>
                isNested(value[key]) ? (
                    <tr key={key}>
                        <td colSpan={2}>
                            <div>
                                <strong>{key}</strong>
                            </div>
                            <ValueTable value={value[key]} />
                        </td>
                    </tr>
                ) : (
                    <tr key={key}>
                        <td>
                            <strong>{key}</strong>
                        </td>
                        <td>{formatPrimitive(value[key])}</td>
                    </tr>
                )
            )}
        </tbody>
    </table>
);

// Arrays of objects render as a grid: one header row with the union of the
// items' keys, then one row per item. Any other array renders one item per row.
const ArrayTable: React.FunctionComponent<{ value: JsonValue[] }> = ({
    value,
}) => {
    if (value.length > 0 && value.every(isPlainObject)) {
        const columns: string[] = [];
        value.forEach(item =>
            Object.keys(item).forEach(key => {
                if (!columns.includes(key)) {
                    columns.push(key);
                }
            })
        );
        return (
            <table>
                <tbody>
                    <tr>
                        {columns.map(column => (
                            <td key={column}>{column}</td>
                        ))}
                    </tr>
                    {value.map((item, i) => (
                        <tr key={i}>
                            {columns.map(column => (
                                <td key={column}>
                                    <Cell value={item[column]} />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }
    return (
        <table>
            <tbody>
                {value.map((item, i) => (
                    <tr key={i}>
                        <td>
                            <Cell value={item} />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

const ValueTable: React.FunctionComponent<{ value: JsonValue }> = ({ value }) =>
    Array.isArray(value) ? (
        <ArrayTable value={value} />
    ) : (
        <ObjectTable value={value} />
    );

const Cell: React.FunctionComponent<{ value: JsonValue }> = ({ value }) =>
    isNested(value) ? (
        <ValueTable value={value} />
    ) : (
        <>{formatPrimitive(value)}</>
    );

/**
 * Renders arbitrary JSON (as returned by the study tags endpoint) as nested
 * HTML tables: object keys become labelled rows, nested objects and arrays
 * become sub-tables.
 */
const JsonTable: React.FunctionComponent<{ json: JsonValue }> = ({ json }) => (
    <div className="json-to-table">
        {isNested(json) ? <ValueTable value={json} /> : formatPrimitive(json)}
    </div>
);

export default JsonTable;
