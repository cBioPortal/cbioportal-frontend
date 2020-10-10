import * as React from 'react';
import SurvivalChart from '../resultsView/survival/SurvivalChart';
import 'react-rangeslider/lib/index.css';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { observer } from 'mobx-react';
import { DefaultTooltip, remoteData } from 'cbioportal-frontend-commons';
import { MakeMobxView } from '../../shared/components/MobxView';
import {
    SURVIVAL_NOT_ENOUGH_GROUPS_MSG,
    SURVIVAL_TOO_MANY_GROUPS_MSG,
} from './GroupComparisonUtils';
import ErrorMessage from '../../shared/components/ErrorMessage';
import { blendColors } from './OverlapUtils';
import OverlapExclusionIndicator from './OverlapExclusionIndicator';
import { getPatientIdentifiers } from '../studyView/StudyViewUtils';
import _, { Dictionary } from 'lodash';
import SurvivalDescriptionTable from 'pages/resultsView/survival/SurvivalDescriptionTable';
import {
    GroupLegendLabelComponent,
    SurvivalTabGroupLegendLabelComponent,
} from './labelComponents/GroupLegendLabelComponent';
import ComparisonStore, {
    OverlapStrategy,
} from '../../shared/lib/comparison/ComparisonStore';
import {
    survivalPlotTooltipxLabelWithEvent,
    generateSurvivalPlotTitleFromDisplayName,
    getStatusCasesHeaderText,
} from 'pages/resultsView/survival/SurvivalUtil';
import { observable, action } from 'mobx';
import survivalPlotStyle from './styles.module.scss';
import SurvivalPrefixTable from 'pages/resultsView/survival/SurvivalPrefixTable';
import autobind from 'autobind-decorator';
import { PatientSurvival } from 'shared/model/PatientSurvival';
import { calculateQValues } from 'shared/lib/calculation/BenjaminiHochbergFDRCalculator';
import { logRankTest } from 'pages/resultsView/survival/logRankTest';

export interface ISurvivalProps {
    store: ComparisonStore;
}

@observer
export default class Survival extends React.Component<ISurvivalProps, {}> {
    private multipleDescriptionWarningMessageWithoutTooltip =
        'The survival data on patients from different cohorts may have been defined by ';
    private multipleDescriptionWarningMessageWithTooltip =
        'different criteria.';
    private differentDescriptionExistMessage =
        'Different descriptions of survival data were used for different studies.';

    @observable
    private selectedSurvivalPlotPrefix: string | undefined = undefined;

    @autobind
    @action
    private setSurvivalPlotPrefix(prefix: string) {
        this.selectedSurvivalPlotPrefix = prefix;
    }

