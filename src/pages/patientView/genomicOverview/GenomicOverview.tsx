import * as React from "react";
import $ from 'jquery';

export interface IClinicalInformationPatientTableProps {
   data:Array<any>;
}

export default class GenomicOverview extends React.Component<IClinicalInformationPatientTableProps, {}> {

    constructor(){

        super();

    }

    shouldComponentUpdate(){

        return false;

    }

    fetchData() {

        //use ajax againt new api

        return Promise.resolve([1,2,3]);

    }

    componentDidMount(){

        this.fetchData.then((data)=>{
            let el = $('.genomicOverViewContainer');

            // use rphael to render
            //renderRap(this.rootNode);

            //this.updateThing('blah');
        });

    }

    updateThing(data){

        el.text(data);
    }


    public render() {

        return (
            <div ref={(el)=>this.rootNode === el} className="genomicOverViewContainer">here i am</div>
        );
    }
}
