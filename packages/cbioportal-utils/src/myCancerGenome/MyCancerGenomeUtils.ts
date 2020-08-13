import { Mutation } from '../model/Mutation';
import { IMyCancerGenome, IMyCancerGenomeData } from '../model/MyCancerGenome';
import myCancerGenomeJson from './mycancergenome.json';

export function getMyCancerGenomeLinks(
    mutation: Partial<Mutation>,
    myCancerGenomeData: IMyCancerGenomeData
): string[] {
    const myCancerGenomes: IMyCancerGenome[] | null =
        mutation.gene && mutation.gene.hugoGeneSymbol
            ? myCancerGenomeData[mutation.gene.hugoGeneSymbol]
            : null;

    let links: string[] = [];

    if (myCancerGenomes) {
        // further filtering required by alteration field
        links = filterByAlteration(mutation, myCancerGenomes).map(
            (myCancerGenome: IMyCancerGenome) => myCancerGenome.linkHTML
        );
    }

    return links;
}

// TODO for now ignoring anything but protein change position, this needs to be improved!
export function filterByAlteration(
    mutation: Partial<Mutation>,
    myCancerGenomes: IMyCancerGenome[]
): IMyCancerGenome[] {
    return myCancerGenomes.filter((myCancerGenome: IMyCancerGenome) => {
        const proteinChangeRegExp: RegExp = /^[A-Za-z][0-9]+[A-Za-z]/;
        const numericalRegExp: RegExp = /[0-9]+/;

        const matched = myCancerGenome.alteration
            .trim()
            .match(proteinChangeRegExp);

        if (matched && mutation.proteinChange) {
            const mutationPos = mutation.proteinChange.match(numericalRegExp);
            const alterationPos = myCancerGenome.alteration.match(
                numericalRegExp
            );

            return (
                mutationPos &&
                alterationPos &&
                mutationPos[0] === alterationPos[0]
            );
        }

        return false;
    });
}

/**
 * This is NOT a generic html anchor tag parser. Assuming all MyCancerGenome links have the same simple structure.
 * DOMParser can be used for generic parsing purposes, but it is not compatible with the current test environment.
 * (i.e: DOMParser unit tests always fail, but it works fine in the browser)
 */
export function parseMyCancerGenomeLink(link: string) {
    // Generic DOMParser solution (not compatible with the current unit test environment):
    // const parser = new DOMParser();
    // const htmlDoc = parser.parseFromString(link, "text/html");
    // const links = htmlDoc.getElementsByTagName('a');

    // assuming that we only have one attribute which is href
    const hrefStart = link.indexOf('"') + 1;
    const hrefEnd = hrefStart + link.slice(hrefStart).indexOf('"');

    // assuming that the text starts right after the first >, and ends right before the </a>
    const textStart = link.indexOf('>') + 1;
    const textEnd = link.indexOf('</a>');

    const href = link.slice(hrefStart, hrefEnd).trim();
    const text = link.slice(textStart, textEnd).trim();

    if (href.length > 0 && text.length > 0) {
        return {
            url: href,
            text: text,
        };
    } else {
        return undefined;
    }
}

export function getMyCancerGenomeData(): IMyCancerGenomeData {
    const data: IMyCancerGenome[] = myCancerGenomeJson;
    return geneToMyCancerGenome(data);
}

export function geneToMyCancerGenome(
    myCancerGenomes: IMyCancerGenome[]
): IMyCancerGenomeData {
    // key: hugo gene symbol
    // value: IMyCancerGenome[]
    const map: IMyCancerGenomeData = {};

    myCancerGenomes.forEach((myCancerGenome: IMyCancerGenome) => {
        if (!(myCancerGenome.hugoGeneSymbol in map)) {
            map[myCancerGenome.hugoGeneSymbol] = [];
        }

        map[myCancerGenome.hugoGeneSymbol].push(myCancerGenome);
    });

    return map;
}
