import * as _ from 'lodash';
import {Alignment} from "shared/api/generated/Genome2StructureAPI";

/**
 * Utility functions to generate mock data.
 *
 * @author Selcuk Onur Sumer
 */

export function initPdbAlignment(alignmentString: string, uniprotFrom: number): Alignment
{
    return initPdbAlignmentWithPartialProps({
        midlineAlign: alignmentString,
        pdbAlign: alignmentString,
        seqAlign: alignmentString,
        seqFrom: uniprotFrom,
        seqTo: uniprotFrom + alignmentString.length - 1
    });
}

export function emptyPdbAlignment(): Alignment
{
    return {
        alignmentId: -1,
        bitscore: 0,
        chain: "",
        evalue: "",
        identity: -1,
        identityPositive: -1,
        midlineAlign: "",
        pdbAlign: "",
        seqAlign: "",
        pdbFrom: 0,
        pdbId: "",
        pdbNo: "",
        pdbSeg: "",
        pdbTo: 0,
        seqFrom: -1,
        seqId: "",
        seqTo: -1,
        segStart: "",
        residueMapping: [],
        updateDate: ""
    };
}

function initPdbAlignmentWithPartialProps(props:{[key:string]: any}): Alignment
{
    const alignment = emptyPdbAlignment();

    _.merge(alignment, props);

    return alignment;
}
