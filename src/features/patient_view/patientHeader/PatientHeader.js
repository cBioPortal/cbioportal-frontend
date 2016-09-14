import React from 'react';

export default class PatientNode extends React.Component {

    render() {
        return (
            <div>
                <div>
                    <a onClick={()=>{this.props.setTab(2)}}>do it</a>
                    {this.props.status}
                </div>
            </div>
        );
    }
}

