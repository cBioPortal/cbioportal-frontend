import {observable} from "mobx";
import AppConfig from "appConfig";
import {default as OncoprinterStore} from "./OncoprinterStore";
import _ from "lodash";
import {GeneticTrackDatum, GeneticTrackDatum_Data,} from "../../../../shared/components/oncoprint/Oncoprint";
import {percentAltered} from "../../../../shared/components/oncoprint/OncoprintUtils";
import {AlterationTypeConstants} from "../../../resultsView/ResultsViewPageStore";
import {cna_profile_data_to_string} from "../../../../shared/lib/oql/AccessorsForOqlFilter";
import {fillGeneticTrackDatum, OncoprintMutationType} from "../../../../shared/components/oncoprint/DataUtils";
import {Gene, Mutation, NumericGeneMolecularData} from "../../../../shared/api/generated/CBioPortalAPI";
import {getProteinPositionFromProteinChange} from "../../../../shared/lib/ProteinChangeUtils";
import OncoKbAPI, {Query} from "../../../../shared/api/generated/OncoKbAPI";
import {ONCOKB_DEFAULT, queryOncoKbData} from "../../../../shared/lib/StoreUtils";
import {generateQueryVariant, generateQueryVariantId} from "../../../../shared/lib/OncoKbUtils";
import {default as oncokbClient} from "../../../../shared/api/oncokbClientInstance";
import {IOncoKbData} from "../../../../shared/model/OncoKB";
import MobxPromise from "mobxpromise";
import {getOncoKbOncogenic} from "../../../resultsView/ResultsViewPageStoreUtils";
import {mutationCountByPositionKey} from "../../../resultsView/mutationCountHelpers";
import {getAlterationString} from "../../../../shared/lib/CopyNumberUtils";

export type OncoprinterGeneticTrackDatum =
    Pick<GeneticTrackDatum, "trackLabel" | "study_id" | "uid" |
                            "disp_mut" | "disp_cna" | "disp_mrna" | "disp_prot" | "disp_fusion" | "disp_germ"> & { sample:string, data:OncoprinterGeneticTrackDatum_Data[]} ;

export type OncoprinterGeneticTrackDatum_Data =
    GeneticTrackDatum_Data & Pick<Partial<Mutation>, "proteinPosStart" | "proteinPosEnd" | "startPosition" | "endPosition">;

type OncoprinterGeneticTrackSpec = {
    key: string; // for efficient diffing, just like in React. must be unique
    label: string;
    info: string;
    data: OncoprinterGeneticTrackDatum[];
};

export type OncoprinterInputLineType1 = {
    sampleId:string;
}
export type OncoprinterInputLineType2 = OncoprinterInputLineType1 & {
    hugoGeneSymbol:string;
    alteration:OncoprintMutationType | "amp" | "homdel" | "gain" | "hetloss" | "mrnaUp" | "mrnaDown" | "protUp" | "protDown";
    proteinChange?:string; // optional parameter: protein change
};
/* Leaving commented only for reference, this will be replaced by unified input strategy
export type OncoprinterInputLineType3_Incomplete = OncoprinterInputLineType1 & {
    cancerType:string;
    proteinChange: string;
    mutationType: string;
    chromosome:string;
    startPosition:number;
    endPosition:number;
    referenceAllele:string;
    variantAllele:string;
};

export type OncoprinterInputLineType3 = OncoprinterInputLineType3_Incomplete & {
    hugoGeneSymbol: string,
    isHotspot:boolean
}; // we get both of these from GenomeNexus using the data from the Incomplete line

export type OncoprinterInputLineIncomplete = OncoprinterInputLineType1 | OncoprinterInputLineType2 | OncoprinterInputLineType3_Incomplete;
*/

export type OncoprinterInputLine = OncoprinterInputLineType1 | OncoprinterInputLineType2;

export function isType2(inputLine:OncoprinterInputLine):inputLine is OncoprinterInputLineType2 {
    return inputLine.hasOwnProperty("alteration");
}
/* Leaving commented only for reference, this will be replaced by unified input strategy
export function isType3NoGene(inputLine:OncoprinterInputLine):inputLine is OncoprinterInputLineType3_Incomplete {
    return inputLine.hasOwnProperty("chromosome");
}*/

