import {
    IArmMatch, IClinicalGroupMatch, IDetailedTrialMatch, IGenomicGroupMatch, IGenomicMatch, ITrial,
    ITrialMatch, IArm, IDrug, IGenomicMatchType
} from "../../../shared/model/MatchMiner";
import * as _ from 'lodash';

export function groupTrialMatchesById(trials: ITrial[], trialMatches:ITrialMatch[]): IDetailedTrialMatch[] {
    trialMatches = excludeControlArms(trialMatches);
    const matchesGroupedById = _.groupBy(trialMatches, (trial: ITrialMatch) => trial.id);
    const matchedTrials: IDetailedTrialMatch[] = _.map(matchesGroupedById, (trialGroup, trialId) => {
        const originalMatchedTrial: ITrial = _.find( trials, (trial) => trial.id === trialId )!;
        const matchedTrial: IDetailedTrialMatch = {
            id: originalMatchedTrial.id,
            nctId: originalMatchedTrial.nctId,
            protocolNo: originalMatchedTrial.protocolNo,
            phase: originalMatchedTrial.phase,
            shortTitle: originalMatchedTrial.shortTitle,
            status: originalMatchedTrial.status,
            matches: [],
            priority: 0 // highest priority
        };
        matchedTrial.matches = groupTrialMatchesByArmDescription(trialGroup, originalMatchedTrial);
        matchedTrial.priority = calculateTrialPriority(matchedTrial.matches);
        return matchedTrial;
    });
    return _.sortBy(matchedTrials, (trial: IDetailedTrialMatch) => trial.priority);
}

export function groupTrialMatchesByArmDescription(trialGroup: ITrialMatch[], originalMatchedTrial: ITrial): IArmMatch[] {
    const matchesGroupedByArm = _.groupBy(trialGroup, (trial: ITrialMatch) => trial.armDescription);
    const matches = _.map(matchesGroupedByArm, (armGroup, armDescription) => {
        const armMatch: IArmMatch = {
            armDescription: armDescription,
            drugs: [],
            matches: []
        };
        if (!_.isUndefined(originalMatchedTrial.treatmentList.step[0].arm)) {
            armMatch.drugs = getDrugsFromArm(armDescription, originalMatchedTrial.treatmentList.step[0].arm);
        }
        armMatch.matches = groupTrialMatchesByAgeNumerical(armGroup);
        return armMatch;
    });
    return matches;
}

export function groupTrialMatchesByAgeNumerical(armGroup: ITrialMatch[]): IClinicalGroupMatch[] {
    const matchesGroupedByAge = _.groupBy(armGroup, (trial: ITrialMatch) => trial.trialAgeNumerical);
    const matches = _.map(matchesGroupedByAge, (ageGroup, age) => {
        const cancerTypes =  _.uniq(_.map(ageGroup, (trial: ITrialMatch) => trial.trialOncotreePrimaryDiagnosis));
        const positiveCancerTypes: string[] = [];
        const negativeCancerTypes: string[] = [];
        _.map(cancerTypes, (item) => {
            // If a cancer type contains a "!", it means this trial cannot be used for the cancer type, which is a "NOT" match.
            if (!_.isUndefined(item)) {
                if (item.includes('!')) {
                    negativeCancerTypes.push(item.replace('!', ''));
                } else {
                    positiveCancerTypes.push(item);
                }
            }
        });
        let clinicalGroupMatch: IClinicalGroupMatch = {
            trialAgeNumerical: age,
            trialOncotreePrimaryDiagnosis: {
                positive: positiveCancerTypes,
                negative: negativeCancerTypes
            },
            matches: {
                MUTATION: [],
                CNA: [],
                MSI: [],
                WILDTYPE: []
            },
            notMatches: {
                MUTATION: [],
                CNA: [],
                MSI: [],
                WILDTYPE: []
            }
        };
        const positiveAndNegativeMatches = groupTrialMatchesByGenomicAlteration(matchesGroupedByAge[age]);
        clinicalGroupMatch.matches = positiveAndNegativeMatches.matches;
        clinicalGroupMatch.notMatches = positiveAndNegativeMatches.notMatches;
        return clinicalGroupMatch;
    });
    if (matches.length > 1) {
        return removeDuplicationByAge(matches);
    }
    return matches;
}

