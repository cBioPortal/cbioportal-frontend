import * as _ from 'lodash';
import {Query, EvidenceQueries, EvidenceQueryRes, Evidence, IndicatorQueryResp} from "shared/api/generated/OncoKbAPI";

/**
 * @author Selcuk Onur Sumer
 * @author Hongxin Zhang
 */

// oncogenic value => oncogenic class name
const ONCOGENIC_CLASS_NAMES:{[oncogenic:string]: string} = {
    'Likely Neutral': 'likely-neutral',
    'Unknown': 'unknown-oncogenic',
    'Inconclusive': 'unknown-oncogenic',
    'Predicted Oncogenic': 'oncogenic',
    'Likely Oncogenic': 'oncogenic',
    'Oncogenic': 'oncogenic',
};

// oncogenic value => score
// (used for sorting purposes)
const ONCOGENIC_SCORE:{[oncogenic:string]: number} = {
    'Unknown': 1,
    'Inconclusive': 1,
    'Likely Neutral': 3,
    'Predicted Oncogenic': 5,
    'Likely Oncogenic': 5,
    'Oncogenic': 5
};

// sensitivity level => score
// (used for sorting purposes)
const SENSITIVITY_LEVEL_SCORE:{[level:string]: number} = {
    '4': 1,
    '3B': 2,
    '3A': 3,
    '2B': 4,
    '2A': 5,
    '1': 6
};

// resistance level <-> score
// (used for sorting purposes)
const RESISTANCE_LEVEL_SCORE:{[level:string]: number} = {
    'R3': 1,
    'R2': 2,
    'R1': 3,
};

// portal consquence (mutation type) => OncoKB consequence
const CONSEQUENCE_MATRIX:{[consequence:string]: string[]} = {
    '3\'Flank': ['any'],
    '5\'Flank ': ['any'],
    'Targeted_Region': ['inframe_deletion', 'inframe_insertion'],
    'COMPLEX_INDEL': ['inframe_deletion', 'inframe_insertion'],
    'ESSENTIAL_SPLICE_SITE': ['feature_truncation'],
    'Exon skipping': ['inframe_deletion'],
    'Frameshift deletion': ['frameshift_variant'],
    'Frameshift insertion': ['frameshift_variant'],
    'FRAMESHIFT_CODING': ['frameshift_variant'],
    'Frame_Shift_Del': ['frameshift_variant'],
    'Frame_Shift_Ins': ['frameshift_variant'],
    'Fusion': ['fusion'],
    'Indel': ['frameshift_variant', 'inframe_deletion', 'inframe_insertion'],
    'In_Frame_Del': ['inframe_deletion'],
    'In_Frame_Ins': ['inframe_insertion'],
    'Missense': ['missense_variant'],
    'Missense_Mutation': ['missense_variant'],
    'Nonsense_Mutation': ['stop_gained'],
    'Nonstop_Mutation': ['stop_lost'],
    'Splice_Site': ['splice_region_variant'],
    'Splice_Site_Del': ['splice_region_variant'],
    'Splice_Site_SNP': ['splice_region_variant'],
    'splicing': ['splice_region_variant'],
    'Translation_Start_Site': ['start_lost'],
    'vIII deletion': ['any']
};

const LEVELS = {
    sensitivity: ['4', '3B', '3A', '2B', '2A', '1', '0'],
    resistance: ['R3', 'R2', 'R1'],
    all: ['4', 'R3', '3B', '3A', 'R2', '2B', '2A', 'R1', '1', '0']
};

export enum AlterationTypes {
    Mutation = 0
}

export function generateIdToIndicatorMap(data:IndicatorQueryResp[]): {[queryId:string]: IndicatorQueryResp}
{
    const map:{[queryId:string]: IndicatorQueryResp} = {};

    _.each(data, function(indicator) {
        map[indicator.query.id] = indicator;
    });

    return map;
}

export function generateEvidenceQuery(queryVariants:Query[]): EvidenceQueries
{
    return {
        evidenceTypes: "GENE_SUMMARY,GENE_BACKGROUND,ONCOGENIC,MUTATION_EFFECT,VUS,STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_SENSITIVITY,STANDARD_THERAPEUTIC_IMPLICATIONS_FOR_DRUG_RESISTANCE,INVESTIGATIONAL_THERAPEUTIC_IMPLICATIONS_DRUG_SENSITIVITY",
        highestLevelOnly: false,
        levels: ['LEVEL_1', 'LEVEL_2A', 'LEVEL_2B', 'LEVEL_3A', 'LEVEL_3B', 'LEVEL_4', 'LEVEL_R1'],
        queries: queryVariants,
        source: "cbioportal"
    };
}

