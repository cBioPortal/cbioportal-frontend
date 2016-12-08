/*
 * Copyright (c) 2015 Memorial Sloan-Kettering Cancer Center.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS
 * FOR A PARTICULAR PURPOSE. The software and documentation provided hereunder
 * is on an "as is" basis, and Memorial Sloan-Kettering Cancer Center has no
 * obligations to provide maintenance, support, updates, enhancements or
 * modifications. In no event shall Memorial Sloan-Kettering Cancer Center be
 * liable to any party for direct, indirect, special, incidental or
 * consequential damages, including lost profits, arising out of the use of this
 * software and its documentation, even if Memorial Sloan-Kettering Cancer
 * Center has been advised of the possibility of such damage.
 */

/*
 * This file is part of cBioPortal.
 *
 * cBioPortal is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

function GenomicOverviewConfig(nRows,width) {
    this.nRows = nRows;
    this.canvasWidth = width;
    this.wideLeftText = 25;
    this.wideRightText = 35;
    this.GenomeWidth = this.canvasWidth-this.wideLeftText-this.wideRightText;
    this.pixelsPerBinMut = 3;
    this.rowHeight = 20;
    this.rowMargin = 5;
    this.ticHeight = 10;
    this.cnTh = [0.2,1.5];
    this.cnLengthTh = 50000;
}
GenomicOverviewConfig.prototype = {
    getCnColor: function(cnValue) {
        if (cnValue>=this.cnTh[1])
            return "#f00";
        if (cnValue<=-this.cnTh[1])
            return "#00f";
        var c = Math.round(255*(this.cnTh[1]-Math.abs(cnValue))/(this.cnTh[1]-this.cnTh[0]));
        if (cnValue<0)
            return "rgb("+c+","+c+",255)";
        else
            return "rgb(255,"+c+","+c+")";
    },
    canvasHeight: function() {
        return 2*this.rowMargin+this.ticHeight+this.nRows*(this.rowHeight+this.rowMargin);
    },
    yRow: function(row) {
        return 2*this.rowMargin+this.ticHeight+row*(this.rowHeight+this.rowMargin);
    },
    xRightText: function() {
        return this.wideLeftText + this.GenomeWidth+5;
    }
};

function createRaphaelCanvas(elementId, config) {
    return Raphael(elementId, config.canvasWidth, config.canvasHeight());
}

function getChmEndsPerc(chms, total) {
    var ends = [0];
    for (var i=1; i<chms.length; i++) {
        ends.push(ends[i-1]+chms[i]/total);
    }
    return ends;
}

/**
 * storing chromesome length info
 */
function ChmInfo() {
    this.hg19 = [0,249250621,243199373,198022430,191154276,180915260,171115067,159138663,146364022,141213431,135534747,135006516,133851895,115169878,107349540,102531392,90354753,81195210,78077248,59128983,63025520,48129895,51304566,155270560,59373566];
    this.total = 3095677412;
    this.perc = getChmEndsPerc(this.hg19,this.total);
}
ChmInfo.prototype = {
    loc2perc : function(chm,loc) {
        return this.perc[chm-1] + loc/this.total;
    },
    loc2xpixil : function(chm,loc,goConfig) {
        return this.loc2perc(chm,loc)*goConfig.GenomeWidth+goConfig.wideLeftText;
    },
    perc2loc : function(xPerc,startChm) {
        var chm;
        if (!startChm) {//binary search
            var low = 1, high = this.hg19.length-1, i;
            while (low <= high) {
                i = Math.floor((low + high) / 2);
                if (this.perc[i] >= xPerc)  {high = i - 1;}
                else  {low = i + 1;}
            }
            chm = low;
        } else {//linear search
            var i;
            for (i=startChm; i<this.hg19.length; i++) {
                if (xPerc<=this.perc[i]) break;
            }
            chm = i;
        }
        var loc = Math.round(this.total*(xPerc-this.perc[chm-1]));
        return [chm,loc];
    },
    xpixil2loc : function(goConfig,x,startChm) {
        var xPerc = (x-goConfig.wideLeftText)/goConfig.GenomeWidth;
        return this.perc2loc(xPerc,startChm);
    },
    middle : function(chm, goConfig) {
        var loc = this.hg19[chm]/2;
        return this.loc2xpixil(chm,loc,goConfig);
    },
    chmName : function(chm) {
        if (chm === 23) return "X";
        if (chm === 24) return "Y";
        return chm;
    }
};

