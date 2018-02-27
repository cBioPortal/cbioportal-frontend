import {IndicatorQueryResp} from "shared/api/generated/OncoKbAPI";
import * as _ from 'lodash';

export function emptyQueryIndicator(): IndicatorQueryResp
{
    return {
        alleleExist: false,
        dataVersion: "",
        geneExist: false,
        geneSummary: "",
        highestResistanceLevel: "LEVEL_R3",
        highestSensitiveLevel: "LEVEL_4",
        hotspot: false,
        lastUpdate: "",
        mutationEffect: {
            description: "",
            knownEffect: "",
            citations: {
                abstracts: [],
                pmids: []
            }
        },
        oncogenic: "",
        otherSignificantResistanceLevels: [],
        otherSignificantSensitiveLevels: [],
        query: {
            alteration: "",
            alterationType: "",
            consequence: "",
            entrezGeneId: -1,
            hugoSymbol: "",
            id: "",
            proteinEnd: -1,
            proteinStart: -1,
            tumorType: "",
            type: "web",
            hgvs: "",
            svType: "DELETION" // TODO: hack because svType is not optional
        },
        treatments: [],
        tumorTypeSummary: "",
        variantExist: false,
        variantSummary: "",
        vus: false
    };
}

export function initQueryIndicator(props:{[key:string]: any}): IndicatorQueryResp
{
    return _.merge(emptyQueryIndicator(), props);
}
