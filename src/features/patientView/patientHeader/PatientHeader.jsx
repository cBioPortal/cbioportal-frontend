import React from 'react';

class PatientHeader extends React.Component {

    render() {

        console.log("patient header render");
        return (
            <div>
                <div>
                    <a onClick={() => { this.props.setTab(2); }}>do it</a>
                    {this.props.status}
                </div>
            </div>
        );
    }
}

export default PatientHeader;