    public readonly analysisGroupsComputations = remoteData({
        await: () => [
            this.props.store.activeGroups,
            this.props.store.patientsVennPartition,
            this.props.store.uidToGroup,
            this.props.store.patientToSamplesSet,
        ],
        invoke: () => {
            const orderedActiveGroupUidSet = _.reduce(
                this.props.store._activeGroupsNotOverlapRemoved.result!,
                (acc, next, index) => {
                    acc[next.uid] = index;
                    return acc;
                },
                {} as { [id: string]: number }
            );
            const partition = this.props.store.patientsVennPartition.result!;

            // ascending sort partition bases on number of groups in each parition.
            // if they are equal then sort based on the give order of groups
            partition.sort((a, b) => {
                const aUids = Object.keys(a.key).filter(uid => a.key[uid]);
                const bUids = Object.keys(b.key).filter(uid => b.key[uid]);
                if (aUids.length !== bUids.length) {
                    return aUids.length - bUids.length;
                }
                const aCount = _.sumBy(
                    aUids,
                    uid => orderedActiveGroupUidSet[uid]
                );
                const bCount = _.sumBy(
                    bUids,
                    uid => orderedActiveGroupUidSet[uid]
                );
                return aCount - bCount;
            });
            const uidToGroup = this.props.store.uidToGroup.result!;
            const analysisGroups = [];
            const patientToAnalysisGroups: {
                [patientKey: string]: string[];
            } = {};

            if (this.props.store.overlapStrategy === OverlapStrategy.INCLUDE) {
                for (const entry of partition) {
                    const partitionGroupUids = Object.keys(entry.key).filter(
                        uid => entry.key[uid]
                    );
                    // sort by give order of groups
                    partitionGroupUids.sort(
                        (a, b) =>
                            orderedActiveGroupUidSet[a] -
                            orderedActiveGroupUidSet[b]
                    );
                    if (partitionGroupUids.length > 0) {
                        const name = `Only ${partitionGroupUids
                            .map(uid => uidToGroup[uid].nameWithOrdinal)
                            .join(', ')}`;
                        const value = partitionGroupUids.join(',');
                        for (const patientKey of entry.value) {
                            patientToAnalysisGroups[patientKey] = [value];
                        }
                        analysisGroups.push({
                            name,
                            color: blendColors(
                                partitionGroupUids.map(
                                    uid => uidToGroup[uid].color
                                )
                            ),
                            value,
                            legendText: JSON.stringify(partitionGroupUids),
                        });
                    }
                }
            } else {
                const patientToSamplesSet = this.props.store.patientToSamplesSet
                    .result!;
                for (const group of this.props.store.activeGroups.result!) {
                    const name = group.nameWithOrdinal;
                    analysisGroups.push({
                        name,
                        color: group.color,
                        value: group.uid,
                        legendText: group.uid,
                    });
                    const patientIdentifiers = getPatientIdentifiers([group]);
                    for (const identifier of patientIdentifiers) {
                        const samples = patientToSamplesSet.get({
                            studyId: identifier.studyId,
                            patientId: identifier.patientId,
                        });
                        if (samples && samples.length) {
                            patientToAnalysisGroups[
                                samples[0].uniquePatientKey
                            ] = [group.uid];
                        }
                    }
                }
            }
            return Promise.resolve({
                analysisGroups,
                patientToAnalysisGroups,
            });
        },
    });

    readonly sortedGroupedSurvivals = remoteData<{
        [prefix: string]: { [analysisGroup: string]: PatientSurvival[] };
    }>({
        await: () => [
            this.analysisGroupsComputations,
            this.props.store.patientSurvivals,
        ],
        invoke: () => {
            const patientToAnalysisGroups = this.analysisGroupsComputations
                .result!.patientToAnalysisGroups;
            const survivalsByPrefixByAnalysisGroup = _.mapValues(
                this.props.store.patientSurvivals.result!,
                survivals =>
                    _.reduce(
                        survivals,
                        (map, nextSurv) => {
                            if (
                                nextSurv.uniquePatientKey in
                                patientToAnalysisGroups
                            ) {
                                // only include this data if theres an analysis group (curve) to put it in
                                const groups =
                                    patientToAnalysisGroups[
                                        nextSurv.uniquePatientKey
                                    ];
                                groups.forEach(group => {
                                    map[group] = map[group] || [];
                                    map[group].push(nextSurv);
                                });
                            }
                            return map;
                        },
                        {} as { [groupValue: string]: PatientSurvival[] }
                    )
            );

            return Promise.resolve(
                _.mapValues(
                    survivalsByPrefixByAnalysisGroup,
                    survivalsByAnalysisGroup =>
                        _.mapValues(survivalsByAnalysisGroup, survivals =>
                            survivals.sort((a, b) => a.months - b.months)
                        )
                )
            );
        },
    });

    readonly pValuesByPrefix = remoteData<{ [prefix: string]: number | null }>({
        await: () => [
            this.sortedGroupedSurvivals,
            this.analysisGroupsComputations,
        ],
        invoke: () => {
            const analysisGroups = this.analysisGroupsComputations.result!
                .analysisGroups;

            return Promise.resolve(
                _.mapValues(
                    this.sortedGroupedSurvivals.result!,
                    groupToSurvivals => {
                        let pVal = null;
                        if (analysisGroups.length > 1) {
                            pVal = logRankTest(
                                ...analysisGroups.map(
                                    group => groupToSurvivals[group.value] || []
                                )
                            );
                        }
                        return pVal;
                    }
                )
            );
        },
    });