export function removeDuplicationByAge(clinicalGroupMatch: IClinicalGroupMatch[]): IClinicalGroupMatch[] {
    const uniqClinicalGroupMatch: IClinicalGroupMatch[] = _.clone(clinicalGroupMatch);
    const duplicateIndexes: number[] = [];
    for (let i = 0; i < clinicalGroupMatch.length - 1; i++) {
        for (let j = i + 1; j < clinicalGroupMatch.length; j++) {
            if (!_.isUndefined(clinicalGroupMatch[i]) && !_.isUndefined(clinicalGroupMatch[j]) &&
                isIdenticalArrays(clinicalGroupMatch[i].trialOncotreePrimaryDiagnosis.positive, clinicalGroupMatch[j].trialOncotreePrimaryDiagnosis.positive) &&
                isIdenticalArrays(clinicalGroupMatch[i].trialOncotreePrimaryDiagnosis.negative, clinicalGroupMatch[j].trialOncotreePrimaryDiagnosis.negative)) {
                if (!uniqClinicalGroupMatch[i].trialAgeNumerical.includes(clinicalGroupMatch[j].trialAgeNumerical)) {
                    uniqClinicalGroupMatch[i].trialAgeNumerical += ',' + clinicalGroupMatch[j].trialAgeNumerical;
                }
                delete clinicalGroupMatch[j]; // Do not messed up indexes
                duplicateIndexes.push(j);
            }
        }
    }
    _.forEach(_.uniq(duplicateIndexes), (index) => uniqClinicalGroupMatch.splice(index, 1));
    return uniqClinicalGroupMatch;
}

function isIdenticalArrays(a: string[], b: string[]): boolean {
    if (a.length === b.length) {
        if (a.length === 0) return true;
        return a.sort().join(',') === b.sort().join(',');
    } else {
        return false;
    }
}

export function groupTrialMatchesByGenomicAlteration(ageGroup: ITrialMatch[]) {
    const matchesGroupedByGenomicAlteration = _.groupBy(ageGroup, (trial: ITrialMatch) => trial.genomicAlteration);
    // positive matches
    const matches: IGenomicMatchType = {
        MUTATION: [],
        CNA: [],
        MSI: [],
        WILDTYPE: []
    };
    // negative matches
    const notMatches: IGenomicMatchType = {
        MUTATION: [],
        CNA: [],
        MSI: [],
        WILDTYPE: []
    };
    _.forEach(matchesGroupedByGenomicAlteration, (genomicAlterationGroup, genomicAlteration) => {
        const genomicGroupMatch = formatTrialMatchesByMatchType(genomicAlterationGroup, genomicAlteration);
        if(genomicAlteration.includes('!')) {
            notMatches[genomicAlterationGroup[ 0 ][ 'matchType' ]].push(genomicGroupMatch);
        } else {
            matches[genomicAlterationGroup[ 0 ][ 'matchType' ]].push(genomicGroupMatch);
        }
    });
    return { notMatches: notMatches, matches: matches };
}

function formatTrialMatchesByMatchType(genomicAlterationGroup: ITrialMatch[], genomicAlteration: string) {
    const matchType = genomicAlterationGroup[ 0 ][ 'matchType' ];
    if (matchType === 'MUTATION') {
        return groupTrialMatchesByPatientGenomic(genomicAlterationGroup, genomicAlteration, matchType);
    } else {
        const genomicGroupMatch: IGenomicGroupMatch = {
            genomicAlteration: genomicAlteration,
            matchType: matchType,
            matches: [{
                sampleIds: _.uniq( _.map( genomicAlterationGroup, ( trial: ITrialMatch ) => trial.sampleId ) )
            }]
        };
        return genomicGroupMatch;
    }
}

export function groupTrialMatchesByPatientGenomic(genomicAlterationGroup: ITrialMatch[], genomicAlteration: string, matchType: string): IGenomicGroupMatch {
    const matchesGroupedByPatientGenomic = _.groupBy( genomicAlterationGroup, ( trial: ITrialMatch ) => trial.trueHugoSymbol! + trial.trueProteinChange! );
    const genomicGroupMatch: IGenomicGroupMatch = {
        genomicAlteration: genomicAlteration,
        matchType: matchType,
        matches: []
    };
    genomicGroupMatch.matches = _.map(matchesGroupedByPatientGenomic, (patientGenomicGroup: ITrialMatch[]) => {
        const genomicMatch: IGenomicMatch = {
            trueHugoSymbol: patientGenomicGroup[0].trueHugoSymbol!,
            trueProteinChange: patientGenomicGroup[0].trueProteinChange!,
            sampleIds: _.uniq(_.map(patientGenomicGroup, (trial: ITrialMatch) => trial.sampleId))
        };
        return genomicMatch;
    });
    return genomicGroupMatch;
}

