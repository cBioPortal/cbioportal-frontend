import {Mutation, MolecularProfile, GeneMolecularData} from "../../api/generated/CBioPortalAPI";
import * as _ from 'lodash';

var cna_profile_data_to_string: any = {
    "-2": "homdel",
    "-1": "hetloss",
    "0": null,
    "1": "gain",
    "2": "amp"
};


var getSimplifiedMutationType = function (type: string) {
    var ret = null;
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
        case "indel":
        case "nonframeshift_deletion":
        case "nonframeshift":
        case "nonframeshift insertion":
        case "nonframeshift_insertion":
        case "targeted_region":
            ret = "inframe";
            break;
        default:
            ret = "other";
            break;
    }
    return ret;
};

export default class accessors {

    constructor(public geneticProfiles: MolecularProfile[]) {

    }

    public gene(d: Mutation) {
        return d.gene.hugoGeneSymbol;
    }

    public alterationType(geneticProfileId:string) {
        const ret = _.find(this.geneticProfiles, (profile: MolecularProfile) => {
            return profile.molecularProfileId === geneticProfileId;
        });
        return (ret) ? ret.molecularAlterationType : undefined;
    }

    public cna(d: GeneMolecularData) {
        if (this.alterationType(d.molecularProfileId) === 'COPY_NUMBER_ALTERATION') {
            return cna_profile_data_to_string[d.value];
        } else {
            return null;
        }
    }

    public mut_type(d: Mutation) {
        if (this.alterationType(d.molecularProfileId) === 'MUTATION_EXTENDED') {
            if (d.mutationType === "fusion") {
                return null;
            } else if (d.aminoAcidChange && d.aminoAcidChange.toLowerCase() === "promoter") {
                return "promoter";
            } else {
                return getSimplifiedMutationType(d.mutationType);
            }
        } else {
            return null;
        }
    }

    public mut_position(d: Mutation) {
        if (this.alterationType(d.molecularProfileId) === 'MUTATION_EXTENDED') {
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
        if (this.alterationType(d.molecularProfileId) === 'MUTATION_EXTENDED') {
            return d.aminoAcidChange;
        } else {
            return null;
        }
    }

    public exp(d: GeneMolecularData) {
        if (this.alterationType(d.molecularProfileId) === 'MRNA_EXPRESSION') {
            return parseFloat(d.value);
        } else {
            return null;
        }
    }

    public prot(d: GeneMolecularData) {
        if (this.alterationType(d.molecularProfileId) === 'PROTEIN_LEVEL') {
            return parseFloat(d.value);
        } else {
            return null;
        }
    }

    public fusion(d: Mutation) {
        return (getSimplifiedMutationType(d.mutationType) === "fusion") ? true : null;
    }


}
