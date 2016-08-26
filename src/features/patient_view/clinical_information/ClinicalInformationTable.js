import React, { PropTypes as T } from 'react';

export class ClinicalInformationTable extends React.Component {

    componentDidMount() {

    }

    render() {

        const arr = [];

        this.props.data.forEach((item, i)=>{
            arr.push(<div className="success" key={i}><b>{ item.get(0) }</b></div>);
        });

        return (<div>{ arr }</div>)

    }
}

export default ClinicalInformationTable;

// grant access to the store via context
ClinicalInformationTable.contextTypes = {
    store: React.PropTypes.object.isRequired
};
