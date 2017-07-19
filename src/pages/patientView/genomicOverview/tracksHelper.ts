import Raphael from 'webpack-raphael';
import $ from 'jquery';
import * as _ from 'lodash';
import 'qtip2';
import 'qtip2/dist/jquery.qtip.css';
import { Mutation } from "shared/api/generated/CBioPortalAPI";

export function GenomicOverviewConfig(nRows: any,width: any) {
    let sel: any = {};
    sel.nRows = nRows;
    sel.canvasWidth = width;
    sel.wideLeftText = 25;
    sel.wideRightText = 35;
    sel.GenomeWidth = sel.canvasWidth-sel.wideLeftText-sel.wideRightText;
    sel.pixelsPerBinMut = 3;
    sel.rowHeight = 20;
    sel.rowMargin = 5;
    sel.ticHeight = 10;
    sel.cnTh = [0.2,1.5];
    sel.cnLengthTh = 50000;
    sel.getCnColor = function(cnValue: any) {
        if (cnValue>=sel.cnTh[1])
            return "#f00";
        if (cnValue<=-sel.cnTh[1])
            return "#00f";
        var c = Math.round(255*(sel.cnTh[1]-Math.abs(cnValue))/(sel.cnTh[1]-sel.cnTh[0]));
        if (cnValue<0)
            return "rgb("+c+","+c+",255)";
        else
            return "rgb(255,"+c+","+c+")";
    };
    sel.canvasHeight = function() {
        return 2*sel.rowMargin+sel.ticHeight+sel.nRows*(sel.rowHeight+sel.rowMargin);
    };
    sel.yRow = function(row: any) {
        return 2*sel.rowMargin+sel.ticHeight+row*(sel.rowHeight+sel.rowMargin);
    };
    sel.xRightText = function() {
        return sel.wideLeftText + sel.GenomeWidth+5;
    };
    return sel;
}

export function createRaphaelCanvas(elementId: any, config: any) {
    return Raphael(elementId, config.canvasWidth, config.canvasHeight());
}

function getChmEndsPerc(chms: Array<any>, total: any) {
    var ends = [0];
    for (var i=1; i<chms.length; i++) {
        ends.push(ends[i-1]+chms[i]/total);
    }
    return ends;
}

/**
 * storing chromesome length info
 */
export function getChmInfo(genomeBuild:string) {
    let sel: any = {};
    const chromSizes = require('./chromSizes.json');
    for (let i = 0; i < chromSizes.length; i++) {
        if (chromSizes[i]["build"] === genomeBuild) {
            sel.hg19 = chromSizes[i]['size'];
            break;
        }
    }
    sel.total = 0
    for (let i=0; i < sel.hg19.length; i++ ) {
        sel.total += sel.hg19[i];
    }
    sel.perc = getChmEndsPerc(sel.hg19,sel.total);
    sel.loc2perc = function(chm: any,loc: any) {
        return sel.perc[chm-1] + loc/sel.total;
    };
    sel.loc2xpixil = function(chm: any, loc: any, goConfig: any) {
        return sel.loc2perc(chm,loc)*goConfig.GenomeWidth+goConfig.wideLeftText;
    };
    sel.perc2loc = function(xPerc: any,startChm: any) {
        var chm;
        if (!startChm) {//binary search
            var low = 1, high = sel.hg19.length-1, i;
            while (low <= high) {
                i = Math.floor((low + high) / 2);
                if (sel.perc[i] >= xPerc)  {high = i - 1;}
                else  {low = i + 1;}
            }
            chm = low;
        } else {//linear search
            var i;
            for (i=startChm; i<sel.hg19.length; i++) {
                if (xPerc<=sel.perc[i]) break;
            }
            chm = i;
        }
        var loc = Math.round(sel.total*(xPerc-sel.perc[chm-1]));
        return [chm,loc];
    };
    sel.xpixil2loc = function(goConfig: any, x: any, startChm: any) {
        var xPerc = (x-goConfig.wideLeftText)/goConfig.GenomeWidth;
        return sel.perc2loc(xPerc,startChm);
    };
    sel.middle = function(chm: any, goConfig: any) {
        var loc = sel.hg19[chm]/2;
        return sel.loc2xpixil(chm,loc,goConfig);
    };
    sel.chmName = function(chm: any) {
        if (chm === 23) return "X";
        if (chm === 24) return "Y";
        return chm;
    }
    return sel;
}

