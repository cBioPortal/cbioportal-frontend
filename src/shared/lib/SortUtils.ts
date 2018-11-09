import {ClinicalAttribute} from "../api/generated/CBioPortalAPI";

export function sortByClinicalAttributePriorityThenName(a: ClinicalAttribute, b: ClinicalAttribute): number {
    const _a = Number(a.priority) || 0;
    const _b = Number(b.priority) || 0;
    const priorityDiff = _b - _a;
    if (priorityDiff === 0) {
        return (a.displayName === undefined ? "" : a.displayName).localeCompare(b.displayName);
    }
    return priorityDiff;
}