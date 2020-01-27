export enum Alterations {
    Deletion = -2,
    Amplification = 2,
}

export function getAlterationString(alteration: number): string {
    return Alterations[alteration] || '';
}
