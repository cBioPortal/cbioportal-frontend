/*
 * Copyright (c) 2015 Memorial Sloan-Kettering Cancer Center.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS
 * FOR A PARTICULAR PURPOSE. The software and documentation provided hereunder
 * is on an "as is" basis, and Memorial Sloan-Kettering Cancer Center has no
 * obligations to provide maintenance, support, updates, enhancements or
 * modifications. In no event shall Memorial Sloan-Kettering Cancer Center be
 * liable to any party for direct, indirect, special, incidental or
 * consequential damages, including lost profits, arising out of the use of this
 * software and its documentation, even if Memorial Sloan-Kettering Cancer
 * Center has been advised of the possibility of such damage.
 */

/*
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
 window.OncoprintSVGRenderer = (function() {
	var events = oncoprint_events;
	var utils = oncoprint_utils;

	var TOOLBAR_CONTAINER_CLASS = 'oncoprint-toolbar-ctr';
	var LABEL_AREA_CONTAINER_CLASS = 'oncoprint-label-area-ctr';
	var CELL_AREA_CONTAINER_CLASS = 'oncoprint-cell-area-ctr';
	var CELL_AREA_CLASS = 'oncoprint-cell-area';
	
	var CELL_HOVER_CLASS = 'oncoprint-cell-hover';
	var LEGEND_HEADER_CLASS = 'oncoprint-legend-header';
	var LABEL_DRAGGING_CLASS = 'oncoprint-label-dragging';
	var LABEL_DRAGGABLE_CLASS = 'oncoprint-label-draggable';
	var CELL_QTIP_CLASS = 'oncoprint-cell-qtip';

	function OncoprintSVGRenderer(container_selector_string, oncoprint, config) {
		OncoprintRenderer.call(this, oncoprint, config);
		var self = this;
		this.toolbar_container;
		this.label_div;
		this.label_container;
		this.cell_container;
		this.cell_container_node;
		this.cell_div;
		this.legend_table;
		this.document_fragment;

		d3.select(container_selector_string).selectAll('*').remove();
		(function initToolbarContainer() {
			self.toolbar_container = d3.select(container_selector_string).append('div').classed(TOOLBAR_CONTAINER_CLASS, true);
			d3.select(container_selector_string).append('br');
			/*$.ajax({url: "src/html/toolbar.html", context: document.body, success: function(response) {
				$(self.toolbar_container.node()).html(response);
			}});*/
		})();
		(function initLabelContainer() {
			self.label_container = d3.select(container_selector_string).append('div').classed(LABEL_AREA_CONTAINER_CLASS, true);
			self.label_div = self.label_container.append('div').style('position', 'relative').attr('viewport-fill', '#ffffff').style('overflow', 'hidden');
			$(self.label_div.node()).on("mousedown", 
				function startDraggingLabel(evt) {
					if (evt.stopPropagation) {
						evt.stopPropagation();
					}
					if (evt.preventDefault) {
						evt.preventDefault();
					}
					var to_drag = false;
					var track_tops = self.getTrackTops();
					//var mouse_y = utils.mouseY(evt);
					var mouse_y = evt.offsetY;
					_.find(track_tops, function(track_top, track_id) {
						track_id = parseInt(track_id);
						if (mouse_y >= track_top && mouse_y <= track_top + self.getRenderedTrackHeight(track_id)) {
							to_drag = track_id;
							return true;
						}
					});
					if (to_drag !== false) {
						if (self.oncoprint.getContainingTrackGroup(to_drag).length > 1) {
							self.dragLabel(to_drag);
						}
					}
				}
			);
		})();
		(function initCellContainer() {
			self.cell_container = d3.select(container_selector_string).append('div').classed(CELL_AREA_CONTAINER_CLASS, true);
			//self.cell_container.style('display', 'none');
			self.cell_container_node = self.cell_container.node();
			self.cell_div = self.cell_container.append('div').classed(CELL_AREA_CLASS, true);
			// TODO: magic number
			self.cell_div.style('max-width', '1000px');
		})();
		(function initLegend() {
			if (config.legend) {
				self.legend_table = d3.select(container_selector_string).append('table').style('border-collapse', 'collapse');
			}
		})();
		(function reactToOncoprint() {
			$(oncoprint).on(events.REMOVE_TRACK, function(evt, data) {
				delete self.rule_sets[data.track_id];
				throw "not implemented";
				self.render();
			});
			$(oncoprint).on(events.MOVE_TRACK, function(evt, data) {
				self.positionCells(data.moved_tracks, 'top');
				self.renderTrackLabels();
			});

			$(oncoprint).on(events.ADD_TRACK, function(e,d) {
				//this.cell_div.style('display', 'none');
				self.drawCells(d.track_id);
				self.positionCells();
				self.renderTrackLabels();
				self.resizeLabelDiv();
				//this.cell_div.style('display','inherit');
			});

			$(oncoprint).on(events.SET_TRACK_DATA, function(e,d) {
				//this.cell_div.style('display', 'none');
				self.drawCells(d.track_id);
				self.positionTrackCells(d.track_id);
				self.renderTrackLabels(d.track_id);
				self.resizeCellDiv();
				//this.cell_div.style('display','inherit');
			});


			$(oncoprint).on(events.SET_CELL_PADDING, function(e,d) {
				self.positionCells(undefined, 'left');
				self.resizeCellDiv();
			});

			$(oncoprint).on(events.SET_ZOOM, function(e,d) {
				self.positionCells(undefined, 'left');
				self.resizeCells();
				self.resizeCellDiv();
			});

			$(oncoprint).on(events.SET_ID_ORDER, function() {
				self.positionCells(undefined, 'left');
			})
		})();
	}
	utils.extends(OncoprintSVGRenderer, OncoprintRenderer);
	OncoprintSVGRenderer.prototype.getVisibleInterval = function() {
		var cell_unit = this.oncoprint.getZoomedCellWidth() + this.oncoprint.getCellPadding();
		var cell_ctr_rect = this.cell_container_node.getBoundingClientRect();
		var view_interval = [this.cell_container_node.scrollLeft, this.cell_container_node.scrollLeft + cell_ctr_rect.right - cell_ctr_rect.left];
		return view_interval;
	};
	OncoprintSVGRenderer.prototype.cellRenderTarget = function() {
		return d3.select(this.document_fragment || this.cell_div.node());
	};
	OncoprintSVGRenderer.prototype.suppressRendering = function() {
		this.document_fragment = document.createDocumentFragment();
	};
	OncoprintSVGRenderer.prototype.releaseRendering = function() {
		this.cell_div.node().appendChild(this.document_fragment);
		this.document_fragment = undefined;
		var self = this;
		$(this.cell_div.node()).ready(function() {
			console.log(self.cell_div.selectAll('.'+self.getCellCSSClass())[0].length);
			self.resizeCells();
			self.positionCells();
		});
	};
	// Rule sets
	OncoprintSVGRenderer.prototype.setRuleSet = function(track_id, type, params) {
		OncoprintRenderer.prototype.setRuleSet.call(this, track_id, type, params);
		this.renderLegend();
		//this.render(track_id);
	};
	OncoprintSVGRenderer.prototype.useSameRuleSet = function(target_track_id, source_track_id) {
		OncoprintRenderer.prototype.useSameRuleSet.call(this, target_track_id, source_track_id);
		this.renderLegend();
		//this.render(target_track_id);
	}

	// Containers
	OncoprintSVGRenderer.prototype.getLabelDiv = function() {
		return this.label_div;
	};
	OncoprintSVGRenderer.prototype.resizeCellDiv = function() {
		this.cell_div.style('min-width', this.getCellAreaWidth()+'px')
				.style('min-height', this.getCellAreaHeight()+'px');
	};
	OncoprintSVGRenderer.prototype.resizeLabelDiv = function() {
		this.getLabelDiv().style('width', this.getLabelAreaWidth()+'px')
				.style('height', this.getLabelAreaHeight()+'px');
	};

	// Labels
	OncoprintSVGRenderer.prototype.getTrackLabelCSSClass = function(track_id) {
		return OncoprintRenderer.prototype.getTrackLabelCSSClass.call(this, track_id)+' oncoprint-track-label-draggable';
	};
	OncoprintSVGRenderer.prototype.renderTrackLabels = function(track_ids, y) {
		var div = this.label_div;
		track_ids = typeof track_ids === "undefined" ? this.oncoprint.getTracks() : track_ids;
		if (typeof y !== "undefined") {
			div.selectAll(this.getTrackLabelCSSSelector(track_ids)).style('top', y+'px');
		} else {
			track_ids = [].concat(track_ids);
			var label_tops = this.getTrackLabelTops();
			var self = this;
			var label_area_width = this.getLabelAreaWidth();
			var percent_altered_left = label_area_width - utils.textWidth('100%', self.getLabelFont());
			_.each(track_ids, function(track_id) {
				var label_top = label_tops[track_id];
				var track_label_class = self.getTrackLabelCSSClass(track_id);
				div.selectAll(self.getTrackLabelCSSSelector(track_id)).remove();
				div.append('span')
					.style('position','absolute')
					.classed(self.getTrackLabelCSSClass(track_id), true)
					.classed('noselect', true)
					.style('font', self.getLabelFont())
					.text(self.oncoprint.getTrackLabel(track_id))
					.style('top', label_top+'px')
					.style('cursor', 'move');

				var rule_set = self.getRuleSet(track_id);
				if (rule_set && rule_set.alteredData) {
					var data = self.oncoprint.getTrackData(track_id);
					var num_altered = rule_set.alteredData(data).length;
					var percent_altered = Math.floor(100*num_altered/data.length);
					div.append('span')
						.style('position','absolute')
						.classed(self.getTrackLabelCSSClass(track_id), true)
						.classed('noselect', true)
						.style('font', self.getLabelFont())
						.text(percent_altered + '%')
						.style('top', label_top+'px')
						.style('left', percent_altered_left+'px');	
				}
			});
		}
	};

	// Cells
	OncoprintSVGRenderer.prototype.resizeCells = function(new_width) {
		this.cell_div.selectAll('svg.'+this.getCellCSSClass()).style('width', this.oncoprint.getZoomedCellWidth()+'px');
	};
	OncoprintSVGRenderer.prototype.drawTrackCells = function(track_id, fragment) {
		var oncoprint = this.oncoprint;
		var data = oncoprint.getTrackData(track_id);
		var id_key = oncoprint.getTrackDatumIdKey(track_id);
		var id_accessor = oncoprint.getTrackDatumIdAccessor(track_id);
		var rule_set = this.getRuleSet(track_id);
		if (!rule_set) {
			return;
		}
		var self = this;

		var cell_class = this.getCellCSSClass();
		var track_cell_class = this.getTrackCellCSSClass(track_id);


		//var bound_svg = this.cell_div.selectAll('svg.'+track_cell_class).data(data, id_accessor);
		var bound_svg = d3.select(fragment).selectAll('svg.'+track_cell_class).data(data, id_accessor);
		bound_svg.enter().append('svg').classed(track_cell_class, true).classed(cell_class, true);
		bound_svg.style('width', oncoprint.getZoomedCellWidth()+'px').style('height', oncoprint.getCellHeight(track_id)+'px');
		bound_svg
			.attr('preserveAspectRatio','none')
			.attr('viewBox', '0 0 '+oncoprint.getFullCellWidth()+' '+oncoprint.getCellHeight(track_id));

		var tooltip = this.oncoprint.getTrackTooltip(track_id);
		bound_svg.each(function(d,i) {
			var dom_cell = this;
			var id = id_accessor(d);
			if (tooltip) {
				var tooltip_html = tooltip(d);
				$(dom_cell).one("mouseover", function() {
					$(dom_cell).qtip({
						content: {
							text: tooltip_html
						},
						position: {my:'left bottom', at:'top middle', viewport: $(window)},
						style: { classes: CELL_QTIP_CLASS, border: 'none'},
						show: {event: "mouseover"},
						hide: {fixed: true, delay: 100, event: "mouseout"}
					});
					$(dom_cell).trigger("mouseover");
				});
			}
			$(dom_cell).on("mouseover", function() {
				d3.select(dom_cell).classed(CELL_HOVER_CLASS, true);
			});
			$(dom_cell).on("mouseout", function() {
				d3.select(dom_cell).classed(CELL_HOVER_CLASS, false);
			});		
		});
		bound_svg.selectAll('*').remove();
		rule_set.apply(bound_svg, data, id_accessor, oncoprint.getZoomedCellWidth(), oncoprint.getCellHeight(track_id));
	};
	OncoprintSVGRenderer.prototype.drawCells = function(track_ids) {
		var fragment = document.createDocumentFragment();
		track_ids = typeof track_ids === "undefined" ? this.oncoprint.getTracks() : track_ids;
		track_ids = [].concat(track_ids);
		var self = this;
		_.each(track_ids, function(track_id) {
			self.drawTrackCells(track_ids, fragment);
		});
		this.cellRenderTarget().node().appendChild(fragment);
	};

	// Positioning
	OncoprintSVGRenderer.prototype.positionTrackCells = function(track_id, axis) {
		var oncoprint = this.oncoprint;
		var bound_svg = this.cell_div.selectAll('svg.'+this.getTrackCellCSSClass(track_id))
					.data(oncoprint.getTrackData(track_id), oncoprint.getTrackDatumIdAccessor(track_id));
		var self = this;
		var id_key = oncoprint.getTrackDatumIdKey(track_id);
		var id_order = utils.invert_array(oncoprint.getIdOrder());
		var y = this.getTrackCellTops()[track_id];
		var visible_interval = this.getVisibleInterval();

		var in_view = function(i) {
			return i >= visible_interval[0] && i <= visible_interval[1];
		};
		var currently_in_view = function(node) {
			return !isNaN(parseInt(node.style.left)) && in_view(parseInt(node.style.left));
		};
		var left_fn = function(d) {
			return self.getCellX(id_order[d[id_key]]);
		};
		var coming_into_view = function(d) {
			return in_view(left_fn(d));
		};
		
		var animated = bound_svg.filter(function(d) {
			return currently_in_view(this) || coming_into_view(d);
		});
		var nonanimated = bound_svg.filter(function(d) {
			return !(currently_in_view(this) || coming_into_view(d));
		});
		
		var left_px_fn = function(d,i) {
			return left_fn(d)+'px';
		};
		if (!axis || axis === "left") {
			animated.style('left', left_px_fn)
			nonanimated.style('left', left_px_fn)
		}
		if (!axis || axis === "top") {
			animated.style('top', y+'px');
			nonanimated.style('top', y+'px');
		}
		// TODO: integrate transitions above
	};
	OncoprintSVGRenderer.prototype.positionCells = function(track_ids, axis) {
		track_ids = typeof track_ids === "undefined" ? this.oncoprint.getTracks() : track_ids;
		track_ids = [].concat(track_ids);
		var self = this;
		_.each(track_ids, function(track_id) {
			self.positionTrackCells(track_id, axis);
		});
	};

	OncoprintSVGRenderer.prototype.isTrackRenderable = function(track_id) {
		return this.getRuleSet(track_id) && this.oncoprint.getTrackData(track_id).length > 0;
	};
	OncoprintSVGRenderer.prototype.render = function(track_id) {
		// TODO: do this by for each track to render, render it, because there's stuff you should only get once like celltops
		var self = this;
		this.resizeLabelSVG();
		this.resizeCellDiv();

		this.cell_div.style('display', 'none');
		var renderTrack = function(track_id) {
			if (self.isTrackRenderable(track_id)) {
				self.drawTrackCells(track_id);
				self.positionTrackCells(track_id);
				self.renderTrackLabels(track_id);
			}
		};
		if (typeof track_id !== "undefined") {
			renderTrack(track_id);
		} else {
			_.each(this.oncoprint.getTracks(), function(track_id) {
				renderTrack(track_id);
			});
		}
		this.cell_div.style('display', 'inherit');
		this.renderLegend();
	};
	OncoprintSVGRenderer.prototype.renderLegend = function() {
		var cell_width = this.oncoprint.getZoomedCellWidth();
		var self = this;
		var rendered = {};
		self.legend_table.selectAll('*').remove();
		_.each(this.rule_sets, function(rule_set, track_id) {
			var rule_set_id = rule_set.getRuleSetId();
			if (!rendered.hasOwnProperty(rule_set_id)) {
				var tr = self.legend_table.append('tr');
				var label_header = tr.append('td').style('padding-top', '1em').style('padding-bottom', '1em')
							.append('h1').classed('oncoprint-legend-header', true);
				label_header.text(rule_set.getLegendLabel());
				var legend_body_td = tr.append('td');
				var legend_div = rule_set.getLegendDiv(cell_width, self.oncoprint.getCellHeight(track_id));
				legend_body_td.node().appendChild(legend_div);
				d3.select(legend_div).selectAll('*').classed('oncoprint-legend-element', true);
				rendered[rule_set_id] = true;
			}
		});
	};
	OncoprintSVGRenderer.prototype.dragLabel = function(track_id) {
		var track_group = this.oncoprint.getContainingTrackGroup(track_id);
		var first_track = track_group[0], last_track=track_group[track_group.length-1];
		var all_track_tops = this.getTrackLabelTops();
		var track_tops = {};
		_.each(track_group, function(id) { 
			track_tops[id] = all_track_tops[id];
		});
		track_group.splice(track_group.indexOf(track_id), 1);
		var group_track_tops = _.map(track_group, function(id) {
			return track_tops[id];
		});
		var label_area_height = this.getLabelAreaHeight();
		var drag_bounds = [undefined, undefined];
		drag_bounds[0] = utils.clamp(track_tops[first_track], 0, label_area_height);
		drag_bounds[1] = utils.clamp(track_tops[last_track]+this.getRenderedTrackHeight(last_track), 0, label_area_height);

		var self = this;
		var $label_div = $(self.label_div.node());
		delete track_tops[track_id];

		(function(track_id) {
			var new_pos = -1;
			var moveHandler = function(evt) {
				if (evt.stopPropagation) {
					evt.stopPropagation();
				}
				if (evt.preventDefault) {
					evt.preventDefault();
				}
				var mouse_y = utils.clamp(utils.mouseY(evt), drag_bounds[0], drag_bounds[1]);
				self.renderTrackLabels(track_id, mouse_y);
				d3.selectAll(self.getTrackLabelCSSSelector(track_id)).classed(LABEL_DRAGGING_CLASS, true);
				
				new_pos = _.sortedIndex(group_track_tops, mouse_y);
				_.each(track_tops, function(top, id) {
					top += 3*(+(new_pos < track_group.length && track_group[new_pos] == id));
					top -= 3*(+(new_pos > 0 && track_group[new_pos-1] == id));
					self.renderTrackLabels(id, top);
				});
			}
			$label_div.on("mousemove", moveHandler);
			$label_div.one("mouseleave mouseup", function(evt) {
				$label_div.off("mousemove", moveHandler);
				$label_div.off("mouseleave mouseup");
				if (new_pos > -1) {
					self.oncoprint.moveTrack(track_id, new_pos);
				}
			});
		})(track_id);
	};
	return OncoprintSVGRenderer;
})();