    readonly qValuesByPrefix = remoteData<{ [prefix: string]: number | null }>({
        await: () => [this.pValuesByPrefix],
        invoke: () => {
            // Pair pValues with prefixes
            const zipped = _.map(
                this.pValuesByPrefix.result!,
                (pVal, prefix) => ({ pVal, prefix })
            );

            // Filter out null pvalues and sort in ascending order
            const sorted = _.sortBy(
                zipped.filter(x => x.pVal !== null),
                x => x.pVal
            );

            // Calculate q values, in same order as `sorted`
            const qValues = calculateQValues(sorted.map(x => x.pVal!));

            // make a copy - null pValues become null qValues
            const ret = _.clone(this.pValuesByPrefix.result!);
            sorted.forEach((x, index) => {
                ret[x.prefix] = qValues[index];
            });
            return Promise.resolve(ret);
        },
    });

    readonly tabUI = MakeMobxView({
        await: () => {
            if (
                this.props.store._activeGroupsNotOverlapRemoved.isComplete &&
                this.props.store._activeGroupsNotOverlapRemoved.result.length >
                    10
            ) {
                // dont bother loading data for and computing UI if its not valid situation for it
                return [this.props.store._activeGroupsNotOverlapRemoved];
            } else {
                return [
                    this.props.store._activeGroupsNotOverlapRemoved,
                    this.survivalUI,
                    this.props.store.overlapComputations,
                    this.survivalPrefixTable,
                ];
            }
        },
        render: () => {
            const numActiveGroups = this.props.store
                ._activeGroupsNotOverlapRemoved.result!.length;
            let content: any = [];
            if (numActiveGroups > 10) {
                content = <span>{SURVIVAL_TOO_MANY_GROUPS_MSG}</span>;
            } else if (numActiveGroups === 0) {
                content = <span>{SURVIVAL_NOT_ENOUGH_GROUPS_MSG}</span>;
            } else {
                content = (
                    <>
                        <div
                            className={'tabMessageContainer'}
                            style={{ paddingBottom: 0 }}
                        >
                            <div className="alert alert-info">
                                <i
                                    className="fa fa-md fa-info-circle"
                                    style={{
                                        verticalAlign: 'middle !important',
                                        marginRight: 6,
                                        marginBottom: 1,
                                    }}
                                />
                                Interpret all outcome results with caution, as
                                they can be confounded by many different
                                variables that are not controlled for in these
                                analyses. Consider consulting a statistician.
                            </div>
                            <OverlapExclusionIndicator
                                store={this.props.store}
                                only="patient"
                                survivalTabMode={true}
                            />
                        </div>
                        <div
                            style={{
                                display: 'flex',
                            }}
                        >
                            {this.survivalPrefixTable.component && (
                                <div
                                    style={{
                                        marginRight: 15,
                                        marginTop: 15,
                                        minWidth: 475,
                                        maxWidth: 475,
                                    }}
                                >
                                    {this.survivalPrefixTable.component}
                                </div>
                            )}
                            {this.survivalUI.component}
                        </div>
                    </>
                );
            }
            return (
                <div data-test="ComparisonPageSurvivalTabDiv">{content}</div>
            );
        },
        renderPending: () => (
            <LoadingIndicator center={true} isLoading={true} size={'big'} />
        ),
        renderError: () => <ErrorMessage />,
        showLastRenderWhenPending: true,
    });

    readonly survivalPrefixTable = MakeMobxView({
        await: () => [
            this.survivalTitleText,
            this.props.store.patientSurvivals,
            this.pValuesByPrefix,
            this.qValuesByPrefix,
            this.analysisGroupsComputations,
        ],
        render: () => {
            const patientSurvivals = this.props.store.patientSurvivals.result!;
            const analysisGroups = this.analysisGroupsComputations.result!
                .analysisGroups;
            const uidToAnalysisGroup = _.keyBy(analysisGroups, g => g.value);
            const patientToAnalysisGroups = this.analysisGroupsComputations
                .result!.patientToAnalysisGroups;
            const pValues = this.pValuesByPrefix.result!;
            const qValues = this.qValuesByPrefix.result!;
            const survivalTitleText = this.survivalTitleText.result!;

            if (Object.keys(survivalTitleText).length > 1) {
                // only show table if theres more than one prefix option
                return (
                    <SurvivalPrefixTable
                        groupNames={analysisGroups.map(g => g.name)}
                        survivalPrefixes={_.map(
                            this.survivalTitleText.result! as Dictionary<
                                string
                            >,
                            (displayText, prefix) => {
                                const numPatientsPerGroup = analysisGroups.reduce(
                                    (countsMap, group) => {
                                        countsMap[group.name] = 0;
                                        return countsMap;
                                    },
                                    {} as { [group: string]: number }
                                );

                                for (const s of patientSurvivals[prefix]) {
                                    // count the number of patients in each active group
                                    const groupUids =
                                        patientToAnalysisGroups[
                                            s.uniquePatientKey
                                        ] || [];
                                    for (const uid of groupUids) {
                                        numPatientsPerGroup[
                                            uidToAnalysisGroup[uid].name
                                        ] += 1;
                                    }
                                }
                                return {
                                    prefix,
                                    displayText,
                                    numPatients: _.sumBy(
                                        patientSurvivals[prefix],
                                        s =>
                                            +(
                                                s.uniquePatientKey in
                                                patientToAnalysisGroups
                                            )
                                    ),
                                    numPatientsPerGroup,
                                    pValue: pValues[prefix],
                                    qValue: qValues[prefix],
                                };
                            }
                        )}
                        getSelectedPrefix={() =>
                            this.selectedSurvivalPlotPrefix
                        }
                        setSelectedPrefix={this.setSurvivalPlotPrefix}
                    />
                );
            } else {
                return null;
            }
        },
    });

