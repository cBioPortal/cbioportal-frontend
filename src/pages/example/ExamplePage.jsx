import React from 'react';
import ReactDOM from 'react-dom';
import Spinner from 'react-spinkit';


export default class ExamplePage extends React.Component {

    componentDidMount(ar1, ar2) {
        this.props.loadClinicalInformationTableData();
    }

    isValidEmail(email){

        const re = /^[-a-z0-9~!$%^&*_=+}{\'?]+(\.[-a-z0-9~!$%^&*_=+}{\'?]+)*@([a-z0-9_][-a-z0-9_]*(\.[-a-z0-9_]+)*\.(aero|arpa|biz|com|coop|edu|gov|info|int|mil|museum|name|net|org|pro|travel|mobi|[a-z][a-z])|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,5})?$/i
        return re.test(email);

    }

    render() {

        return (<div><input /></div>);


    }

}



