import {
    CopyNumberEnrichmentEventType,
    MutationEnrichmentEventType,
} from 'shared/lib/comparison/ComparisonTabUtils';

export const cnaEventTypeSelectInit: {
    [key in CopyNumberEnrichmentEventType]?: boolean;
} = {
    [CopyNumberEnrichmentEventType.HOMDEL]: true,
    [CopyNumberEnrichmentEventType.AMP]: true,
};

export function mutationEventTypeSelectInit() {
    const object = {} as { [key in MutationEnrichmentEventType]?: boolean };
    Object.keys(MutationEnrichmentEventType).forEach(type => {
        object[type as MutationEnrichmentEventType] = true;
    });
    return object;
}
