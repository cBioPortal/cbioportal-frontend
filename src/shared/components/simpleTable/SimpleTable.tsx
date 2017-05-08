import * as React from 'react';
import './styles.scss';
import { If, Then,  Else } from 'react-if';

interface ISimpleTableProps {
    headers:JSX.Element[];
    rows:JSX.Element[];
    noRowsText?:string;
    className?:string;
};

export default class SimpleTable extends React.Component<ISimpleTableProps, {}>
{


    public render() {
        const {headers, rows, className, noRowsText} = this.props;

        const tableRows = rows.length > 0 ? rows :
            [<tr>
                <td style={{textAlign:'center'}} colSpan={headers.length}>
                    {noRowsText || "There are no results."}
                </td>
            </tr>];

        return (
            <table className={`table table-striped table-border-top${className ? ' ' + className : ''}`}>
                <thead>
                    <tr>{headers}</tr>
                </thead>
                <tbody>
                    {tableRows}
                </tbody>
            </table>
        );
    }
}