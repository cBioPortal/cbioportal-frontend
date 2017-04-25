import * as React from 'react';
import { Modal, ModalBody, ModalHeader } from 'react-bootstrap';
import {QueryStore} from "../../shared/components/query/QueryStore";
import QueryAndDownloadTabs from "../../shared/components/query/QueryAndDownloadTabs";

export default class QueryModal extends React.Component<{ store:QueryStore, styles:any }, { showModal:boolean }> {

    constructor(){

        super();

        this.toggleState = this.toggleState.bind(this);

        this.state = { showModal:false }

    }

    toggleState(){
       if (this.state.showModal) {
           this.setState({showModal:false})
       } else {
           this.setState({showModal:true})
       }
    }


    render(){

        return (
            <div>
            <button onClick={this.toggleState} className="btn btn-primary">Modify Query</button>
            <Modal show={this.state.showModal} dialogClassName={'cbioportal-frontend '+ this.props.styles.queryModal} onHide={this.toggleState} >
            <ModalHeader closeButton>
                <Modal.Title>Modify Query</Modal.Title>
            </ModalHeader>
            <ModalBody>
                <QueryAndDownloadTabs store={this.props.store} onSubmit={this.toggleState}></QueryAndDownloadTabs>
            </ModalBody>
            </Modal>
            </div>
        )


    }



}