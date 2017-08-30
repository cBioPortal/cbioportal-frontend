import {MutationAssessor} from 'shared/api/generated/GenomeNexusAPI';

export interface IGenomeNexusData {
	mutation_assessor: {[id:string]: MutationAssessor|undefined}
}
