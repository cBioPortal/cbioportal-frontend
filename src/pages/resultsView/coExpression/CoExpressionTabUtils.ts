import {MolecularProfile} from "../../../shared/api/generated/CBioPortalAPI";
import {AlterationTypeConstants} from "../ResultsViewPageStore";
export const correlationInformation = "Pearson correlations are computed first. For genes with a correlation greater "+
                                        "than 0.3 or less than -0.3, the Spearman correlations are also computed. By "+
                                        "default, only gene pairs with values > 0.3 or < -0.3 in both measures are shown.";

export const tableSearchInformation = "Coexpression data can be filtered by gene, or by cytoband. To exclude all genes "+
                                        "from a cytoband, prefix with a dash -. For example, to exclude all genes on "+
                                        "1p, search '-1p'."


export function filterAndSortProfiles(profiles:MolecularProfile[]) {
    const profs = profiles.filter(profile=>{
        // we want a profile which is mrna or protein, and among them we want any profile,
        // except zscore profiles that are not merged_median_zscores

        let good = false;
        if (profile.molecularAlterationType === AlterationTypeConstants.MRNA_EXPRESSION ||
            profile.molecularAlterationType === AlterationTypeConstants.PROTEIN_LEVEL) {

            const profileId = profile.molecularProfileId.toLowerCase();
            good = (profileId.indexOf("merged_median_zscores") > -1) ||
                (profileId.indexOf("zscores") === -1);
        }
        return good;
    });
    profs.sort(function(profA, profB) {
        // sort rna seq to the top
        const rnaSeqA = profA.molecularProfileId.toLowerCase().indexOf("rna_seq") > -1;
        const rnaSeqB = profB.molecularProfileId.toLowerCase().indexOf("rna_seq") > -1;
        if (rnaSeqA === rnaSeqB) {
            return 0;
        } else if (rnaSeqA) {
            return -1;
        } else {
            return 1;
        }
    });
    return profs;
}