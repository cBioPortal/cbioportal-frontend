import * as React from 'react';
import { If, Then, Else } from 'react-if';
import {IPharmacoDBView,IPharmacoDBCnaEntry} from "shared/model/PharmacoDB.ts";
import "./styles/pharmacoDbCard.scss";
import * as _ from "lodash";
import {observer} from "mobx-react";

export interface IPharmacoDBCardProps {
    oncoTreeCode: string;
    geneName: string;
    cna: string;
    direction: string;
    cardCnaData : IPharmacoDBCnaEntry;
}

@observer
export default class PharmacoDBCard extends React.Component<IPharmacoDBCardProps, {}> {
    constructor() {
        super();
    }

    /**
     * Render PharmacoDB card component
     * @returns {any}
     */


    public render() {
        return (
            <div className="pharmacodb-card">
                 <span>
                    <div className="col s12 tip-header">
                        Preclinical Associations for {this.props.geneName} {this.props.cna}
                    </div>
                    <div className="col s12 pharmacodb-card-content">
                        Result of the API call will be displayed here 
                        <br></br>
                        oncoTreeCode={this.props.oncoTreeCode}
                        <br></br>
                    </div>
                    <div className="item footer">
                    </div>
                </span>
            </div>
        );
    }
}