export function plotChromosomes(p: any, config: any,chmInfo: any) {
    var yRuler = config.rowMargin+config.ticHeight;
    drawLine(config.wideLeftText,yRuler,config.wideLeftText+config.GenomeWidth,yRuler,p,'#000',1);
    // ticks & texts
    for (var i=1; i<chmInfo.hg19.length; i++) {
        var xt = chmInfo.loc2xpixil(i,0,config);
        drawLine(xt,yRuler,xt,config.rowMargin,p,'#000',1);

        var m = chmInfo.middle(i,config);
        p.text(m,yRuler-config.rowMargin,chmInfo.chmName(i));
    }
    drawLine(config.wideLeftText+config.GenomeWidth,yRuler,config.wideLeftText+config.GenomeWidth,config.rowMargin,p,'#000',1);
}

function drawLine(x1: any, y1: any, x2: any, y2: any, p: any, cl: any, width: any) {
    var path = "M" + x1 + " " + y1 + " L" + x2 + " " + y2;
    var line = p.path(path);
    line.attr("stroke", cl);
    line.attr("stroke-width", width);
    line.attr("opacity", 0.5);
    line.translate(0.5, 0.5);
    return line;
}

function loc2string(loc: any, chmInfo: any) {
    return "chr"+chmInfo.chmName(loc[0])+":"+addCommas(loc[1]);
}

function addCommas(x: any)
{
    var strX = x.toString();
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(strX)) {
        strX = strX.replace(rgx, '$1' + ',' + '$2');
    }
    return strX;
}

export function plotCnSegs(p: any,config: any,chmInfo: any,row: any, segs: Array<any>, chrCol: any, startCol: any,endCol: any,segCol: any,caseId: any) {
    var yRow = config.yRow(row);
    var genomeMeasured = 0;
    var genomeAltered = 0;

    _.each(segs, function(seg: any) {
        let chm: any = translateChm(seg[chrCol]);
        if (chm == null || chm[0]>=chmInfo.hg19.length) return;
        var start = seg[startCol];
        var end = seg[endCol];
        var segMean = seg[segCol];
        genomeMeasured += end-start;
        if (Math.abs(segMean)<config.cnTh[0]) return;
        if (end-start<config.cnLengthTh) return; //filter cnv
        genomeAltered += end-start;
        var x1: any = chmInfo.loc2xpixil(chm,start,config);
        var x2: any = chmInfo.loc2xpixil(chm,end,config);
        var r: any = p.rect(x1,yRow,x2-x1,config.rowHeight);
        var cl: any = config.getCnColor(segMean);
        r.attr("fill",cl);
        r.attr("stroke", cl);
        r.attr("stroke-width", 1);
        r.attr("opacity", 0.5);
        r.translate(0.5, 0.5);
        var tip = "Mean copy number log2 value: "+segMean+"<br/>from "+loc2string([chm,start],chmInfo)+"<br/>to "+loc2string([chm,end],chmInfo);
        addToolTip(r.node,tip, '', '');
    });

    if (caseId!=null) {
        //var label = caseMetaData.label[caseId]; //TODO: needed for patient view
        var label = "CNA"; //TODO:
        //var c = p.circle(12,yRow+config.rowHeight/2,6).attr({'stroke':caseMetaData.color[caseId], 'fill':caseMetaData.color[caseId]}); //TODO: needed for patient view
        //var c = p.circle(12,yRow+config.rowHeight/2,6).attr({'stroke':'black', 'fill':'black'});
        var t = p.text(12,yRow+config.rowHeight/2,label).attr({'text-anchor': 'center', 'fill':'black'});

        t.node.setAttribute('id','cnaTrack' + caseId);

        //addToolTip(c.node, caseMetaData.tooltip[caseId],false,{my:'middle left',at:'middle right', viewport: $(window)}); //TODO: needed for patient view
        //addToolTip(t.node, caseMetaData.tooltip[caseId],false,{my:'middle left',at:'middle right', viewport: $(window)}); //TODO: needed for patient view
        //addToolTip(c.node, "",false,{my:'middle left',at:'middle right', viewport: $(window)});
        //addToolTip(t.node, "",false,{my:'middle left',at:'middle right', viewport: $(window)});
    } else {
        p.text(0,yRow+config.rowHeight/2,'CNA').attr({'text-anchor': 'start'});
    }

    var label = genomeMeasured===0 ? 'N/A' : (100*genomeAltered/genomeMeasured).toFixed(1)+'%';
    var tip = genomeMeasured===0 ? 'Copy number segment data not available' :
        ("Percentage of copy number altered chromosome regions (mean copy number log value >0.2 or <-0.2) out of measured regions.");

    var t = p.text(config.xRightText(),yRow+config.rowHeight/2,label).attr({'text-anchor': 'start','font-weight': 'bold'});
    underlineText(t,p);
    addToolTip(t.node, tip,null,{my:'top right',at:'bottom left', viewport: $(window)});
}