export function calculateTrialPriority(armMatches: IArmMatch[]): number {
    let priority = 0;
    _.forEach(armMatches, (armMatch) => {
        _.forEach(armMatch.matches, (clinicalGroupMatch: IClinicalGroupMatch) => {
            priority += getMatchPriority(clinicalGroupMatch);
        });
    });
    return priority;
}

export function getMatchPriority(clinicalGroupMatch: IClinicalGroupMatch): number {
    // In trial match tab, positive matches should always display before negative matches(notMatches).
    // The highest and default priority is 0. The priority the higher, the display order the lower.
    const matchesLength = getMatchesLength(clinicalGroupMatch.matches);
    const notMatchesLength = getMatchesLength(clinicalGroupMatch.notMatches);
    if (notMatchesLength > 0) {
        if ( matchesLength === 0) {
            return 2; // A trial only has negative matches.
        }
        return 1; // A trial has both positive matches and negative matches.
    }
    return 0; // A trial only has positive matches.
}

export function getMatchesLength(genomicMatchType: IGenomicMatchType): number {
    return _.sum([genomicMatchType.MUTATION.length, genomicMatchType.CNA.length,
        genomicMatchType.MSI.length, genomicMatchType.WILDTYPE.length]);
}

export function excludeControlArms(trialMatches: ITrialMatch[]): ITrialMatch[] {
    const hiddenArmTypes = ['Control Arm', 'Placebo Arm'];
    const filteredTrialMatches: ITrialMatch[] = [];
    _.forEach(trialMatches, (trialMatch) => {
        if ( !trialMatch.armType || !hiddenArmTypes.includes(trialMatch.armType) ) {
            filteredTrialMatches.push(trialMatch);
        }
    });
    return filteredTrialMatches;
}

export function getDrugsFromArm(armDescription: string, arms: IArm[]): string[][] {
    const drugs:string[][] = [];
    if ( armDescription !== '' ) { // match for specific arm
        const matchedArm: IArm = _.find( arms, (arm) => arm.arm_description === armDescription )!;
        if ( !_.isUndefined(matchedArm.drugs) ) {
            drugs.push( _.map( matchedArm.drugs, (drug: IDrug) => drug.name ) );
        }
    }
    return drugs;
}

export function getAgeRangeDisplay(trialAgeNumerical: string) {
    if (trialAgeNumerical.includes(',')) {
        const ageGroups = trialAgeNumerical.split(',');
        const ageNumbers = trialAgeNumerical.match(/\d+(\.?\d+)?/g)!.map((v: string) => Number(v));
        if (ageGroups.length === 2) {
            let leftAgeText = '';
            let rightAgeText = '';
            if (ageGroups[0].includes('>') && ageGroups[1].includes('<')) {
                if (ageGroups[0].includes('=')) {
                    leftAgeText = `${ageNumbers[0]} ≤`;
                } else {
                    leftAgeText = `${ageNumbers[0]} <`;
                }
                if (ageGroups[1].includes('=')) {
                    rightAgeText = `≤ ${ageNumbers[1]}`;
                } else {
                    rightAgeText = `< ${ageNumbers[1]}`;
                }
                return `${leftAgeText} Age ${rightAgeText}`;
            } else if (ageGroups[0].includes('<') && ageGroups[1].includes('>')) {
                if (ageGroups[1].includes('=')) {
                    leftAgeText = `${ageNumbers[1]} ≤`;
                } else {
                    leftAgeText = `${ageNumbers[1]} <`;
                }
                if (ageGroups[0].includes('=')) {
                    rightAgeText = `≤ ${ageNumbers[0]}`;
                } else {
                    rightAgeText = `< ${ageNumbers[0]}`;
                }
                return `${leftAgeText} Age ${rightAgeText}`;
            } else {
                return `Age: ${trialAgeNumerical}`
            }
        } else {
            return `Age: ${trialAgeNumerical}`;
        }
    } else {
        return `${trialAgeNumerical} yrs old`;
    }
}
