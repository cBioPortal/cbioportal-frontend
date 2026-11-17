import { assert } from 'chai';
import SurvivalChart, { ISurvivalChartProps } from './SurvivalChart';

function getPValueLabelText(pValue: number) {
    const chart = new SurvivalChart({
        sortedGroupedSurvivals: {},
        patientToAnalysisGroups: {},
        analysisGroups: [],
        totalCasesHeader: '',
        statusCasesHeader: '',
        medianMonthsHeader: '',
        title: '',
        xAxisLabel: '',
        yAxisLabel: '',
        yLabelTooltip: '',
        xLabelWithEventTooltip: '',
        xLabelWithoutEventTooltip: '',
        fileName: '',
        pValue,
    } as ISurvivalChartProps);

    return (chart as any).pValueText.props.text;
}

describe('SurvivalChart', () => {
    it('displays a lower bound when the log-rank p-value is zero', () => {
        assert.equal(getPValueLabelText(0), 'Logrank Test P-Value: <10^-10');
    });

    it('displays a lower bound when the log-rank p-value is below 10^-10', () => {
        assert.equal(
            getPValueLabelText(1e-12),
            'Logrank Test P-Value: <10^-10'
        );
    });

    it('preserves the existing precision for larger p-values', () => {
        assert.equal(
            getPValueLabelText(0.005),
            'Logrank Test P-Value: 5.000e-3'
        );
    });
});