export function generateQueryVariant(entrezGeneId:number,
                                     tumorType:string,
                                     alteration?:string,
                                     mutationType?:string,
                                     proteinPosStart?:number,
                                     proteinPosEnd?:number,
                                     alterationType?:string): Query
{
    return {
        id: generateQueryVariantId(entrezGeneId, tumorType, alteration, mutationType),
        hugoSymbol: '',
        tumorType,
        alterationType: alterationType || AlterationTypes[AlterationTypes.Mutation],
        entrezGeneId: entrezGeneId,
        alteration: alteration || "",
        consequence: convertConsequence(mutationType || ""),
        proteinStart: proteinPosStart === undefined ? -1 : proteinPosStart,
        proteinEnd: proteinPosEnd === undefined ? -1 : proteinPosEnd,
        type: "web",
        hgvs: ""
    };
}

export function generateQueryVariantId(entrezGeneId:number,
                                       tumorType:string,
                                       alteration?:string,
                                       mutationType?:string): string
{
    let id = `${entrezGeneId}_${tumorType}`;

    if (alteration) {
        id = `${id}_${alteration}`;
    }

    if (mutationType) {
        id = `${id}_${mutationType}`;
    }

    return id.trim().replace(/\s/g, "_");
}

// TODO evidence:IEvidence
export function extractPmids(evidence:any)
{
    let refs:number[] = [];

    if (evidence.mutationEffect &&
        evidence.mutationEffect.refs &&
        evidence.mutationEffect.refs.length > 0)
    {
        refs = refs.concat(evidence.mutationEffect.refs.map((article:any) => {
            return Number(article.pmid);
        }));
    }

    if (evidence.oncogenicRefs &&
        evidence.oncogenicRefs.length > 0)
    {
        refs = refs.concat(evidence.oncogenicRefs.map((article:any) => {
            return Number(article.pmid);
        }));
    }

    if (evidence.treatments &&
        _.isArray(evidence.treatments.sensitivity))
    {
        evidence.treatments.sensitivity.forEach((item:any) => {
            if (_.isArray(item.articles))
            {
                refs = refs.concat(item.articles.map((article:any) => {
                    return Number(article.pmid);
                }));
            }
        });
    }

    if (evidence.treatments &&
        _.isArray(evidence.treatments.resistance))
    {
        evidence.treatments.resistance.forEach((item:any) => {
            if (_.isArray(item.articles))
            {
                refs = refs.concat(item.articles.map((article:any) => {
                    return Number(article.pmid);
                }));
            }
        });
    }

    return refs;
}

export function normalizeLevel(level:string):string|null
{
    if (level)
    {
        const matchArray = level.match(/LEVEL_(R?\d[AB]?)/);

        if (matchArray && matchArray.length >= 2) {
            return matchArray[1];
        }
        else {
            return level;
        }
    }
    else {
        return null;
    }
}

export function oncogenicImageClassNames(oncogenic:string,
                                         isVUS:boolean,
                                         highestSensitiveLevel:string,
                                         highestResistanceLevel:string):string[]
{
    const classNames = ["", ""];

    const sl = normalizeLevel(highestSensitiveLevel);
    const rl = normalizeLevel(highestResistanceLevel);

    if (!rl && sl)
    {
        classNames[0] = 'level' + sl;
    }
    else if (rl && !sl)
    {
        classNames[0] = 'level' + rl;
    }
    else if (rl && sl)
    {
        classNames[0] = 'level' + sl + 'R';
    }

    classNames[1] = ONCOGENIC_CLASS_NAMES[oncogenic] || "no-info-oncogenic";

    if(classNames[1] === 'no-info-oncogenic' && isVUS)
    {
        classNames[1] = 'vus';
    }

    return classNames;
}

export function calcOncogenicScore(oncogenic:string, isVus:boolean)
{
    let score:number = ONCOGENIC_SCORE[oncogenic] || 0;

    if (isVus && score === 0) {
        score += 0.5;
    }

    return score;
}

export function calcSensitivityLevelScore(level:string)
{
    return SENSITIVITY_LEVEL_SCORE[normalizeLevel(level) || ""] || 0;
}

export function calcResistanceLevelScore(level:string)
{
    return RESISTANCE_LEVEL_SCORE[normalizeLevel(level) || ""] || 0;
}

/**
 * Convert cBioPortal consequence to OncoKB consequence
 *
 * @param consequence cBioPortal consequence
 * @returns
 */
export function convertConsequence(consequence:string)
{
    if (consequence in CONSEQUENCE_MATRIX &&
        CONSEQUENCE_MATRIX.hasOwnProperty(consequence))
    {
        return CONSEQUENCE_MATRIX[consequence].join(',');
    }
    else {
        return 'any';
    }
}

