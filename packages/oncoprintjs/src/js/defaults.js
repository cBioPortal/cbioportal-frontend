window.oncoprint_defaults = (function() {
	var utils = window.oncoprint_utils;
	var genetic_alteration_config = {
		default: [{shape: 'full-rect', color: '#D3D3D3', z_index: -1}],
		altered: {
			'cna': {
				'AMPLIFIED': {
					shape: 'full-rect',
					color: 'red',
					legend_label: 'Amplification'
				},
				'GAINED': {
					shape: 'full-rect',
					color: '#FFB6C1',
					legend_label: 'Gain'
				},
				'HOMODELETED':{
					shape: 'full-rect',
					color: '#0000FF',
					legend_label: 'Homozygous Deletion'
				},
				'HETLOSS': {
					shape: 'full-rect',
					color: '#8FD8D8',
					legend_label: 'Heterozygous Deletion'
				}
			},
			'mut_type': {
				'MISSENSE': {
					shape: 'middle-rect',
					color: 'green',
					legend_label: 'Missense Mutation'
				},
				'INFRAME': {
					shape: 'middle-rect',
					color: '#9F8170',
					legend_label: 'Inframe Insertion/Deletion'
				},
				'TRUNC': {
					shape: 'middle-rect',
					color: 'black',
					legend_label: 'Truncating Mutation'
				},
				'FUSION':{
					shape: 'large-right-arrow',
					color: 'black',
					legend_label: 'Fusion'
				}
			},
			'mrna': {
				'UPREGULATED': {
					shape: 'outline',
					color: '#FF9999',
					legend_label: 'mRNA Upregulation'
				},
				'DOWNREGULATED': {
					shape: 'outline',
					color: '#6699CC',
					legend_label: 'mRNA Downregulation'
				}
			},
			'rppa': {
				'UPREGULATED': {
					shape: 'small-up-arrow',
					color: 'black',
					legend_label: 'Protein Upregulation'
				},
				'DOWNREGULATED': {
					shape: 'small-down-arrow',
					color: 'black',
					legend_label: 'Protein Downregulation'
				}
			}
		}
	};
	
	var genetic_alteration_comparator = function(d1,d2) {
		var cna_order = utils.invert_array(['AMPLIFIED', 'HOMODELETED', 'GAINED', 'HEMIZYGOUSLYDELETED', 'DIPLOID', undefined]);
		var mut_order = utils.invert_array(['TRUNC', 'INFRAME', 'MISSENSE', undefined]); 
		var regulation_order = utils.invert_array(['UPREGULATED', 'DOWNREGULATED', undefined]);

		var cna_key = 'cna';
		var cna_diff = utils.sign(cna_order[d1[cna_key]] - cna_order[d2[cna_key]]);
		if (cna_diff !== 0) {
			return cna_diff;
		}

		var mut_type_key = 'mut_type';
		var mut_type_diff = utils.sign(mut_order[d1[mut_type_key]] - mut_order[d2[mut_type_key]]);
		if (mut_type_diff !== 0) {
			return mut_type_diff;
		}

		var mrna_key = 'mrna';
		var mrna_diff = utils.sign(regulation_order[d1[mrna_key]] - regulation_order[d2[mrna_key]]);
		if (mrna_diff !== 0) {
			return mrna_diff;
		}

		var rppa_key = 'rppa';
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
