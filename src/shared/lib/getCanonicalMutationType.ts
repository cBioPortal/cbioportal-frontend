import {Mutation} from "../api/generated/CBioPortalAPI";

export type CanonicalMutationType =
    "missense" | "frame_shift_ins" | "frame_shift_del" | "frameshift" |
        "nonsense" | "splice_site" | "nonstart" | "nonstop" | "in_frame_del" |
        "in_frame_ins" | "inframe" | "truncating" | "fusion" | "silent" | "other";

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
    "translation_start_site":  "nonstart",
    "initiator_codon_variant": "nonstart",
    "start_codon_snp": "nonstart",
    "start_codon_del": "nonstart",
    "nonstop_mutation": "nonstop",
    "stop_lost": "nonstop",
    "in_frame_del": "in_frame_del",
    "in_frame_deletion": "in_frame_del",
    "in_frame_ins": "in_frame_ins",
    "in_frame_insertion": "in_frame_ins",
    "indel": "in_frame_del",
    "nonframeshift_deletion": "inframe",
    "nonframeshift": "inframe",
    "nonframeshift insertion": "inframe",
    "nonframeshift_insertion": "inframe",
    "targeted_region": "inframe",
    "inframe": "inframe",
    "truncating": "truncating",
    "feature_truncation": "truncating",
    "fusion": "fusion",
    "silent": "silent",
    "synonymous_variant": "silent",
    "any": "other",
    "other": "other"
};

export default function getCanonicalMutationType(mutationType:string):CanonicalMutationType {
    return canonicalType[mutationType.toLowerCase()];
}
  