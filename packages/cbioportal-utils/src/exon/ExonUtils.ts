import { Exon, UntranslatedRegion } from 'genome-nexus-ts-api-client';
import { ExonDatum } from '../model/Exon';

export function extractExonInformation(
    exons: Exon[],
    utrs: UntranslatedRegion[],
    proteinLength: number
): ExonDatum[] {
    let totalLength = 0;
    const exonLocList: { exonRank: number; length: number }[] = [];
    exons.forEach(exon => {
        let utrStartSitesWithinExon = false;
        for (let j = 0; j < utrs.length; j++) {
            const currentUtr = utrs[j];
            // if utr start is within exon, add only translated length of exon to exonLocList
            if (
                exon.exonStart <= currentUtr.start &&
                exon.exonEnd >= currentUtr.start
            ) {
                utrStartSitesWithinExon = true;
                const aaLength =
                    (currentUtr.start -
                        exon.exonStart +
                        (exon.exonEnd - currentUtr.end)) /
                    3;
                if (aaLength !== 0) {
                    exonLocList.push({
                        exonRank: exon.rank,
                        length: aaLength,
                    });
                    totalLength += aaLength;
                }
                break;
            }
        }
        // if there are no utr start sites within exon
        if (!utrStartSitesWithinExon) {
            const aaLength = (exon.exonEnd - exon.exonStart + 1) / 3;
            exonLocList.push({ exonRank: exon.rank, length: aaLength });
            totalLength += aaLength;
        }
    });
    exonLocList.sort((n1, n2) => n1.exonRank - n2.exonRank);
    // if totalLength is greater than proteinLength, remove length (1 aa or 3 nucs) associated with stop codon
    // isoforms that are especially short already have this length taken out
    if (totalLength !== proteinLength) {
        exonLocList[exonLocList.length - 1].length =
            exonLocList[exonLocList.length - 1].length - 1;
        totalLength--;
    }
    let startOfExon = 0;
    const exonInfo: ExonDatum[] = exonLocList.map(exon => {
        const exonDatum = {
            rank: exon.exonRank,
            length: exon.length,
            start: startOfExon,
        };
        startOfExon += exon.length;
        return exonDatum;
    });
    return exonInfo;
}

export function formatExonLocation(exonLocation: number) {
    const numNucleotidesOver = Math.round(exonLocation * 3) % 3;
    if (numNucleotidesOver === 0) {
        return Math.round(exonLocation).toString();
    } else if (numNucleotidesOver === 1) {
        return Math.trunc(exonLocation).toString() + ' ⅓';
    } else {
        return Math.trunc(exonLocation).toString() + ' ⅔';
    }
}
