import { action, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import { Mutation } from 'cbioportal-ts-api-client';
import * as React from 'react';
import {
    formatPercentValue,
    numberOfLeadingDecimalZeros,
} from 'cbioportal-utils';
import { AxisScale } from 'react-mutation-mapper';
import { countUniqueMutations } from 'shared/lib/MutationUtils';

interface ILollipopTooltipCountInfoProps {
    count: number;
    mutations: Mutation[];
    axisMode: AxisScale;
    patientCount: number;
}

export const LollipopTooltipCountInfo: React.FC<ILollipopTooltipCountInfoProps> = ({
    count,
    mutations,
    axisMode,
    patientCount,
}: ILollipopTooltipCountInfoProps) => {
    const decimalZeros = numberOfLeadingDecimalZeros(count);
    const fractionDigits = decimalZeros < 0 ? 1 : decimalZeros + 2;

    return axisMode === AxisScale.PERCENT ? (
        <strong>
            {formatPercentValue(count, fractionDigits)}% (
            {countUniqueMutations(mutations)} mutated of {patientCount} profiled
            patients)
        </strong>
    ) : (
        <strong>
            {count} mutated of {patientCount} profiled patients
        </strong>
    );
};
