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
window.Oncoprint = (function() {
	var events = oncoprint_events;
	var utils = oncoprint_utils;
	var RuleSet = oncoprint_RuleSet;
	var defaults = oncoprint_defaults;

	var defaultOncoprintConfig = {
		cell_width: 6,
		cell_padding: 2.5,
		legend: true,
	};

	var hiddenOncoprintConfig = {
		pre_track_padding: 0,
	};

	var defaultTrackConfig = {
		label: 'Gene',
		datum_id_key: 'sample',
		cell_height: 23,
		track_height: 20,
		track_padding: 5,
		sort_cmp: undefined,
		tooltip: function(d) {
			return d['sample'];
		}
	}; 



	function Oncoprint(config) {
		var self = this;
		var getTrackId = utils.makeIdCounter();
		var MIN_CELL_WIDTH = 0.5;

		self.config = config;

		self.id_order = [];
		self.inverted_id_order = {};
		self.track_groups = [[],[]];
		self.track_group_sort_order = [0,1];
		self.sort_direction = {};
		self.tracks = {};

		self.zoom = 1;
		self.cell_padding_on = true;
		self.true_cell_width = config.cell_width;

		// Cell Padding
		self.toggleCellPadding = function() {
			self.cell_padding_on = !self.cell_padding_on;
			$(self).trigger(events.SET_CELL_PADDING);
		};
		self.getCellPadding = function() {
			return self.config.cell_padding*self.getZoomMultiplier()*(+self.cell_padding_on);
		};

		// Zoom
		self.getZoom = function() {
			return self.zoom;
		};
		self.getZoomMultiplier = function() {
			var min_over_max = MIN_CELL_WIDTH/self.getFullCellWidth();
			return (1-min_over_max)*self.zoom + min_over_max;
		};
		self.setZoom = function(z) {
			self.zoom = utils.clamp(z,0,1);
			$(self).trigger(events.SET_ZOOM);
		};

		// Cell Width
		self.getFullCellWidth = function() {
			return self.true_cell_width;
		};
		self.getZoomedCellWidth = function() {
			return self.true_cell_width*self.getZoomMultiplier();
		};

		// Cell Height
		self.getCellHeight = function(track_id) {
			return self.tracks[track_id].config.cell_height;
		};

		// Track Height
		self.getTrackHeight = function(track_id) {
			return self.tracks[track_id].config.track_height;
		};

		// Track Padding
		self.getTrackPadding = function(track_id) {
			return self.tracks[track_id].config.track_padding;
		};

		// Id Order
		self.getIdOrder = function() {
			return self.id_order.slice();
		};
		self.getInvertedIdOrder = function() {
			return self.inverted_id_order;
		};
		self.setIdOrder = function(id_order) {
			self.id_order = id_order.slice();
			self.inverted_id_order = utils.invert_array(self.id_order);
			$(self).trigger(events.SET_ID_ORDER);
		};

		// Sorting
		self.setTrackSortComparator = function(track_id, cmp) {
			self.tracks[track_id].config.sort_cmp = cmp;
		};
		self.getTrackSortComparator = function(track_id) {
			return self.tracks[track_id].config.sort_cmp;
		};
		self.toggleTrackSortDirection = function(track_id) {
			var dir = self.sort_direction[track_id];
			self.sort_direction[track_id] = -dir;
			$(self).trigger(events.SET_SORT_DIRECTION);
		};
		self.setTrackGroupSortOrder = function(order) {
			self.track_group_sort_order = order.slice();
		};
		self.getTrackGroupSortOrder = function() {
			return self.track_group_sort_order.slice();
		};
		self.getTrackSortOrder = function() {
			var ret = [];
			var track_groups = self.getTrackGroups();
			_.each(self.getTrackGroupSortOrder(), function(group_id) {
				ret = ret.concat(track_groups[group_id]);
			});
			return ret;
		};
		self.sortById = function(desc) {
			var ret = _.sortBy(self.getIdOrder(), _.identity);
			if (desc) {
				ret.reverse();
			}
			self.setIdOrder(ret);
		};
		self.sortByTrack = function() {
			var track_id_list = self.getTrackSortOrder();
			var cmp_list = _.map(track_id_list, function(track_id) { 
				return self.getTrackSortComparator(track_id);
			});
			var lexicographically_ordered_cmp = function(id1,id2) {
				var cmp_result = 0;
				for (var i=0, _len = track_id_list.length; i<_len; i++) {
					var track_id = track_id_list[i];
					var cmp = cmp_list[i];
					var d1 = self.getTrackDatum(track_id, id1);
					var d2 = self.getTrackDatum(track_id, id2);
					var d1_undef = (typeof d1 === "undefined");
					var d2_undef = (typeof d2 === "undefined");
					if (!d1_undef && !d2_undef) {
						cmp_result = cmp(self.getTrackDatum(track_id, id1),self.getTrackDatum(track_id, id2));
					} else if (d1_undef && d2_undef) {
						cmp_result = 0;
					} else if (d1_undef) {
						cmp_result = 1;
					} else {
						cmp_result = -1;
					}
					cmp_result *= self.sort_direction[track_id];
					if (cmp_result !== 0) {
						break;
					}
				}
				return cmp_result;
			};
			self.setIdOrder(utils.stableSort(self.getIdOrder(), lexicographically_ordered_cmp));
		};


		// Track Creation/Destruction
		self.addTrack = function(config, group) {
			group = utils.ifndef(group, 1);
			var track_id = getTrackId();
			self.tracks[track_id] ={id: track_id, data: [], config: $.extend({}, defaultTrackConfig, config)};
			self.track_groups[group].push(track_id);
			self.sort_direction[track_id] = 1;

			$(self).trigger(events.ADD_TRACK, {track_id: track_id});
			return track_id;
		};
		self.removeTrack = function(track_id) {
			var track = self.tracks[track_id];
			delete self.tracks[track_id];

			var track_group = self.getContainingTrackGroup(track_id, true);
			if (!track_group) {
				return false;
			} else {
				var old_position = track_group.indexOf(track_id);
				track_group.splice(old_position, 1);

				$(self).trigger(events.REMOVE_TRACK, {track: track, track_id: track_id});
				return true;	
			}
		};

		// Track Ordering
		self.getTrackGroups = function(reference) {
			return (reference === true ? self.track_groups : $.extend(true, [], self.track_groups));			
		};
		self.getTracks = function() {
			return _.flatten(self.getTrackGroups());
		};
		self.getContainingTrackGroup = function(track_id, reference) {
			var group = false;
			_.find(self.track_groups, function(grp) {
				if (grp.indexOf(track_id) > -1) {
					group = grp;
					return true;
				}
				return false;
			});
			return (reference === true ? group : group.slice());
		};
		self.moveTrack = function(track_id, new_position) {
			var track_group = self.getContainingTrackGroup(track_id, true);
			if (!track_group) {
				return false;
			}
			var old_position = track_group.indexOf(track_id);
			new_position = utils.clamp(new_position, 0, track_group.length-1);
			track_group.splice(old_position, 1);
			track_group.splice(new_position, 0, track_id);
			var moved_tracks = track_group.slice(Math.min(old_position, new_position), Math.max(old_position, new_position) + 1);
			$(self).trigger(events.MOVE_TRACK, {moved_tracks: moved_tracks});
		};


		// Track Label
		self.getTrackLabel = function(track_id) {
			return self.tracks[track_id].config.label;
		};

		// Track Tooltip
		self.getTrackTooltip = function(track_id) {
			return self.tracks[track_id].config.tooltip;
		};

		// Track Data
		self.getTrackData = function(track_id) {
			return self.tracks[track_id].data;
		};
		self.setTrackData = function(track_id, data) {
			var id_accessor = self.getTrackDatumIdAccessor(track_id);

			self.tracks[track_id].data = data;
			self.setIdOrder(self.id_order.concat(_.difference(_.map(data, id_accessor), self.id_order)));

			self.tracks[track_id].id_data_map = {};
			var id_data_map = self.tracks[track_id].id_data_map;
			_.each(self.tracks[track_id].data, function(datum) {
				id_data_map[id_accessor(datum)] = datum;
			});
			$(self).trigger(events.SET_TRACK_DATA, {track_id: track_id});
		};
		self.getTrackDatum = function(track_id, datum_id) {
			return self.tracks[track_id].id_data_map[datum_id];
		};
		self.getTrackDatumDataKey = function(track_id) {
			return self.tracks[track_id].config.datum_data_key;
		};

		// Track Datum Id
		self.getTrackDatumIdAccessor = function(track_id) {
			var key = self.getTrackDatumIdKey(track_id);
			return function(d) {
				return d[key];
			};
		};
		self.getTrackDatumIdKey = function(track_id) {
			return self.tracks[track_id].config.datum_id_key;
		};
	}

	return { 
		CATEGORICAL_COLOR: RuleSet.CATEGORICAL_COLOR,
		GRADIENT_COLOR: RuleSet.GRADIENT_COLOR,
		GENETIC_ALTERATION: RuleSet.GENETIC_ALTERATION,
		BAR_CHART: RuleSet.BAR_CHART,
		create: function CreateOncoprint(container_selector_string, config) {
			config = $.extend({}, defaultOncoprintConfig, config || {});
			config = $.extend(config, hiddenOncoprintConfig);
			var oncoprint = new Oncoprint(config);
			var renderer = new OncoprintSVGRenderer(container_selector_string, oncoprint, {label_font: '12px Arial', legend:config.legend});
			var ret = {
				onc_dev: oncoprint,
				ren_dev: renderer,
				addTrack: function(config, group) {
					var track_id = oncoprint.addTrack(config, group);
					return track_id;
				},
				removeTrack: function(track_id) {
					oncoprint.removeTrack(track_id);
				},
				moveTrack: function(track_id, position) {
					oncoprint.moveTrack(track_id, position);
				},
				setTrackData: function(track_id, data) {
					oncoprint.setTrackData(track_id, data);
				},
				setRuleSet: function(track_id, type, params) {
					renderer.setRuleSet(track_id, type, params);
				},
				useSameRuleSet: function(target_track_id, source_track_id) {
					renderer.useSameRuleSet(target_track_id, source_track_id);
				},
				toggleCellPadding: function() {
					oncoprint.toggleCellPadding();
				},
				toSVG: function(ctr) {
					return renderer.toSVG(ctr);
				},
				setTrackGroupSortOrder: function(order) {
					oncoprint.setTrackGroupSortOrder(order);
				},
				sortByTrack: function() {
					oncoprint.sortByTrack();
				},
				sortById: function() {
					oncoprint.sortById();
				},
				toggleTrackSortDirection: function(track_id) {
					oncoprint.toggleTrackSortDirection(track_id);
				},
				setZoom: function(z) {
					oncoprint.setZoom(z);
				},
				suppressRendering: function() {
					renderer.suppressRendering();
				},
				releaseRendering: function() {
					renderer.releaseRendering();
				},
				setLegendVisible: function(track_ids, visible) {
					renderer.setLegendVisible(track_ids, visible);
				}
			};
			$(oncoprint).on(events.MOVE_TRACK, function() {
				$(ret).trigger(events.MOVE_TRACK);
			});
			$(renderer).on(events.FINISHED_RENDERING, function() {
				$(ret).trigger(events.FINISHED_RENDERING);
			});
			return ret;
		}
	};
})();
