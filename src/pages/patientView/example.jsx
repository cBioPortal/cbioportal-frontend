import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { Component } from 'react';
import ClinicalInformationContainer from './clinicalInformation/ClinicalInformationContainer';
import PatientHeaderUnconnected from './patientHeader/PatientHeader';
import {IPatientHeaderProps} from './patientHeader/PatientHeader';
import {RootState} from "../../redux/rootReducer";


const QuerySession = {

  getCartDatafromServer(){

      return Promise.resolve(["apple","apple"]);

  }


};


export default class ContainerComponent extends React.Component {

    constructor(){

        super();

        this.state = {
            cart:[]
        };

        this.addItem = this.addItem.bind(this);



        QuerySession.getCartDatafromServer().then((cartData)=>{

            this.setState({
                cart:cartData
            });

        });



    }

    addItem(){

        var newState = this.state.cart;

        newState.push("apple");

        this.setState({
            cart:newState
        });

    }


    render() {
        return (
            <div><Child1 addItem={this.addItem} cart={this.state.cart} /><Child2 addItem={this.addItem} cart={this.state.cart} /></div>
        );
    }
}

class Child1 extends React.Component {

    shouldComponentUpdate(newProps, newState){

        let answer = newProps.cart !== this.props.cart;

        return answer;

    }

    render(){

        return <div><h2>Child1: </h2>{this.props.cart.join(',')} <a onClick={this.props.addItem}>add apple</a></div>

    }


}


class Child2 extends React.Component {

    render(){

        return <div><h2>Child2:</h2> {this.props.cart.join(',')} <a onClick={this.props.addItem}>add apple</a></div>

    }

}


