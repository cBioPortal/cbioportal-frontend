import {
    ComparisonGroup,
    finalizeStudiesAttr,
    getNumPatients,
    getNumSamples,
} from '../../groupComparison/GroupComparisonUtils';
import { getStudiesAttr } from '../../groupComparison/comparisonGroupManager/ComparisonGroupManagerUtils';
import {
    Sample,
    SampleIdentifier,
} from '../../../shared/api/generated/CBioPortalAPI';
import {
    AnnotatedExtendedAlteration,
    IQueriedMergedTrackCaseData,
} from '../ResultsViewPageStore';
import {
    isMergedGeneQuery,
    isMergedTrackFilter,
    parseOQLQueryFlat,
    UnflattenedOQLLineFilterOutput,
    unparseOQLQueryLine,
} from '../../../shared/lib/oql/oqlfilter';
import {
    ResultsViewComparisonSessionGroupData,
    SessionGroupData,
} from '../../../shared/api/ComparisonGroupClient';
import ComplexKeyMap from '../../../shared/lib/complexKeyDataStructures/ComplexKeyMap';
import {
    MergedGeneQuery,
    SingleGeneQuery,
} from '../../../shared/lib/oql/oql-parser';
import oql_parser from '../../../shared/lib/oql/oql-parser';
import _ from 'lodash';
import { Omit } from '../../../shared/lib/TypeScriptUtils';

export type ResultsViewComparisonGroup = Omit<
    ResultsViewComparisonSessionGroupData,
    'studies' | 'color'
> & {
    color: string; // color mandatory here, bc we'll assign one if its missing
    uid: string; // unique in the session
    nameWithOrdinal: string; // for easy disambiguation when groups are abbreviated
    ordinal: string;
    studies: { id: string; samples: string[]; patients: string[] }[]; // include patients, filter out nonexistent samples
    nonExistentSamples: SampleIdentifier[]; // samples specified in the group which no longer exist in our DB
    count: number;
};

export const ALTERED_COLOR = '#dc3912';
export const UNALTERED_COLOR = '#3366cc';
export const ALTERED_GROUP_NAME = 'Altered group';
export const UNALTERED_GROUP_NAME = 'Unaltered group';

export function getNormalizedTrackOql(line: SingleGeneQuery | MergedGeneQuery) {
    if (isMergedGeneQuery(line)) {
        return line.list
            .map(singleGeneQuery => unparseOQLQueryLine(singleGeneQuery))
            .join(' / ');
    } else {
        return unparseOQLQueryLine(line);
    }
}

export function completeSessionGroups(
    patientLevel: boolean,
    groups: ResultsViewComparisonSessionGroupData[],
    sampleSet: ComplexKeyMap<Sample>,
    getColor: () => string
): ResultsViewComparisonGroup[] {
    // (1) ensure color and other required members
    // (2) filter out, and add list of, nonexistent samples
    // (3) add patients

    return groups.map(groupData => {
        // assign color to group if no color given
        let color = groupData.color || getColor();

        const { nonExistentSamples, studies } = finalizeStudiesAttr(
            groupData,
            sampleSet
        );

        return Object.assign({}, groupData, {
            color,
            studies,
            nonExistentSamples,
            uid: groupData.name,
            nameWithOrdinal: groupData.name,
            ordinal: '',
            count: patientLevel
                ? getNumPatients({ studies })
                : getNumSamples({ studies }),
        });
    });
}

export function getAlteredVsUnalteredGroups(
    patientLevel: boolean,
    studyIds: string[],
    alteredSamples: Sample[],
    unalteredSamples: Sample[]
): ResultsViewComparisonSessionGroupData[] {
    return [
        {
            name: ALTERED_GROUP_NAME,
            description: `Number (percentage) of ${
                patientLevel ? 'patients' : 'samples'
            } that have alterations in the query gene(s) that also have a deep deletion in the listed gene.`,
            studies: getStudiesAttr(alteredSamples, alteredSamples),
            origin: studyIds,
            color: ALTERED_COLOR,
            originTracksOql: [],
        },
        {
            name: UNALTERED_GROUP_NAME,
            description: `Number (percentage) of ${
                patientLevel ? 'patients' : 'samples'
            } that do not have alterations in the query gene(s) that have a deep deletion in the listed gene.`,
            studies: getStudiesAttr(unalteredSamples, unalteredSamples),
            origin: studyIds,
            color: UNALTERED_COLOR,
            originTracksOql: [],
        },
    ];
}

export function getAlteredByOncoprintTrackGroups(
    patientLevel: boolean,
    studyIds: string[],
    allSamples: Sample[],
    oqlFilteredCaseAggregatedDataByUnflattenedOQLLine: IQueriedMergedTrackCaseData[],
    defaultOql: string
): ResultsViewComparisonSessionGroupData[] {
    const parsedDefaultOqlAlterations = (oql_parser.parse(
        `DUMMYGENE:${defaultOql};`
    )![0] as SingleGeneQuery).alterations;
    const groups: ResultsViewComparisonSessionGroupData[] = oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.map(
        (dataForLine, index) => {
            const label = getOncoprintTrackGroupName(
                dataForLine.oql,
                parsedDefaultOqlAlterations
            );
            const alteredSamples = allSamples.filter(
                sample =>
                    dataForLine.cases.samples[sample.uniqueSampleKey].length > 0
            );
            const studies = getStudiesAttr(alteredSamples, alteredSamples);
            return {
                name: label,
                description: `Number (percentage) of ${
                    patientLevel ? 'patients' : 'samples'
                } in the following track: ${label}`,
                studies,
                origin: studyIds,
                originTracksOql: [
                    getNormalizedTrackOql(
                        isMergedTrackFilter(dataForLine.oql)
                            ? {
                                  list: dataForLine.oql.list.map(
                                      q => q.parsed_oql_line
                                  ),
                              }
                            : dataForLine.oql.parsed_oql_line
                    ),
                ],
            };
        }
    );

    // remove duplicates by name
    return _.uniqBy(groups, g => g.name);
}

function getOncoprintTrackGroupName(
    oqlFilter: UnflattenedOQLLineFilterOutput<object>,
    parsedDefaultOqlAlterations: SingleGeneQuery['alterations']
): string {
    if (isMergedTrackFilter(oqlFilter) && oqlFilter.label) {
        // return label if it exists
        return oqlFilter.label;
    } else {
        // if oql is default oql, just use list of genes joined by /,
        //  otherwise, give all the oql
        if (isMergedTrackFilter(oqlFilter)) {
            // list of genes (with oql, if not default) joined by /
            return oqlFilter.list
                .map(geneLine => {
                    if (
                        _.isEqual(
                            geneLine.parsed_oql_line.alterations,
                            parsedDefaultOqlAlterations
                        )
                    ) {
                        return geneLine.gene;
                    } else {
                        return geneLine.oql_line.replace(';', ''); // take out semicolon at end
                    }
                })
                .join(' / ');
        } else {
            if (
                _.isEqual(
                    oqlFilter.parsed_oql_line.alterations,
                    parsedDefaultOqlAlterations
                )
            ) {
                return oqlFilter.gene;
            } else {
                return oqlFilter.oql_line.replace(';', ''); // take out semicolon at end
            }
        }
    }
}
