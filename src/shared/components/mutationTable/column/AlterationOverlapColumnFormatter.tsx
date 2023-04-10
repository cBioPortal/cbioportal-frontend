import * as React from 'react';
import { Mutation, Sample } from 'cbioportal-ts-api-client';
import {
    ComparisonGroup,
    getPatientIdentifiers,
    getSampleIdentifiers,
} from 'pages/groupComparison/GroupComparisonUtils';
import { MiniOncoprint } from 'shared/components/miniOncoprint/MiniOncoprint';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import numeral from 'numeral';
import ComplexKeyMap from 'shared/lib/complexKeyDataStructures/ComplexKeyMap';
import { ComparisonMutationsRow } from 'shared/model/ComparisonMutationsRow';

export default class AlterationOverlapColumnFormatter {
    public static renderFunction(
        rowDataByProteinChange: {
            [proteinChange: string]: ComparisonMutationsRow;
        },
        d: Mutation[],
        profiledPatientsCounts: { [groupIndex: number]: number },
        sampleSet: ComplexKeyMap<Sample>,
        groups: ComparisonGroup[]
    ) {
        const rowData = rowDataByProteinChange[d[0].proteinChange];

        const sampleIdentifiersForGroupA = getSampleIdentifiers([groups[0]]);
        const patientIdentifiersforGroupA = getPatientIdentifiers(
            sampleIdentifiersForGroupA,
            sampleSet
        );
        const sampleIdentifiersForGroupB = getSampleIdentifiers([groups[1]]);
        const patientIdentifiersforGroupB = getPatientIdentifiers(
            sampleIdentifiersForGroupB,
            sampleSet
        );

        const totalQueriedCases =
            patientIdentifiersforGroupA.length +
            patientIdentifiersforGroupB.length;
        const group1Width =
            (patientIdentifiersforGroupA.length / totalQueriedCases) * 100;
        const group2Width = 100 - group1Width;
        const group1Unprofiled =
            ((patientIdentifiersforGroupA.length - profiledPatientsCounts[0]) /
                totalQueriedCases) *
            100;
        const group1Unaltered =
            ((profiledPatientsCounts[0] - rowData.groupAMutatedCount) /
                totalQueriedCases) *
            100;
        const group2Unprofiled =
            ((patientIdentifiersforGroupB.length - profiledPatientsCounts[1]) /
                totalQueriedCases) *
            100;
        const group1Altered =
            (rowData.groupAMutatedCount / totalQueriedCases) * 100;
        const group2Altered =
            (rowData.groupBMutatedCount / totalQueriedCases) * 100;

        const alterationLanguage = 'alterations';

        const overlay = () => {
            return (
                <div>
                    <h3>
                        {`${d[0].gene.hugoGeneSymbol} ${alterationLanguage} for ${d[0].proteinChange} in:`}
                    </h3>
                    <table className={'table table-striped'}>
                        <tbody>
                            <tr>
                                <td>
                                    <strong>
                                        {groups[0].nameWithOrdinal}:{' '}
                                    </strong>
                                </td>
                                <td>
                                    {rowData.groupAMutatedCount} of{' '}
                                    {profiledPatientsCounts[0]} of profiled{' '}
                                    {'patients'} (
                                    {numeral(
                                        rowData.groupAMutatedPercentage
                                    ).format('0.0')}
                                    %)
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <strong>
                                        {groups[1].nameWithOrdinal}:{' '}
                                    </strong>
                                </td>
                                <td>
                                    {rowData.groupBMutatedCount} of{' '}
                                    {profiledPatientsCounts[1]} of profiled{' '}
                                    {'patients'} (
                                    {numeral(
                                        rowData.groupBMutatedPercentage
                                    ).format('0.0')}
                                    %)
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            );
        };

        return (
            <DefaultTooltip
                destroyTooltipOnHide={true}
                trigger={['hover']}
                overlay={overlay}
            >
                <div className={'inlineBlock'} style={{ padding: '3px 0' }}>
                    <MiniOncoprint
                        group1Width={group1Width}
                        group2Width={group2Width}
                        group1Unaltered={group1Unaltered}
                        group1Altered={group1Altered}
                        group2Altered={group2Altered}
                        group1Unprofiled={group1Unprofiled}
                        group2Unprofiled={group2Unprofiled}
                        group1Color={groups[0].color}
                        group2Color={groups[1].color}
                        width={150}
                    />
                </div>
            </DefaultTooltip>
        );
    }
}
