import * as _ from 'lodash';
import {PdbHeader, PdbUniprotAlignment} from "shared/api/generated/PdbAnnotationAPI";
import {
    IPdbPositionRange, IPdbChain, ALIGNMENT_GAP, ALIGNMENT_MINUS, ALIGNMENT_PLUS,
    ALIGNMENT_SPACE
} from "shared/model/Pdb";

/**
 * Generates a pdb info summary for the given pdb header and the chain id.
 */
export function generatePdbInfoSummary(pdbHeader:PdbHeader, chainId: string)
{
    const summary: {
        pdbInfo: string,
        moleculeInfo?: string
    } = {
        pdbInfo: pdbHeader.title
    };

    // get chain specific molecule info
    _.find(pdbHeader.compound, (mol:any) => {
        if (mol.molecule &&
            _.indexOf(mol.chain, chainId.toLowerCase()) !== -1)
        {
            // chain is associated with this mol,
            // get the organism info from the source
            summary.moleculeInfo = mol.molecule;
            return mol;
        }
    });

    return summary;
}

/**
 * Converts the given PDB position to residue code(s)
 */
export function convertPdbPosToResCode(position: IPdbPositionRange): string[]
{
    const residues: string[] = [];
    const start = position.start.position;
    const end = position.end.position;

    for (let i=start; i <= end; i++) {
        residues.push(`${i}`);
    }

    // TODO this may not be accurate if residues.length > 2

    if (position.start.insertionCode)
    {
        residues[0] += "^" + position.start.insertionCode;
    }

    if (residues.length > 1 &&
        position.end.insertionCode)
    {
        residues[residues.length - 1] += "^" + position.end.insertionCode;
    }

    return residues;
}

/**
 * Converts the given PDB position to residue and icode pairs
 */
export function convertPdbPosToResAndInsCode(position: IPdbPositionRange): {resi: number, icode?:string}[]
{
    const residues: {resi: number, icode?:string}[] = [];
    const start = position.start.position;
    const end = position.end.position;

    for (let i=start; i <= end; i++) {
        residues.push({
            resi: i
        });
    }

    // TODO this may not be accurate if residues.length > 2

    if (position.start.insertionCode) {
        residues[0].icode = position.start.insertionCode;
    }

    if (residues.length > 1 && position.end.insertionCode) {
        residues[residues.length - 1].icode = position.end.insertionCode;
    }

    return residues;
}

export function processPdbAlignmentData(alignments: PdbUniprotAlignment[]): IPdbChain[]
{
    // ascending sort
    // TODO we do not actually need to sort if we implement "mergeSortedAlignments" in a way that it does not require a sorted array
    const sortedAlignments = sortAlignments(alignments);

    const chains: IPdbChain[] = [];

    // generate chains
    _.each(groupAlignmentsByPdbIdAndChain(sortedAlignments), (map: {[chainId: string]: PdbUniprotAlignment[]}) => {
        _.each(map, (chainAlignments: PdbUniprotAlignment[]) => {
            const chain = mergeSortedAlignments(chainAlignments);

            if (chain) {
                chains.push(chain);
            }
        });
    });

    return chains;
}

function sortAlignments(alignments: PdbUniprotAlignment[])
{
    // alignments might be immutable, shallow copy to avoid exceptions
    const sortedAlignments = _.clone(alignments);

    sortedAlignments.sort(function(a:PdbUniprotAlignment, b:PdbUniprotAlignment) {
        let diff = a.uniprotFrom - b.uniprotFrom;

        // for consistency sort by identity when positions are the same
        if (diff === 0) {
            diff = a.identity - b.identity;
        }

        return diff || 0;
    });

    return sortedAlignments;
}

function groupAlignmentsByPdbIdAndChain(alignments: PdbUniprotAlignment[])
{
    const groupedAlignments: {
        [pdbId: string]: {
            [chainId: string]: PdbUniprotAlignment[]
        }
    } = {};

    alignments.forEach((alignment: PdbUniprotAlignment) => {
        if (!groupedAlignments[alignment.pdbId]) {
            groupedAlignments[alignment.pdbId] = {};
        }

        if (!groupedAlignments[alignment.pdbId][alignment.chain]) {
            groupedAlignments[alignment.pdbId][alignment.chain] = [];
        }

        groupedAlignments[alignment.pdbId][alignment.chain].push(alignment);
    });

    return groupedAlignments;
}

