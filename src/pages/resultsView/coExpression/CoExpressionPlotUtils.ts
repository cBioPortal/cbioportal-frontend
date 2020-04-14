import _ from 'lodash';
import { IAxisLogScaleParams } from 'pages/resultsView/plots/PlotsTabUtils';

export function getUniquePrecision(
    value: number,
    allValues: number[],
    maxPrecision: number = 3
) {
    if (!allValues.length) return 0;

    let precision = 0;
    while (
        _.countBy(allValues, val => val.toFixed(precision))[
            value.toFixed(precision)
        ] > 1
    ) {
        precision++;

        if (precision >= maxPrecision) {
            break;
        }
    }
    return precision;
}

export function axisLabel(
    geneticEntity: { geneticEntityName: string; cytoband?: string },
    logScale: IAxisLogScaleParams | undefined,
    profileName: string
) {
    return `${profileName}: ${geneticEntity.geneticEntityName} ${
        geneticEntity.cytoband ? `(${geneticEntity.cytoband}) ` : ''
    }${logScale ? `(${logScale.label}) ` : ''}`;
}

export function isNotProfiled(d: { profiledX: boolean; profiledY: boolean }) {
    return !d.profiledX && !d.profiledY;
}
