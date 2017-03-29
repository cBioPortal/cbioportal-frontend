import * as React from 'react';
import {PathologyReportPDF} from "../clinicalInformation/PatientViewPageStore";
import { If, Then, Else } from 'react-if';
import * as _ from 'lodash';

export type IPathologyReportProps = {

    pdfs:PathologyReportPDF[];

}


export default class PathologyReport extends React.Component<IPathologyReportProps,{ pdfUrl:string; }> {

    pdfSelectList:any;
    pdfEmbed:any;

    constructor(props: IPathologyReportProps){

        super();

        console.log(props.pdfs);

        this.state = { pdfUrl: this.buildPDFUrl(props.pdfs[0].name) }

        this.handleSelection = this.handleSelection.bind(this);

    }

    buildPDFUrl(name: string):string {

        return `https://drive.google.com/viewerng/viewer?url=https://github.com/cBioPortal/datahub/raw/master/tcga/pathology_reports/${name}?pid=explorer&efh=false&a=v&chrome=false&embedded=true`;

    }

    shouldComponentUpdate(nextProps: IPathologyReportProps){
        return nextProps === this.props;
    }

    handleSelection(){
        this.setState({ pdfUrl:this.buildPDFUrl(this.pdfSelectList.options[this.pdfSelectList.selectedIndex].value) });
    }

    render(){

        return (<div>

            <If condition={this.props.pdfs.length > 1}>
                <select ref={(el)=>this.pdfSelectList = el} style={{ marginBottom:15 }} onChange={ this.handleSelection }>{  _.map(this.props.pdfs, (pdf: PathologyReportPDF)=>
                    <option value={pdf.name}>{pdf.name}</option>)    }
                </select>
            </If>

            <iframe style={{ height:1100, width: '100%', border:'none'}} src={this.state.pdfUrl}></iframe>

        </div>)

    }



}