function plotChromosomes(p,config,chmInfo) {
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

function drawLine(x1, y1, x2, y2, p, cl, width) {
    var path = "M" + x1 + " " + y1 + " L" + x2 + " " + y2;
    var line = p.path(path);
    line.attr("stroke", cl);
    line.attr("stroke-width", width);
    line.attr("opacity", 0.5);
    line.translate(0.5, 0.5);
    return line;
}

function plotMuts(p,config,chmInfo,row,mutations,caseId) {
    var pixelMap = [];
    var numMut = 0;
    for (var i=0; i<mutations.getNumEvents(false); i++) {
        if (caseId!==null) {
            var caseIds = mutations.data['caseIds'][i];
            if ($.inArray(caseId, caseIds)===-1) continue;
        }
        var chm = translateChm(mutations.data['chr'][i]);
        if (cbio.util.checkNullOrUndefined(chm)||chm>=chmInfo.hg19.length) continue;
        var x = Math.round(chmInfo.loc2xpixil(chm,(mutations.data['start'][i]+mutations.data['end'][i])/2,config));
        var xBin = x-x%config.pixelsPerBinMut;
        if (cbio.util.checkNullOrUndefined(pixelMap[xBin]))
            pixelMap[xBin] = [];
        pixelMap[xBin].push(mutations.data['id'][i]);
        numMut++;
    }

    var maxCount = 5; // set max height to 5 mutations
//    for (var i in pixelMap) {
//        var arr = pixelMap[i];
//        if (arr && arr.length>maxCount)
//            maxCount=arr.length;
//    }

    var yRow = config.yRow(row)+config.rowHeight;
    for (var i in pixelMap) {
        var arr = pixelMap[i];
        var pixil = parseInt(i);
        if (arr) {
            var h = arr.length>maxCount ? config.rowHeight : (config.rowHeight*arr.length/maxCount);
            var r = p.rect(pixil,yRow-h,config.pixelsPerBinMut,h);
            r.attr("fill","#0f0");
            r.attr("stroke", "#0f0");
            r.attr("stroke-width", 1);
            r.attr("opacity", 0.5);
            r.translate(0.5, 0.5);

            var mutGeneAA = getMutGeneAA(arr.slice(0,10));
            var tip = mutGeneAA.join('<br/>')
                +'<br/><a href="#" onclick="filterMutationsTableByIds(\''
                +idRegEx(arr)+'\');switchToTab(\'tab_mutations\');return false;">'
                +(arr.length<=10?'show details':('show all '+arr.length+' mutations'))+'</a>';
            addToolTip(r.node,tip,100);
        }
    }

    if (caseId!==null) {
        var label = caseMetaData.label[caseId];
        var c = p.circle(8,yRow-config.rowHeight/2,6).attr({'stroke':caseMetaData.color[caseId], 'fill':caseMetaData.color[caseId]});
        var t = p.text(8,yRow-config.rowHeight/2,label).attr({'text-anchor': 'center', 'fill':'white'});
        addToolTip(c.node, caseMetaData.tooltip[caseId],false,{my:'middle left',at:'middle right'});
        addToolTip(t.node, caseMetaData.tooltip[caseId],false,{my:'middle left',at:'middle right'});
    } else {
        p.text(0,yRow-config.rowHeight/2,'MUT').attr({'text-anchor': 'start'});
    }
    var t = p.text(config.xRightText(),yRow-config.rowHeight/2,numMut).attr({'text-anchor': 'start','font-weight': 'bold'});
    underlineText(t,p);
    var tip =  "Number of mutation events.";
    addToolTip(t.node,tip,null,{my:'top right',at:'bottom left'});
}

function loc2string(loc,chmInfo) {
    return "chr"+chmInfo.chmName(loc[0])+":"+addCommas(loc[1]);
}

function addCommas(x)
{
    var strX = x.toString();
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(strX)) {
        strX = strX.replace(rgx, '$1' + ',' + '$2');
    }
    return strX;
}

function plotCnSegs(p,config,chmInfo,row,segs,chrCol,startCol,endCol,segCol,caseId) {
    var yRow = config.yRow(row);
    var genomeMeasured = 0;
    var genomeAltered = 0;
    for (var i=0; i<segs.length; i++) {
        var chm = translateChm(segs[i][chrCol]);
        if (cbio.util.checkNullOrUndefined(chm)||chm[0]>=chmInfo.hg19.length) continue;
        var start = segs[i][startCol];
        var end = segs[i][endCol];
        var segMean = segs[i][segCol];
        genomeMeasured += end-start;
        if (Math.abs(segMean)<config.cnTh[0]) continue;
        if (end-start<config.cnLengthTh) continue; //filter cnv
        genomeAltered += end-start;
        var x1 = chmInfo.loc2xpixil(chm,start,config);
        var x2 = chmInfo.loc2xpixil(chm,end,config);
        var r = p.rect(x1,yRow,x2-x1,config.rowHeight);
        var cl = config.getCnColor(segMean);
        r.attr("fill",cl);
        r.attr("stroke", cl);
        r.attr("stroke-width", 1);
        r.attr("opacity", 0.5);
        r.translate(0.5, 0.5);
        var tip = "Mean copy number log2 value: "+segMean+"<br/>from "+loc2string([chm,start],chmInfo)+"<br/>to "+loc2string([chm,end],chmInfo);
        addToolTip(r.node,tip);
    }if (caseId!==null) {
        var label = caseMetaData.label[caseId];
        var c = p.circle(8,yRow+config.rowHeight/2,6).attr({'stroke':caseMetaData.color[caseId], 'fill':caseMetaData.color[caseId]});
        var t = p.text(8,yRow+config.rowHeight/2,label).attr({'text-anchor': 'center', 'fill':'white'});
        addToolTip(c.node, caseMetaData.tooltip[caseId],false,{my:'middle left',at:'middle right', viewport: $(window)});
        addToolTip(t.node, caseMetaData.tooltip[caseId],false,{my:'middle left',at:'middle right', viewport: $(window)});
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

function addToolTip(node,tip,showDelay,position) {
    var param = {
        content: {text:tip},
        show: {event: "mouseover"},
        hide: {fixed: true, delay: 100, event:"mouseout"},
        style: { classes: 'qtip-light qtip-rounded' },
        position: {viewport: $(window)}
    };
    if (showDelay)
        param['show'] = { delay: showDelay };
    if (position)
        param['position'] = position;
    $(node).qtip(param);
}

function underlineText(textElement,p) {
    var textBBox = textElement.getBBox();
    return p.path("M"+textBBox.x+" "+(textBBox.y+textBBox.height)+"L"+(textBBox.x+textBBox.width)+" "+(textBBox.y+textBBox.height));
}

function translateChm(chm) {
    if (chm.toLowerCase().indexOf("chr")===0) chm=chm.substring(3);
    if (chm==='X'||chm==='x') chm = 23;
    if (chm==='Y'||chm==='y') chm = 24;
    if (isNaN(chm) || chm < 1 || chm > 24) return null;
    return parseInt(chm);
}