export function initDriverAnnotationSettings(store:OncoprinterStore) {
    return observable({
        cbioportalCount: false,
        cbioportalCountThreshold: 0,
        _oncoKb:true,
        _ignoreUnknown: false,
        hotspots: false, // for now

        set oncoKb(val:boolean) {
            this._oncoKb = val;
        },
        get oncoKb() {
            return AppConfig.serverConfig.show_oncokb && this._oncoKb && !store.didOncoKbFail;
        },
        set ignoreUnknown(val:boolean) {
            this._ignoreUnknown = val;
        },
        get ignoreUnknown() {
            return this._ignoreUnknown && this.driversAnnotated;
        },
        get driversAnnotated() {
            const anySelected = this.oncoKb ||
                this.cbioportalCount || this.hotspots;

            return anySelected;
        }
    });
}

export function getSampleIds(oncoprinterInput:OncoprinterInputLine[]):string[] {
    return _.chain(oncoprinterInput).map(o=>o.sampleId).uniq().value();
}

export function getGeneSymbols(oncoprinterInput:OncoprinterInputLine[]):string[] {
    return (_.chain(oncoprinterInput).filter(o=>isType2(o)) as any).map((o:OncoprinterInputLineType2)=>o.hugoGeneSymbol).value();
}

export async function fetchOncoKbDataForMutations(annotatedGenes:{[entrezGeneId:number]:boolean}|Error,
                                                   data:OncoprinterGeneticTrackDatum_Data[],
                                                   client: OncoKbAPI = oncokbClient)
{
    if (annotatedGenes instanceof Error) {
        return new Error();
    }

    const mutationsToQuery = _.chain(data).filter(m=>!!annotatedGenes[m.entrezGeneId])
        .filter(d=>(d.proteinPosStart !== undefined && d.proteinPosEnd !== undefined))
        .value();

    if (mutationsToQuery.length === 0) {
        return ONCOKB_DEFAULT;
    }

    const queryVariants = _.uniqBy(_.map(mutationsToQuery, (mutation) => {
        return generateQueryVariant(mutation.entrezGeneId,
            null,
            mutation.proteinChange,
            mutation.mutationType,
            mutation.proteinPosStart,
            mutation.proteinPosEnd);
    }), "id");
    return queryOncoKbData(queryVariants, {}, client, "ONCOGENIC");
}

export async function fetchOncoKbDataForCna(annotatedGenes:{[entrezGeneId:number]:boolean}|Error,
                                            data:OncoprinterGeneticTrackDatum_Data[],
                                            client: OncoKbAPI = oncokbClient)
{
    if (annotatedGenes instanceof Error) {
        return new Error();
    }

    const alterationsToQuery = _.chain(data).filter(m=>!!annotatedGenes[m.entrezGeneId])
                                .filter(d=>(d.molecularProfileAlterationType === AlterationTypeConstants.COPY_NUMBER_ALTERATION))
                                .value();

    if (alterationsToQuery.length === 0) {
        return ONCOKB_DEFAULT;
    }
    const queryVariants = _.chain(alterationsToQuery).map((datum: NumericGeneMolecularData) => {
        return generateQueryVariant(datum.entrezGeneId,
            null,
            getAlterationString(datum.value));
    }).uniqBy("id").value() as any as Query[]; // lodash typings not perfect
    return queryOncoKbData(queryVariants, {}, client, "ONCOGENIC");
}

