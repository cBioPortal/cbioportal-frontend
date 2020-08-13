import {
    Mutation,
    MolecularProfile,
    NumericGeneMolecularData,
    StructuralVariant,
} from 'cbioportal-ts-api-client';
import * as _ from 'lodash';
import {
    AlterationTypeConstants,
    AnnotatedExtendedAlteration,
    AnnotatedMutation,
    AnnotatedNumericGeneMolecularData,
    AnnotatedStructuralVariant,
} from '../../../pages/resultsView/ResultsViewPageStore';
import { isNotGermlineMutation } from '../MutationUtils';
import { IAccessorsForOqlFilter } from './oqlfilter';

export const cna_profile_data_to_string: any = {
    '-2': 'homdel',
    '-1': 'hetloss',
    '0': null,
    '1': 'gain',
    '2': 'amp',
};

export type SimplifiedMutationType =
    | 'missense'
    | 'frameshift'
    | 'nonsense'
    | 'splice'
    | 'nonstart'
    | 'nonstop'
    | 'fusion'
    | 'inframe'
    | 'other';

export function getSimplifiedMutationType(
    type: string
): SimplifiedMutationType {
    let ret: SimplifiedMutationType;
    type = typeof type === 'string' ? type.toLowerCase() : '';
    switch (type) {
        case 'missense_mutation':
        case 'missense':
        case 'missense_variant':
            ret = 'missense';
            break;
        case 'frame_shift_ins':
        case 'frame_shift_del':
        case 'frameshift':
        case 'frameshift_deletion':
        case 'frameshift_insertion':
        case 'de_novo_start_outofframe':
        case 'frameshift_variant':
            ret = 'frameshift';
            break;
        case 'nonsense_mutation':
        case 'nonsense':
        case 'stopgain_snv':
            ret = 'nonsense';
            break;
        case 'splice_site':
        case 'splice':
        case 'splice site':
        case 'splicing':
        case 'splice_site_snp':
        case 'splice_site_del':
        case 'splice_site_indel':
        case 'splice_region':
            ret = 'splice';
            break;
        case 'translation_start_site':
        case 'start_codon_snp':
        case 'start_codon_del':
            ret = 'nonstart';
            break;
        case 'nonstop_mutation':
            ret = 'nonstop';
            break;
        case 'fusion':
            ret = 'fusion';
            break;
        case 'in_frame_del':
        case 'in_frame_ins':
        case 'in_frame_deletion':
        case 'in_frame_insertion':
        case 'indel':
        case 'nonframeshift_deletion':
        case 'nonframeshift':
        case 'nonframeshift insertion':
        case 'nonframeshift_insertion':
            ret = 'inframe';
            break;
        default:
            ret = 'other';
            break;
    }
    return ret;
}

export type Datum =
    | Mutation
    | NumericGeneMolecularData
    | AnnotatedMutation
    | AnnotatedNumericGeneMolecularData
    | StructuralVariant
    | AnnotatedStructuralVariant;

export default class AccessorsForOqlFilter
    implements IAccessorsForOqlFilter<Datum> {
    private molecularProfileIdToMolecularProfile: {
        [molecularProfileId: string]: MolecularProfile;
    };

    constructor(molecularProfiles: MolecularProfile[]) {
        this.molecularProfileIdToMolecularProfile = _.keyBy(
            molecularProfiles,
            p => p.molecularProfileId
        );
    }

    private isMutation(d: Datum): d is Mutation {
        return (
            this.molecularAlterationType(d.molecularProfileId) ===
            AlterationTypeConstants.MUTATION_EXTENDED
        );
    }

    public gene(d: Datum) {
        if (
            this.molecularAlterationType(d.molecularProfileId) ===
            AlterationTypeConstants.STRUCTURAL_VARIANT
        ) {
            return (d as StructuralVariant).site1HugoSymbol;
        }
        return (d as any).gene.hugoGeneSymbol;
    }

    public molecularAlterationType(molecularProfileId: string) {
        const profile = this.molecularProfileIdToMolecularProfile[
            molecularProfileId
        ];
        return profile && profile.molecularAlterationType;
    }

    public cna(d: Datum) {
        if (
            this.molecularAlterationType(d.molecularProfileId) ===
            AlterationTypeConstants.COPY_NUMBER_ALTERATION
        ) {
            return cna_profile_data_to_string[
                (d as NumericGeneMolecularData).value
            ];
        } else {
            return null;
        }
    }

    public mut_type(d: Datum) {
        if (this.isMutation(d)) {
            if (d.mutationType && d.mutationType.toLowerCase() === 'fusion') {
                return null;
            } else if (
                d.proteinChange &&
                d.proteinChange.toLowerCase() === 'promoter'
            ) {
                return 'promoter';
            } else {
                return getSimplifiedMutationType(d.mutationType);
            }
        } else {
            return null;
        }
    }

    public mut_status(d: Datum) {
        if (this.isMutation(d)) {
            if (isNotGermlineMutation(d)) {
                return 'somatic';
            } else {
                return 'germline';
            }
        } else {
            return null;
        }
    }

    public mut_position(d: Datum) {
        if (this.isMutation(d)) {
            var start = d.proteinPosStart;
            var end = d.proteinPosEnd;
            if (
                !isNaN(start) &&
                !isNaN(end) &&
                start !== -1 &&
                end !== -1 &&
                start <= end
            ) {
                return [start, end] as [number, number];
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    public mut_amino_acid_change(d: Datum) {
        if (this.isMutation(d)) {
            return d.proteinChange;
        } else {
            return null;
        }
    }

    public exp(d: Datum) {
        if (
            this.molecularAlterationType(d.molecularProfileId) ===
            AlterationTypeConstants.MRNA_EXPRESSION
        ) {
            return (d as NumericGeneMolecularData).value;
        } else {
            return null;
        }
    }

    public prot(d: Datum) {
        if (
            this.molecularAlterationType(d.molecularProfileId) ===
            AlterationTypeConstants.PROTEIN_LEVEL
        ) {
            return (d as NumericGeneMolecularData).value;
        } else {
            return null;
        }
    }

    public structuralVariant(d: Datum) {
        if (
            this.molecularAlterationType(d.molecularProfileId) ===
            AlterationTypeConstants.STRUCTURAL_VARIANT
        ) {
            return true;
        } else {
            return null;
        }
    }

    public is_driver(d: Datum) {
        if (
            this.molecularAlterationType(d.molecularProfileId) ===
            AlterationTypeConstants.MUTATION_EXTENDED
        ) {
            // covers mutations and fusions
            return !!(d as AnnotatedMutation).putativeDriver;
        } else if (
            this.molecularAlterationType(d.molecularProfileId) ===
            AlterationTypeConstants.COPY_NUMBER_ALTERATION
        ) {
            // covers CNA
            return !!(d as AnnotatedNumericGeneMolecularData).oncoKbOncogenic;
        } else {
            return null;
        }
    }
}
