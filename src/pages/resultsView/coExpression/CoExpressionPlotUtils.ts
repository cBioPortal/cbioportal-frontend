import _ from 'lodash';
import {
    IAxisLogScaleParams,
    logScalePossibleForProfile,
} from 'shared/components/plots/PlotsTabUtils';
import { CoExpressionPlotData } from 'pages/resultsView/coExpression/CoExpressionPlot';
import { MolecularProfile } from 'cbioportal-ts-api-client';
import { GeneticEntity } from 'shared/model/GeneticEntity';

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

const MIN_LOG_ARGUMENT = 0.01;

// The two axes can come from different profiles (e.g. RNA-seq vs. RPPA), so
// the log scale option is applied per axis: only RNA-seq values are log2
// transformed. Values of the other profile types are already on a log or
// relative scale and are often negative.
export function getAxisLogScale(
    logScale: boolean,
    molecularProfileId: string
): IAxisLogScaleParams | undefined {
    if (!logScale || !logScalePossibleForProfile(molecularProfileId)) {
        return undefined;
    }
    return {
        label: 'log2',
        fLogScale: (x: number) => Math.log2(Math.max(x, MIN_LOG_ARGUMENT)),
        fInvLogScale: (x: number) => Math.pow(2, x),
    };
}

export function isNotProfiled(d: { profiledX: boolean; profiledY: boolean }) {
    return !d.profiledX && !d.profiledY;
}

export function getDownloadData(
    data: CoExpressionPlotData[],
    entityX: GeneticEntity,
    entityY: GeneticEntity,
    molecularProfileX: MolecularProfile,
    molecularProfileY: MolecularProfile,
    showMutations: boolean
) {
    const firstRow = [
        'Sample ID',
        `${entityX.geneticEntityName} (${molecularProfileX.name})`,
        `${entityY.geneticEntityName} (${molecularProfileY.name})`,
    ];
    if (showMutations) {
        firstRow.push(
            `${entityX.geneticEntityName} Mutations`,
            `${entityY.geneticEntityName} Mutations`
        );
    }
    const rows = [
        firstRow,
        ...data.map(d => {
            const row = [d.sampleId, d.x, d.y];
            if (showMutations) {
                row.push(
                    d.profiledX ? d.mutationsX || 'WT' : 'NS',
                    d.profiledY ? d.mutationsY || 'WT' : 'NS'
                );
            }
            return row;
        }),
    ];
    return rows.map(row => row.join('\t')).join('\n');
}
