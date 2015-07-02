window.OncoprintSVGLegendRenderer = (function() {
	var events = oncoprint_events;
	var utils = oncoprint_utils;
}
OncoprintSVGRenderer.prototype.resizeLegendSVG = function() {
		var new_height = 0;
		var new_width = 0;
		var point = this.legend_svg.node().createSVGPoint();
		utils.d3SelectChildren(this.legend_svg, 'g').each(function() {
			point.x = 0;
			point.y = 0;
			point = point.matrixTransform(this.getCTM());
			var bbox = this.getBBox();
			new_height = Math.max(new_height, point.y + bbox.height);
			new_width = Math.max(new_width, point.x + bbox.width);
		});
		this.legend_svg.attr('width', new_width+'px').attr('height', new_height+'px');
	};
	OncoprintSVGRenderer.prototype.renderLegend = function() {
		var svg = this.legend_svg;
		svg.selectAll('*').remove();
		// <delete with less hacky solution that doesn't use bbox>
		svg.attr('width', 10000+'px').attr('height', 10000+'px');
		//</delete>
		var padding = 25;
		var y = padding;
		var rendered = {};
		var cell_width = this.oncoprint.getZoomedCellWidth();
		var self = this;
		_.each(this.rule_sets, function(rule_set, track_id) {
			var rule_set_id = rule_set.getRuleSetId();
			if (!rendered.hasOwnProperty(rule_set_id)) {
				var text = svg.append('text').classed(LEGEND_HEADER_CLASS, true).text(rule_set.getLegendLabel())
						.attr('transform', utils.translate(0,y));
				var group = rule_set.putLegendGroup(svg, cell_width, self.oncoprint.getCellHeight(track_id));
				rendered[rule_set_id] = true;
				group.attr('transform', utils.translate(200,y));
				var bounding_box = group.node().getBBox();
				y += bounding_box.height;
				y += padding;
			}
		});
		this.resizeLegendSVG();
	}