function makeGeneticTrackDatum_Data(oncoprinterInputLine:OncoprinterInputLineType2, hugoGeneSymbolToGene:{[hugoGeneSymbol:string]:Gene}) {
    return makeGeneticTrackDatum_Data_Type2(oncoprinterInputLine, hugoGeneSymbolToGene);
}
/* Leaving commented only for reference, this will be replaced by unified input strategy
function makeGeneticTrackDatum_Data_Type3(oncoprinterInputLine:OncoprinterInputLineType3, hugoGeneSymbolToGene:{[hugoGeneSymbol:string]:Gene}) {
    let ret:Partial<OncoprinterGeneticTrackDatum_Data> = {
        // we'll never set these values - theyre not needed for oncoprinter
        driverFilter:"",
        driverFilterAnnotation:"",
        driverTiersFilter:"",
        driverTiersFilterAnnotation:"",
        mutationStatus: "", // used only for germline

        // we'll update these values later, not in this function
        oncoKbOncogenic: "",
        putativeDriver: false,

        // we set these values now
        hugoGeneSymbol:oncoprinterInputLine.hugoGeneSymbol,
        proteinChange:oncoprinterInputLine.proteinChange,
        molecularProfileAlterationType: AlterationTypeConstants.MUTATION_EXTENDED as any, // type3 line is always mutation
        isHotspot:oncoprinterInputLine.isHotspot,
        mutationType: oncoprinterInputLine.mutationType,
        alterationSubType: getSimplifiedMutationType(oncoprinterInputLine.mutationType),
        value:undefined, // type3 line is always mutation, so this field not needed

        // updated later in function
        entrezGeneId:0,
        proteinPosStart:undefined,
        proteinPosEnd:undefined
    };

    const gene = hugoGeneSymbolToGene[oncoprinterInputLine.hugoGeneSymbol];
    if (gene) {
        // add gene information if it exists
        ret.entrezGeneId = gene.entrezGeneId;
    }
    if (ret.proteinChange) {
        // add protein change information if it exists
        const parsedInfo = getProteinPositionFromProteinChange(ret.proteinChange);
        if (parsedInfo) {
            ret.proteinPosStart = parsedInfo.start;
            ret.proteinPosEnd = parsedInfo.end;
        }
    }

    return ret as OncoprinterGeneticTrackDatum_Data;
}*/

export function makeGeneticTrackDatum_Data_Type2(oncoprinterInputLine:OncoprinterInputLineType2, hugoGeneSymbolToGene:{[hugoGeneSymbol:string]:Gene}) {
    let ret:Partial<OncoprinterGeneticTrackDatum_Data> = {
        // we'll never set these values - theyre not needed for oncoprinter
        driverFilter:"",
        driverFilterAnnotation:"",
        driverTiersFilter:"",
        driverTiersFilterAnnotation:"",
        mutationStatus: "", // used only for germline

        // we'll update these values later, not in this function
        oncoKbOncogenic: "",
        isHotspot:false,
        putativeDriver: false,

        // these are the same always or almost always
        hugoGeneSymbol:oncoprinterInputLine.hugoGeneSymbol,
        proteinChange:oncoprinterInputLine.proteinChange,

        // we'll update these later in this function
        molecularProfileAlterationType: undefined, // the profile type in AlterationTypeConstants
        alterationSubType: "", // up or down or cna_profile_data_to_string[value] or SimplifiedMutationType,
        value:undefined, // numeric cna
        mutationType: "",
        entrezGeneId:0,
        proteinPosStart:undefined,
        proteinPosEnd:undefined
    };

    const gene = hugoGeneSymbolToGene[oncoprinterInputLine.hugoGeneSymbol];
    if (gene) {
        // add gene information if it exists
        ret.entrezGeneId = gene.entrezGeneId;
    }
    if (ret.proteinChange) {
        // add protein change information if it exists
        const parsedInfo = getProteinPositionFromProteinChange(ret.proteinChange);
        if (parsedInfo) {
            ret.proteinPosStart = parsedInfo.start;
            ret.proteinPosEnd = parsedInfo.end;
        }
    }
    switch (oncoprinterInputLine.alteration) {
        case "missense":
            ret = Object.assign(ret, {
                molecularProfileAlterationType: AlterationTypeConstants.MUTATION_EXTENDED,
                alterationSubType:"missense",
                mutationType: "missense_mutation"
            });
            break;
        case "inframe":
            ret = Object.assign(ret, {
                molecularProfileAlterationType: AlterationTypeConstants.MUTATION_EXTENDED,
                alterationSubType:"inframe",
                mutationType: "indel"
            });
            break;
        case "fusion":
            ret = Object.assign(ret, {
                molecularProfileAlterationType: AlterationTypeConstants.MUTATION_EXTENDED,
                mutationType: "fusion",
            });
            break;
        case "promoter":
            ret = Object.assign(ret, {
                molecularProfileAlterationType: AlterationTypeConstants.MUTATION_EXTENDED,
                proteinChange: "promoter",
            });
            break;
        case "trunc":
            ret = Object.assign(ret, {
                molecularProfileAlterationType: AlterationTypeConstants.MUTATION_EXTENDED,
                alterationSubType: "nonsense",
                mutationType: "nonsense"
            });
            break;
        case "other":
            ret = Object.assign(ret, {
                molecularProfileAlterationType: AlterationTypeConstants.MUTATION_EXTENDED,
                alterationSubType: "other"
            });
            break;
        case "amp":
            ret = Object.assign(ret, {
                molecularProfileAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                alterationSubType: cna_profile_data_to_string["2"],
                value:2
            });
            break;
        case "homdel":
            ret = Object.assign(ret, {
                molecularProfileAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                alterationSubType: cna_profile_data_to_string["-2"],
                value:-2
            });
            break;
        case "gain":
            ret = Object.assign(ret, {
                molecularProfileAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                alterationSubType: cna_profile_data_to_string["1"],
                value:1
            });
            break;
        case "hetloss":
            ret = Object.assign(ret, {
                molecularProfileAlterationType: AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                alterationSubType: cna_profile_data_to_string["-1"],
                value:-1
            });
            break;
        case "mrnaUp":
            ret = Object.assign(ret, {
                molecularProfileAlterationType: AlterationTypeConstants.MRNA_EXPRESSION,
                alterationSubType: "up",
            });
            break;
        case "mrnaDown":
            ret = Object.assign(ret, {
                molecularProfileAlterationType: AlterationTypeConstants.MRNA_EXPRESSION,
                alterationSubType: "down",
            });
            break;
        case "protUp":
            ret = Object.assign(ret, {
                molecularProfileAlterationType: AlterationTypeConstants.PROTEIN_LEVEL,
                alterationSubType: "up",
            });
            break;
        case "protDown":
            ret = Object.assign(ret, {
                molecularProfileAlterationType: AlterationTypeConstants.PROTEIN_LEVEL,
                alterationSubType: "down",
            });
            break;
    }
    return ret as OncoprinterGeneticTrackDatum_Data;
}

