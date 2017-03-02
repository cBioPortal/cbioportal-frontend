import * as React from 'react';
import './styles.scss';

type SimpleTableProps = {
    headers:JSX.Element[];
    rows:JSX.Element[];
};

export default class SimpleTable extends React.Component<SimpleTableProps, {}>
{
    public render() {
        return (
            <table className="table table-striped table-border-top">
                <thead>
                    <tr>{this.props.headers}</tr>
                </thead>
                <tbody>
                    {this.props.rows}
                </tbody>
            </table>
        );
    }
}