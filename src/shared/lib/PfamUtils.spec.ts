import * as _ from 'lodash';
import { assert } from 'chai';
import {PfamDomain} from "shared/api/generated/GenomeNexusAPI";
import {generatePfamDomainColorMap} from "./PfamUtils";

let domains: PfamDomain[];

before(() => {
    domains = [{
        geneId: "ENSG00000198742",
        geneSymbol: "SMURF1",
        pfamDomainDescription: "Domain 2",
        pfamDomainEnd: 11,
        pfamDomainId: "PF0002",
        pfamDomainName: "Dmn2",
        pfamDomainStart: 7,
        proteinId: "ENSP0001",
        transcriptId: "ENST00000361125"
    }, {
        geneId: "ENSG00000198742",
        geneSymbol: "SMURF1",
        pfamDomainDescription: "Domain 2",
        pfamDomainEnd: 29,
        pfamDomainId: "PF0002",
        pfamDomainName: "Dmn2",
        pfamDomainStart: 23,
        proteinId: "ENSP0001",
        transcriptId: "ENST00000361125"
    }, {
        geneId: "ENSG00000198742",
        geneSymbol: "SMURF1",
        pfamDomainDescription: "Domain 1",
        pfamDomainEnd: 5,
        pfamDomainId: "PF0001",
        pfamDomainName: "Dmn1",
        pfamDomainStart: 2,
        proteinId: "ENSP0001",
        transcriptId: "ENST00000361125"
    }, {
        geneId: "ENSG00000198742",
        geneSymbol: "SMURF1",
        pfamDomainDescription: "Domain 1",
        pfamDomainEnd: 89,
        pfamDomainId: "PF0001",
        pfamDomainName: "Dmn1",
        pfamDomainStart: 61,
        proteinId: "ENSP0001",
        transcriptId: "ENST00000361125"
    }, {
        geneId: "ENSG00000198742",
        geneSymbol: "SMURF1",
        pfamDomainDescription: "Domain 4",
        pfamDomainEnd: 41,
        pfamDomainId: "PF0004",
        pfamDomainName: "Dmn4",
        pfamDomainStart: 31,
        proteinId: "ENSP0001",
        transcriptId: "ENST00000361125"
    }, {
        geneId: "ENSG00000198742",
        geneSymbol: "SMURF1",
        pfamDomainDescription: "Domain 3",
        pfamDomainEnd: 17,
        pfamDomainId: "PF0003",
        pfamDomainName: "Dmn3",
        pfamDomainStart: 13,
        proteinId: "ENSP0003",
        transcriptId: "ENST00000361368"
    }];
});

describe('PfamUtils', () => {
    it('assigns colors for PFAM domains in the correct order', () => {
        const colorMap = generatePfamDomainColorMap(domains);

        assert.equal(_.keys(colorMap).length, 4,
            "number of colors should be equal to the number of unique domains");

        assert.equal(colorMap["PF0001"], "#2dcf00");
        assert.equal(colorMap["PF0002"], "#ff5353");
        assert.equal(colorMap["PF0003"], "#5b5bff");
        assert.equal(colorMap["PF0004"], "#ebd61d");
    });
});
