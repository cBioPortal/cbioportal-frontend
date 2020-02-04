import * as React from 'react';
import { observer } from 'mobx-react';
import GroupComparisonStore from './GroupComparisonStore';
import { ComparisonGroup, IOverlapComputations } from './GroupComparisonUtils';
import { joinGroupNames } from './OverlapUtils';
import { computed } from 'mobx';
import { MakeMobxView } from '../../shared/components/MobxView';
import ComparisonStore, {
    OverlapStrategy,
} from '../../shared/lib/comparison/ComparisonStore';

export interface IOverlapExclusionIndicatorProps {
    store: ComparisonStore;
    only?: 'sample' | 'patient';
    overlapTabMode?: boolean;
    survivalTabMode?: boolean;
}

function makeSurvivalTabMessage(count: number) {
    return (
        <span>
            Overlapping patients ({count}) are plotted as distinct groups below.
        </span>
    );
}

@observer
export default class OverlapExclusionIndicator extends React.Component<
    IOverlapExclusionIndicatorProps,
    {}
> {
    static defaultProps: Partial<IOverlapExclusionIndicatorProps> = {
        overlapTabMode: false,
        survivalTabMode: false,
    };

    @computed get classNames() {
        let icon = '';
        let alert = '';
        switch (this.props.store.overlapStrategy) {
            case OverlapStrategy.INCLUDE:
                if (this.props.survivalTabMode) {
                    icon = 'fa-info-circle';
                    alert = 'alert-info';
                } else {
                    icon = 'fa-exclamation-triangle';
                    alert = 'alert-warning';
                }
                break;
            case OverlapStrategy.EXCLUDE:
                icon = 'fa-info-circle';
                alert = 'alert-info';
                break;
        }
        return { icon, alert };
    }

    readonly excludedGroupsSummary = MakeMobxView({
        await: () => [this.props.store.overlapComputations],
        render: () => {
            let summary;
            const selectionInfo = this.props.store.overlapComputations.result!;
            const excludedGroups = selectionInfo.groups.filter(
                g => g.uid in selectionInfo.excludedFromAnalysis
            );
            const groupNames = joinGroupNames(excludedGroups, 'and');
            const is = excludedGroups.length === 1 ? 'is' : 'are';

            if (excludedGroups.length > 0) {
                summary = (
                    <span>
                        {groupNames}
                        {` ${is} completely overlapping with other selected groups, so `}
                        {this.props.overlapTabMode
                            ? `${is} excluded from analysis in other tabs.`
                            : `${
                                  excludedGroups.length === 1 ? 'has' : 'have'
                              } been excluded from this analysis.`}
                    </span>
                );
            }
            if (summary) {
                return (
                    <div>
                        <i
                            className={`fa fa-md ${this.classNames.icon}`}
                            style={{
                                color: '#000000',
                                marginRight: 5,
                            }}
                        />
                        {summary}
                    </div>
                );
            } else {
                return null;
            }
        },
    });

    private makeOverlappingCasesMessage(
        caseType: 'sample' | 'patient',
        selectionInfo: IOverlapComputations<ComparisonGroup>
    ) {
        // determine count
        const count =
            caseType === 'sample'
                ? selectionInfo.overlappingSamples.length
                : selectionInfo.overlappingPatients.length;

        if (count === 0) {
            // omit message if 0 overlap
            return null;
        }

        let message;
        if (
            this.props.survivalTabMode &&
            selectionInfo.totalPatientOverlap > 0 &&
            this.props.store.overlapStrategy === OverlapStrategy.INCLUDE
        ) {
            // handle survival mode
            message = makeSurvivalTabMessage(count);
        } else {
            // determine groups
            const includedGroups = selectionInfo.groups.filter(
                g => !(g.uid in selectionInfo.excludedFromAnalysis)
            );
            const groupsAreExcluded =
                includedGroups.length < selectionInfo.groups.length;
            let groupsSummary;
            if (groupsAreExcluded) {
                groupsSummary = (
                    <span>between {joinGroupNames(includedGroups, 'and')}</span>
                );
            } else {
                groupsSummary = <span>in the selected groups</span>;
            }

            message = (
                <span>
                    {`${
                        caseType === 'sample' ? 'Samples' : 'Patients'
                    } (${count}) that overlap `}
                    {groupsSummary}
                    {` are ${
                        this.props.store.overlapStrategy ===
                        OverlapStrategy.INCLUDE
                            ? 'included in'
                            : 'excluded from'
                    }`}
                    {this.props.overlapTabMode
                        ? ` ${caseType}-level analysis in other tabs.`
                        : ` ${caseType}-level analysis below.`}
                </span>
            );
        }

        return (
            <div>
                <i
                    className={`fa fa-md ${this.classNames.icon}`}
                    style={{
                        color: '#000000',
                        marginRight: 5,
                    }}
                />
                {message}
            </div>
        );
    }

    render() {
        if (!this.props.store.overlapComputations.isComplete) {
            return null;
        } else {
            const selectionInfo = this.props.store.overlapComputations.result!;
            if (
                (!selectionInfo.totalSampleOverlap &&
                    !selectionInfo.totalPatientOverlap) ||
                (this.props.only === 'sample' &&
                    !selectionInfo.totalSampleOverlap) ||
                (this.props.only === 'patient' &&
                    !selectionInfo.totalPatientOverlap)
            ) {
                return null;
            }

            return (
                <div className={`alert ${this.classNames.alert}`}>
                    {this.excludedGroupsSummary.component}
                    {this.props.only !== 'patient' &&
                        this.makeOverlappingCasesMessage(
                            'sample',
                            selectionInfo
                        )}
                    {this.props.only !== 'sample' &&
                        this.makeOverlappingCasesMessage(
                            'patient',
                            selectionInfo
                        )}
                </div>
            );
        }
    }
}