export function initEvidence()
{
    return {
        id: '',
        gene: {},
        alteration: [],
        prevalence: [],
        progImp: [],
        treatments: {
            sensitivity: [],
            resistance: []
        }, //separated by level type
        trials: [],
        oncogenic: '',
        oncogenicRefs: [],
        mutationEffect: {},
        mutationEffectRefs: [],
        summary: '',
        drugs: {
            sensitivity: {
                current: [],
                inOtherTumor: []
            },
            resistance: []
        }
    };
}

export function processEvidence(evidences:EvidenceQueryRes[]) {
    var result:any = {}; //id based.
    if (evidences && evidences.length > 0) {
        evidences.forEach(function(record) {
            var id = record.query.id;
            let datum:any = initEvidence(); // TODO define an extended evidence model?
            var hasHigherLevelEvidence = false;
            var sensitivityTreatments:any = [];
            var resistanceTreatments:any = [];

            let evidenceArr: Evidence[] = [];
            evidenceArr = evidenceArr.concat(record.evidences);

            evidenceArr.forEach(function(evidence:any) {
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
                    let _datum:any = {};
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
                    if (['LEVEL_0'].indexOf(evidence.levelOfEvidence) === -1) {
                        var _treatment:any = {};
                        _treatment.alterations = evidence.alterations;
                        _treatment.articles = evidence.articles;
                        _treatment.tumorType = getTumorTypeFromEvidence(evidence);
                        _treatment.level = evidence.levelOfEvidence;
                        _treatment.content = evidence.treatments;
                        _treatment.description = description || 'No yet curated';

                        if (LEVELS.sensitivity.indexOf(getLevel(evidence.levelOfEvidence)) !== -1) {
                            sensitivityTreatments.push(_treatment);
                        } else {
                            resistanceTreatments.push(_treatment);
                        }

                        if (_treatment.level === 'LEVEL_1' || _treatment.level === 'LEVEL_2A') {
                            hasHigherLevelEvidence = true;
                        }
                    }
                }
            });

            if (datum.alteration.length > 0) {
                datum.mutationEffect = datum.alteration[0];
            }

            if (hasHigherLevelEvidence) {
                sensitivityTreatments.forEach(function(treatment:any, index:number) {
                    if (treatment.level !== 'LEVEL_2B') {
                        datum.treatments.sensitivity.push(treatment);
                    }
                });
            } else {
                datum.treatments.sensitivity = sensitivityTreatments;
            }
            datum.treatments.resistance = resistanceTreatments;
            datum.treatments.sensitivity.forEach(function(treatment:any, index:number) {
                if (treatment.level === 'LEVEL_2B') {
                    datum.drugs.sensitivity.inOtherTumor.push(treatment);
                } else if (treatment.level === 'LEVEL_2A' || treatment.level === 'LEVEL_1') {
                    datum.drugs.sensitivity.current.push(treatment);
                }
            });
            datum.treatments.resistance.forEach(function(treatment:any, index:number) {
                if (treatment.level === 'LEVEL_R1') {
                    datum.drugs.resistance.push(treatment);
                }
            });
            // id.split('*ONCOKB*').forEach(function(_id) {
            //     result[_id] = datum;
            // })
            result[id] = datum;
        });
    }

    return result;
}

export function getTumorTypeFromEvidence(evidence:any) {
    var tumorType = _.isObject(evidence.tumorType) ? evidence.tumorType.name : (evidence.subtype || evidence.cancerType);
    var oncoTreeTumorType = '';

    if(_.isObject(evidence.oncoTreeType)) {
        oncoTreeTumorType = evidence.oncoTreeType.subtype ? evidence.oncoTreeType.subtype : evidence.oncoTreeType.cancerType;
    }

    if(oncoTreeTumorType) {
        tumorType = oncoTreeTumorType;
    }

    return tumorType;
}

export function generateOncogenicCitations(oncogenicRefs:any):number[]
{
    return _.isArray(oncogenicRefs) ?
        _.map(oncogenicRefs, (article:any) => {
            return Number(article.pmid);
        }).sort() : [];
}

export function generateMutationEffectCitations(mutationEffectRefs:any):number[]
{
    return _.isArray(mutationEffectRefs) ?
        _.map(mutationEffectRefs, (article:any) => {
            return Number(article.pmid);
        }).sort() : [];
}

