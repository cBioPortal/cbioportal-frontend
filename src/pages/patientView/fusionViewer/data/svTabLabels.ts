import { StructuralVariant } from 'cbioportal-ts-api-client';
import { isRnaDerivedFusion } from './structuralVariantAdapter';

/** True when any SV is an RNA-derived fusion (vs. DNA-only SV calls). */
export function hasRnaFusion(svs: StructuralVariant[]): boolean {
    return svs.some(isRnaDerivedFusion);
}

/** Patient-view tab name: "Fusion" only when RNA fusions are present. */
export function patientSvTabLabel(hasRna: boolean): string {
    return hasRna ? 'Fusion Viewer' : 'SV Viewer';
}

/** Study-view tab name, same rule as the patient tab. */
export function cohortSvTabLabel(hasRna: boolean): string {
    return hasRna ? 'Fusion Comparison' : 'SV Comparison';
}
