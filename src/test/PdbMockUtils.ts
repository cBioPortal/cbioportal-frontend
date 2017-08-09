import * as _ from 'lodash';
import {PdbUniprotAlignment} from "shared/api/generated/PdbAnnotationAPI";

/**
 * Utility functions to generate mock data.
 *
 * @author Selcuk Onur Sumer
 */

export function initPdbAlignment(alignmentString: string, uniprotFrom: number): PdbUniprotAlignment
{
    return initPdbAlignmentWithPartialProps({
        midlineAlign: alignmentString,
        pdbAlign: alignmentString,
        uniprotAlign: alignmentString,
        uniprotFrom: uniprotFrom,
        uniprotTo: uniprotFrom + alignmentString.length - 1
    });
}

export function emptyPdbAlignment(): PdbUniprotAlignment
{
    return {
        alignmentId: -1,
        chain: "",
        eValue: -1,
        identity: -1,
        identityP: -1,
        midlineAlign: "",
        pdbAlign: "",
        uniprotAlign: "",
        pdbFrom: 0,
        pdbId: "",
        pdbTo: 0,
        uniprotFrom: -1,
        uniprotId: "",
        uniprotTo: -1
    };
}

function initPdbAlignmentWithPartialProps(props:{[key:string]: any}): PdbUniprotAlignment
{
    const alignment = emptyPdbAlignment();

    _.merge(alignment, props);

    return alignment;
}
