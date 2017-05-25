import * as _ from 'lodash';
import {PdbHeader} from "shared/api/generated/PdbAnnotationAPI";
import {IPdbPositionRange} from "shared/model/Pdb";

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
