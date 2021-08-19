import { assert } from 'chai';

import { ExonDatum } from '../model/Exon';
import { extractExonInformation } from './ExonUtils';

describe('ExonUtils', () => {
    const transcriptInfo = {
        transcriptId: 'ENST00000349496',
        geneId: 'ENSG00000168036',
        refseqMrnaId: 'NM_001098209',
        ccdsId: 'CCDS2694',
        hugoSymbols: ['CTNNB1'],
        proteinId: 'ENSP00000344456',
        proteinLength: 781,
        pfamDomains: [
            {
                pfamDomainId: 'PF00514',
                pfamDomainStart: 584,
                pfamDomainEnd: 622,
            },
            {
                pfamDomainId: 'PF00514',
                pfamDomainStart: 350,
                pfamDomainEnd: 390,
            },
            {
                pfamDomainId: 'PF00514',
                pfamDomainStart: 229,
                pfamDomainEnd: 262,
            },
            {
                pfamDomainId: 'PF00514',
                pfamDomainStart: 432,
                pfamDomainEnd: 473,
            },
        ],
        exons: [
            {
                exonId: 'ENSE00001912361',
                exonStart: 41240930,
                exonEnd: 41241161,
                rank: 1,
                strand: 1,
                version: 1,
            },
            {
                exonId: 'ENSE00003554494',
                exonStart: 41265512,
                exonEnd: 41265572,
                rank: 2,
                strand: 1,
                version: 1,
            },
            {
                exonId: 'ENSE00003464041',
                exonStart: 41266017,
                exonEnd: 41266244,
                rank: 3,
                strand: 1,
                version: 1,
            },
            {
                exonId: 'ENSE00003593193',
                exonStart: 41266445,
                exonEnd: 41266698,
                rank: 4,
                strand: 1,
                version: 1,
            },
            {
                exonId: 'ENSE00001692569',
                exonStart: 41266825,
                exonEnd: 41267063,
                rank: 5,
                strand: 1,
                version: 1,
            },
            {
                exonId: 'ENSE00001643204',
                exonStart: 41267151,
                exonEnd: 41267352,
                rank: 6,
                strand: 1,
                version: 1,
            },
            {
                exonId: 'ENSE00001767208',
                exonStart: 41268699,
                exonEnd: 41268843,
                rank: 7,
                strand: 1,
                version: 1,
            },
            {
                exonId: 'ENSE00001649367',
                exonStart: 41274832,
                exonEnd: 41274935,
                rank: 8,
                strand: 1,
                version: 1,
            },
            {
                exonId: 'ENSE00001718373',
                exonStart: 41275020,
                exonEnd: 41275358,
                rank: 9,
                strand: 1,
                version: 1,
            },
            {
                exonId: 'ENSE00001592339',
                exonStart: 41275630,
                exonEnd: 41275788,
                rank: 10,
                strand: 1,
                version: 1,
            },
            {
                exonId: 'ENSE00003558822',
                exonStart: 41277215,
                exonEnd: 41277334,
                rank: 11,
                strand: 1,
                version: 1,
            },
            {
                exonId: 'ENSE00003521934',
                exonStart: 41277840,
                exonEnd: 41277990,
                rank: 12,
                strand: 1,
                version: 1,
            },
            {
                exonId: 'ENSE00001782706',
                exonStart: 41278079,
                exonEnd: 41278200,
                rank: 13,
                strand: 1,
                version: 1,
            },
            {
                exonId: 'ENSE00001805633',
                exonStart: 41279507,
                exonEnd: 41279567,
                rank: 14,
                strand: 1,
                version: 1,
            },
            {
                exonId: 'ENSE00001867353',
                exonStart: 41280625,
                exonEnd: 41281936,
                rank: 15,
                strand: 1,
                version: 1,
            },
        ],
        utrs: [
            {
                type: 'five_prime_UTR',
                start: 41240930,
                end: 41241161,
                strand: 1,
            },
            {
                type: 'five_prime_UTR',
                start: 41265512,
                end: 41265559,
                strand: 1,
            },
            {
                type: 'three_prime_UTR',
                start: 41280834,
                end: 41281936,
                strand: 1,
            },
        ],
        uniprotId: 'P35222',
    };

    describe('extractExonInformation', () => {
        it('extracts exon rank, start, and length', () => {
            const exonInfo = extractExonInformation(
                transcriptInfo.exons,
                transcriptInfo.utrs,
                transcriptInfo.proteinLength
            );

            assert.equal(
                exonInfo[0].rank,
                2,
                'Entire first exon is within UTR so we should start on second'
            );

            assert.equal(
                exonInfo[0].start,
                0,
                'We always start at 0 for the first exon in our array'
            );

            assert.equal(
                exonInfo[0].length,
                13.0 / 3,
                'Difference between end of utr 2 and exon 2 ends'
            );
        });
    });
});
