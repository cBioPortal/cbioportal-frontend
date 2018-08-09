import {Mutation} from "../api/generated/CBioPortalAPI";
import * as _ from 'lodash';


type MISSENSE = "missense";
type FRAME_SHIFT_INS = "frame_shift_ins";
type FRAME_SHIFT_DEL = "frame_shift_del";
type FRAMESHIFT = "frameshift";
type NONSENSE = "nonsense";
type SPLICE_SITE = "splice_site";
type NONSTART = "nonstart";
type NONSTOP = "nonstop";
type IN_FRAME_DEL = "in_frame_del";
type IN_FRAME_INS = "in_frame_ins";
type INFRAME = "inframe";
type TRUNCATING = "truncating";
type FUSION = "fusion";
type SILENT = "silent";
type OTHER = "other";

export type CanonicalMutationType =
    MISSENSE | FRAME_SHIFT_INS | FRAME_SHIFT_DEL | FRAMESHIFT |
        NONSENSE | SPLICE_SITE | NONSTART | NONSTOP | IN_FRAME_DEL |
        IN_FRAME_INS | INFRAME | TRUNCATING | FUSION | SILENT | OTHER;


export type ProteinImpactType =
    MISSENSE | TRUNCATING | INFRAME | OTHER;

const canonicalType:{ [lowerCaseType:string]:CanonicalMutationType } = {
    "missense_mutation": "missense",
    "missense": "missense",
    "missense_variant": "missense",
    "frame_shift_ins": "frame_shift_ins",
    "frame_shift_del": "frame_shift_del",
    "frameshift": "frameshift",
    "frameshift_deletion": "frame_shift_del",
    "frameshift_insertion": "frame_shift_ins",
    "de_novo_start_outofframe": "frameshift",
    "frameshift_variant": "frameshift",
    "nonsense_mutation": "nonsense",
    "nonsense": "nonsense",
    "stopgain_snv": "nonsense",
    "stop_gained": "nonsense",
    "splice_site": "splice_site",
    "splice": "splice_site",
    "splice site": "splice_site",
    "splicing": "splice_site",
    "splice_site_snp": "splice_site",
    "splice_site_del": "splice_site",
    "splice_site_indel": "splice_site",
    "splice_region_variant": "splice_site",
    "splice_region": "splice_site",
    "translation_start_site":  "nonstart",
    "initiator_codon_variant": "nonstart",
    "start_codon_snp": "nonstart",
    "start_codon_del": "nonstart",
    "nonstop_mutation": "nonstop",
    "stop_lost": "nonstop",
    "inframe_del": "in_frame_del",
    "inframe_deletion": "in_frame_del",
    "in_frame_del": "in_frame_del",
    "in_frame_deletion": "in_frame_del",
    "inframe_ins": "in_frame_ins",
    "inframe_insertion": "in_frame_ins",
    "in_frame_ins": "in_frame_ins",
    "in_frame_insertion": "in_frame_ins",
    "indel": "in_frame_del",
    "nonframeshift_deletion": "inframe",
    "nonframeshift": "inframe",
    "nonframeshift insertion": "inframe",
    "nonframeshift_insertion": "inframe",
    "targeted_region": "other",
    "inframe": "inframe",
    "truncating": "truncating",
    "feature_truncation": "truncating",
    "fusion": "fusion",
    "silent": "silent",
    "synonymous_variant": "silent",
    "any": "other",
    "other": "other"
};

export function getProteinImpactType(mutationType:string):ProteinImpactType {
    return getProteinImpactTypeFromCanonical(getCanonicalMutationType(mutationType));
}

export function getProteinImpactTypeFromCanonical(mutationType:CanonicalMutationType):ProteinImpactType {
    switch(mutationType) {
        case "missense":
            return "missense";
        case "frame_shift_ins":
        case "frame_shift_del":
        case "frameshift":
        case "nonsense":
        case "splice_site":
        case "nonstop":
        case "truncating":
            return "truncating";
        case "in_frame_ins":
        case "in_frame_del":
        case "inframe":
            return "inframe";
        case "nonstart":
        case "fusion":
        case "silent":
        case "other":
        default:
            return "other";
    }
}
export default function getCanonicalMutationType(mutationType:string):CanonicalMutationType {
    return canonicalType[mutationType.toLowerCase()];
}

export const CanonicalMutationTypeList: CanonicalMutationType[] = _.chain(canonicalType).values().uniq().value();
