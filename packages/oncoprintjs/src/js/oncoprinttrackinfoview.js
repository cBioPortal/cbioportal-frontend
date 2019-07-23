var svgfactory = require('./svgfactory.js');
var $ = require('jquery');

var OncoprintTrackInfoView = (function () {
    function OncoprintTrackInfoView($div, tooltip) {
	this.$div = $div;
	this.tooltip = tooltip;
	this.tooltip.center = false;
	this.$ctr = $('<div></div>').css({'position': 'absolute', 'overflow-y':'hidden', 'overflow-x':'hidden'}).appendTo(this.$div);
	this.$text_ctr = $('<div></div>').css({'position':'absolute'}).appendTo(this.$ctr);
	this.base_font_size = 12;
	this.font_family = 'Arial';
	this.font_weight = 'bold';
	this.width = 0;

	this.$label_elts = [];

	this.rendering_suppressed = false;
    }

    var destroyLabelElts = function(view) {
        for (var i=0; i<view.$label_elts.length; i++) {
        	view.$label_elts[i].off("mousemove mouseleave");
		}
        view.$label_elts = [];
	}

    var renderAllInfo = function (view, model) {
	if (view.rendering_suppressed) {
	    return;
	}
	view.$text_ctr.empty();
	destroyLabelElts(view);

	var tracks = model.getTracks();
	view.minimum_track_height = Number.POSITIVE_INFINITY;
	for (var i = 0; i < tracks.length; i++) {
	    view.minimum_track_height = Math.min(view.minimum_track_height, model.getTrackHeight(tracks[i]));
	}

	view.width = 32;

	var label_tops = model.getLabelTops();
	scroll(view, model.getVertScroll());
	var font_size = view.getFontSize();
	for (var j = 0; j < tracks.length; j++) {
		(function() {
			var i = j;
			var $new_label = $('<span>').css({'position': 'absolute',
			'font-family': view.font_family,
			'font-weight': view.font_weight,
			'font-size': font_size})
				.addClass('noselect');
			$new_label.text(model.getTrackInfo(tracks[i]));
			$new_label.appendTo(view.$text_ctr);
			view.$label_elts.push($new_label);
			setTimeout(function() {
				$new_label.on("mousemove", function() {
					var $tooltip_elt = model.$getTrackInfoTooltip(tracks[i]);
					if ($tooltip_elt) {
						var offset = $new_label[0].getBoundingClientRect();
						view.tooltip.fadeIn(200, offset.left, offset.top, $tooltip_elt);
					}
				}).on("mouseleave", function() {
					view.tooltip.hideIfNotAlreadyGoingTo(150);
				});
			}, 0); // delay to give time for render before adding events
			var top = label_tops[tracks[i]] + (model.getCellHeight(tracks[i]) - $new_label.outerHeight()) / 2;
			$new_label.css({'top': top + 'px'});
			view.width = Math.max(view.width, $new_label[0].clientWidth);
		})();
	}
    };
    var scroll = function (view, scroll_y) {
	if (view.rendering_suppressed) {
	    return;
	}
	view.$text_ctr.css({'top': -scroll_y});
    };

    var resize = function (view, model) {
	if (view.rendering_suppressed) {
	    return;
	}
	view.$div.css({'width': view.getWidth(), 'height': model.getCellViewHeight()});
	view.$ctr.css({'width': view.getWidth(), 'height': model.getCellViewHeight()});
    };

    OncoprintTrackInfoView.prototype.getFontSize = function () {
	return Math.max(Math.min(this.base_font_size, this.minimum_track_height), 7);
    }
    OncoprintTrackInfoView.prototype.getWidth = function () {
	return this.width + 10;
    }
    OncoprintTrackInfoView.prototype.addTracks = function (model) {
	renderAllInfo(this, model);
	resize(this, model);
    }
    OncoprintTrackInfoView.prototype.moveTrack = function (model) {
	renderAllInfo(this, model);
	resize(this, model);
    }
    OncoprintTrackInfoView.prototype.setTrackGroupOrder = function(model) {
	renderAllInfo(this, model);
	resize(this, model);
    }
    OncoprintTrackInfoView.prototype.removeTrack = function (model) {
	renderAllInfo(this, model);
	resize(this, model);
    }
    OncoprintTrackInfoView.prototype.setTrackInfo = function (model) {
	renderAllInfo(this, model);
	resize(this, model);
    }
    OncoprintTrackInfoView.prototype.setScroll = function(model) {
	this.setVertScroll(model);
    }
    OncoprintTrackInfoView.prototype.setHorzScroll = function (model) {
    }
    OncoprintTrackInfoView.prototype.setVertScroll = function (model) {
	scroll(this, model.getVertScroll());
    }
    OncoprintTrackInfoView.prototype.setZoom = function(model) {
	this.setVertZoom(model);
    }
    
    OncoprintTrackInfoView.prototype.setViewport = function(model) {
	renderAllInfo(this, model);
	resize(this, model);
	scroll(this, model.getVertScroll());
    }
    OncoprintTrackInfoView.prototype.setVertZoom = function (model) {
	renderAllInfo(this, model);
	resize(this, model);
    }
    OncoprintTrackInfoView.prototype.suppressRendering = function () {
	this.rendering_suppressed = true;
    }
    OncoprintTrackInfoView.prototype.releaseRendering = function (model) {
	this.rendering_suppressed = false;
	renderAllInfo(this, model);
	resize(this, model);
	scroll(this, model.getVertScroll());
    }
    OncoprintTrackInfoView.prototype.destroy = function() {
    	destroyLabelElts(this);
	}
    OncoprintTrackInfoView.prototype.toSVGGroup = function (model, offset_x, offset_y) {
	var root = svgfactory.group((offset_x || 0), (offset_y || 0));
	var cell_tops = model.getCellTops();
	var tracks = model.getTracks();
	for (var i = 0; i < tracks.length; i++) {
	    var track_id = tracks[i];
	    var y = cell_tops[track_id] + model.getCellHeight(track_id) / 2;
	    var info = model.getTrackInfo(track_id);
	    var text_elt = svgfactory.text(info, 0, y, this.font_size, this.font_family, this.font_weight, "bottom");
	    text_elt.setAttribute("dy", "0.35em");
	    root.appendChild(text_elt);
	}
	return root;
    }
    return OncoprintTrackInfoView;
})();

module.exports = OncoprintTrackInfoView;