    readonly survivalTitleText = remoteData({
        await: () => [
            this.props.store.survivalClinicalAttributesPrefix,
            this.props.store.survivalDescriptions,
        ],
        invoke: () =>
            Promise.resolve(
                this.props.store.survivalClinicalAttributesPrefix.result!.reduce(
                    (map, prefix) => {
                        // get survival plot titles
                        // use first display name as title
                        map[prefix] = generateSurvivalPlotTitleFromDisplayName(
                            this.props.store.survivalDescriptions.result![
                                prefix
                            ][0].displayName
                        );
                        return map;
                    },
                    {} as { [prefix: string]: string }
                )
            ),
    });

    readonly survivalUI = MakeMobxView({
        await: () => [
            this.props.store.survivalDescriptions,
            this.props.store.survivalXAxisLabelGroupByPrefix,
            this.props.store.survivalClinicalAttributesPrefix,
            this.props.store.patientSurvivals,
            this.props.store.activeStudiesClinicalAttributes,
            this.analysisGroupsComputations,
            this.props.store.overlapComputations,
            this.props.store.uidToGroup,
            this.props.store.patientSurvivalUniqueStatusText,
            this.survivalTitleText,
            this.sortedGroupedSurvivals,
            this.pValuesByPrefix,
        ],
        render: () => {
            let content: any = null;
            let plotHeader: any = null;
            const analysisGroups = this.analysisGroupsComputations.result!
                .analysisGroups;
            const patientToAnalysisGroups = this.analysisGroupsComputations
                .result!.patientToAnalysisGroups;
            const attributeDescriptions: { [prefix: string]: string } = {};
            const survivalTitleText = this.survivalTitleText.result!;
            this.props.store.survivalClinicalAttributesPrefix.result!.forEach(
                prefix => {
                    // get attribute description
                    // if only have one description, use it as plot title description
                    // if have more than one description, don't show description in title
                    attributeDescriptions[prefix] =
                        this.props.store.survivalDescriptions.result![prefix]
                            .length === 1
                            ? this.props.store.survivalDescriptions.result![
                                  prefix
                              ][0].description
                            : '';
                }
            );
            // set default plot if available
            if (
                this.selectedSurvivalPlotPrefix === undefined &&
                !_.isEmpty(this.props.store.patientSurvivals.result)
            ) {
                this.setSurvivalPlotPrefix(
                    _.keys(this.props.store.patientSurvivals.result!)[0]
                );
            }

            if (this.selectedSurvivalPlotPrefix) {
                const value = this.props.store.patientSurvivals.result![
                    this.selectedSurvivalPlotPrefix
                ];
                const key = this.selectedSurvivalPlotPrefix;
                if (value.length > 0) {
                    if (
                        this.props.store.survivalDescriptions &&
                        this.props.store.survivalDescriptions.result![key]
                            .length > 1
                    ) {
                        let messageBeforeTooltip = this
                            .multipleDescriptionWarningMessageWithoutTooltip;
                        const uniqDescriptions = _.uniq(
                            _.map(
                                this.props.store.survivalDescriptions.result![
                                    key
                                ],
                                d => d.description
                            )
                        );
                        if (uniqDescriptions.length > 1) {
                            messageBeforeTooltip = `${this.differentDescriptionExistMessage} ${messageBeforeTooltip}`;
                        }

                        plotHeader = (
                            <div className={'tabMessageContainer'}>
                                <div
                                    className={'alert alert-warning'}
                                    role="alert"
                                >
                                    {messageBeforeTooltip}
                                    <DefaultTooltip
                                        placement="bottom"
                                        overlay={
                                            <SurvivalDescriptionTable
                                                survivalDescriptionData={
                                                    this.props.store
                                                        .survivalDescriptions
                                                        .result![key]
                                                }
                                            />
                                        }
                                    >
                                        <a href="javascript:void(0)">
                                            {
                                                this
                                                    .multipleDescriptionWarningMessageWithTooltip
                                            }
                                        </a>
                                    </DefaultTooltip>
                                </div>
                            </div>
                        );
                    }
                    content = (
                        <div style={{ marginBottom: 40 }}>
                            <h4 className="forceHeaderStyle h4">
                                {survivalTitleText[key]}
                            </h4>
                            <p>{attributeDescriptions[key]}</p>
                            <div
                                className="borderedChart"
                                style={{ width: '920px' }}
                            >
                                <SurvivalChart
                                    key={key}
                                    sortedGroupedSurvivals={
                                        this.sortedGroupedSurvivals.result![
                                            this.selectedSurvivalPlotPrefix
                                        ]
                                    }
                                    analysisGroups={analysisGroups}
                                    patientToAnalysisGroups={
                                        patientToAnalysisGroups
                                    }
                                    title={survivalTitleText[key]}
                                    xAxisLabel={
                                        this.props.store
                                            .survivalXAxisLabelGroupByPrefix
                                            .result![key]
                                    }
                                    yAxisLabel={survivalTitleText[key]}
                                    totalCasesHeader="Number of Cases, Total"
                                    statusCasesHeader={`Number of Cases, ${getStatusCasesHeaderText(
                                        key,
                                        this.props.store
                                            .patientSurvivalUniqueStatusText
                                            .result![key]
                                    )}`}
                                    medianMonthsHeader={`Median Months ${survivalTitleText[key]}`}
                                    yLabelTooltip={`${_.startCase(
                                        _.toLower(survivalTitleText[key])
                                    )} estimate`}
                                    xLabelWithEventTooltip={
                                        survivalPlotTooltipxLabelWithEvent[
                                            key
                                        ] || 'Time of Death'
                                    }
                                    xLabelWithoutEventTooltip="Time of last observation"
                                    fileName={survivalTitleText[key].replace(
                                        ' ',
                                        '_'
                                    )}
                                    showCurveInTooltip={true}
                                    legendLabelComponent={
                                        this.props.store.overlapStrategy ===
                                        OverlapStrategy.INCLUDE ? (
                                            <SurvivalTabGroupLegendLabelComponent
                                                maxLabelWidth={256}
                                                uidToGroup={
                                                    this.props.store.uidToGroup
                                                        .result!
                                                }
                                                dy="0.3em"
                                            />
                                        ) : (
                                            <GroupLegendLabelComponent
                                                maxLabelWidth={256}
                                                uidToGroup={
                                                    this.props.store.uidToGroup
                                                        .result!
                                                }
                                                dy="0.3em"
                                            />
                                        )
                                    }
                                    styleOpts={{
                                        tooltipYOffset: -28,
                                    }}
                                    pValue={
                                        this.pValuesByPrefix.result![
                                            this.selectedSurvivalPlotPrefix
                                        ]
                                    }
                                />
                            </div>
                        </div>
                    );
                } else {
                    content = (
                        <div className={'alert alert-info'}>
                            {survivalTitleText[key]} not available
                        </div>
                    );
                }
            }
            return (
                <div>
                    <div
                        className={
                            survivalPlotStyle['survivalPlotHeaderContainer']
                        }
                    >
                        <div
                            className={survivalPlotStyle['survivalPlotHeader']}
                        >
                            <ul className={'nav nav-pills'}>{plotHeader}</ul>
                        </div>
                    </div>
                    {content}
                </div>
            );
        },
        renderPending: () => (
            <LoadingIndicator center={true} isLoading={true} size={'big'} />
        ),
        renderError: () => <ErrorMessage />,
    });

    render() {
        return this.tabUI.component;
    }
}
