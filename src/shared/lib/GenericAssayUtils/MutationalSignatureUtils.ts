export enum MutationalSignatureStableIdKeyWord {
    MutationalSignatureExposureKeyWord = 'mean',
    MutationalSignatureConfidenceKeyWord = 'confidence',
}

export function convertMutationalSignatureStableIdToDisplayName(
    stableId: string
) {
    const parsedStableId = stableId.split('_');
    let displayName = '';
    if (parsedStableId.length > 0) {
        const mutationalSignatureIndex = parseInt(
            parsedStableId[parsedStableId.length - 1]
        );
        displayName = `Mutational Signature ${mutationalSignatureIndex}`;
    }
    return displayName;
}
