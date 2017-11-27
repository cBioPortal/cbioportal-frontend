// $(document).ready(function(){
//     var sampleIds = window.QuerySession.getSampleIds().join(",");
//     function generateHTML(cancerStudyId, hugoSymbol, id){
//         $.when($.ajax({
//             method : "GET",
//             url : "api/genes/" + hugoSymbol
//         })).then(
//             function(response) {
//                 var segmentTrackHeight = 1.5*window.QuerySession.getSampleIds().length;
//                 var height = 300 + 2*window.QuerySession.getSampleIds().length;
//                 height = Math.min(height, 800);
//                 var headerContent = '<head>    <link rel="stylesheet" type="text/css"  href="https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.2/themes/smoothness/jquery-ui.css"/>'
//                     + '<link rel="stylesheet" type="text/css" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css">'
//                     + '<link rel="stylesheet" type="text/css" href="css/igv.css">'
//                     + '<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"><\/script>'
//                     + '<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.2/jquery-ui.min.js"><\/script>'
//                     + '<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js"><\/script>'
//                     + '<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/es5-shim/4.5.7/es5-shim.min.js"><\/script>'
//                     + '<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/es6-shim/0.35.3/es6-shim.js"><\/script>'
//                     + '<script type="text/javascript" src="js/lib/igv.min.js"><\/script></head>';
//                 var bodyContent1 = '<body><div id="igvDiv" style="padding-top: 10px;padding-bottom: 10px; border:1px solid lightgray;width:100%"></div><script type="text/javascript">  $(document).ready(function () {    var div = $("#igvDiv"),   options = {'
//                     + 'divId: "igvDiv", showNavigation: true, showRuler: true, genome: "hg19", divId: "igvDiv", locus: "' + hugoSymbol + '", tracks: [  { url: "api-legacy/copynumbersegments", indexed: false, isLog: true, contentType: "application/x-www-form-urlencoded", name: "Alt click to sort", type:"seg", json: true, method: "POST", ';
//                 var bodyContent2 = 'height: ' + segmentTrackHeight + ', sendData: "cancerStudyId=' + cancerStudyId + '&chromosome=' + response.chromosome +'&sampleIds=' + sampleIds + '"},{name: "Genes", url: "https://s3.amazonaws.com/igv.broadinstitute.org/annotations/hg19/genes/gencode.v18.collapsed.bed", order: Number.MAX_VALUE,  displayMode: "EXPANDED"}]};igv.createBrowser(div, options);});<\/script><\/body>';
//                 var fullContent = headerContent + bodyContent1 + bodyContent2;
//                 var iframe = document.createElement('iframe');
//                 $("#"+id).html(iframe);
//                 iframe.style.cssText = 'width:100%;height:'+height+'px';
//                 iframe.contentWindow.document.open();
//                 iframe.contentWindow.document.write(fullContent);
//                 iframe.contentWindow.document.close();
//             });
//     }
//
//     $("#igv-result-tab").click(function(){
//         var genes = window.QuerySession.getQueryGenes();
//         if(genes.length > 0 && $("#igvList").html().length === 0){
//             $("#igvList").append('<li><a style="font-size:11px"  href="#home">' + genes[0] + '</a></li>');
//             $("#igvContent").append('<div id="home" class="tab-pane fade in active"></div>');
//             generateHTML('<%= cancerStudyId %>', genes[0], "home");
//             for(var i = 1;i < genes.length;i++){
//                 $("#igvList").append('<li class="geneList" value="' + i +  '"><a style="font-size:11px" href="#menu'+ i +'">' + genes[i] + '</a></li>');
//                 $("#igvContent").append('<div id="menu' + i + '"></div>');
//             }
//             $("#segment_tabs").tabs();
//             $(".geneList").click(function(event){
//                 var index = $(this).val();
//                 if($("#menu"+index).html().length === 0){
//                     generateHTML('<%= cancerStudyId %>', genes[index], "menu"+index);
//                 }
//             });
//         }
//
//         $("#downloadSegment").click(function(){
//             var xhr = new XMLHttpRequest(),
//                 sendData = "cancerStudyId=<%= cancerStudyId %>&sampleIds=" + sampleIds;
//             xhr.onreadystatechange = function() {
//                 var a;
//                 if (xhr.readyState === 4 && xhr.status === 200) {
//                     // Making a downloadable link
//                     a = document.createElement('a');
//                     a.href = window.URL.createObjectURL(xhr.response);
//                     a.download = '<%= cancerStudyId %>' + '_segments.seg';
//                     a.style.display = 'none';
//                     document.body.appendChild(a);
//                     //triger download
//                     a.click();
//                 }
//             };
//             // Post data to URL which handles post request
//             xhr.open("POST", "api-legacy/segmentfile");
//             xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
//             xhr.responseType = 'blob';
//             xhr.send(sendData);
//         });
//
//
//     });
//
// });
// </script>
//
// <div id="segment_tabs">
//     <ul id="igvList"></ul>
//     <div id="igvContent"></div>
// </div>
// <br/>
// Download a copy number segment file for the selected samples<button id="downloadSegment" class="btn btn-default btn-sm">Download</button>
// </div>
import * as React from 'react';
import {observer} from "mobx-react";
import {MSKTabs, MSKTab} from "../../../shared/components/MSKTabs/MSKTabs";
import {Gene, Sample} from "../../../shared/api/generated/CBioPortalAPI";
import {ResultsViewPageStore} from "../ResultsViewPageStore";

