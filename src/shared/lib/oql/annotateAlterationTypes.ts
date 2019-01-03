import AccessorsForOqlFilter from "./AccessorsForOqlFilter";
import {NumericGeneMolecularData} from "../../api/generated/CBioPortalAPI";
import {
    AlterationTypeConstants,
    AnnotatedMutation,
    ExtendedAlteration
} from "../../../pages/resultsView/ResultsViewPageStore";
import {isMutation} from "../CBioPortalAPIUtils";

export function annotateAlterationTypes(datum:(AnnotatedMutation | NumericGeneMolecularData)&Partial<ExtendedAlteration>, accessors:AccessorsForOqlFilter):ExtendedAlteration {
    const molecularAlterationType = accessors.molecularAlterationType(datum.molecularProfileId);
    switch (molecularAlterationType) {
        case AlterationTypeConstants.MUTATION_EXTENDED:
        case AlterationTypeConstants.FUSION:
            if (accessors.fusion(datum as AnnotatedMutation) !== null) {
                datum.alterationType = AlterationTypeConstants.FUSION;
                datum.alterationSubType = "";
            } else {
                datum.alterationType = AlterationTypeConstants.MUTATION_EXTENDED;
                datum.alterationSubType = accessors.mut_type(datum as AnnotatedMutation) as any;
            }
            break;
        case AlterationTypeConstants.COPY_NUMBER_ALTERATION:
            datum.alterationType = AlterationTypeConstants.COPY_NUMBER_ALTERATION;
            datum.alterationSubType = accessors.cna(datum as NumericGeneMolecularData);
            break;
        case AlterationTypeConstants.MRNA_EXPRESSION:
        case AlterationTypeConstants.PROTEIN_LEVEL:
            datum.alterationType = molecularAlterationType;
            break;
    }
    return datum as ExtendedAlteration;
};