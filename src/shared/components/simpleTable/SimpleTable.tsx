import * as React from 'react';
import './styles.scss';
import { If, Then,  Else } from 'react-if';

type SimpleTableProps = {
    headers:JSX.Element[];
    rows:JSX.Element[];
    noRowsText?:string;
};

export default class SimpleTable extends React.Component<SimpleTableProps, {}>
{


    public render() {

        const rows = this.props.rows.length > 0 ? this.props.rows :
            [<tr>
                <td style={{textAlign:'center'}} colSpan={this.props.headers.length}>
                    {this.props.noRowsText || "There are no results."}
                </td>
            </tr>];

        return (
            <table className="table table-striped table-border-top">
                <thead>
                    <tr>{this.props.headers}</tr>
                </thead>
                <tbody>
                    {rows}
                </tbody>
            </table>
        );
    }
}