export function isAltered(d:OncoprinterGeneticTrackDatum) {
    return (d.disp_mut || d.disp_cna || d.disp_mrna || d.disp_prot || d.disp_fusion);
}
function getPercentAltered(data:OncoprinterGeneticTrackDatum[]) {
    const numAltered = _.chain(data).filter(isAltered)
        .size().value();
    return percentAltered(numAltered, data.length);
}

export function getSampleGeneticTrackData(
    oncoprinterInput:OncoprinterInputLine[],
    hugoGeneSymbolToGene:{[hugoGeneSymbol:string]:Gene}
):{[hugoGeneSymbol:string]:{ sampleId:string, data:OncoprinterGeneticTrackDatum_Data[]}[]} {
    const geneToSampleIdToData:{[hugoGeneSymbol:string]:{[sampleId:string]:OncoprinterGeneticTrackDatum["data"]}} = {};

    const type2Lines = oncoprinterInput.filter(d=>(isType2(d))) as OncoprinterInputLineType2[];
    // collect data by gene x sample
    for (const inputLine of type2Lines) {
        if (!(inputLine.hugoGeneSymbol in geneToSampleIdToData)) {
            // add track if it doesnt yet exist
            geneToSampleIdToData[inputLine.hugoGeneSymbol] = {};
        }
        const sampleIdToData = geneToSampleIdToData[inputLine.hugoGeneSymbol];
        if (!(inputLine.sampleId in sampleIdToData)) {
            sampleIdToData[inputLine.sampleId] = [];
        }
        sampleIdToData[inputLine.sampleId].push(makeGeneticTrackDatum_Data(inputLine, hugoGeneSymbolToGene));
    }
    // add missing samples
    for (const inputLine of oncoprinterInput) {
        _.forEach(geneToSampleIdToData, (sampleToData, gene)=>{
            if (!(inputLine.sampleId in sampleToData)) {
                sampleToData[inputLine.sampleId] = [];
            }
        });
    }

    return _.mapValues(geneToSampleIdToData, sampleIdToData=>_.chain(sampleIdToData).map((data, sampleId)=>({ sampleId, data })).value());
}