export function mergeSortedAlignments(alignments: PdbUniprotAlignment[]): IPdbChain|undefined
{
    let mergedAlignment = "";
    let end: number;

    if (alignments.length > 0) {
        // set the end just before the beginning of the first alignment
        // the iteration below will handle the rest
        end = alignments[0].uniprotFrom - 1;
    }
    else {
        return undefined;
    }

    alignments.forEach((alignment: PdbUniprotAlignment) => {
        const distance = alignment.uniprotFrom - end - 1;
        const alignmentStr = generateAlignmentString(alignment) || "";

        // check for overlapping uniprot positions...

        // no overlap, and the next alignment starts exactly after the current merge
        if (distance === 0) {
            // just concatenate two strings
            mergedAlignment += alignmentStr;
        }
        // no overlap, but there is a gap
        else if (distance > 0)
        {
            let gap: string[] = [];

            // add gap characters (character count = distance)
            for (let i = 0; i < distance; i++) {
                gap.push(ALIGNMENT_GAP);
            }

            // also add the actual string
            mergedAlignment += gap.join("") + alignmentStr;
        }
        // overlapping
        else {
            // TODO: here we are assuming that overlapping sections are the same for both alignment strings,
            // but that's not always the case...

            // merge two strings
            // (just append the non-overlapping section of the current alignment)
            mergedAlignment += alignmentStr.substr(-1 * distance);
        }

        // update the end position
        end = Math.max(end, alignment.uniprotTo);
    });

    return {
        pdbId: alignments[0].pdbId,
        chain: alignments[0].chain,
        uniprotStart: alignments[0].uniprotFrom,
        uniprotEnd: alignments[0].uniprotFrom + mergedAlignment.length,
        alignment: mergedAlignment,
        identityPerc: calcIdentityPerc(mergedAlignment),
        identity: calcIdentity(mergedAlignment)
    };
}

export function generateAlignmentString(alignment: PdbUniprotAlignment): string|undefined
{
    let alignmentStr: string|undefined;

    // process 3 alignment strings and create a visualization string
    const midline = alignment.midlineAlign;
    const uniprot = alignment.uniprotAlign;
    const pdb = alignment.pdbAlign;

    if (midline.length === uniprot.length &&
        midline.length === pdb.length)
    {
        const stringBuilder = [];

        for (let i = 0; i < midline.length; i++)
        {
            // do not append anything if there is a gap in uniprot alignment
            if (uniprot[i] !== '-')
            {
                if (pdb[i] === '-') {
                    stringBuilder.push('-');
                }
                else {
                    stringBuilder.push(midline[i]);
                }
            }
        }

        alignmentStr = stringBuilder.join("")
    }

    return alignmentStr;
}

/**
 * Calculates the identity percentage of the given alignment string
 * based on mismatch ratio.
 */
function calcIdentityPerc(alignment: string): number
{
    let gap = 0;
    let mismatch = 0;

    for (let i = 0; i < alignment.length; i++)
    {
        const symbol = alignment[i];

        if (symbol === ALIGNMENT_GAP) {
            // increment gap count (gaps excluded from ratio calculation)
            gap++;
        }
        else if (symbol == ALIGNMENT_MINUS ||
            symbol == ALIGNMENT_PLUS ||
            symbol == ALIGNMENT_SPACE)
        {
            // any special symbol other than a gap is considered as a mismatch
            // TODO is it better to assign a different weight for each symbol?
            mismatch++;
        }
    }

    return 1.0 - (mismatch / (alignment.length - gap));
}

/**
 * Calculates the identity (number of matches) for
 * the given alignment string.
 *
 */
function calcIdentity(alignment: string)
{
    alignment = alignment.toLowerCase();

    let match = 0;

    for (let i = 0; i < alignment.length; i++)
    {
        if (alignment[i].match(/[a-z]/)) {
            match++;
        }
    }

    return match;
}

/**
 * Assigns numerical value to the given pdb id.
 * This is for sorting purposes, and always returns an array of size 4.
 * If invert is true, then A will have a greater value than Z.
 */
export function calcPdbIdNumericalValue(pdbId: string, invert?: boolean): number[]
{
    const values = [0, 0, 0, 0];
    const coeff = invert ? -1: 1;

    // assuming pdb id is no longer than 4 characters
    for (let i = 0; i < pdbId.length || i < 5; i++) {
        values.push(coeff * pdbId.charCodeAt(i));
    }

    return values;
}
