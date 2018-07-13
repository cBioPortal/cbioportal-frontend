import {IStudyViewScatterPlotProps} from "./StudyViewScatterPlot";
import {downsampleByGrouping} from "../../../../shared/components/plots/downsampleByGrouping";
import _ from "lodash";

export const DOWNSAMPLE_PIXEL_DISTANCE_THRESHOLD = 4;
export const MAX_DOT_SIZE = 5;

export function getGroupedData(
    data:IStudyViewScatterPlotProps["data"],
    isSelected:IStudyViewScatterPlotProps["isSelected"],
    dataSpaceToPixelSpace:{x:(val:number)=>number, y:(val:number)=>number}
) {
    // group selected and unselected separately
    const selectedData = [];
    const unselectedData = [];
    for (const datum of data) {
        if (isSelected(datum)) {
            selectedData.push(datum);
        } else {
            unselectedData.push(datum);
        }
    }
    const unorderedSelectedGroups = downsampleByGrouping(
        selectedData,
        DOWNSAMPLE_PIXEL_DISTANCE_THRESHOLD,
        dataSpaceToPixelSpace
    );
    const unorderedUnselectedGroups = downsampleByGrouping(
        unselectedData,
        DOWNSAMPLE_PIXEL_DISTANCE_THRESHOLD,
        dataSpaceToPixelSpace
    );
    // display selection above unselection, bigger size above smaller size
    return _.sortBy(unorderedUnselectedGroups, d=>d.data.length)
        .concat(_.sortBy(unorderedSelectedGroups, d=>d.data.length));
}