interface CNSegmentsIframeProps {
    sampleIds:string[];
    studyId:string;
    gene:Gene
}



class CNASegmentIframe extends React.Component<CNSegmentsIframeProps,{}>{
    
    iframeEl:HTMLIFrameElement;
    
    private getIframeBody(){

        var segmentTrackHeight = 1.5*this.props.sampleIds.length;
        var height = 300 + 2*this.props.sampleIds.length;
        height = Math.min(height, 800);
        var headerContent = '<head>    <link rel="stylesheet" type="text/css"  href="https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.2/themes/smoothness/jquery-ui.css"/>'
            + '<link rel="stylesheet" type="text/css" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css">'
            + '<link rel="stylesheet" type="text/css" href="css/igv.css">'
            + '<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"><\/script>'
            + '<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jqueryui/1.11.2/jquery-ui.min.js"><\/script>'
            + '<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js"><\/script>'
            + '<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/es5-shim/4.5.7/es5-shim.min.js"><\/script>'
            + '<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/es6-shim/0.35.3/es6-shim.js"><\/script>'
            + '<script type="text/javascript" src="js/lib/igv.min.js"><\/script></head>';


        var bodyContent1 = '<body><div id="igvDiv" style="padding-top: 10px;padding-bottom: 10px; border:1px solid lightgray;width:100%"></div><script type="text/javascript">  $(document).ready(function () {    var div = $("#igvDiv"),   options = {'
            + 'divId: "igvDiv", showNavigation: true, showRuler: true, genome: "hg19", divId: "igvDiv", locus: "' + this.props.gene.hugoGeneSymbol + '", tracks: [  { url: "api-legacy/copynumbersegments", indexed: false, isLog: true, contentType: "application/x-www-form-urlencoded", name: "Alt click to sort", type:"seg", json: true, method: "POST", ';

        var bodyContent2 = 'height: ' + segmentTrackHeight + ', sendData: "cancerStudyId=' + this.props.studyId + '&chromosome=' + this.props.gene.chromosome +'&sampleIds=' + this.props.sampleIds.join(',') + '"},{name: "Genes", url: "https://s3.amazonaws.com/igv.broadinstitute.org/annotations/hg19/genes/gencode.v18.collapsed.bed", order: Number.MAX_VALUE,  displayMode: "EXPANDED"}]};igv.createBrowser(div, options);});<\/script><\/body>';

        return headerContent + bodyContent1 + bodyContent2;
        
    }
    
    componentDidMount(){
        this.iframeEl.contentWindow.document.open();
        this.iframeEl.contentWindow.document.write(this.getIframeBody());
        this.iframeEl.contentWindow.document.close();
        
    }
    
    render(){
        
        return <iframe ref={(el:HTMLIFrameElement)=>this.iframeEl = el}/>
        
    }
    
}



@observer
export default class CNSegments extends React.Component<{ store: ResultsViewPageStore}, {}> {

    activeTabId:string;

    render(){
        return (<MSKTabs activeTabId={this.activeTabId} onTabClick={(id:string)=>{
            this.activeTabId = id;
        }}>
            {
                this.props.store.genes.result!.map((gene:Gene)=>{
                    return <MSKTab key={gene.hugoGeneSymbol} id={`CNSegmentsTab${gene.hugoGeneSymbol}`} linkText={gene.hugoGeneSymbol}>
                        <CNASegmentIframe studyId={this.props.store.studyIds[0]}
                                          sampleIds={this.props.store.samples.result!.map((sample:Sample)=>sample.sampleId)}
                                          gene={gene}
                        />
                    </MSKTab>
                })
            }


        </MSKTabs>);
    }

}