export function getOncoprintData(
    geneToSampleData:{[hugoGeneSymbol:string]:{ sampleId:string, data:OncoprinterGeneticTrackDatum_Data[]}[]}
):{[hugoGeneSymbol:string]:OncoprinterGeneticTrackDatum[]} {
    return _.mapValues(
        geneToSampleData,
        (sampleData, gene)=>sampleData.map(o=>(
            fillGeneticTrackDatum(
                { sample: o.sampleId, study_id: "", uid: o.sampleId },
                gene, o.data
            ) as OncoprinterGeneticTrackDatum
        ))
    );
}

export function getGeneticTracks(
    geneToOncoprintData:{[hugoGeneSymbol:string]:OncoprinterGeneticTrackDatum[]},
    geneOrder?:string[],
    excludedSampleIds?:string[]
):OncoprinterGeneticTrackSpec[] {
    // remove excluded sample data
    const excludedSampleIdsMap = _.keyBy(excludedSampleIds || []);
    geneToOncoprintData = _.mapValues(geneToOncoprintData, data=>data.filter(d=>!(d.sample in excludedSampleIdsMap)));

    const geneToPercentAltered:{[hugoGeneSymbol:string]:string} = _.mapValues(geneToOncoprintData, getPercentAltered);
    const genes = geneOrder ? geneOrder.filter(gene=>(gene in geneToOncoprintData)) : Object.keys(geneToOncoprintData);
    return genes.map(gene=>({
        key: gene,
        label: gene,
        info: geneToPercentAltered[gene],
        data: geneToOncoprintData[gene]
    }));
}

export function annotateGeneticTrackData(
    geneToSampleData:{[hugoGeneSymbol:string]:{ sampleId:string, data:OncoprinterGeneticTrackDatum_Data[]}[]},
    promisesMap:{
        oncoKbCna:MobxPromise<IOncoKbData|Error>,
        oncoKb?:MobxPromise<IOncoKbData|Error>,
        cbioportalCount?:MobxPromise<{[mutationPositionKey:string]:number}>,
    },
    params:{
        cbioportalCountThreshold?:number;
        useHotspots:boolean;
    },
    ignoreUnknown:boolean
) {
    // build annotater functions
    let getOncoKbCnaAnnotation = (d:OncoprinterGeneticTrackDatum_Data)=>"";
    if (promisesMap.oncoKbCna.isComplete && !(promisesMap.oncoKbCna.result instanceof Error)) {
        const indicatorMap = (promisesMap.oncoKbCna!.result! as IOncoKbData).indicatorMap!;
        getOncoKbCnaAnnotation = (d:OncoprinterGeneticTrackDatum_Data)=>{
            const id = generateQueryVariantId(
                d.entrezGeneId,
                null,
                getAlterationString(d.value)
            );
            const indicator = indicatorMap[id];
            if (indicator) {
                return getOncoKbOncogenic(indicator);
            } else {
                return "";
            }
        };
    }

    let getOncoKbAnnotation = (d:OncoprinterGeneticTrackDatum_Data)=>"";
    if (promisesMap.oncoKb && promisesMap.oncoKb.isComplete && !(promisesMap.oncoKb.result instanceof Error)) {
        const indicatorMap = (promisesMap.oncoKb!.result! as IOncoKbData).indicatorMap!;
        getOncoKbAnnotation = (d:OncoprinterGeneticTrackDatum_Data)=>{
            const id = generateQueryVariantId(
                d.entrezGeneId,
                null,
                d.proteinChange,
                d.mutationType
            );
            const oncoKbIndicator = indicatorMap[id];
            if (oncoKbIndicator) {
                return getOncoKbOncogenic(oncoKbIndicator);
            } else {
                return "";
            }
        };
    }

    let getCBioAnnotation = (d:OncoprinterGeneticTrackDatum_Data)=>false;
    if (promisesMap.cbioportalCount && promisesMap.cbioportalCount.isComplete) {
        const countMap = promisesMap.cbioportalCount!.result!;
        const threshold = params.cbioportalCountThreshold!;
        getCBioAnnotation = (d:OncoprinterGeneticTrackDatum_Data)=>{
            if (d.molecularProfileAlterationType === AlterationTypeConstants.MUTATION_EXTENDED) {
                const key = mutationCountByPositionKey(d as any);
                const count = countMap[key];
                return (threshold <= count);
            } else {
                return false;
            }
        };
    }

    return _.mapValues(geneToSampleData, (sampleData, gene)=>{
        return sampleData.map(object=>{
            const newObj = _.clone(object);
            newObj.data = newObj.data.filter(d=>{
                // clear previous annotations
                delete d.oncoKbOncogenic;
                delete d.putativeDriver;
                // annotate and filter out if necessary
                switch(d.molecularProfileAlterationType) {
                    case AlterationTypeConstants.COPY_NUMBER_ALTERATION:
                        d.oncoKbOncogenic = getOncoKbCnaAnnotation(d);
                        break;
                    case AlterationTypeConstants.MUTATION_EXTENDED:
                        d.oncoKbOncogenic = getOncoKbAnnotation(d);
                        break;
                }
                if (d.molecularProfileAlterationType === AlterationTypeConstants.MUTATION_EXTENDED) {
                    // tag mutations as putative driver, and filter them
                    d.putativeDriver = !!(d.oncoKbOncogenic || (params.useHotspots && d.isHotspot) || getCBioAnnotation(d));
                    return (!ignoreUnknown || d.putativeDriver);
                } else {
                    return true;
                }
            });
            return newObj;
        }, []);
    });
}

