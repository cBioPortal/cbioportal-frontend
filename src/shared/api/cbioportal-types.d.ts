declare namespace cbio
{
	interface PortalMetaData
	{
		cancer_studies: CancerStudyMap;
		type_of_cancers: VisibleTypeOfCancerMap;
		cancer_colors: VisibleCancerColors;
		short_names: VisibleShortNames;
		parent_type_of_cancers: ParentTypeOfCancer;
		gene_sets: {[id:string]: GeneSet};
	}

	interface VisibleTypeOfCancerMap
	{
		[typeOfCancerId:string]: string; // name visible to user
	}

	interface VisibleCancerColors
	{
		[typeOfCancerId:string]: string; // CSS color visible to user
	}

	interface VisibleShortNames
	{
		[typeOfCancerId:string]: string; // short name visible to user
	}

	interface ParentTypeOfCancer
	{
		[typeOfCancerId:string]: string;
	}

	type CancerStudyMap = _CancerStudyMapPartial | _CancerStudyMapFull;

	interface _CancerStudyMapBase
	{
		// cancer_study
		name: string;
		type_of_cancer: string;
		description: string;
		// sample,patient
		num_samples: number;
	}

	interface _CancerStudyMapPartial extends _CancerStudyMapBase
	{
		partial: "true";
	}

	// returned when
	interface _CancerStudyMapFull extends _CancerStudyMapBase
	{
		partial: "false";
		short_name: string;
		citation: string;
		pmid: string;
		genomic_profiles: GenomicProfile[];
		case_sets: CaseList[];
		has_mutation_data: boolean;
		has_cna_data: boolean;
		has_mutsig_data: boolean;
		has_gistic_data: boolean;
	}

	interface GenomicProfile
	{
		id: string;
		alteration_type: string;
		show_in_analysis_tab: boolean;
		name: string;
		description: string;
		datatype: string;
	}

	interface CaseList
	{
		id: string;
		name: string;
		description: string;
		size: number;
	}

	interface GeneSet
	{
		name: string;
		gene_list: string;
	}
}
