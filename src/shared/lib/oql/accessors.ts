import {Mutation, MolecularProfile, NumericGeneMolecularData} from "../../api/generated/CBioPortalAPI";
import * as _ from 'lodash';

var cna_profile_data_to_string: any = {
    "-2": "homdel",
    "-1": "hetloss",
    "0": null,
    "1": "gain",
    "2": "amp"
};

export type SimplifiedMutationType =
    "missense" | "frameshift" | "nonsense" | "splice" |
    "nonstart" | "nonstop" | "fusion" | "inframe" | "other";

export function getSimplifiedMutationType(type: string):SimplifiedMutationType {
    let ret:SimplifiedMutationType;
    type = (typeof type === "string") ? type.toLowerCase() : "";
    switch (type) {
        case "missense_mutation":
        case "missense":
        case "missense_variant":
            ret = "missense";
            break;
        case "frame_shift_ins":
        case "frame_shift_del":
        case "frameshift":
        case "frameshift_deletion":
        case "frameshift_insertion":
        case "de_novo_start_outofframe":
        case "frameshift_variant":
            ret = "frameshift";
            break;
        case "nonsense_mutation":
        case "nonsense":
        case "stopgain_snv":
            ret = "nonsense";
            break;
        case "splice_site":
        case "splice":
        case "splice site":
        case "splicing":
        case "splice_site_snp":
        case "splice_site_del":
        case "splice_site_indel":
        case "splice_region":
            ret = "splice";
            break;
        case "translation_start_site":
        case "start_codon_snp":
        case "start_codon_del":
            ret = "nonstart";
            break;
        case "nonstop_mutation":
            ret = "nonstop";
            break;
        case "fusion":
            ret = "fusion";
            break;
        case "in_frame_del":
        case "in_frame_ins":
        case "in_frame_deletion":
        case "in_frame_insertion":
        case "indel":
        case "nonframeshift_deletion":
        case "nonframeshift":
        case "nonframeshift insertion":
        case "nonframeshift_insertion":
            ret = "inframe";
            break;
        default:
            ret = "other";
            break;
    }
    return ret;
};

export default class accessors {
    private molecularProfileIdToMolecularProfile:{[molecularProfileId:string]:MolecularProfile};

    constructor(molecularProfiles: MolecularProfile[]) {
        this.molecularProfileIdToMolecularProfile = _.keyBy(molecularProfiles, p=>p.molecularProfileId);
    }

    public gene(d: Mutation) {
        return d.gene.hugoGeneSymbol;
    }

    public molecularAlterationType(molecularProfileId:string) {
        const profile = this.molecularProfileIdToMolecularProfile[molecularProfileId];
        return profile && profile.molecularAlterationType;
    }

    public cna(d: NumericGeneMolecularData) {
        if (this.molecularAlterationType(d.molecularProfileId) === 'COPY_NUMBER_ALTERATION') {
            return cna_profile_data_to_string[d.value];
        } else {
            return null;
        }
    }

    public mut_type(d: Mutation) {
        if (this.molecularAlterationType(d.molecularProfileId) === 'MUTATION_EXTENDED') {
            if (d.mutationType && d.mutationType.toLowerCase() === "fusion") {
                return null;
            } else if (d.proteinChange && d.proteinChange.toLowerCase() === "promoter") {
                return "promoter";
            } else {
                return getSimplifiedMutationType(d.mutationType);
            }
        } else {
            return null;
        }
    }

    public mut_position(d: Mutation) {
        if (this.molecularAlterationType(d.molecularProfileId) === 'MUTATION_EXTENDED') {
            var start = d.proteinPosStart;
            var end = d.proteinPosEnd;
            if (start !== null && end !== null) {
                return [start, end];
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    public mut_amino_acid_change(d: Mutation) {
        if (this.molecularAlterationType(d.molecularProfileId) === 'MUTATION_EXTENDED') {
            return d.proteinChange;
        } else {
            return null;
        }
    }

    public exp(d: NumericGeneMolecularData) {
        if (this.molecularAlterationType(d.molecularProfileId) === 'MRNA_EXPRESSION') {
            return d.value;
        } else {
            return null;
        }
    }

    public prot(d: NumericGeneMolecularData) {
        if (this.molecularAlterationType(d.molecularProfileId) === 'PROTEIN_LEVEL') {
            return d.value;
        } else {
            return null;
        }
    }

    public fusion(d: Mutation) {
        return (getSimplifiedMutationType(d.mutationType) === "fusion") ? true : null;
    }


}
