import * as React from 'react';
import $ from 'jquery';
import {observer} from "mobx-react";
import {MSKTabs, MSKTab} from "../../../shared/components/MSKTabs/MSKTabs";
import {Gene, Sample} from "../../../shared/api/generated/CBioPortalAPI";
import {unescapeTabDelimited, unquote} from "shared/lib/StringUtils";
import {ResultsViewPageStore} from "../ResultsViewPageStore";
import {observable} from "mobx";
import AppConfig from "appConfig";
import fileDownload from 'react-file-download';

interface CNSegmentsIframeProps {
    sampleIds:string[];
    studyId:string;
    gene:Gene
}

class CNASegmentIframe extends React.Component<CNSegmentsIframeProps,{}>{
    
    iframeDiv:HTMLDivElement;

    constructor(){
        super();
        this.downloadSegmentData = this.downloadSegmentData.bind(this);
    }
    
    private getIframeBody(){

        var segmentTrackHeight = 1.5*this.props.sampleIds.length;
        var height = 300 + 2*this.props.sampleIds.length;
        height = Math.min(height, 800);
        var headerContent = '<head>    <link rel="stylesheet" type="text/css"  href="https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.2/themes/smoothness/jquery-ui.css"/>'
            + '<link rel="stylesheet" type="text/css" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css">'
            + `<link rel="stylesheet" type="text/css" href="${AppConfig.frontendUrl}reactapp/igv.css">`
            + '<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"><\/script>'
            + '<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.2/jquery-ui.min.js"><\/script>'
            + '<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js"><\/script>'
            + '<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/es5-shim/4.5.7/es5-shim.min.js"><\/script>'
            + '<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/es6-shim/0.35.3/es6-shim.js"><\/script>'
            + `<script type="text/javascript" src="${AppConfig.frontendUrl}reactapp/igv.min.js"><\/script></head>`;


        var bodyContent1 = '<body style="margin:0"><div id="igvDiv" style="padding-top: 10px;padding-bottom: 10px;"></div><script type="text/javascript">  $(document).ready(function () {    var div = $("#igvDiv"),   options = {'
            + 'divId: "igvDiv", showNavigation: true, showRuler: true, genome: "hg19", divId: "igvDiv", locus: "' + this.props.gene.hugoGeneSymbol + '", tracks: [  { url: "api-legacy/copynumbersegments", indexed: false, isLog: true, contentType: "application/x-www-form-urlencoded", name: "Alt click to sort", type:"seg", json: true, method: "POST", ';

        var bodyContent2 = 'height: ' + segmentTrackHeight + ', sendData: "cancerStudyId=' + this.props.studyId + '&chromosomes=' + this.props.gene.chromosome +'&sampleIds=' + this.props.sampleIds.join(',') + '"},{name: "Genes", url: "https://s3.amazonaws.com/igv.broadinstitute.org/annotations/hg19/genes/gencode.v18.collapsed.bed", order: Number.MAX_VALUE,  displayMode: "EXPANDED"}]};igv.createBrowser(div, options);});<\/script><\/body>';

        return headerContent + bodyContent1 + bodyContent2;
        
    }

    downloadSegmentData() {
            const self = this;
            const xhr = new XMLHttpRequest();
            const sendData = `cancerStudyId=${self.props.studyId}&sampleIds=${self.props.sampleIds.join(',')}`;

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    const reader = new FileReader();

                    reader.addEventListener('loadend', (e: any) => {
                        // seems like the downloaded string is wrapped with quotes,
                        // also it contains "\\n", "\\t", instead of "\n", and "\t"
                        const text = unescapeTabDelimited(unquote(e.srcElement.result));
                        fileDownload(text, self.props.studyId + '_segments.seg');
                    });

                    // this will fire a "loadend" event
                    reader.readAsText(xhr.response);
                }
            };

            // Post data to URL which handles post request
            xhr.open("POST", "api-legacy/segmentfile");
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.responseType = 'blob';
            xhr.send(sendData);
    }
    
    componentDidMount(){
        const iframe: HTMLIFrameElement = document.createElement('iframe');
        iframe.id = "cnSegmentsFrame";
        $(iframe).css({
           width:'100%',
           height:630,
           border:'none'
        }).appendTo($(this.iframeDiv).empty());
        iframe.contentWindow.document.open();
        iframe.contentWindow.document.write(this.getIframeBody());
        iframe.contentWindow.document.close();
    }
    
    render(){
        return (
            <div>
                <div style={{border:'1px solid #ddd', marginBottom:10 }} ref={(el:HTMLDivElement)=>this.iframeDiv = el}/>
                <p>Download a copy number segment file for the selected samples
                    &nbsp;<button onClick={this.downloadSegmentData} className="btn btn-default btn-sm">Download</button>
                </p>
            </div>
        )
        
    }
    
}

@observer
export default class CNSegments extends React.Component<{ store: ResultsViewPageStore}, {}> {

    @observable activeTabId:string;

    render(){

        if (this.props.store.samples.isComplete && this.props.store.genes.isComplete && this.props.store.studyIds.isComplete) {
            return (<MSKTabs tabButtonStyle="pills" activeTabId={this.activeTabId} className="pillTabs" onTabClick={(id:string)=>{
                this.activeTabId = id;
            }}>
                {
                    this.props.store.genes.result!.map((gene:Gene)=>{
                        return <MSKTab key={gene.hugoGeneSymbol} id={`CNSegmentsTab${gene.hugoGeneSymbol}`} linkText={gene.hugoGeneSymbol}>
                            <CNASegmentIframe studyId={this.props.store.studyIds.result![0]}
                                              sampleIds={this.props.store.samples.result!.map((sample:Sample)=>sample.sampleId)}
                                              gene={gene}
                            />
                        </MSKTab>
                    })
                }
            </MSKTabs>);
        } else {
            return null
        }


    }

}