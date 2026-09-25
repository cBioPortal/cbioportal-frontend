import * as React from 'react';

export type SimpleJsonTableProps = {
    json: { [key: string]: any };
};

function renderValue(value: any): string {
    if (value === null || value === undefined) {
        return '';
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}

export default class SimpleJsonTable extends React.Component<
    SimpleJsonTableProps,
    {}
> {
    render() {
        const { json } = this.props;
        return (
            <div className="json-to-table">
                <table>
                    <tbody>
                        {Object.keys(json).map(key => (
                            <tr key={key}>
                                <td>
                                    <strong>{key}</strong>
                                </td>
                                <td>{renderValue(json[key])}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }
}
