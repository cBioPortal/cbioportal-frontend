// TODO remove this file and completely rely on react-mutation-mapper implementation?

import * as _ from 'lodash';
import {
    Evidence,
    EvidenceQueries,
    EvidenceQueryRes,
    IndicatorQueryResp,
    Query,
    generateQueryVariant as generateGenericQueryVariant,
    generatePartialEvidenceQuery,
    LevelOfEvidence,
    LEVELS,
} from 'cbioportal-frontend-commons';
import { Mutation } from 'shared/api/generated/CBioPortalAPI';
import { IOncoKbData } from 'shared/model/OncoKB';

export function generateIdToIndicatorMap(
    data: IndicatorQueryResp[]
): { [queryId: string]: IndicatorQueryResp } {
    const map: { [queryId: string]: IndicatorQueryResp } = {};

    _.each(data, function(indicator) {
        map[indicator.query.id] = indicator;
    });

    return map;
}

export function generateEvidenceQuery(
    queryVariants: Query[],
    evidenceTypes?: string
): EvidenceQueries {
    return {
        ...generatePartialEvidenceQuery(evidenceTypes),
        queries: queryVariants,
    } as EvidenceQueries;
}

export function generateQueryVariant(
    entrezGeneId: number,
    tumorType: string | null,
    alteration?: string,
    mutationType?: string,
    proteinPosStart?: number,
    proteinPosEnd?: number,
    alterationType?: string
): Query {
    return generateGenericQueryVariant(
        entrezGeneId,
        tumorType,
        alteration,
        mutationType,
        proteinPosStart,
        proteinPosEnd,
        alterationType
    ) as Query;
}

export function initEvidence() {
    return {
        id: '',
        gene: {},
        alteration: [],
        prevalence: [],
        progImp: [],
        treatments: {
            sensitivity: [],
            resistance: [],
        }, //separated by level type
        trials: [],
        oncogenic: '',
        oncogenicRefs: [],
        mutationEffect: {},
        mutationEffectRefs: [],
        summary: '',
    };
}

export function getEvidenceQuery(mutation: Mutation, oncoKbData: IOncoKbData): Query | undefined {
    // return null in case sampleToTumorMap is null
    return oncoKbData.uniqueSampleKeyToTumorType
        ? generateQueryVariant(
              mutation.gene.entrezGeneId,
              oncoKbData.uniqueSampleKeyToTumorType[mutation.uniqueSampleKey],
              mutation.proteinChange,
              mutation.mutationType,
              mutation.proteinPosStart,
              mutation.proteinPosEnd
          )
        : undefined;
}

export function defaultOncoKbIndicatorFilter(indicator: IndicatorQueryResp) {
    return indicator.oncogenic
        .toLowerCase()
        .trim()
        .includes('oncogenic');
}

export function processEvidence(evidences: EvidenceQueryRes[]) {
    var result: any = {}; //id based.
    if (evidences && evidences.length > 0) {
        evidences.forEach(function(record) {
            var id = record.query.id;
            let datum: any = initEvidence(); // TODO define an extended evidence model?
            var sensitivityTreatments: any = [];
            var resistanceTreatments: any = [];

            let evidenceArr: Evidence[] = [];
            evidenceArr = evidenceArr.concat(record.evidences);

            evidenceArr.forEach(function(evidence: any) {
                var description = '';
                if (evidence.shortDescription) {
                    description = evidence.shortDescription;
                } else {
                    description = evidence.description;
                }
                if (evidence.evidenceType === 'GENE_SUMMARY') {
                    datum.gene.summary = description;
                } else if (evidence.evidenceType === 'GENE_BACKGROUND') {
                    datum.gene.background = description;
                } else if (evidence.evidenceType === 'ONCOGENIC') {
                    if (evidence.articles) {
                        datum.oncogenicRefs = evidence.articles;
                    }
                } else if (evidence.evidenceType === 'MUTATION_EFFECT') {
                    let _datum: any = {};
                    if (evidence.knownEffect) {
                        _datum.knownEffect = evidence.knownEffect;
                    }
                    if (evidence.articles) {
                        _datum.refs = evidence.articles;
                    }
                    if (description) {
                        _datum.description = description;
                    }
                    datum.alteration.push(_datum);
                } else if (evidence.levelOfEvidence) {
                    //if evidence has level information, that means this is treatment evidence.
                    if ([LevelOfEvidence.LEVEL_0].indexOf(evidence.levelOfEvidence) === -1) {
                        var _treatment: any = {};
                        _treatment.alterations = evidence.alterations;
                        _treatment.articles = evidence.articles;
                        _treatment.tumorType = getTumorTypeFromEvidence(evidence);
                        _treatment.level = evidence.levelOfEvidence;
                        _treatment.content = evidence.treatments;
                        _treatment.description = description || '';

                        if (LEVELS.sensitivity.indexOf(getLevel(evidence.levelOfEvidence)) !== -1) {
                            sensitivityTreatments.push(_treatment);
                        } else {
                            resistanceTreatments.push(_treatment);
                        }
                    }
                }
            });

            if (datum.alteration.length > 0) {
                datum.mutationEffect = datum.alteration[0];
            }

            datum.treatments.sensitivity = sensitivityTreatments;
            datum.treatments.resistance = resistanceTreatments;
            // id.split('*ONCOKB*').forEach(function(_id) {
            //     result[_id] = datum;
            // })
            result[id] = datum;
        });
    }

    return result;
}

export function getTumorTypeFromEvidence(evidence: any) {
    var tumorType = _.isObject(evidence.tumorType)
        ? evidence.tumorType.name
        : evidence.subtype || evidence.cancerType;
    var oncoTreeTumorType = '';

    if (_.isObject(evidence.oncoTreeType)) {
        oncoTreeTumorType = evidence.oncoTreeType.name
            ? evidence.oncoTreeType.name
            : evidence.oncoTreeType.mainType
            ? evidence.oncoTreeType.mainType.name
            : '';
    }

    if (oncoTreeTumorType) {
        tumorType = oncoTreeTumorType;
    }

    return tumorType;
}

function getLevel(level: string) {
    if (level) {
        var _level = level.match(/LEVEL_(R?\d[AB]?)/);
        if (_level instanceof Array && _level.length >= 2) {
            return _level[1];
        } else {
            return level;
        }
    } else {
        return '';
    }
}
