import { action } from 'mobx';
import ComparisonStore from 'shared/lib/comparison/ComparisonStore';

export type CopyNumberEnrichmentEventType = 'HOMDEL' | 'AMP';

export type MutationEnrichmentEventType =
    | 'missense_mutation'
    | 'missense'
    | 'missense_variant'
    | 'frame_shift_ins'
    | 'frame_shift_del'
    | 'frameshift'
    | 'frameshift_deletion'
    | 'frameshift_insertion'
    | 'de_novo_start_outofframe'
    | 'frameshift_variant'
    | 'nonsense_mutation'
    | 'nonsense'
    | 'stopgain_snv'
    | 'stop_gained'
    | 'splice_site'
    | 'splice'
    | 'splicing'
    | 'splice_site_snp'
    | 'splice_site_del'
    | 'splice_site_indel'
    | 'splice_region_variant'
    | 'splice_region'
    | 'translation_start_site'
    | 'initiator_codon_variant'
    | 'start_codon_snp'
    | 'start_codon_del'
    | 'nonstop_mutation'
    | 'stop_lost'
    | 'inframe_del'
    | 'inframe_deletion'
    | 'in_frame_del'
    | 'in_frame_deletion'
    | 'inframe_ins'
    | 'inframe_insertion'
    | 'in_frame_ins'
    | 'in_frame_insertion'
    | 'indel'
    | 'nonframeshift_deletion'
    | 'nonframeshift'
    | 'nonframeshift_insertion'
    | 'targeted_region'
    | 'inframe'
    | 'truncating'
    | 'feature_truncation'
    | 'fusion'
    | 'silent'
    | 'synonymous_variant'
    | 'any'
    | 'other';

export function buildAlterationEnrichmentTypeSelectorHandlers(
    self: ComparisonStore
) {
    const handlers = {
        updateSelectedMutations: action((s: MutationEnrichmentEventType[]) => {
            self.selectedMutationEnrichmentEventTypes = s;
        }),
        updateSelectedCopyNumber: action(
            (s: CopyNumberEnrichmentEventType[]) => {
                self.selectedCopyNumberEnrichmentEventTypes = s;
            }
        ),
    };
    return handlers;
}
