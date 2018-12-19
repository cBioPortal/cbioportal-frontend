var $ = require('jquery');
var menuDotsIcon = require('../img/menudots.svg');

var TOGGLE_BTN_CLASS = "oncoprintjs__track_options__toggle_btn_img";
var TOGGLE_BTN_OPEN_CLASS = "oncoprintjs__track_options__open";
var DROPDOWN_CLASS = "oncoprintjs__track_options__dropdown";
var SEPARATOR_CLASS = "oncoprintjs__track_options__separator";
var NTH_CLASS_PREFIX = "nth-";

var OncoprintTrackOptionsView = (function () {
    function OncoprintTrackOptionsView($div, moveUpCallback, moveDownCallback, removeCallback, sortChangeCallback, unexpandCallback) {
	var position = $div.css('position');
	if (position !== 'absolute' && position !== 'relative') {
	    console.log("WARNING: div passed to OncoprintTrackOptionsView must be absolute or relative positioned - layout problems will occur");
	}

	this.moveUpCallback = moveUpCallback;
	this.moveDownCallback = moveDownCallback;
	this.removeCallback = removeCallback; // function(track_id) { ... }
	this.sortChangeCallback = sortChangeCallback; // function(track_id, dir) { ... }
	this.unexpandCallback = unexpandCallback; // function(track_id)

	this.$div = $div;
	this.$ctr = $('<div></div>').css({'position': 'absolute', 'overflow-y':'hidden', 'overflow-x':'hidden'}).appendTo(this.$div);
	this.$buttons_ctr = $('<div></div>').css({'position':'absolute'}).appendTo(this.$ctr);
	this.$dropdown_ctr = $('<div></div>').css({'position': 'absolute'}).appendTo(this.$div);

	this.img_size;

	this.rendering_suppressed = false;

	this.track_options_$elts = {};

	this.menu_shown = {};

	var self = this;
	this.clickHandler = function() {
        $(self).trigger('oncoprint-track-options-view.click-out');
    };
	$(document).on("click", this.clickHandler);

	this.interaction_disabled = false;
    }
    
    var renderAllOptions = function(view, model) {
	if (view.rendering_suppressed) {
	    return;
	}
	$(view).off('oncoprint-track-options-view.click-out');
	$(view).on('oncoprint-track-options-view.click-out', function() {
	     for (var track_id in view.track_options_$elts) {
		if (view.track_options_$elts.hasOwnProperty(track_id)) {
		    hideTrackMenu(view, track_id);
		}
	    }
	});
	
	view.$buttons_ctr.empty();
	view.$dropdown_ctr.empty();
	scroll(view, model.getVertScroll());

	var tracks = model.getTracks();
	var minimum_track_height = Number.POSITIVE_INFINITY;
	for (var i = 0; i < tracks.length; i++) {
	    minimum_track_height = Math.min(minimum_track_height, model.getTrackHeight(tracks[i]));
	}
	view.img_size = Math.floor(minimum_track_height * 0.75);

	for (var i = 0; i < tracks.length; i++) {
	    renderTrackOptions(view, model, tracks[i], i);
	}
    };

    var scroll = function (view, scroll_y) {
	if (view.rendering_suppressed) {
	    return;
	}
	view.$buttons_ctr.css({'top': -scroll_y});
	view.$dropdown_ctr.css({'top': -scroll_y});
    };

    var resize = function (view, model) {
	if (view.rendering_suppressed) {
	    return;
	}
	view.$div.css({'width': view.getWidth(), 'height': model.getCellViewHeight()});
	view.$ctr.css({'width': view.getWidth(), 'height': model.getCellViewHeight()});
    };

    var hideTrackMenu = function (view, track_id) {
	view.menu_shown[track_id] = false;
	var $elts = view.track_options_$elts[track_id];
	$elts.$dropdown.css({'z-index': 1});
	$elts.$dropdown.css({'border': '1px solid rgba(125,125,125,0)'});
	$elts.$img.css({'border': '1px solid rgba(125,125,125,0)'});
	$elts.$dropdown.fadeOut(100);
    };

    var showTrackMenu = function (view, track_id) {
	view.menu_shown[track_id] = true;
	var $elts = view.track_options_$elts[track_id];
	$elts.$dropdown.css({'z-index': 10});
	$elts.$dropdown.css({'border': '1px solid rgba(125,125,125,1)'});
	$elts.$img.css({'border': '1px solid rgba(125,125,125,1)'});
	$elts.$dropdown.fadeIn(100);
    };

    var hideMenusExcept = function (view, track_id) {
	track_id = track_id.toString();
	for (var other_track_id in view.track_options_$elts) {
	    if (view.track_options_$elts.hasOwnProperty(other_track_id)) {
		if (other_track_id === track_id) {
		    continue;
		}
		hideTrackMenu(view, other_track_id);
	    }
	}
    };

    var $makeDropdownOption = function (text, weight, disabled, callback) {
	var li = $('<li>').text(text).css({'font-weight': weight, 'font-size': 12, 'border-bottom': '1px solid rgba(0,0,0,0.3)'})
		if (!disabled) {
            if (callback) {
            	li.addClass("clickable");
                li.css({'cursor': 'pointer'});
				li.click(callback)
					.hover(function () {
						$(this).css({'background-color': 'rgb(200,200,200)'});
					}, function () {
						$(this).css({'background-color': 'rgba(255,255,255,0)'});
					});
			} else {
            	li.click(function(evt) { evt.stopPropagation(); });
			}
		} else {
			li.addClass("disabled");
			li.css({'color': 'rgb(200, 200, 200)', 'cursor': 'default'});
		}
	return li;
    };
    var $makeDropdownSeparator = function () {
	return $('<li>').css({'border-top': '1px solid black'}).addClass(SEPARATOR_CLASS);
    };

    var renderSortArrow = function($sortarrow, model, track_id) {
	var sortarrow_char = '';
	if (model.isTrackSortDirectionChangeable(track_id)){
	    sortarrow_char = {
		    '1': '<i class="fa fa-signal" aria-hidden="true" title="Sorted ascending"></i>',
		    '-1': '<i class="fa fa-signal" style="transform: scaleX(-1);" aria-hidden="true" title="Sorted descending"></i>',
		    '0': ''}[model.getTrackSortDirection(track_id)];
	}
	$sortarrow.html(sortarrow_char);
    }

    var renderTrackOptions = function (view, model, track_id, index) {
	var $div, $img, $sortarrow, $dropdown;
	var top = model.getZoomedTrackTops(track_id);
	$div = $('<div>').appendTo(view.$buttons_ctr).css({'position': 'absolute', 'left': '0px', 'top': top + 'px', 'white-space': 'nowrap'});
	$img = $('<img/>').appendTo($div)
		.attr({
			'src': menuDotsIcon,
			'width': view.img_size,
			'height': view.img_size
		})
		.css({
			'float': 'left',
			'cursor': 'pointer',
			'border': '1px solid rgba(125,125,125,0)'
		}).addClass(TOGGLE_BTN_CLASS).addClass(NTH_CLASS_PREFIX+(index+1));
	$sortarrow = $('<span>').appendTo($div).css({'position': 'absolute', 'top': Math.floor(view.img_size / 4) + 'px'});
	$dropdown = $('<ul>').appendTo(view.$dropdown_ctr)
		.css({
			'position':'absolute',
			'width': 120,
			'display': 'none',
			'list-style-type': 'none',
			'padding-left': '6',
			'padding-right': '6',
			'float': 'right',
			'background-color': 'rgb(255,255,255)',
			'left':'0px', 'top': top + view.img_size + 'px'
		}).addClass(DROPDOWN_CLASS).addClass(NTH_CLASS_PREFIX+(index+1));
	view.track_options_$elts[track_id] = {'$div': $div, '$img': $img, '$dropdown': $dropdown};

	renderSortArrow($sortarrow, model, track_id);

	$img.hover(function (evt) {
	    if (!view.menu_shown[track_id]) {
		$(this).css({'border': '1px solid rgba(125,125,125,0.3)'});
	    }
	}, function (evt) {
	    if (!view.menu_shown[track_id]) {
		$(this).css({'border': '1px solid rgba(125,125,125,0)'});
	    }
	});
	$img.click(function (evt) {
	    evt.stopPropagation();
	    if ($dropdown.is(":visible")) {
		$img.addClass(TOGGLE_BTN_OPEN_CLASS);
		hideTrackMenu(view, track_id);
	    } else {
		$img.removeClass(TOGGLE_BTN_OPEN_CLASS);
		showTrackMenu(view, track_id);
	    }
	    hideMenusExcept(view, track_id);
	});

	var movable = !model.isTrackInClusteredGroup(track_id);
	var sortable = movable; // for now movable and sortable are the same

	$dropdown.append($makeDropdownOption('Move up', 'normal', !movable, function (evt) {
	    evt.stopPropagation();
	    view.moveUpCallback(track_id);
	}));
	$dropdown.append($makeDropdownOption('Move down', 'normal', !movable, function (evt) {
	    evt.stopPropagation();
	    view.moveDownCallback(track_id);
	}));
	if (model.isTrackRemovable(track_id)) {
	    $dropdown.append($makeDropdownOption('Remove track', 'normal', false, function (evt) {
		evt.stopPropagation();
		view.removeCallback(track_id);
	    }));
	}
	if (model.isTrackSortDirectionChangeable(track_id)) {
	    $dropdown.append($makeDropdownSeparator());
	    var $sort_inc_li;
	    var $sort_dec_li;
	    var $dont_sort_li;
	    $sort_inc_li = $makeDropdownOption('Sort a-Z', (model.getTrackSortDirection(track_id) === 1 ? 'bold' : 'normal'), !sortable, function (evt) {
		evt.stopPropagation();
		$sort_inc_li.css('font-weight', 'bold');
		$sort_dec_li.css('font-weight', 'normal');
		$dont_sort_li.css('font-weight', 'normal');
		view.sortChangeCallback(track_id, 1);
		renderSortArrow($sortarrow, model, track_id);
	    });
	    $sort_dec_li = $makeDropdownOption('Sort Z-a', (model.getTrackSortDirection(track_id) === -1 ? 'bold' : 'normal'), !sortable, function (evt) {
		evt.stopPropagation();
		$sort_inc_li.css('font-weight', 'normal');
		$sort_dec_li.css('font-weight', 'bold');
		$dont_sort_li.css('font-weight', 'normal');
		view.sortChangeCallback(track_id, -1);
		renderSortArrow($sortarrow, model, track_id);
	    });
	    $dont_sort_li = $makeDropdownOption('Don\'t sort track', (model.getTrackSortDirection(track_id) === 0 ? 'bold' : 'normal'), !sortable, function (evt) {
		evt.stopPropagation();
		$sort_inc_li.css('font-weight', 'normal');
		$sort_dec_li.css('font-weight', 'normal');
		$dont_sort_li.css('font-weight', 'bold');
		view.sortChangeCallback(track_id, 0);
		renderSortArrow($sortarrow, model, track_id);
	    });
	    $dropdown.append($sort_inc_li);
	    $dropdown.append($sort_dec_li);
	    $dropdown.append($dont_sort_li);
	}
	if (model.isTrackExpandable(track_id)) {
	    $dropdown.append($makeDropdownOption(
		    model.getExpandButtonText(track_id),
		    'normal',
		    false,
		    function (evt) {
			evt.stopPropagation();
			// close the menu to discourage clicking again, as it
			// may take a moment to finish expanding
			renderAllOptions(view, model);
			model.expandTrack(track_id);
		    }));
	}
	if (model.isTrackExpanded(track_id)) {
	    $dropdown.append($makeDropdownOption(
		    'Remove expansion',
		    'normal',
		    false,
		    function (evt) {
			evt.stopPropagation();
			view.unexpandCallback(track_id);
		    }));
	}
	// Add custom options
	var custom_options = model.getTrackCustomOptions(track_id);
	if (custom_options && custom_options.length > 0) {
		for (var i=0; i<custom_options.length; i++) {
			(function() {
				// wrapped in function to prevent scope issues
				var option = custom_options[i];
				if (option.separator) {
					$dropdown.append($makeDropdownSeparator());
				} else {
					$dropdown.append($makeDropdownOption(option.label || "", option.weight || "normal", !!option.disabled, option.onClick && function (evt) {
						evt.stopPropagation();
						option.onClick(track_id);
					}));
				}
			})()
		}
	}
    };

    OncoprintTrackOptionsView.prototype.enableInteraction = function () {
	this.interaction_disabled = false;
    }
    OncoprintTrackOptionsView.prototype.disableInteraction = function () {
	this.interaction_disabled = true;
    }
    OncoprintTrackOptionsView.prototype.suppressRendering = function () {
	this.rendering_suppressed = true;
    }
    OncoprintTrackOptionsView.prototype.releaseRendering = function (model) {
	this.rendering_suppressed = false;
	renderAllOptions(this, model);
	resize(this, model);
	scroll(this, model.getVertScroll());
    }
    OncoprintTrackOptionsView.prototype.setScroll = function(model) {
	this.setVertScroll(model);
    }
    OncoprintTrackOptionsView.prototype.setHorzScroll = function (model) {
    }
    OncoprintTrackOptionsView.prototype.setVertScroll = function (model) {
	scroll(this, model.getVertScroll());
    }
    OncoprintTrackOptionsView.prototype.setZoom = function(model) {
	this.setVertZoom(model);
    }
    OncoprintTrackOptionsView.prototype.setVertZoom = function (model) {
	renderAllOptions(this, model);
	resize(this, model);
    }
    OncoprintTrackOptionsView.prototype.setViewport = function(model) {
	renderAllOptions(this, model);
	resize(this, model);
	scroll(this, model.getVertScroll());
    }
    OncoprintTrackOptionsView.prototype.getWidth = function () {
	return 18 + this.img_size;
    }
    OncoprintTrackOptionsView.prototype.addTracks = function (model) {
	renderAllOptions(this, model);
	resize(this, model);
    }
    OncoprintTrackOptionsView.prototype.moveTrack = function (model) {
	renderAllOptions(this, model);
	resize(this, model);
    }
    OncoprintTrackOptionsView.prototype.setTrackGroupOrder = function(model) {
	renderAllOptions(this, model);
    }
    OncoprintTrackOptionsView.prototype.setSortConfig = function(model) {
	renderAllOptions(this, model);
	}
    OncoprintTrackOptionsView.prototype.removeTrack = function(model, track_id) {
	delete this.track_options_$elts[track_id];
	renderAllOptions(this, model);
	resize(this, model);
    }
    OncoprintTrackOptionsView.prototype.destroy = function() {
    	$(document).off("click", this.clickHandler);
	};
    OncoprintTrackOptionsView.prototype.setTrackCustomOptions = function(model) {
    	renderAllOptions(this, model);
	};
    return OncoprintTrackOptionsView;
})();

module.exports = OncoprintTrackOptionsView;
