import React, {PropTypes as T} from 'react';
import {Table} from 'react-bootstrap';
import Immutable from 'immutable';

export default class ClinicalInformationPatientTable extends React.Component {

    componentDidMount() {

    }

    shouldComponentUpdate(nextProps, nextState) {
        return (nextProps === this.props);
    }


    render() {

        console.log(this.props.data);

        const rows = [];

        this.props.data.forEach((item)=> {

            rows.push(
                <tr key={item.get('id')}>
                    <td>{item.get('name')}</td>
                    <td>{item.get('value')}</td>
                </tr>
            )

        });

        return (
            <Table striped>
                <thead>
                <tr>
                    <th>Attribute</th>
                    <th>Value</th>
                </tr>
                </thead>
                <tbody>
                {rows}
                </tbody>

            </Table>
        )
        // const headerCells = this.props.data.get('columns').map((col)=>{
        //     return <th>{col.get('id')}</th>
        // });
        //
        // const rows = this.props.data.get('items').map((row, key) => {
        //     return (<tr key={key}>
        //             <th>{row.get('name')}</th>
        //             {
        //                 this.props.data.get('columns').map((col)=> {
        //                     if(col.get('id') in row.toJS()) {
        //                         return <td>{row.get(col.get('id'))}</td>
        //                     } else {
        //                         return <td>N/A</td>
        //                     }
        //
        //                 })
        //             }
        //
        //         </tr>
        //     );
        // });
        //
        // return (
        //     <Table striped>
        //         <thead><tr>
        //             <th></th>
        //             { headerCells }
        //         </tr></thead>
        //         <tbody>{ rows }</tbody>
        //     </Table>
        // );
    }
}


ClinicalInformationPatientTable.propTypes = {
    data: T.any.isRequired
};
