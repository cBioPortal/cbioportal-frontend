import * as React from 'react';
import { If, Then, Else } from 'react-if';
import {IPharmacoDBView,IPharmacoDBCnaEntry,IPharmacoDBGeneDrugAssociationData} from "shared/model/PharmacoDB.ts";
import 'shared/components/annotation/styles/pharmacoDBCard.scss';
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
     * <br></br>
     */

    private linkURL():string {
        return "https://cbioapi.pharmacodb.ca/v1/genes/cna/" + this.props.oncoTreeCode + "?gene=" + this.props.geneName
        + "&cna=" + this.props.cna + "&retrieveData=true";
    }

    private CNA2Text(cna:string):string {
        let status:string='';
        switch (cna) {
            case 'DEEPDEL':
                status ='Deep Deletion';
            break;
            case 'SHALLOWDEL':
                status ='Shallow Deletion';
            break;
            case 'GAIN':
                status ='Gain';
            break;
            case 'AMP':
                status ='Amplification';
            break;
            default:
                status='';
            break;
        }
        return status;
    }

    public render() {
        return (
            <div className="pharmacodb-card">
                 <span>
                    <div className="col s12 tip-header">
                        Preclinical Associations for <a href={this.props.cardCnaData.gene_url} target="_blank" >{this.props.geneName}</a>  {this.CNA2Text(this.props.cna)} <br/> Cancer: {this.props.cardCnaData.cancer_type}
                        <br/>Tissue: {this.props.cardCnaData.tissue_name}
                    </div>
                    <div className="treatments-wrapper">
                        <table className="table" style={{marginTop:6}}>
                            <thead>
                                <tr>
                                    <th key="drug_name" scope="col">Drug Name</th>
                                    <th key="correlation" scope="col">Correlation</th>
                                    <th key="fda_approved" scope="col">FDA Approved</th>
                                    <th key="in_clinical_trials" scope="col">In Trial</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    this.generateGeneDrugRows(this.props.cardCnaData.gene_drug_associations)
                                }
                            </tbody>
                        </table>
                    </div>
                    <div>
                    Disclaimer: This resource is intended for purely research purposes. It should not be used for emergencies or medical or professional advice.
                    </div>
                    <div className="item footer">
                        Powered by <a href="https://www.pharmacodb.ca" target="_blank" >PharmacoDB</a>
                    </div>
                </span>
            </div>
        );
    }

    public geneDrugRow(index:number,
        drug_name:string,
        drug_url:string,
        in_clinical_trials:boolean,
        fda_approved:boolean,
        correlation:string)
        {
            return(
            <tr key={index}>
                <td key="drug_name"><a href={drug_url} target="_blank" >{drug_name}</a></td>
                <td key="correlation">{correlation.charAt(0).toUpperCase() + correlation.slice(1)}</td>
                <td key="fda_approved">{fda_approved?"Yes":"No"}</td>
                <td key="in_clinical_trials">{in_clinical_trials?"Yes":"No"}</td>
            </tr>
            );
        }

    public generateGeneDrugRows(geneDrugAssociation:IPharmacoDBGeneDrugAssociationData[]):JSX.Element[]
    {
        const rows:JSX.Element[] = [];

        geneDrugAssociation.forEach((gda:IPharmacoDBGeneDrugAssociationData, index:number) => {
            rows.push(
                this.geneDrugRow(index,
                    gda.drug_name,
                    gda.drug_url,
                    gda.in_clinical_trials,
                    gda.fda_approved,
                    gda.correlation)
            );
        });

        return rows;
    }
}
