import {IStudyViewScatterPlotData, IStudyViewScatterPlotProps} from "./StudyViewScatterPlot";
import {downsampleByGrouping, DSData} from "../../../../shared/components/plots/downsampleByGrouping";
import _ from "lodash";

export const DOWNSAMPLE_PIXEL_DISTANCE_THRESHOLD = 4;
export const MAX_DOT_SIZE = 5;

export function getDownsampledData(
    data:IStudyViewScatterPlotProps["data"],
    dataSpaceToPixelSpace:{x:(val:number)=>number, y:(val:number)=>number},
):DSData<IStudyViewScatterPlotData>[];

export function getDownsampledData(
    data:IStudyViewScatterPlotProps["data"],
    dataSpaceToPixelSpace:{x:(val:number)=>number, y:(val:number)=>number},
    sampleToAnalysisGroup:IStudyViewScatterPlotProps["sampleToAnalysisGroup"]
):{[groupVal:string]:DSData<IStudyViewScatterPlotData>[]};

export function getDownsampledData(
    data:IStudyViewScatterPlotProps["data"],
    dataSpaceToPixelSpace:{x:(val:number)=>number, y:(val:number)=>number},
    sampleToAnalysisGroup?:IStudyViewScatterPlotProps["sampleToAnalysisGroup"]
) {
    if (sampleToAnalysisGroup) {
        // group data by analysis group
        const groupedData = _.groupBy(data, d=>sampleToAnalysisGroup[d.uniqueSampleKey]);
        // downsample, and sort by number of points in the downsample group
        const downsampledGroups = _.mapValues(groupedData, dataForGroup=>{
            return _.sortBy(downsampleByGrouping(dataForGroup, DOWNSAMPLE_PIXEL_DISTANCE_THRESHOLD, dataSpaceToPixelSpace), d=>d.data.length);
        });
        return downsampledGroups;
    } else {
        // downsample, and sort by number of points in the downsample group
        return _.sortBy(downsampleByGrouping(data, DOWNSAMPLE_PIXEL_DISTANCE_THRESHOLD, dataSpaceToPixelSpace), d=>d.data.length);
    }
}