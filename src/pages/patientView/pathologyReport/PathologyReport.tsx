import * as React from 'react';
import PDFObject from 'pdfobject';
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

        this.state = { pdfUrl: props.pdfs[0].url }

        this.handleSelection = this.handleSelection.bind(this);

    }

    shouldComponentUpdate(nextProps: IPathologyReportProps){
        return nextProps === this.props;
    }

    componentDidMount(){
        this.embedPDF(this.state.pdfUrl);
    }

    componentDidUpdate(){
        this.embedPDF(this.state.pdfUrl);
    }

    embedPDF(url: string){
        PDFObject.embed(require("./report.pdf"), this.pdfEmbed);
    }

    handleSelection(){
        this.setState({ pdfUrl:this.pdfSelectList.options[this.pdfSelectList.selectedIndex].value });
    }

    render(){

        return (<div>

            <If condition={this.props.pdfs.length > 0}>
                <select ref={(el)=>this.pdfSelectList = el} style={{ marginBottom:15 }} onChange={ this.handleSelection }>{  _.map(this.props.pdfs, (pdf: PathologyReportPDF)=>
                    <option value={pdf.url}>{pdf.name}</option>)    }
                </select>
            </If>

            <div style={{height:1000}} ref={(div)=>this.pdfEmbed = div} className="pathologyReportPdfHolder"></div>

        </div>)

    }



}