export function parseInput(input:string):{status:"complete", result:OncoprinterInputLine[], error:undefined}|{status:"error", result:undefined, error:string} {
    const lines = input.trim().split("\n").map(line=>line.split(/[\t]/));
    if (_.isEqual(lines[0], ["Sample", "Gene", "Alteration", "Type"])) {
        lines.shift(); // skip header line
    }
    try {
        const result = lines.map((line, lineIndex)=>{
            const errorPrefix = `Data input error on line ${lineIndex}: `;
            if (line.length === 1) {
                // Type 1 line
                return { sampleId: line[0] };
            } else if (line.length === 4) {
                // Type 2 line
                const sampleId = line[0];
                const hugoGeneSymbol = line[1];
                const alteration = line[2];
                const lcAlteration = alteration.toLowerCase();
                const type = line[3].toLowerCase();
                let ret:Partial<OncoprinterInputLineType2> = { sampleId, hugoGeneSymbol };

                switch (type) {
                    case "cna":
                        if (["amp", "gain", "hetloss", "homdel"].indexOf(lcAlteration) === -1) {
                            throw new Error(`${errorPrefix}Alteration must be "AMP", "GAIN" ,"HETLOSS", or "HOMDEL" if Type is "CNA"`);
                        }
                        ret.alteration = lcAlteration as "amp"|"gain"|"hetloss"|"homdel";
                        break;
                    case "exp":
                        if (lcAlteration === "up") {
                            ret.alteration = "mrnaUp";
                        } else if (lcAlteration === "down") {
                            ret.alteration = "mrnaDown";
                        } else {
                            throw new Error(`${errorPrefix}Alteration must be "UP" or "DOWN" if Type is "EXP"`);
                        }
                        break;
                    case "prot":
                        if (lcAlteration === "up") {
                            ret.alteration = "protUp";
                        } else if (lcAlteration === "down") {
                            ret.alteration = "protDown";
                        } else {
                            throw new Error(`${errorPrefix}Alteration must be "UP" or "DOWN" if Type is "PROT"`);
                        }
                        break;
                    default:
                        // everything else is a mutation
                        if (["missense", "inframe", "fusion", "promoter", "trunc", "other"].indexOf(type) === -1) {
                            if (lcAlteration === "fusion") {
                                throw new Error(`${errorPrefix}Type must be "FUSION" if Alteration is "FUSION"`);
                            } else {
                                throw new Error(`${errorPrefix}Type must be "MISSENSE", "INFRAME", "TRUNC", "PROMOTER", or "OTHER" for a mutation alteration.`);
                            }
                        }
                        ret.alteration = type as OncoprintMutationType;
                        ret.proteinChange = alteration;
                }
                return ret as OncoprinterInputLineType2;
            } else {
                throw new Error(`${errorPrefix}input lines must have either 1 or 4 columns.`);
            }
        });
        return {
            status: "complete",
            result,
            error:undefined
        };
    } catch (e) {
        return {
            status:"error",
            result:undefined,
            error:e.message
        };
    }
}