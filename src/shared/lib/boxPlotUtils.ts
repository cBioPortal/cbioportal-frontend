import jStat from 'jStat'
import * as _ from 'lodash';

const SUSPECTED_OUTLIER_MULTIPLE = 1.5;
const OUTLIER_MULTIPLE = 3;

interface Outliers {
  upper:{
      suspectedOutliers:number[];
      outliers:number[];
  };
  lower:{
      suspectedOutliers:number[];
      outliers:number[];
  }
};

function calculateOutliers(vector:number[], suspectedOutlierThresholdUpper:number, outlierThresholdUpper:number,
                           suspectedOutlierThresholdLower:number, outlierThresholdLower:number):Outliers
{

    return vector.reduce((memo: Outliers, val)=>{
        if (val >= suspectedOutlierThresholdUpper) {
            (val < outlierThresholdUpper) ?
                memo.upper.suspectedOutliers.push(val) : memo.upper.outliers.push(val);
        }

        if (val <= suspectedOutlierThresholdLower) {
            (val > outlierThresholdLower) ?
                memo.lower.suspectedOutliers.push(val) : memo.lower.outliers.push(val);
        }

        return memo;
    },{ upper:{ outliers:[], suspectedOutliers:[] }, lower:{ outliers:[], suspectedOutliers:[] }  });

}


export function calculateBoxPlotModel(vector: number[]) {

    const sortedVector = _.sortBy(vector, [(o)=>o]);

    const quartiles = jStat.quartiles(sortedVector);
    const median = jStat.median(sortedVector);

    const q1 = quartiles[0];
    const q2 = quartiles[1];
    const q3 = quartiles[2];
    const IQR = q3 - q1;
    const max = sortedVector[sortedVector.length-1];
    const min = sortedVector[0];

    const outlierThresholdLower = q1-(OUTLIER_MULTIPLE*IQR);
    const outlierThresholdUpper = q3+(OUTLIER_MULTIPLE*IQR);

    const suspectedOutlierThresholdLower = q1-(SUSPECTED_OUTLIER_MULTIPLE*IQR);
    const suspectedOutlierThresholdUpper = q3+(SUSPECTED_OUTLIER_MULTIPLE*IQR);

    const outliers = calculateOutliers(sortedVector, suspectedOutlierThresholdUpper, outlierThresholdUpper,
        suspectedOutlierThresholdLower, outlierThresholdLower);

    const whiskerLower = (outliers.lower.suspectedOutliers.length > 0 || outliers.lower.outliers.length > 0) ?
        suspectedOutlierThresholdLower : sortedVector[0];

    const whiskerUpper = (outliers.upper.suspectedOutliers.length > 0 || outliers.upper.outliers.length > 0) ?
        suspectedOutlierThresholdUpper : sortedVector[sortedVector.length-1];

    return {

        q1,
        q2,
        q3,
        IQR,
        median,
        whiskerUpper,
        whiskerLower,
        max,
        min,
        outliersUpper:outliers.upper,
        outliersLower:outliers.lower,

    }


}