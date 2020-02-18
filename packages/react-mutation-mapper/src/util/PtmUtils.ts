import * as _ from 'lodash';
import { PostTranslationalModification } from '../model/PostTranslationalModification';

export const PTM_COLORS: { [type: string]: string } = {
    Phosphorylation: '#2DCF00',
    Acetylation: '#5B5BFF',
    Ubiquitination: '#B9264F',
    Methylation: '#EBD61D',
    multiType: '#444444',
    default: '#BA21E0',
};

export const PTM_PRIORITY: { [type: string]: number } = {
    Phosphorylation: 1,
    Acetylation: 2,
    Ubiquitination: 3,
    Methylation: 4,
    default: 999,
};

export function groupPtmDataByPosition(ptmData: PostTranslationalModification[]) {
    return _.groupBy(ptmData, 'position');
}

export function groupPtmDataByTypeAndPosition(ptmData: PostTranslationalModification[]) {
    const groupedByType = _.groupBy(ptmData, 'type');

    const groupedByTypeAndPosition: {
        [type: string]: { [position: number]: PostTranslationalModification[] };
    } = {};

    _.keys(groupedByType).forEach(type => {
        groupedByTypeAndPosition[type] = _.groupBy(groupedByType[type], 'position');
    });

    return groupedByTypeAndPosition;
}

export function ptmColor(ptms: PostTranslationalModification[]) {
    let color = PTM_COLORS.default;
    const uniqueTypes = _.uniq((ptms || []).map(ptm => ptm.type));

    if (uniqueTypes.length === 1) {
        color = PTM_COLORS[uniqueTypes[0]] || PTM_COLORS.default;
    } else if (uniqueTypes.length > 1) {
        color = PTM_COLORS.multiType;
    }

    return color;
}

export function compareByPtmTypePriority(a: string, b: string) {
    const aValue = PTM_PRIORITY[a] || PTM_PRIORITY.default;
    const bValue = PTM_PRIORITY[b] || PTM_PRIORITY.default;

    if (aValue > bValue) {
        return 1;
    } else if (bValue > aValue) {
        return -1;
    } else if (a > b) {
        return 1;
    } else if (b > a) {
        return -1;
    }

    return 0;
}
