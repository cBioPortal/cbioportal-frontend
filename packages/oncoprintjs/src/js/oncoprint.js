require('./polyfill.js');

var OncoprintModel = require('./oncoprintmodel.js');
var OncoprintWebGLCellView = require('./oncoprintwebglcellview.js');
var OncoprintLabelView = require('./oncoprintlabelview.js');
var OncoprintRuleSet = require('./oncoprintruleset.js');
var OncoprintTrackOptionsView = require('./oncoprinttrackoptionsview.js');
var OncoprintLegendView = require('./oncoprintlegendrenderer.js');//TODO: rename
var OncoprintToolTip = require('./oncoprinttooltip.js');
var OncoprintTrackInfoView = require('./oncoprinttrackinfoview.js');
var OncoprintMinimapView = require('./oncoprintminimapview.js');

var svgfactory = require('./svgfactory.js');

var $ = require('jquery');

var clamp = function(val, lower, upper) {
    return Math.min(Math.max(val, lower), upper);
};

var Oncoprint = (function () {
    // this is the controller
    var nextTrackId = (function () {
        var ctr = 0;
        return function () {
            ctr += 1;
            return ctr;
        }
    })();
    function Oncoprint(ctr_selector, width, params) {
        params = params || {};

        var self = this;

        this.destroyed = false;
        this.webgl_unavailable = (document.createElement('canvas').getContext('experimental-webgl') === null);
        if (this.webgl_unavailable) {
            $(ctr_selector).append("<p class='oncoprintjs__webgl_unavailable_message'>WebGL context cannot be retrieved, so oncoprint cannot be used. Please visit <a href='http://webglreport.com'>WebGL Report</a> to explore your browsers WebGL capabilities.</p>");
            return;
        }

        this.ctr_selector = ctr_selector;

        var $ctr = $('<span></span>').css({'position':'relative', 'display':'inline-block'}).appendTo(ctr_selector);
        var $oncoprint_ctr = $('<div></div>')
            .css({'position':'absolute', 'display':'inline-block'})
            .appendTo($ctr);

        var $tooltip_ctr = $('<span></span>').css({'position':'fixed', 'top':0, 'left':0, "z-index":99999}).appendTo(ctr_selector);
        var $legend_ctr = $('<div></div>').css({'position':'absolute', 'display':'inline-block', 'top':0, 'left':0, 'min-height':1})
            .appendTo($ctr);

        var $label_canvas = $('<canvas></canvas>')
            .css({'display':'inline-block',
                'position':'absolute',
                'left':'0px',
                'top':'0px'})
            .addClass("noselect")
            .attr({'width':'150', 'height':'250'});

        var $track_options_div = $('<div></div>')
            .css({'position':'absolute',
                'left':'150px',
                'top':'0px'})
            .addClass("noselect")
            .attr({'width':'50', 'height':'250'});

        var $legend_div = $('<div></div>')
            .css({'position':'absolute',
                'top':'250px',
                'min-height':1})
            .addClass("noselect oncoprint-legend-div");

        var $cell_div = $('<div>')
            .css({'width':width,
                'display':'inline-block',
                'position':'absolute',
                'left':'200px',
                'top':'0px'})
            .addClass("noselect");

        var $cell_canvas = $('<canvas></canvas>')
            .attr({'width':'0px', 'height':'0px'})
            .css({'position':'absolute', 'top':'0px', 'left':'0px'})
            .addClass("noselect");

        var $dummy_scroll_div = $('<div>')
            .css({'position':'absolute',
                'overflow-x':'scroll',
                'overflow-y':'scroll',
                'top':'0',
                'left':'0px',
                'height':'1px',
            }).addClass('oncoprintjs__scroll_div');

        var $dummy_scroll_div_contents = $('<div>').appendTo($dummy_scroll_div);

        var $cell_overlay_canvas = $('<canvas></canvas>')
            .attr({'width':'0px', 'height':'0px'})
            .css({'position':'absolute',
                'top':'0px',
                'left':'0px'})
            .addClass("noselect")
            .addClass('oncoprintjs__cell_overlay_div');

        var $column_label_canvas = $('<canvas></canvas>')
            .attr({'width':'0px', 'height':'0px'})
            .css({'position':'absolute',
                'top':'0px',
                'left':'0px'})
            .addClass("noselect")
            .addClass('oncoprintjs__column_label_canvas');

        var $track_info_div = $('<div>')
            .css({'position':'absolute'});

        var $minimap_div = $('<div>').css({'position':'absolute', 'outline':'solid 1px black', 'display': 'none'}).addClass("noselect");

        var $minimap_canvas = $('<canvas></canvas>')
            .attr('width', 300)
            .attr('height', 300)
            .css({'position':'absolute', 'top':'0px', 'left':'0px', 'z-index':0})
            .addClass("noselect");
        var $minimap_overlay_canvas = $('<canvas></canvas>')
            .attr('width', 300)
            .attr('height', 300)
            .css({'position': 'absolute', 'top':'0px', 'left':'0px', 'z-index':1})
            .addClass("noselect");

        $label_canvas.appendTo($oncoprint_ctr);
        $cell_div.appendTo($oncoprint_ctr);
        $track_options_div.appendTo($oncoprint_ctr);
        $track_info_div.appendTo($oncoprint_ctr);

        $legend_div.appendTo($legend_ctr);

        $minimap_div.appendTo($ctr);

        $cell_canvas.appendTo($cell_div);
        $cell_overlay_canvas.appendTo($cell_div);
        $column_label_canvas.appendTo($cell_div);
        $dummy_scroll_div.appendTo($cell_div);
        $dummy_scroll_div.on("mousemove mousedown mouseup", function(evt) {
            $cell_overlay_canvas.trigger(evt);
        });
        $minimap_canvas.appendTo($minimap_div);
        $minimap_overlay_canvas.appendTo($minimap_div);

        this.$ctr = $ctr;
        this.$oncoprint_ctr = $oncoprint_ctr;
        this.$cell_div = $cell_div;
        this.$legend_div = $legend_div;
        this.$track_options_div = $track_options_div;
        this.$track_info_div = $track_info_div;
        this.$dummy_scroll_div = $dummy_scroll_div;
        this.$minimap_div = $minimap_div;



        this.$cell_canvas = $cell_canvas;
        this.$cell_overlay_canvas = $cell_overlay_canvas;

        this.model = new OncoprintModel(params);

        this.cell_view = new OncoprintWebGLCellView($cell_div, $cell_canvas, $cell_overlay_canvas, $column_label_canvas, $dummy_scroll_div_contents, this.model, new OncoprintToolTip($tooltip_ctr), function(left, right) {
                var enclosed_ids = self.model.getIdsInLeftInterval(left, right);
                self.setHorzZoom(self.model.getHorzZoomToFit(self.cell_view.visible_area_width, enclosed_ids));
                self.$dummy_scroll_div.scrollLeft(self.model.getZoomedColumnLeft(enclosed_ids[0]));
                self.id_clipboard = enclosed_ids;
            },
            function(uid, track_id) {
                doCellMouseOver(self, uid, track_id);
            },
            function(uid, track_id) {
                doCellClick(self, uid, track_id);
            }
        );

        this.minimap_view = new OncoprintMinimapView($minimap_div, $minimap_canvas, $minimap_overlay_canvas, this.model, this.cell_view, 150, 150, function(x,y) {
                self.setScroll(x,y);
            },
            function(vp) {
                self.setViewport(vp.col,vp.scroll_y_proportion,vp.num_cols, vp.zoom_y);
            },
            function(val) {
                var prev_viewport = self.cell_view.getViewportOncoprintSpace(self.model);
                var prev_center_onc_space = (prev_viewport.left + prev_viewport.right) / 2;
                var center_column = Math.floor(prev_center_onc_space / (self.model.getCellWidth(true) + self.model.getCellPadding(true)));
                self.setHorzZoom(val);
                var viewport = self.cell_view.getViewportOncoprintSpace(self.model);
                var center_column_x_zoomed = center_column * (self.model.getCellWidth() + self.model.getCellPadding());
                var half_viewport_width_zoomed = self.model.getHorzZoom() * (viewport.right - viewport.left) / 2;

                self.setHorzScroll(center_column_x_zoomed - half_viewport_width_zoomed);
            },
            function(val) {
                var prev_viewport = self.cell_view.getViewportOncoprintSpace(self.model);
                var center_onc_space = (prev_viewport.top + prev_viewport.bottom) / 2;
                self.setVertZoom(val);
                var viewport = self.cell_view.getViewportOncoprintSpace(self.model);
                var half_viewport_height_zoomed = self.model.getVertZoom() * (viewport.bottom - viewport.top) / 2;

                self.setVertScroll(center_onc_space * self.model.getVertZoom() - half_viewport_height_zoomed);
            },
            function() {
                updateHorzZoomToFit(self);
                var left = self.model.getZoomedColumnLeft();
                self.setHorzScroll(Math.min.apply(null, self.keep_horz_zoomed_to_fit_ids.map(function(id) { return left[id]; })));
            },
            function() {
                self.setMinimapVisible(false);
            });
        /*this.minimap_view = {};
        var methods = ['moveTrack','addTracks','removeTrack','setHorzZoom','setVertZoom','setScroll','setZoom','setHorzScroll','setVertScroll','setTrackData','sort','shareRuleSet','setRuleSet','setIdOrder','suppressRendering','releaseRendering','hideIds'];
        for (var i=0; i<methods.length; i++) {
            this.minimap_view[methods[i]] = function(){};
        }*/

        this.track_options_view = new OncoprintTrackOptionsView($track_options_div,
            function (track_id) {
                // move up
                var tracks = self.model.getContainingTrackGroup(track_id);
                var index = tracks.indexOf(track_id);
                if (index > 0) {
                    var new_previous_track = null;
                    if (index >= 2) {
                        new_previous_track = tracks[index-2];
                    }
                    self.moveTrack(track_id, new_previous_track);
                }
            },
            function (track_id) {
                // move down
                var tracks = self.model.getContainingTrackGroup(track_id);
                var index = tracks.indexOf(track_id);
                if (index < tracks.length - 1) {
                    self.moveTrack(track_id, tracks[index+1]);
                }
            },
            function (track_id) { self.removeTrack(track_id); },
            function (track_id, dir) { self.setTrackSortDirection(track_id, dir); },
            function (track_id) { self.removeExpansionTracksFor(track_id); });
        this.track_info_view = new OncoprintTrackInfoView($track_info_div, new OncoprintToolTip($tooltip_ctr));

        //this.track_info_view = new OncoprintTrackInfoView($track_info_div);

        this.label_view = new OncoprintLabelView($label_canvas, this.model, new OncoprintToolTip($tooltip_ctr, {noselect: true}));
        this.label_view.setDragCallback(function(target_track, new_previous_track) {
            self.moveTrack(target_track, new_previous_track);
        });

        this.legend_view = new OncoprintLegendView($legend_div, 10, 20);

        this.keep_sorted = false;

        this.keep_horz_zoomed_to_fit = false;
        this.keep_horz_zoomed_to_fit_ids = [];

        // We need to handle scrolling this way because for some reason huge
        //  canvas elements have terrible resolution.
        var cell_view = this.cell_view;
        var model = this.model;

        this.target_dummy_scroll_left = 0;
        this.target_dummy_scroll_top = 0;

        (function setUpOncoprintScroll(oncoprint) {
            $dummy_scroll_div.scroll(function (e) {
                var dummy_scroll_left = $dummy_scroll_div.scrollLeft();
                var dummy_scroll_top = $dummy_scroll_div.scrollTop();
                if (dummy_scroll_left !== self.target_dummy_scroll_left || dummy_scroll_top !== self.target_dummy_scroll_top) {
                    // In setDummyScrollDivScroll, where we intend to set the scroll programmatically without
                    //	triggering the handler, we set target_dummy_scroll_left and target_dummy_scroll_top,
                    //	so if they're not set (we get inside this block), then it's a user-triggered scroll.
                    //
                    // Set oncoprint scroll to match
                    self.target_dummy_scroll_left = dummy_scroll_left;
                    self.target_dummy_scroll_top = dummy_scroll_top;
                    var maximum_dummy_scroll_div_scroll = maxDummyScrollDivScroll(oncoprint);
                    var maximum_div_scroll_left = maximum_dummy_scroll_div_scroll.left;
                    var maximum_div_scroll_top = maximum_dummy_scroll_div_scroll.top;
                    var scroll_left_prop = maximum_div_scroll_left > 0 ? dummy_scroll_left / maximum_div_scroll_left : 0;
                    var scroll_top_prop = maximum_div_scroll_top > 0 ? dummy_scroll_top / maximum_div_scroll_top : 0;
                    scroll_left_prop = clamp(scroll_left_prop, 0, 1);
                    scroll_top_prop = clamp(scroll_top_prop, 0, 1);
                    var maximum_scroll_left = maxOncoprintScrollLeft(self);
                    var maximum_scroll_top = maxOncoprintScrollTop(self);
                    var scroll_left = Math.round(maximum_scroll_left * scroll_left_prop);
                    var scroll_top = Math.round(maximum_scroll_top * scroll_top_prop);
                    self.keep_horz_zoomed_to_fit = false;

                    doSetScroll(self, scroll_left, scroll_top);
                }
            });
        })(self);

        this.horz_zoom_callbacks = [];
        this.minimap_close_callbacks = [];
        this.cell_mouse_over_callbacks = [];
        this.cell_click_callbacks = [];

        this.id_clipboard = [];
        this.clipboard_change_callbacks = [];

        this.pending_resize_and_organize = false;

        this.width = width;
    }

    var _SetLegendTop = function (oncoprint) {
        if (oncoprint.model.rendering_suppressed_depth > 0) {
            return;
        }
        oncoprint.$legend_div.css({'top': oncoprint.cell_view.getVisibleAreaHeight(oncoprint.model) + 30});
    };
    var setLegendTopAfterTimeout = function (oncoprint) {
        if (oncoprint.model.rendering_suppressed_depth > 0) {
            return;
        }
        setTimeout(function () {
            setHeight(oncoprint);
            _SetLegendTop(oncoprint);
        }, 0);
    };

    var setHeight = function(oncoprint) {
        oncoprint.$ctr.css({'min-height': oncoprint.cell_view.getVisibleAreaHeight(oncoprint.model) + Math.max(oncoprint.$legend_div.outerHeight(), (oncoprint.$minimap_div.is(":visible") ? oncoprint.$minimap_div.outerHeight() : 0)) + 30});
    };

    var resizeAndOrganize = function (oncoprint, onComplete) {
        if (oncoprint.model.rendering_suppressed_depth > 0) {
            return;
        }
        var ctr_width = $(oncoprint.ctr_selector).width();
        if (ctr_width === 0) {
            // dont make any adjustments while oncoprint is offscreen, DOM size calculations would be messed up
            oncoprint.pending_resize_and_organize = true;
            return;
        }
        oncoprint.$track_options_div.css({'left': oncoprint.label_view.getWidth()});
        oncoprint.$track_info_div.css({'left': oncoprint.label_view.getWidth() + oncoprint.track_options_view.getWidth()});
        var cell_div_left = oncoprint.label_view.getWidth() + oncoprint.track_options_view.getWidth() + oncoprint.track_info_view.getWidth();
        oncoprint.$cell_div.css('left', cell_div_left);
        oncoprint.cell_view.setWidth(oncoprint.width - cell_div_left - 20, oncoprint.model);

        _SetLegendTop(oncoprint);
        oncoprint.legend_view.setWidth(oncoprint.width - oncoprint.$minimap_div.outerWidth() - 20, oncoprint.model);

        setHeight(oncoprint);
        oncoprint.$ctr.css({'min-width': oncoprint.width});

        setTimeout(function () {
            if (oncoprint.keep_horz_zoomed_to_fit) {
                updateHorzZoomToFit(oncoprint);
            }
            onComplete && onComplete();
        }, 0);
    };

    var resizeAndOrganizeAfterTimeout = function (oncoprint, onComplete) {
        if (oncoprint.model.rendering_suppressed_depth > 0) {
            return;
        }
        setTimeout(function () {
            resizeAndOrganize(oncoprint, onComplete);
        }, 0);
    };

    var maxOncoprintScrollLeft = function(oncoprint) {
        return Math.max(0, oncoprint.cell_view.getTotalWidth(oncoprint.model) - oncoprint.cell_view.getVisibleAreaWidth());
    };

    var maxOncoprintScrollTop = function(oncoprint) {
        return Math.max(0, oncoprint.cell_view.getTotalHeight(oncoprint.model)-oncoprint.cell_view.getVisibleAreaHeight(oncoprint.model));
    };

    var maxDummyScrollDivScroll = function(oncoprint) {
        var dummy_scroll_div_client_size = oncoprint.cell_view.getDummyScrollDivClientSize();
        var maximum_div_scroll_left = Math.max(0, (oncoprint.$dummy_scroll_div[0].scrollWidth - dummy_scroll_div_client_size.width));
        var maximum_div_scroll_top = Math.max(0, (oncoprint.$dummy_scroll_div[0].scrollHeight - dummy_scroll_div_client_size.height));
        return {'left': maximum_div_scroll_left, 'top': maximum_div_scroll_top};
    };

    Oncoprint.prototype.setMinimapVisible = function (visible) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        if (visible) {
            this.$minimap_div.css({'display': 'block', 'top': this.cell_view.getVisibleAreaHeight(this.model) + 30, 'left': $(this.ctr_selector).width() - this.$minimap_div.outerWidth() - 10});
        } else {
            this.$minimap_div.css('display', 'none');
            executeMinimapCloseCallbacks(this);
        }
        resizeAndOrganizeAfterTimeout(this);
    }

    Oncoprint.prototype.scrollTo = function(left) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.$dummy_scroll_div.scrollLeft(left);
    }
    Oncoprint.prototype.onHorzZoom = function(callback) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.horz_zoom_callbacks.push(callback);
    }
    Oncoprint.prototype.onMinimapClose = function(callback) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.minimap_close_callbacks.push(callback);
    }
    Oncoprint.prototype.moveTrack = function(target_track, new_previous_track) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.moveTrack(target_track, new_previous_track);
        this.cell_view.moveTrack(this.model);
        this.label_view.moveTrack(this.model);
        this.track_options_view.moveTrack(this.model);
        this.track_info_view.moveTrack(this.model);
        this.minimap_view.moveTrack(this.model, this.cell_view);

        if (this.keep_sorted && this.model.isSortAffected([target_track, new_previous_track], "track")) {
            this.sort();
        }

        resizeAndOrganizeAfterTimeout(this);
    }
    Oncoprint.prototype.setTrackGroupOrder = function(index, track_order, dont_sort) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.setTrackGroupOrder(index, track_order);
        this.cell_view.setTrackGroupOrder(this.model);
        this.label_view.setTrackGroupOrder(this.model);
        this.track_options_view.setTrackGroupOrder(this.model);
        this.track_info_view.setTrackGroupOrder(this.model);

        if (!dont_sort && this.keep_sorted && this.model.isSortAffected(index, "group")) {
            this.sort();
        }

        resizeAndOrganizeAfterTimeout(this);
    }
    Oncoprint.prototype.setTrackGroupLegendOrder = function(group_order) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.setTrackGroupLegendOrder(group_order);
        this.legend_view.setTrackGroupLegendOrder(this.model);

        resizeAndOrganizeAfterTimeout(this);
    }

    Oncoprint.prototype.keepSorted = function(keep_sorted) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.keep_sorted = (typeof keep_sorted === 'undefined' ? true : keep_sorted);
        if (this.keep_sorted) {
            this.sort();
        }
    }

    Oncoprint.prototype.addTracks = function (params_list) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        // Update model
        var track_ids = [];
        params_list = params_list.map(function (o) {
            o.track_id = nextTrackId();
            o.rule_set = OncoprintRuleSet(o.rule_set_params);
            track_ids.push(o.track_id);
            return o;
        });

        this.model.addTracks(params_list);
        // Update views
        this.cell_view.addTracks(this.model, track_ids);
        this.label_view.addTracks(this.model, track_ids);
        this.track_options_view.addTracks(this.model);
        this.track_info_view.addTracks(this.model);
        this.legend_view.addTracks(this.model);
        this.minimap_view.addTracks(this.model, this.cell_view);

        if (this.keep_sorted && this.model.isSortAffected(track_ids, "track")) {
            this.sort();
        }
        resizeAndOrganizeAfterTimeout(this);
        return track_ids;
    }

    Oncoprint.prototype.removeTrack = function (track_id) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        // Update model
        this.model.removeTrack(track_id);
        // Update views
        this.cell_view.removeTrack(this.model, track_id);
        this.label_view.removeTrack(this.model, track_id);
        this.track_options_view.removeTrack(this.model, track_id);
        this.track_info_view.removeTrack(this.model);
        this.legend_view.removeTrack(this.model);
        this.minimap_view.removeTrack(this.model, this.cell_view);

        if (this.keep_sorted && this.model.isSortAffected(track_id, "track")) {
            this.sort();
        }
        resizeAndOrganizeAfterTimeout(this);
    }

    Oncoprint.prototype.removeTracks = function(track_ids) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.keepSorted(false);
        this.suppressRendering();
        for (var i=0; i<track_ids.length; i++) {
            this.removeTrack(track_ids[i]);
        }
        this.keepSorted(true);
        this.releaseRendering();
    }

    Oncoprint.prototype.getTracks = function() {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        return this.model.getTracks().slice();
    }

    Oncoprint.prototype.removeAllTracks = function() {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        var track_ids = this.model.getTracks();
        this.removeTracks(track_ids);
    }

    Oncoprint.prototype.removeExpansionTracksFor = function (track_id) {
        // remove all expansion tracks for this track
        this.removeTracks(this.model.track_expansion_tracks[track_id].slice());
    }

    Oncoprint.prototype.disableTrackExpansion = function (track_id) {
        this.model.disableTrackExpansion(track_id);
    }

    Oncoprint.prototype.enableTrackExpansion = function (track_id) {
        this.model.enableTrackExpansion(track_id);
    }

    Oncoprint.prototype.removeAllExpansionTracksInGroup = function (index) {
        var tracks_in_group = this.model.getTrackGroups()[index],
            expanded_tracks = [],
            i;
        for (i = 0; i < tracks_in_group.length ; i++) {
            if (this.model.isTrackExpanded(tracks_in_group[i])) {
                expanded_tracks.push(tracks_in_group[i]);
            }
        }
        this.suppressRendering();
        for (i = 0; i < expanded_tracks.length; i++) {
            // assume that the expanded tracks are not themselves removed here
            this.removeExpansionTracksFor(expanded_tracks[i]);
        }
        this.releaseRendering();
    }

    Oncoprint.prototype.setHorzZoomToFit = function(ids) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.keep_horz_zoomed_to_fit = true;
        this.updateHorzZoomToFitIds(ids);
        updateHorzZoomToFit(this);
    }
    Oncoprint.prototype.updateHorzZoomToFitIds = function(ids) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.keep_horz_zoomed_to_fit_ids = ids.slice();
        if (this.keep_horz_zoomed_to_fit) {
            updateHorzZoomToFit(this);
        }
    }
    var updateHorzZoomToFit = function(oncoprint) {
        oncoprint.setHorzZoom(getHorzZoomToFit(oncoprint, oncoprint.keep_horz_zoomed_to_fit_ids), true);
    };
    var getHorzZoomToFit = function(oncoprint, ids) {
        ids = ids || [];
        return oncoprint.model.getHorzZoomToFit(oncoprint.cell_view.visible_area_width, ids);
    }
    var executeHorzZoomCallbacks = function(oncoprint) {
        for (var i=0; i<oncoprint.horz_zoom_callbacks.length; i++) {
            oncoprint.horz_zoom_callbacks[i](oncoprint.model.getHorzZoom());
        }
    };

    var executeMinimapCloseCallbacks = function(oncoprint) {
        for (var i=0; i<oncoprint.minimap_close_callbacks.length; i++) {
            oncoprint.minimap_close_callbacks[i]();
        }
    };

    var doCellMouseOver = function(oncoprint, uid, track_id) {
        if (uid !== null) {
            oncoprint.highlightTrack(track_id);
        } else {
            oncoprint.highlightTrack(null);
        }
        for (var i=0; i<oncoprint.cell_mouse_over_callbacks.length; i++) {
            oncoprint.cell_mouse_over_callbacks[i](uid, track_id);
        }
    };

    var doCellClick = function(oncoprint, uid, track_id) {
        for (var i=0; i<oncoprint.cell_click_callbacks.length; i++) {
            oncoprint.cell_click_callbacks[i](uid, track_id);
        }
    };

    Oncoprint.prototype.getHorzZoom = function () {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        return this.model.getHorzZoom();
    }


    Oncoprint.prototype.setHorzZoom = function (z, still_keep_horz_zoomed_to_fit) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.keep_horz_zoomed_to_fit = this.keep_horz_zoomed_to_fit && still_keep_horz_zoomed_to_fit

        if (this.model.getHorzZoom() !== z) {
            // Update model if new zoom is different
            this.model.setHorzZoom(z);
            // Update views
            this.cell_view.setHorzZoom(this.model);
            this.minimap_view.setHorzZoom(this.model, this.cell_view);

            executeHorzZoomCallbacks(this);
            resizeAndOrganizeAfterTimeout(this);
        }
        return this.model.getHorzZoom();
    }

    Oncoprint.prototype.getVertZoom = function () {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        return this.model.getVertZoom();
    }

    Oncoprint.prototype.setVertZoom = function (z) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        // Update model
        this.model.setVertZoom(z);
        // Update views
        this.cell_view.setVertZoom(this.model, z);
        this.label_view.setVertZoom(this.model, z);
        this.track_info_view.setVertZoom(this.model);
        this.track_options_view.setVertZoom(this.model);
        this.minimap_view.setVertZoom(this.model, this.cell_view);

        resizeAndOrganizeAfterTimeout(this);
        return this.model.getVertZoom();
    }

    var doSetScroll = function(oncoprint, scroll_left, scroll_top) {
        // Update model
        scroll_left = Math.min(scroll_left, maxOncoprintScrollLeft(oncoprint));
        scroll_top = Math.min(scroll_top, maxOncoprintScrollTop(oncoprint));
        oncoprint.model.setScroll(scroll_left, scroll_top);
        // Update views

        oncoprint.cell_view.setScroll(oncoprint.model);
        oncoprint.label_view.setScroll(oncoprint.model);
        oncoprint.track_info_view.setScroll(oncoprint.model);
        oncoprint.track_options_view.setScroll(oncoprint.model);
        oncoprint.minimap_view.setScroll(oncoprint.model, oncoprint.cell_view);
    };

    var setDummyScrollDivScroll = function(oncoprint) {
        var scroll_left = oncoprint.model.getHorzScroll();
        var scroll_top = oncoprint.model.getVertScroll();

        var maximum_scroll_left = maxOncoprintScrollLeft(oncoprint);
        var maximum_scroll_top = maxOncoprintScrollTop(oncoprint);
        var onc_scroll_left_prop = maximum_scroll_left > 0 ? scroll_left/maximum_scroll_left : 0;
        var onc_scroll_top_prop = maximum_scroll_top > 0 ? scroll_top/maximum_scroll_top : 0;
        onc_scroll_left_prop = clamp(onc_scroll_left_prop, 0, 1);
        onc_scroll_top_prop = clamp(onc_scroll_top_prop, 0, 1);

        var maximum_dummy_scroll_div_scroll = maxDummyScrollDivScroll(oncoprint);
        var maximum_div_scroll_left = maximum_dummy_scroll_div_scroll.left;
        var maximum_div_scroll_top = maximum_dummy_scroll_div_scroll.top;

        oncoprint.target_dummy_scroll_left = Math.round(onc_scroll_left_prop * maximum_div_scroll_left);
        oncoprint.target_dummy_scroll_top = Math.round(onc_scroll_top_prop * maximum_div_scroll_top);
        oncoprint.$dummy_scroll_div.scrollLeft(oncoprint.target_dummy_scroll_left);
        oncoprint.$dummy_scroll_div.scrollTop(oncoprint.target_dummy_scroll_top);
    };

    Oncoprint.prototype.setScroll = function(scroll_left, scroll_top) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        doSetScroll(this, scroll_left, scroll_top);
        setDummyScrollDivScroll(this);
    }

    Oncoprint.prototype.setZoom = function(zoom_x, zoom_y) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        // Update model
        this.model.setZoom(zoom_x, zoom_y);
        // Update views
        this.cell_view.setZoom(this.model);
        this.label_view.setZoom(this.model);
        this.track_info_view.setZoom(this.model);
        this.track_options_view.setZoom(this.model);
        this.minimap_view.setZoom(this.model, this.cell_view);
    }

    Oncoprint.prototype.setHorzScroll = function(s) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        // Update model
        this.model.setHorzScroll(Math.min(s, maxOncoprintScrollLeft(this)));
        // Update views
        this.cell_view.setHorzScroll(this.model);
        this.label_view.setHorzScroll(this.model);
        this.track_info_view.setHorzScroll(this.model);
        this.track_options_view.setHorzScroll(this.model);
        this.minimap_view.setHorzScroll(this.model, this.cell_view);
        // Update dummy scroll div
        setDummyScrollDivScroll(this);

        return this.model.getHorzScroll();
    }
    Oncoprint.prototype.setVertScroll = function(s) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        // Update model
        this.model.setVertScroll(Math.min(s, maxOncoprintScrollTop(this)));
        // Update views
        this.cell_view.setVertScroll(this.model);
        this.label_view.setVertScroll(this.model);
        this.track_info_view.setVertScroll(this.model);
        this.track_options_view.setVertScroll(this.model);
        this.minimap_view.setVertScroll(this.model, this.cell_view);
        // Update dummy scroll div
        setDummyScrollDivScroll(this);

        return this.model.getVertScroll();
    }
    Oncoprint.prototype.setViewport = function(col, scroll_y_proportion, num_cols, zoom_y) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        // Zoom
        var zoom_x = this.model.getHorzZoomToFitNumCols(this.cell_view.getVisibleAreaWidth(), num_cols);
        this.setZoom(zoom_x, zoom_y);
        // Scroll
        var scroll_left = Math.min(col * (this.model.getCellWidth() + this.model.getCellPadding()), maxOncoprintScrollLeft(this));
        var scroll_top = Math.min(scroll_y_proportion*this.model.getOncoprintHeight(), maxOncoprintScrollTop(this));
        this.setScroll(scroll_left, scroll_top);

        executeHorzZoomCallbacks(this);
    }

    Oncoprint.prototype.getTrackData = function (track_id) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        return this.model.getTrackData(track_id);
    }

    Oncoprint.prototype.getTrackDataIdKey = function(track_id) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        return this.model.getTrackDataIdKey(track_id);
    }

    /**
     * Sets the data for an Oncoprint track.
     *
     * @param track_id - the ID that identifies the track
     * @param {Object[]} data - the list of data for the cells
     * @param {string} data_id_key - name of the property of the
     * data objects to use as the (column) key
     */
    Oncoprint.prototype.setTrackData = function (track_id, data, data_id_key) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.setTrackData(track_id, data, data_id_key);
        this.cell_view.setTrackData(this.model, track_id);
        this.legend_view.setTrackData(this.model);
        this.minimap_view.setTrackData(this.model, this.cell_view);

        if (this.keep_sorted && this.model.isSortAffected(track_id, "track")) {
            this.sort();
        }
        resizeAndOrganizeAfterTimeout(this);
    }

    Oncoprint.prototype.setTrackImportantIds = function(track_id, ids) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.setTrackImportantIds(track_id, ids);
        this.cell_view.setTrackImportantIds(this.model, track_id);
        this.legend_view.setTrackImportantIds(this.model);
        resizeAndOrganizeAfterTimeout(this);
    }

    Oncoprint.prototype.setTrackGroupSortPriority = function(priority) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.setTrackGroupSortPriority(priority);
        this.cell_view.setTrackGroupSortPriority(this.model);

        if (this.keep_sorted) {
            this.sort();
        }
        resizeAndOrganizeAfterTimeout(this);
    }

    Oncoprint.prototype.setTrackSortDirection = function(track_id, dir) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        if (this.model.isTrackSortDirectionChangeable(track_id)) {
            this.model.setTrackSortDirection(track_id, dir);

            if (this.keep_sorted && this.model.isSortAffected(track_id, "track")) {
                this.sort();
            }
        }
        return this.model.getTrackSortDirection(track_id);
    }

    Oncoprint.prototype.setTrackSortComparator = function(track_id, sortCmpFn) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.setTrackSortComparator(track_id, sortCmpFn);
        if (this.keep_sorted && this.model.isSortAffected(track_id, "track")) {
            this.sort();
        }
    }

    Oncoprint.prototype.getTrackSortDirection = function(track_id) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        return this.model.getTrackSortDirection(track_id);
    }

    Oncoprint.prototype.setTrackInfo = function(track_id, msg) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.setTrackInfo(track_id, msg);
        this.track_info_view.setTrackInfo(this.model);
    }

    Oncoprint.prototype.setTrackTooltipFn = function(track_id, tooltipFn) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.setTrackTooltipFn(track_id, tooltipFn);
    }

    Oncoprint.prototype.setShowTrackSublabels = function(show) {
        this.model.setShowTrackSublabels(show);
        this.label_view.setShowTrackSublabels(this.model);

        resizeAndOrganizeAfterTimeout(this);
    }

    Oncoprint.prototype.sort = function() {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        var self = this;
        this.model.sort().then(function(x) {;
            self.label_view.sort(self.model);
            self.cell_view.sort(self.model);
            self.minimap_view.sort(self.model, self.cell_view);

            if (x) {
                self.setTrackGroupOrder(
                    x.track_group_index,
                    x.track_id_order,
                    true
                );
            }
        });
    }

    Oncoprint.prototype.shareRuleSet = function(source_track_id, target_track_id) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.shareRuleSet(source_track_id, target_track_id);
        this.cell_view.shareRuleSet(this.model, target_track_id);
        this.legend_view.shareRuleSet(this.model);
        this.minimap_view.shareRuleSet(this.model, this.cell_view);
    }

    Oncoprint.prototype.setRuleSet = function(track_id, rule_set_params) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.setRuleSet(track_id, OncoprintRuleSet(rule_set_params));
        this.cell_view.setRuleSet(this.model, track_id);
        this.legend_view.setRuleSet(this.model);
        this.minimap_view.setRuleSet(this.model, this.cell_view);
        resizeAndOrganizeAfterTimeout(this);
    }

    Oncoprint.prototype.setSortConfig = function(params) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.setSortConfig(params);
        this.cell_view.setSortConfig(this.model);
        this.track_options_view.setSortConfig(this.model);

        if (this.keep_sorted) {
            this.sort();
        }
    }
    Oncoprint.prototype.setIdOrder = function(ids) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        // Update model
        this.model.setIdOrder(ids);
        // Update views
        this.cell_view.setIdOrder(this.model, ids);
        this.minimap_view.setIdOrder(this.model, this.cell_view);

        if (this.keep_sorted) {
            this.sort();
        }
    }

    Oncoprint.prototype.disableInteraction = function() {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        //this.label_view.disableInteraction();
        //this.cell_view.disableInteraction();
        this.track_options_view.disableInteraction();
        //this.track_info_view.disableInteraction();
        //this.legend_view.disableInteraction();
    }
    Oncoprint.prototype.enableInteraction = function() {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        //this.label_view.enableInteraction();
        //this.cell_view.enableInteraction();
        this.track_options_view.enableInteraction();
        //this.track_info_view.enableInteraction();
        //this.legend_view.enableInteraction();
    }
    Oncoprint.prototype.suppressRendering = function() {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.rendering_suppressed_depth += 1;
        this.label_view.suppressRendering();
        this.cell_view.suppressRendering();
        this.track_options_view.suppressRendering();
        this.track_info_view.suppressRendering();
        this.legend_view.suppressRendering();
        this.minimap_view.suppressRendering();
    }

    Oncoprint.prototype.releaseRendering = function(onComplete) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.rendering_suppressed_depth -= 1;
        this.model.rendering_suppressed_depth = Math.max(0, this.model.rendering_suppressed_depth);
        if (this.model.rendering_suppressed_depth === 0) {
            this.label_view.releaseRendering(this.model);
            this.cell_view.releaseRendering(this.model);
            this.track_options_view.releaseRendering(this.model);
            this.track_info_view.releaseRendering(this.model);
            this.legend_view.releaseRendering(this.model);
            this.minimap_view.releaseRendering(this.model, this.cell_view);
            resizeAndOrganizeAfterTimeout(this, onComplete);
        }
    }

    Oncoprint.prototype.triggerPendingResizeAndOrganize = function(onComplete) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        if (this.pending_resize_and_organize) {
            this.pending_resize_and_organize = false;
            resizeAndOrganizeAfterTimeout(this, onComplete);
        }
    }

    Oncoprint.prototype.hideIds = function(to_hide, show_others) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.hideIds(to_hide, show_others);
        this.cell_view.hideIds(this.model);
        this.minimap_view.hideIds(this.model, this.cell_view);
    }

    Oncoprint.prototype.hideTrackLegends = function(track_ids) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        track_ids = [].concat(track_ids);
        this.model.hideTrackLegends(track_ids);
        this.legend_view.hideTrackLegends(this.model);
        setLegendTopAfterTimeout(this);
    }

    Oncoprint.prototype.showTrackLegends = function(track_ids) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        track_ids = [].concat(track_ids);
        this.model.showTrackLegends(track_ids);
        this.legend_view.showTrackLegends(this.model);
        setLegendTopAfterTimeout(this);
    }

    Oncoprint.prototype.setCellPaddingOn = function(cell_padding_on) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.setCellPaddingOn(cell_padding_on);
        this.cell_view.setCellPaddingOn(this.model);
    }

    Oncoprint.prototype.setTrackCustomOptions = function(track_id, options) {
        this.model.setTrackCustomOptions(track_id, options);
        this.track_options_view.setTrackCustomOptions(this.model);
    }

    Oncoprint.prototype.setTrackInfoTooltip = function(track_id, $tooltip_elt) {
        this.model.setTrackInfoTooltip(track_id, $tooltip_elt);
    }

    Oncoprint.prototype.setTrackMovable = function(track_id, movable) {
        this.model.setTrackMovable(track_id, movable);
        this.track_options_view.setTrackMovable(this.model);
        this.label_view.setTrackMovable(this.model);
    }

    Oncoprint.prototype.setWidth = function(width) {
        this.width = width;

        resizeAndOrganize(this);
    }

    Oncoprint.prototype.setColumnLabels = function(labels) {
        this.model.setColumnLabels(labels);
        this.cell_view.setColumnLabels(this.model);
        resizeAndOrganizeAfterTimeout(this);
    }

    Oncoprint.prototype.onCellMouseOver = function(callback) {
        this.cell_mouse_over_callbacks.push(callback);
    }

    Oncoprint.prototype.onCellClick = function(callback) {
        this.cell_click_callbacks.push(callback);
    }

    Oncoprint.prototype.toSVG = function(with_background) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        // Returns svg DOM element
        var root = svgfactory.svg(10, 10);
        this.$ctr.append(root);
        var everything_group = svgfactory.group(0,0);
        root.appendChild(everything_group);

        var bgrect = svgfactory.bgrect(10,10,'#ffffff');

        if (with_background) {
            everything_group.appendChild(bgrect);
        }

        var label_view_group = this.label_view.toSVGGroup(this.model, true, 0, 0);
        everything_group.appendChild(label_view_group);
        var track_info_group_x = label_view_group.getBBox().width + 30;
        var track_info_group = this.track_info_view.toSVGGroup(this.model, track_info_group_x, 0);
        everything_group.appendChild(track_info_group);
        var cell_view_group_x = track_info_group_x + track_info_group.getBBox().width + 10;
        var cell_view_group = this.cell_view.toSVGGroup(this.model, cell_view_group_x, 0);
        everything_group.appendChild(cell_view_group);
        everything_group.appendChild(this.legend_view.toSVGGroup(this.model, 0, cell_view_group.getBBox().y + cell_view_group.getBBox().height+20));

        var everything_box = everything_group.getBBox();
        var everything_width = everything_box.x + everything_box.width;
        var everything_height = everything_box.y + everything_box.height;
        root.setAttribute('width', everything_width);
        root.setAttribute('height', everything_height);

        if (with_background) {
            bgrect.setAttribute('width', everything_width);
            bgrect.setAttribute('height', everything_height);
        }
        root.parentNode.removeChild(root);

        return root;
    }

    Oncoprint.prototype.toCanvas = function(callback, resolution) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        // Returns data url, requires IE >= 11

        var MAX_CANVAS_SIDE = 8192;
        var svg = this.toSVG(true);
        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        var width = parseInt(svg.getAttribute('width'), 10);
        var height = parseInt(svg.getAttribute('height'), 10);
        var canvas = document.createElement('canvas');

        resolution = resolution || 1;
        var truncated = width*resolution > MAX_CANVAS_SIDE || height*resolution > MAX_CANVAS_SIDE;
        canvas.setAttribute('width', Math.min(MAX_CANVAS_SIDE, width*resolution));
        canvas.setAttribute('height', Math.min(MAX_CANVAS_SIDE, height*resolution));

        var container = document.createElement("div");
        container.appendChild(svg);
        var svg_data_str = container.innerHTML;
        var svg_data_uri = "data:image/svg+xml;base64,"+window.btoa(svg_data_str);

        var ctx = canvas.getContext('2d');
        ctx.setTransform(resolution,0,0,resolution,0,0);
        var img = new Image();

        img.onload = function() {
            ctx.drawImage(img, 0, 0);
            callback(canvas, truncated);
        };
        img.onerror = function() {
            console.log("IMAGE LOAD ERROR");
        };

        img.src = svg_data_uri;
        return img;
    }

    Oncoprint.prototype.toDataUrl = function(callback) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.toCanvas(function(canvas) {
            callback(canvas.toDataURL());
        });
    }

    Oncoprint.prototype.highlightTrack = function(track_id) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.label_view.highlightTrack(track_id, this.model);
    }

    Oncoprint.prototype.setHighlightedIds = function(ids) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.model.setHighlightedIds(ids);
        this.cell_view.setHighlightedIds(this.model);
    }

    Oncoprint.prototype.getIdOrder = function(all) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        return this.model.getIdOrder(all);
    }

    Oncoprint.prototype.setIdClipboardContents = function(array) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.id_clipboard = array.slice();
        for (var i=0; i<this.clipboard_change_callbacks.length; i++) {
            this.clipboard_change_callbacks[i](array);
        }
    }
    Oncoprint.prototype.getIdClipboardContents = function() {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        return this.id_clipboard.slice();
    }
    Oncoprint.prototype.onClipboardChange = function(callback) {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.clipboard_change_callbacks.push(callback);
    }

    Oncoprint.prototype.destroy = function() {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.cell_view.destroy();
        this.track_options_view.destroy();
        this.track_info_view.destroy();
        this.destroyed = true;
    }

    Oncoprint.prototype.clearMouseOverEffects = function() {
        if(this.webgl_unavailable || this.destroyed) {
            return;
        }
        this.cell_view.clearOverlay();
        this.label_view.highlightTrack(null, this.model);
    }


    return Oncoprint;
})();
module.exports = Oncoprint;
