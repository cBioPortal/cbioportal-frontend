import * as $ from "jquery";
import {RuleSetParams} from "oncoprintjs";
// Feed this in as

// Mutation colors
export const MUT_COLOR_MISSENSE = '#008000';
export const MUT_COLOR_MISSENSE_PASSENGER = '#53D400';
export const MUT_COLOR_INFRAME = '#993404';
export const MUT_COLOR_INFRAME_PASSENGER = '#fe9929';
export const MUT_COLOR_TRUNC = '#000000';
export const MUT_COLOR_TRUNC_PASSENGER = '#708090';
export const MUT_COLOR_FUSION = '#8B00C9';
export const MUT_COLOR_PROMOTER = '#FFA942';

export const PROT_COLOR_UP = "#ff3df8";
export const PROT_COLOR_DOWN = "#00E1FF";

let non_mutation_rule_params = {
    // Default: gray rectangle
    '*': {
	shapes: [{
		'type': 'rectangle',
		'fill': 'rgba(190, 190, 190, 1)',
		'z': 1
	    }],
	legend_label: "No alterations"
    },
    // Copy number alteration
    'disp_cna': {
	// Red rectangle for amplification
	'amp': {
	    shapes: [{
		    'type': 'rectangle',
		    'fill': 'rgba(255,0,0,1)',
		    'x': '0%',
		    'y': '0%',
		    'width': '100%',
		    'height': '100%',
		    'z': 2,
		}],
	    legend_label: 'Amplification',
	},
	// Light red rectangle for gain
	'gain': {
	    shapes: [{
		    'type': 'rectangle',
		    'fill': 'rgba(255,182,193,1)',
		    'x': '0%',
		    'y': '0%',
		    'width': '100%',
		    'height': '100%',
		    'z': 2,
		}],
	    legend_label: 'Gain',
	},
	// Blue rectangle for deep deletion 
	'homdel': {
	    shapes: [{
		    'type': 'rectangle',
		    'fill': 'rgba(0,0,255,1)',
		    'x': '0%',
		    'y': '0%',
		    'width': '100%',
		    'height': '100%',
		    'z': 2,
		}],
	    legend_label: 'Deep Deletion',
	},
	// Light blue rectangle for shallow deletion
	'hetloss': {
	    shapes: [{
		    'type': 'rectangle',
		    'fill': 'rgba(143, 216, 216,1)',
		    'x': '0%',
		    'y': '0%',
		    'width': '100%',
		    'height': '100%',
		    'z': 2,
		}],
	    legend_label: 'Shallow Deletion',
	}
    },
    // mRNA regulation
    'disp_mrna': {
	// Light red outline for upregulation
	'up': {
	    shapes: [{
		    'type': 'rectangle',
		    'fill': 'rgba(0, 0, 0, 0)',
		    'stroke': 'rgba(255, 153, 153, 1)',
		    'stroke-width': '2',
		    'x': '0%',
		    'y': '0%',
		    'width': '100%',
		    'height': '100%',
		    'z': 3,
		}],
	    legend_label: 'mRNA Upregulation',
	},
	// Light blue outline for downregulation
	'down': {
	    shapes: [{
		    'type': 'rectangle',
		    'fill': 'rgba(0, 0, 0, 0)',
		    'stroke': 'rgba(102, 153, 204, 1)',
		    'stroke-width': '2',
		    'x': '0%',
		    'y': '0%',
		    'width': '100%',
		    'height': '100%',
		    'z': 3,
		}],
	    legend_label: 'mRNA Downregulation',
	},
    },
    // protein expression regulation
    'disp_prot': {
	// small up arrow for upregulated
	'up': {
	    shapes: [{
			'type': 'rectangle',
			'fill': PROT_COLOR_UP,
			'x':"0%",
			'y':"0%",
			'width':"100%",
			'height':"20%",
			'z': 4,
		}],
	    legend_label: 'Protein Upregulation',
	},
	// small down arrow for upregulated
	'down': {
	    shapes: [{
			'type': 'rectangle',
			'fill': PROT_COLOR_DOWN,
			'x':"0%",
			'y':"80%",
			'width':"100%",
			'height':"20%",
			'z': 4,
		}],
	    legend_label: 'Protein Downregulation',
	}
    },
    // fusion
    'disp_fusion': {
	// tall inset purple rectangle for fusion
	'true': {
	    shapes: [{
			'type': 'rectangle',
			'fill': MUT_COLOR_FUSION,
			'x': '0%',
			'y': '20%',
			'width': '100%',
			'height': '60%',
			'z': 5
		    }],
		legend_label: 'Fusion'
	}
    },
};

