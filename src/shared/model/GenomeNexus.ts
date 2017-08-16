
export type MutationAssessor = {
	"variant": string,
	"aminoAcidVariant": string,
	"functionalImpact": string,
	"functionalImpactScore": number,
	"hugoSymbol": string,
	"proteinPosition": number	
}

export interface IGenomeNexusData {
	mutation_assessor: {[id:string]: MutationAssessor}
}