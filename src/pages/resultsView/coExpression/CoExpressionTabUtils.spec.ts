import {assert} from "chai";
import {filterAndSortProfiles} from "./CoExpressionTabUtils";
import {MolecularProfile} from "../../../shared/api/generated/CBioPortalAPI";

describe("CoExpressionTabUtils", ()=>{
    describe("filterAndSortProfiles", ()=>{
        let profiles:MolecularProfile[];
        before(()=>{
            profiles = [
                {
                    molecularAlterationType: "MUTATION_EXTENDED"
                },
                {
                    molecularAlterationType: "MRNA_EXPRESSION",
                    molecularProfileId: "merged_median_zscores_rna_seq"
                },
                {
                    molecularAlterationType: "PROTEIN_LEVEL",
                    molecularProfileId: "aposidjpao"
                },
                {
                    molecularAlterationType: "MRNA_EXPRESSION",
                    molecularProfileId: "blah2_zscores"
                },
                {
                    molecularAlterationType: "PROTEIN_LEVEL",
                    molecularProfileId:"blah_zscores"
                },
            ] as any;
        });
        it("returns empty if no profiles given", ()=>{
            assert.equal(filterAndSortProfiles([]).length, 0);
        });
        it("returns empty if no valid profiles", ()=>{
            assert.equal(filterAndSortProfiles([profiles[0]]).length, 0);
            assert.equal(filterAndSortProfiles([profiles[3]]).length, 0);
            assert.equal(filterAndSortProfiles([profiles[0], profiles[3], profiles[4]]).length, 0);
        });
        it("returns valid profiles, with rna seq sorted to the top", ()=>{
            assert.deepEqual(
                filterAndSortProfiles(profiles),
                [profiles[1], profiles[2]]
            );
        });
    });
});