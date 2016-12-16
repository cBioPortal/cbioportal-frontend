import * as React from "react";
import * as $ from 'jquery';
import * as _ from 'lodash';
import queryString from "query-string";
import { GenomicOverviewConfig, createRaphaelCanvas, getChmInfo, plotChromosomes, plotCnSegs } from './genomicOverviewHelper';
import {CopyNumberSegment} from "../../../shared/api/CBioPortalAPI";

type LegacyCopyNumberSegment = {
    sample: string,
    value: number,
} & Pick<CopyNumberSegment, 'chr' | 'end' | 'start' | 'numProbes'>;

type GenomicOverviewConfig = {
    nRows: number,
    canvasWidth: number,
    wideLeftText: number,
    wideRightText: number,
    GenomeWidth: number,
    pixelsPerBinMut: number,
    rowHeight: number,
    rowMargin: number,
    ticHeight: number,
    cnTh: number[],
    cnLengthTh: number,
    getCnColor: (cnValue:number) => string,
    canvasHeight: () => number,
    yRow: (row:number) => number,
    xRightText: () => number,
};

type ChmInfo = {
    hg19: number[],
    total: number,
    perc: number[],
    loc2perc: (chm:number,loc:number)=>number,
    loc2xpixil: (chm:number,loc:number,goConfig:GenomicOverviewConfig)=>number,
    perc2loc: (xPerc:number,startChm:number)=>[number,number],
    xpixil2loc: (goConfig:GenomicOverviewConfig,x:number,startChm:number)=>[number,number],
    middle: (chm:number, goConfig:GenomicOverviewConfig)=>number,
    chmName: (chm:number)=>string,
};

export default class GenomicOverview extends React.Component<{}, {}> {

    constructor(){

        super();

    }

    fetchData():Promise<LegacyCopyNumberSegment[]> {

        const qs = queryString.parse(location.search);
        var p = Promise.resolve(
            //$.get("http://www.cbioportal.org/api-legacy/copynumbersegments?cancerStudyId=" + qs.cancer_study_id + "&chromosome=17&sampleIds=P04_Pri")
            $.get("http://www.cbioportal.org/api-legacy/copynumbersegments?cancerStudyId=ov_tcga_pub&chromosome=17&sampleIds=TCGA-24-2035-01")
        );
        return p;

    }

    componentDidMount() {

        this.fetchData().then( apiResult => {

            // transform API result
            let raphaelData: any = {};

            let sampleId = _.uniq(_.map(apiResult, 'sample'))[0] as string;

            raphaelData[sampleId] = [];
            _.each(apiResult, function(_dataObj) {
                raphaelData[sampleId].push([
                    _dataObj.sample,
                    _dataObj.chr,
                    _dataObj.end,
                    _dataObj.start,
                    _dataObj.numProbes,
                    _dataObj.value
                ]);
            });

            // render cna segment bar chart
            var config = GenomicOverviewConfig(1, 1000) as GenomicOverviewConfig;
            var paper:RaphaelPaper = createRaphaelCanvas('cna_segment_bar_chart_div', config);
            var chmInfo = getChmInfo() as ChmInfo;
            plotChromosomes(paper,config,chmInfo);
            plotCnSegs(paper, config, chmInfo, 0, raphaelData[sampleId], 1, 3, 2, 5, sampleId);

        });

    }


    public render() {
        return (
            <div className="genomicOverViewContainer" style={{ backgroundColor: '#F0FFFF'}}>
                <div id="cna_segment_bar_chart_div"></div>
            </div>
        );
    }
}