export function plotMuts(p: any, config: any,chmInfo: any,row: any, mutations: Array<Mutation>, caseId: any) {
    var numMut = 0;
    var mutObjs = _.filter(mutations, function(_mutObj: Mutation){ return _mutObj.sampleId === caseId; } );

    let pixelMap: Array<Array<string>> = [];
    for (var i = 0; i < mutObjs.length; i++) {
        var mutObj: Mutation = mutObjs[i];
        if (typeof mutObj.gene.chromosome !== 'undefined') {
            var chm = translateChm(mutObj.gene.chromosome);
            if (chm != null && chm <= chmInfo.hg19.length) {
                var x = Math.round(chmInfo.loc2xpixil(chm, (mutObj.startPosition + mutObj.endPosition)/2, config));
                var xBin = x - x%config.pixelsPerBinMut;
                if (pixelMap[xBin] == null) pixelMap[xBin] = [];
                pixelMap[xBin].push(mutObj.gene.hugoGeneSymbol + ": " + mutObj.proteinChange);
                numMut++;
            }
        }
    }
    var maxCount = 5; // set max height to 5 mutations

    var yRow = config.yRow(row)+config.rowHeight;
    $.each(pixelMap, function(i: number, arr: Array<any>) {
        var pixil = i;
        if (arr) {
            var h = arr.length>maxCount ? config.rowHeight : (config.rowHeight*arr.length/maxCount);
            var r = p.rect(pixil,yRow-h,config.pixelsPerBinMut,h);
            r.attr("fill","#0f0");
            r.attr("stroke", "#0f0");
            r.attr("stroke-width", 1);
            r.attr("opacity", 0.5);
            r.translate(0.5, 0.5);
            addToolTip(r.node, arr.join("</br>"), 100, '');
        }
    });

    if (caseId!==null) {
        //var label = caseMetaData.label[caseId]; //TODO: needed for patient view
        var label = "MUT";
        //var c = p.circle(12,yRow-config.rowHeight/2,6).attr({'stroke':caseMetaData.color[caseId], 'fill':caseMetaData.color[caseId]}); //TODO: needed for patient view
        var t = p.text(12,yRow-config.rowHeight/2,label).attr({'text-anchor': 'center', 'fill':'black'});
        t.node.setAttribute('id','mutTrack' + caseId);
        //addToolTip(c.node, caseMetaData.tooltip[caseId],false,{my:'middle left',at:'middle right'}); //TODO: needed for patient view
        //addToolTip(t.node, caseMetaData.tooltip[caseId],false,{my:'middle left',at:'middle right'}); //TODO: needed for patient view
    } else {
        p.text(0,yRow-config.rowHeight/2,'MUT').attr({'text-anchor': 'start'});
    }
    var t = p.text(config.xRightText(),yRow-config.rowHeight/2,mutations.length).attr({'text-anchor': 'start','font-weight': 'bold'});
    underlineText(t,p);
    var tip =  "Number of mutation events.";
    addToolTip(t.node,tip,null,{my:'top right',at:'bottom left'});

}

function addToolTip(node: any, tip: any,showDelay: any, position: any) {
    var param = {
        content: {text:tip},
        show: {event: "mouseover"},
        hide: {fixed: true, delay: 100, event:"mouseout"},
        style: { classes: 'qtip-light qtip-rounded' },
        position: {
            my: "bottom right",
            at: "top left"
        }
        //position: {viewport: $(window)}
    }; //TODO: viewport causes jquery exception
    // if (showDelay)
    //     param['show'] = { delay: showDelay };
    // if (position)
    //     param['position'] = position;

    ($(node) as any).qtip(param);

}

function underlineText(textElement: any, p: any) {
    var textBBox = textElement.getBBox();
    return p.path("M"+textBBox.x+" "+(textBBox.y+textBBox.height)+"L"+(textBBox.x+textBBox.width)+" "+(textBBox.y+textBBox.height));
}

function translateChm(chm: any) {
    if (chm.toLowerCase().indexOf("chr")===0) chm=chm.substring(3);
    if (chm==='X'||chm==='x') chm = 23;
    if (chm==='Y'||chm==='y') chm = 24;
    if (isNaN(chm) || chm < 1 || chm > 24) return null;
    return parseInt(chm);
}
