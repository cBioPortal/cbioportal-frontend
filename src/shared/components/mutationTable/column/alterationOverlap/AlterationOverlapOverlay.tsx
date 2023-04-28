import { action, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { ComparisonMutationsRow } from 'shared/model/ComparisonMutationsRow';
import { ComparisonGroup } from 'pages/groupComparison/GroupComparisonUtils';
import { Mutation } from 'cbioportal-ts-api-client';
import numeral from 'numeral';

interface IAlterationOverlapOverlayProps {
    rowData: ComparisonMutationsRow;
    mutations: Mutation[];
    profiledPatientsCounts: number[];
    groups: ComparisonGroup[];
}

export const AlterationOverlapOverlay: React.FC<IAlterationOverlapOverlayProps> = observer(
    ({
        rowData,
        mutations,
        profiledPatientsCounts,
        groups,
    }: IAlterationOverlapOverlayProps) => {
        return (
            <div>
                <h3>
                    {`${mutations[0].gene.hugoGeneSymbol} alterations for ${mutations[0].proteinChange} in:`}
                </h3>
                <table className={'table table-striped'}>
                    <tbody>
                        <tr>
                            <td>
                                <strong>{groups[0].nameWithOrdinal}: </strong>
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
                                <strong>{groups[1].nameWithOrdinal}: </strong>
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
    }
);
