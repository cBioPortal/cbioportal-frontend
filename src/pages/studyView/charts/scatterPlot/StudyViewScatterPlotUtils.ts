import {IStudyViewScatterPlotProps} from "./StudyViewScatterPlot";
import {downsampleByGrouping} from "../../../../shared/components/plots/downsampleByGrouping";
import _ from "lodash";

export const DOWNSAMPLE_PIXEL_DISTANCE_THRESHOLD = 4;
export const MAX_DOT_SIZE = 5;

export function getDownsampledData(
    data:IStudyViewScatterPlotProps["data"],
    sampleToAnalysisGroup:IStudyViewScatterPlotProps["sampleToAnalysisGroup"],
    dataSpaceToPixelSpace:{x:(val:number)=>number, y:(val:number)=>number}
) {
    // group data by analysis group
    const groupedData = _.groupBy(data, d=>sampleToAnalysisGroup[d.uniqueSampleKey]);
    // downsample, and sort by number of points in the downsample group
    const downsampledGroups = _.mapValues(groupedData, data=>{
        return _.sortBy(downsampleByGrouping(data, DOWNSAMPLE_PIXEL_DISTANCE_THRESHOLD, dataSpaceToPixelSpace), d=>d.data.length);
    });
    return downsampledGroups;
}