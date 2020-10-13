import {
    SampleTreatmentRow,
    SampleTreatmentFilter,
    PatientTreatmentFilter,
    PatientTreatmentRow,
} from 'cbioportal-ts-api-client';
import styles from 'pages/studyView/table/tables.module.scss';
import React from 'react';

export type Treatment =
    | SampleTreatmentRow
    | SampleTreatmentFilter
    | PatientTreatmentRow
    | PatientTreatmentFilter;

export function treatmentComparisonGroupName(
    cell: Treatment,
    ignoreTime?: boolean
) {
    if (
        (cell as SampleTreatmentFilter | SampleTreatmentRow).time !==
            undefined &&
        !ignoreTime
    ) {
        const castCell = cell as SampleTreatmentFilter | SampleTreatmentRow;
        return `${castCell.time}-${castCell.treatment}`;
    } else {
        return cell.treatment;
    }
}
export function treatmentUniqueKey(cell: Treatment, ignoreTime?: boolean) {
    if (
        (cell as SampleTreatmentFilter | SampleTreatmentRow).time !==
            undefined &&
        !ignoreTime
    ) {
        const castCell = cell as SampleTreatmentFilter | SampleTreatmentRow;
        return castCell.treatment + '::' + castCell.time;
    } else {
        return cell.treatment;
    }
}

export function toSampleTreatmentFilter(
    uniqueKey: string
): SampleTreatmentFilter {
    const split = uniqueKey.split('::');
    return {
        treatment: split[0],
        time: split[1] as 'Pre' | 'Post',
    };
}

export function toPatientTreatmentFilter(
    uniqueKey: string
): PatientTreatmentFilter {
    const split = uniqueKey.split('::');
    return {
        treatment: split[0],
    };
}

export enum TreatmentTableType {
    SAMPLE = 'SAMPLE_TREATMENTS',
    PATIENT = 'PATIENT_TREATMENTS',
}

export const TreatmentGenericColumnHeader = class GenericColumnHeader extends React.Component<
    { margin: number; headerName: string },
    {}
> {
    render() {
        return (
            <div
                style={{ marginLeft: this.props.margin }}
                className={styles.displayFlex}
            >
                {this.props.headerName}
            </div>
        );
    }
};

export const TreatmentColumnCell = class TreatmentColumnCell extends React.Component<
    { row: PatientTreatmentRow | SampleTreatmentRow },
    {}
> {
    render() {
        return <div>{this.props.row.treatment}</div>;
    }
};

export function filterTreatmentCell(
    cell: PatientTreatmentRow | SampleTreatmentRow,
    filter: string
): boolean {
    return cell.treatment.toUpperCase().includes(filter.toUpperCase());
}