export function generateTreatments(evidenceTreatments:any)
{
    var treatments: any = {};
    var result: any[] = [];

    _.each(evidenceTreatments, function(content, type) {
        _.each(content, function(item, index) {
            var _level = getLevel(item.level);
            var _treatment = treatmentsToStr(item.content);
            var _tumorType = item.tumorType;
            var _alterations = item.alterations.map(function(alt:any) {
                return alt.alteration;
            }).join(',');
            if (!treatments.hasOwnProperty(_level)) {
                treatments[_level] = {};
            }
            if (!treatments[_level].hasOwnProperty(_alterations)) {
                treatments[_level][_alterations] = {};
            }

            if (!treatments[_level][_alterations].hasOwnProperty(_treatment)) {
                treatments[_level][_alterations][_treatment] = {};
            }

            if (!treatments[_level][_alterations][_treatment].hasOwnProperty(_tumorType)) {
                treatments[_level][_alterations][_treatment][_tumorType] = {
                    articles: [],
                    tumorType: _tumorType,
                    alterations: item.alterations,
                    level: _level,
                    treatment: _treatment
                };
            }
            treatments[_level][_alterations][_treatment][_tumorType].articles = _.union(treatments[_level][_alterations][_treatment][_tumorType].articles, item.articles);
        });
    });

    _.each(_.keys(treatments).sort(function(a, b) {
        return LEVELS.all.indexOf(a) > LEVELS.all.indexOf(b) ? -1 : 1;
    }), function(level) {
        _.each(_.keys(treatments[level]).sort(), function(_alteration) {
            _.each(_.keys(treatments[level][_alteration]).sort(), function(_treatment) {
                _.each(_.keys(treatments[level][_alteration][_treatment]).sort(), function(_tumorType) {
                    var content = treatments[level][_alteration][_treatment][_tumorType];
                    result.push({
                        level: content.level,
                        variant: content.alterations.map(function(alteration:any) {
                            return alteration.alteration;
                        }),
                        treatment: _treatment,
                        pmids: content.articles.filter(function(article:any) {
                            return !isNaN(article.pmid);
                        }).map(function(article:any) {
                            return Number(article.pmid);
                        }).sort(),
                        abstracts: content.articles.filter(function(article:any) {
                            return _.isString(article.abstract);
                        }).map(function(article:any) {
                            return {
                                abstract: article.abstract,
                                link: article.link
                            };
                        }),
                        cancerType: content.tumorType
                    });
                });
            });
        });
    });

    return result;
}

function treatmentsToStr(data:any[]) {
    if (_.isArray(data)) {
        var treatments:any[] = [];

        data.forEach(function(treatment:any) {
            treatments.push(drugToStr((treatment.drugs)));
        });

        return treatments.join(', ');
    }
    else {
        return "";
    }
}

function drugToStr(data:any) {
    var drugs:any[] = [];

    data.forEach(function(drug:any) {
        drugs.push(drug.drugName);
    });

    return drugs.join('+');
}

function getLevel(level:string) {
    if (level) {
        var _level = level.match(/LEVEL_(R?\d[AB]?)/);
        if (_level instanceof Array && _level.length >= 2) {
            return _level[1];
        } else {
            return level;
        }
    } else {
        return "";
    }
}

function getNumberLevel(level:string) {
    if (level) {
        var _level = level.match(/LEVEL_R?(\d)[AB]?/);
        if (_level instanceof Array && _level.length >= 2) {
            return _level[1];
        } else {
            return level;
        }
    } else {
        return "";
    }
}

/**
 * Return combined alterations name, separated by comma.
 * Same location variant will be truncated into AALocationAllele e.g. V600E/K
 *
 * @param {Array} alterations - List of alterations
 * @return {string} - Truncated alteration name
 */
export function mergeAlterations(alterations:string|string[])
{
    var positions:any = {};
    var regular:any[] = [];
    var regExp = new RegExp('^([A-Z])([0-9]+)([A-Z]$)');

    if (_.isString(alterations)) {
        return alterations;
    }

    _.each(alterations, function(alteration) {
        var result = regExp.exec(alteration);
        if (_.isArray(result) && result.length === 4) {
            if (!positions.hasOwnProperty(result[2])) {
                positions[result[2]] = {};
            }
            if (!positions[result[2]].hasOwnProperty(result[1])) {
                // Avoid duplication, use object instead of array
                positions[result[2]][result[1]] = {};
            }
            positions[result[2]][result[1]][result[3]] = 1;
        } else {
            regular.push(alteration);
        }
    });

    _.each(_.keys(positions).map(function(e) {
        return Number(e);
    }).sort(), function(position) {
        _.each(_.keys(positions[position]).sort(), function(aa) {
            regular.push(aa + position + _.keys(positions[position][aa]).sort().join('/'));
        });
    });
    return regular.join(', ');
}