export const genetic_rule_set_same_color_for_all_no_recurrence:RuleSetParams = {
    'type':'gene',
    'legend_label': 'Genetic Alteration',
    'rule_params': $.extend({}, non_mutation_rule_params, {
	'disp_mut': {
	    'trunc,inframe,missense,promoter,trunc_rec,inframe_rec,missense_rec,promoter_rec': {
		shapes: [{
			'type': 'rectangle',
			'fill': MUT_COLOR_MISSENSE,
			'x': '0%',
			'y': '33.33%',
			'width': '100%',
			'height': '33.33%',
			'z': 6
		}],
		legend_label: 'Mutation'
	    }
	}
    })
};
export const genetic_rule_set_same_color_for_all_recurrence:RuleSetParams = {
    'type':'gene',
    'legend_label': 'Genetic Alteration',
    'rule_params': $.extend({}, non_mutation_rule_params, {
	'disp_mut': {
	    'missense_rec,inframe_rec,trunc_rec': {
		shapes: [{
			'type': 'rectangle',
			'fill': MUT_COLOR_MISSENSE,
			'x': '0%',
			'y': '33.33%',
			'width': '100%',
			'height': '33.33%',
			'z': 6
		}],
		legend_label: 'Mutation (putative driver)'
	    },
	    'missense,inframe,trunc,promoter,promoter_rec': { 
		shapes: [{
			'type': 'rectangle',
			'fill': MUT_COLOR_MISSENSE_PASSENGER,
			'x': '0%',
			'y': '33.33%',
			'width': '100%',
			'height': '33.33%',
			'z': 6
		}],
		legend_label: 'Mutation (putative passenger)'
	    },
	},
    })
};
export const genetic_rule_set_different_colors_no_recurrence:RuleSetParams = {
    'type':'gene',
    'legend_label': 'Genetic Alteration',
    'rule_params': $.extend({}, non_mutation_rule_params, {
	'disp_mut': {
	    'promoter,promoter_rec': {
		shapes: [{
			'type': 'rectangle',
			'fill': MUT_COLOR_PROMOTER,
			'x': '0%',
			'y': '33.33%',
			'width': '100%',
			'height': '33.33%',
			'z': 6,
		    }],
		legend_label: 'Promoter Mutation'
	    },
	    'trunc,trunc_rec': {
		shapes: [{
			'type': 'rectangle',
			'fill': MUT_COLOR_TRUNC,
			'x': '0%',
			'y': '33.33%',
			'width': '100%',
			'height': '33.33%',
			'z': 6,
		    }],
		legend_label: 'Truncating Mutation',
	    },
	    'inframe,inframe_rec': {
		shapes: [{
			'type': 'rectangle',
			'fill': MUT_COLOR_INFRAME,
			'x': '0%',
			'y': '33.33%',
			'width': '100%',
			'height': '33.33%',
			'z': 6,
		    }],
		legend_label: 'Inframe Mutation',
	    },
	    'missense,missense_rec': {
		shapes: [{
			'type': 'rectangle',
			'fill': MUT_COLOR_MISSENSE,
			'x': '0%',
			'y': '33.33%',
			'width': '100%',
			'height': '33.33%',
			'z': 6,
		    }],
		legend_label: 'Missense Mutation',
	    },
	}
    })
};
export const genetic_rule_set_different_colors_recurrence:RuleSetParams = {
    'type':'gene',
    'legend_label': 'Genetic Alteration',
    'rule_params': $.extend({}, non_mutation_rule_params, {
	'disp_mut': {
	    'promoter,promoter_rec': {
		shapes: [{
			'type': 'rectangle',
			'fill': MUT_COLOR_PROMOTER,
			'x': '0%',
			'y': '33.33%',
			'width': '100%',
			'height': '33.33%',
			'z': 6,
		    }],
		legend_label: 'Promoter Mutation'
	    },
	    'trunc_rec': {
		shapes: [{
			'type': 'rectangle',
			'fill': MUT_COLOR_TRUNC,
			'x': '0%',
			'y': '33.33%',
			'width': '100%',
			'height': '33.33%',
			'z': 6,
		    }],
		legend_label: 'Truncating Mutation (putative driver)',
	    },
	    'trunc': {
		shapes: [{
			'type': 'rectangle',
			'fill': MUT_COLOR_TRUNC_PASSENGER,
			'x': '0%',
			'y': '33.33%',
			'width': '100%',
			'height': '33.33%',
			'z': 6,
		    }],
		legend_label: 'Truncating Mutation (putative passenger)',
	    },
	    'inframe_rec': {
		shapes: [{
			'type': 'rectangle',
			'fill': MUT_COLOR_INFRAME,
			'x': '0%',
			'y': '33.33%',
			'width': '100%',
			'height': '33.33%',
			'z': 6,
		    }],
		legend_label: 'Inframe Mutation (putative driver)',
	    },
	    'inframe': {
		shapes: [{
			'type': 'rectangle',
			'fill': MUT_COLOR_INFRAME_PASSENGER,
			'x': '0%',
			'y': '33.33%',
			'width': '100%',
			'height': '33.33%',
			'z': 6,
		    }],
		legend_label: 'Inframe Mutation (putative passenger)',
	    },
	    'missense_rec': {
		shapes: [{
			'type': 'rectangle',
			'fill': MUT_COLOR_MISSENSE,
			'x': '0%',
			'y': '33.33%',
			'width': '100%',
			'height': '33.33%',
			'z': 6,
		    }],
		legend_label: 'Missense Mutation (putative driver)',
	    },
	    'missense': {
		shapes: [{
			'type': 'rectangle',
			'fill': MUT_COLOR_MISSENSE_PASSENGER,
			'x': '0%',
			'y': '33.33%',
			'width': '100%',
			'height': '33.33%',
			'z': 6,
		    }],
		legend_label: 'Missense Mutation (putative passenger)',
	    },
	}
    })
};
