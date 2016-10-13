import React from 'react';
import ReactDOM from 'react-dom';
import Oncoprint from './Oncoprint';
import { connect } from 'react-redux';
import { Tabs, Tab } from 'react-bootstrap';

class QueryResultPage extends React.Component {

    constructor(){
        super();
    }


    changeSort(){

    }

    render() {
        return (
            <div>
                <h1>Oncoprint</h1>

                <Tabs defaultActiveKey={2}>
                    <Tab eventKey={1} title="Oncoprint">
                        <Oncoprint />
                    </Tab>
                    <Tab eventKey={2} title="Summary">Summary</Tab>
                </Tabs>


            </div>
        );
    }
}

export default QueryResultPage;









