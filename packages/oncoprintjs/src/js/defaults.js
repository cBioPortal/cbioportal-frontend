window.oncoprint_defaults = (function() {
	var utils = window.oncoprint_utils;
	var genetic_alteration_config = {
		default_color: '#D3D3D3',
		cna_key: 'cna',
		cna: {
			color: {
				AMPLIFIED: 'red',
				GAINED: '#FFB6C1',
				HOMODELETED: '#0000FF',
				HETLOSS: '#8FD8D8',	
			},
			label: {
				AMPLIFIED: 'Amplification',
				GAINED: 'Gain',
				HOMODELETED: 'Homozygous Deletion',
				HETLOSS: 'Heterozygous Deletion'
			}

		},
		mut_type_key: 'mut_type',
		mut: {
			color: {
				MISSENSE: 'green',
				INFRAME: '#9F8170',
				TRUNC: 'black',
			},
			label: {
				MISSENSE: 'Missense Mutation',
				INFRAME: 'In-Frame Insertion/Deletion',
				TRUNC: 'Truncating Mutation'
			}
		},
		legend_label: 'Genetic Alteration',
		mrna_key: 'mrna',
		mrna: {
			color: {
				UPREGULATED: '#FF9999',
				DOWNREGULATED: '#6699CC'
			},
			label: {
				UPREGULATED: 'mRNA Upregulation',
				DOWNREGULATED: 'mRNA Downregulation'
			}
		},
		rppa_key: 'rppa',
		rppa_down: 'DOWNREGULATED',
		rppa_up: 'UPREGULATED',
		rppa_down_label: 'Protein Downregulation',
		rppa_up_label: 'Protein Upregulation',
	};
	
	var genetic_alteration_comparator = function(d1,d2) {
		var cna_order = utils.invert_array(['AMPLIFIED', 'HOMODELETED', 'GAINED', 'HEMIZYGOUSLYDELETED', 'DIPLOID', undefined]);
		var mut_order = utils.invert_array(['MISSENSE', 'INFRAME', 'TRUNC', undefined]); 
		var regulation_order = utils.invert_array(['UPREGULATED', 'DOWNREGULATED', undefined]);

		var cna_key = genetic_alteration_config.cna_key;
		var cna_diff = utils.sign(cna_order[d1[cna_key]] - cna_order[d2[cna_key]]);
		if (cna_diff !== 0) {
			return cna_diff;
		}

		var mut_type_key = genetic_alteration_config.mut_type_key;
		var mut_type_diff = utils.sign(mut_order[d1[mut_type_key]] - mut_order[d2[mut_type_key]]);
		if (mut_type_diff !== 0) {
			return mut_type_diff;
		}

		var mrna_key = genetic_alteration_config.mrna_key;
		var mrna_diff = utils.sign(regulation_order[d1[mrna_key]] - regulation_order[d2[mrna_key]]);
		if (mrna_diff !== 0) {
			return mrna_diff;
		}

		var rppa_key = genetic_alteration_config.rppa_key;
		var rppa_diff = utils.sign(regulation_order[d1[rppa_key]] - regulation_order[d2[rppa_key]]);
		if (rppa_diff !== 0) {
			return rppa_diff;
		}

		return 0;
	};

	return {
		genetic_alteration_config: genetic_alteration_config,
		genetic_alteration_comparator: genetic_alteration_comparator
	}
})();
