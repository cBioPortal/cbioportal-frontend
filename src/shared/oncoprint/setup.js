import URL from './url';

import utils from './utils';

import tooltip_utils from './tooltipUtils';

var makeComparatorMetric = function (array_spec) {
    var metric = {};
    for (var i = 0; i < array_spec.length; i++) {
        var equiv_values = [].concat(array_spec[i]);
        for (var j = 0; j < equiv_values.length; j++) {
            metric[equiv_values[j]] = i;
        }
    }
    return metric;
};

import State from './state';

console.log(State);

import qs from './querySession';

var QuerySession = qs();

export function createCBioPortalOncoprintWithToolbar(ctr_selector, toolbar_selector) {

    $('#oncoprint #everything').show();
    $('#oncoprint #oncoprint-diagram-toolbar-buttons').show();

    $(ctr_selector).css({'position': 'relative'});

    window.LoadingBar = (function () {
        var $loading_bar_svg = $('<svg width="100" height="50"></svg><br>')
            .appendTo(ctr_selector)
            .append(utils.makeSVGElement("rect", {
                "width": 100,
                "height": 25,
                "stroke": "black",
                "fill": "white"
            }));
        $loading_bar_svg.append(utils.makeSVGElement("rect", {
            "width": 100,
            "height": 25,
            "stroke": "black",
            "fill": "white"
        }));
        var $loading_bar = $(utils.makeSVGElement("rect", {
            "width": 0,
            "height": 25,
            "fill": "green",
            "stroke": "dark green"
        }))
            .appendTo($loading_bar_svg);
        var $loading_bar_msg = $(utils.makeSVGElement("text", {
            'x': 2,
            'y': 15,
            'font-size': 11,
            'font-family': 'Arial',
            'font-weight': 'normal',
            'text-anchor': 'start',
        }))
            .appendTo($loading_bar_svg);

        return {
            'hide': function () {
                $loading_bar_svg.hide();
            },
            'show': function () {
                $loading_bar_svg.show();
            },
            'msg': function (str) {
                $loading_bar_msg[0].textContent = str;
            },
            'update': function (proportion) {
                $loading_bar.attr('width', proportion * parseFloat($loading_bar_svg.attr('width')));
            },
            'DOWNLOADING_MSG': 'Downloading data..'
        };
    })();

    var oncoprint = new window.Oncoprint(ctr_selector, 1050);
    var toolbar_fade_out_timeout;
    $(ctr_selector).add(toolbar_selector).on("mouseover", function (evt) {
        $(toolbar_selector).fadeIn('fast');
        clearTimeout(toolbar_fade_out_timeout);
    });
    $(ctr_selector).add(toolbar_selector).on("mouseleave", function (evt) {
        clearTimeout(toolbar_fade_out_timeout);
        toolbar_fade_out_timeout = setTimeout(function () {
            $(toolbar_selector).fadeOut();
        }, 700);
    });


    var Toolbar = (function () {
        var events = [];

        return {
            'addEventHandler': function ($elt, evt, callback) {
                $elt.on(evt, callback);
                events.push({'$elt': $elt, 'evt': evt, 'callback': callback});
            },
            'onMouseDownAndClick': function ($elt, mousedown_callback, click_callback) {
                this.addEventHandler($elt, 'mousedown', mousedown_callback);
                this.addEventHandler($elt, 'click', click_callback);
            },
            'onHover': function ($elt, enter_callback, leave_callback) {
                this.addEventHandler($elt, 'mouseenter', enter_callback);
                this.addEventHandler($elt, 'mouseleave', leave_callback);
            },
            'onClick': function ($elt, callback) {
                this.addEventHandler($elt, 'click', callback);
            },
            'destroy': function () {
                // Destroy events
                for (var i = 0; i < events.length; i++) {
                    var event = events[i];
                    event['$elt'].off(event['evt'], event['callback']);
                }

                // Destroy qtips

                // Destroy elements
            },
            'refreshClinicalAttributeSelector': function () {
                var attributes_to_populate = State.unused_clinical_attributes;
                attributes_to_populate.sort(function (attrA, attrB) {
                    return attrA.display_order - attrB.display_order;
                });
                var $selector = $(toolbar_selector + ' #select_clinical_attributes');
                $selector.empty();
                for (var i = 0; i < attributes_to_populate.length; i++) {
                    $("<option></option>").appendTo($selector)
                        .attr("value", attributes_to_populate[i].attr_id)
                        .text(attributes_to_populate[i].display_name);
                }
                $(toolbar_selector + " #select_clinical_attributes").val('');
                $(toolbar_selector + " #select_clinical_attributes").trigger("liszt:updated");
                $(toolbar_selector + " #select_clinical_attributes_chzn").addClass("chzn-with-drop");
            }
        };
    })();

    State.clinical_attributes_fetched.then(function () {
        State.unused_clinical_attributes.sort(function (attrA, attrB) {
            var set_attribute_order = ["FRACTION_GENOME_ALTERED", "# mutations", "NO_CONTEXT_MUTATION_SIGNATURE"];
            var attrA_index = set_attribute_order.indexOf(attrA.attr_id);
            var attrB_index = set_attribute_order.indexOf(attrB.attr_id);
            if (attrA_index < 0) {
                attrA_index = set_attribute_order.length;
            }
            if (attrB_index < 0) {
                attrB_index = set_attribute_order.length;
            }
            if (attrA_index === attrB_index) {
                return attrA.display_name.localeCompare(attrB.display_name);
            } else {
                return utils.sign_of_diff(attrA_index, attrB_index);
            }
        });

        for (var i = 0, _len = State.unused_clinical_attributes.length; i < _len; i++) {
            State.unused_clinical_attributes[i].display_order = i;
        }

        var url_clinical_attr_ids = URL.getInitUsedClinicalAttrs() || [];
        for (var i = 0; i < url_clinical_attr_ids.length; i++) {
            State.useAttribute(url_clinical_attr_ids[i]);
        }

        if (url_clinical_attr_ids.length > 0) {
            $(toolbar_selector + ' #oncoprint-diagram-showlegend-icon').show();
            State.addClinicalTracks(State.used_clinical_attributes.filter(function (attr) {
                return url_clinical_attr_ids.indexOf(attr.attr_id) > -1;
            }));
        }

        Toolbar.refreshClinicalAttributeSelector();

        console.log("RESTORE CHOSEN");
        //$(toolbar_selector + ' #select_clinical_attributes').chosen({width: "330px", "font-size": "12px", search_contains: true});

        // add a title to the text input fields generated by Chosen for
        // Section 508 accessibility compliance
        $("div.chzn-search > input:first-child").attr("title", "Search");

        Toolbar.onClick($(toolbar_selector + ' #select_clinical_attributes_chzn .chzn-search input'), function (e) {
            e.stopPropagation();
        });

        $(toolbar_selector + " #select_clinical_attributes_chzn").mouseenter(function () {
            $(toolbar_selector + " #select_clinical_attributes_chzn .chzn-search input").focus();
        });
        $(toolbar_selector + " #select_clinical_attributes_chzn").addClass("chzn-with-drop");

        Toolbar.addEventHandler($(toolbar_selector + ' #select_clinical_attributes'), 'change', function (evt) {
            if ($(toolbar_selector + ' #select_clinical_attributes').val().trim() === '') {
                evt && evt.stopPropagation();
                return;
            }
            var attr_id = $(toolbar_selector + ' #select_clinical_attributes option:selected').attr("value");
            $(toolbar_selector + ' #select_clinical_attributes').val('').trigger('liszt:updated');
            $(toolbar_selector + ' #clinical_dropdown').dropdown('toggle');
            addClinicalAttributeTrack(attr_id);
        });
    });

    var addClinicalAttributeTrack = function (attr_id) {
        $(toolbar_selector + ' #oncoprint-diagram-showlegend-icon').show();
        var index = State.unused_clinical_attributes.findIndex(function (attr) {
            return attr.attr_id === attr_id;
        });
        if (index === -1) {
            return;
        }
        var attr = State.unused_clinical_attributes[index];
        State.useAttribute(attr_id);
        Toolbar.refreshClinicalAttributeSelector();

        return State.addAndPopulateClinicalTracks(attr);
    };

    (function initOncoprint() {
        window.LoadingBar.show();
        window.LoadingBar.msg(window.LoadingBar.DOWNLOADING_MSG);
        var def = new $.Deferred();
        oncoprint.setCellPaddingOn(State.cell_padding_on);
        $.when(QuerySession.getOncoprintSampleGenomicEventData()).then(function (oncoprint_data) {
            State.addGeneticTracks(oncoprint_data);
        }).fail(function () {
            def.reject();
        }).then(function () {
            (function fetchClinicalAttributes() {
                QuerySession.getClinicalAttributes().then(function (attrs) {
                    State.unused_clinical_attributes = attrs;
                    State.clinical_attributes_fetched.resolve();
                    def.resolve();
                }).fail(function () {
                    def.reject();
                    State.clinical_attributes_fetched.reject();
                });
            })();
        })
        return def.promise();
    })().then(function () {
        var populate_data_promise = State.setDataType(State.using_sample_data ? 'sample' : 'patient');

        $.when(QuerySession.getPatientIds(), QuerySession.getAlteredSamples(), QuerySession.getAlteredPatients(), QuerySession.getCaseUIDMap(), populate_data_promise).then(function (patient_ids, altered_samples, altered_patients, case_uid_map) {
            if ((State.using_sample_data ? window.QuerySession.getSampleIds() : patient_ids).length > 200) {
                // TODO: assume multiple studies
                var study_id = QuerySession.getCancerStudyIds()[0];
                var getUID = function (id) {
                    return case_uid_map[study_id][id];
                };
                oncoprint.setHorzZoomToFit(State.using_sample_data ? altered_samples.map(getUID) : altered_patients.map(getUID));
            }
            oncoprint.scrollTo(0);
        });

        return populate_data_promise;
    });
    window.oncoprint = oncoprint;

    (function setUpToolbar() {
        console.log("RESOTRE SETUP_TOOLBAR");
        return;
        var zoom_discount = 0.7;
        var to_remove_on_destroy = [];
        var to_remove_qtip_on_destroy = [];


        var appendTo = function ($elt, $target) {
            $elt.appendTo($target);
            to_remove_on_destroy.push($elt);
        };
        var addQTipTo = function ($elt, qtip_params) {
            $elt.qtip(qtip_params);
            to_remove_qtip_on_destroy.push($elt);
        };

        var setUpHoverEffect = function ($elt) {
            $elt.hover(function () {
                    $(this).css({
                        'fill': '#0000FF',
                        'font-size': '18px',
                        'cursor': 'pointer'
                    });
                },
                function () {
                    $(this).css({
                        'fill': '#87CEFA',
                        'font-size': '12px'
                    });
                }
            );
        };


        var setUpButton = function ($elt, img_urls, qtip_descs, index_fn, callback) {
            index_fn = index_fn || function () {
                    return 0;
                };
            var updateButton = function () {
                if (img_urls.length > 0) {
                    $elt.find('img').attr('src', img_urls[index_fn()]);
                }
                $elt.css({'background-color': '#efefef'});
            };
            var hoverButton = function () {
                if (img_urls.length > 0) {
                    $elt.find('img').attr('src', img_urls[(index_fn() + 1) % img_urls.length]);
                }
                $elt.css({'background-color': '#d9d9d9'});
            };
            if (qtip_descs.length > 0) {
                addQTipTo($elt, {
                    content: {
                        text: function () {
                            return qtip_descs[index_fn()];
                        }
                    },
                    position: {my: 'bottom middle', at: 'top middle', viewport: $(window)},
                    style: {classes: 'qtip-light qtip-rounded qtip-shadow qtip-lightwhite'},
                    show: {event: "mouseover"},
                    hide: {fixed: true, delay: 100, event: "mouseout"}
                });
            }
            Toolbar.onHover($elt, function () {
                hoverButton();
            }, function () {
                updateButton();
            });
            Toolbar.onMouseDownAndClick($elt, function () {
                    $elt.css({'background-color': '#c7c7c7'});
                },
                function () {
                    callback();
                    updateButton();
                });
            updateButton();
        };
        var $zoom_slider = (function setUpZoom() {
            var zoom_elt = $(toolbar_selector + ' #oncoprint_diagram_slider_icon');
            var $slider = $('<input>', {
                id: "oncoprint_zoom_slider",
                type: "range",
                min: 0,
                max: 1,
                step: 0.0001,
                value: 1,
                change: function (evt) {
                    if (evt.originalEvent) {
                        this.value = oncoprint.setHorzZoom(parseFloat(this.value));
                    } else {
                        this.value = oncoprint.getHorzZoom();
                    }
                },
            });

            $('#oncoprint_zoom_scale_input').on("keypress", function (e) {
                if (e.keyCode === 13) {
                    // 'Enter' key
                    var new_zoom = parseFloat($('#oncoprint_zoom_scale_input').val()) / 100;
                    new_zoom = Math.min(1, new_zoom);
                    new_zoom = Math.max(0, new_zoom);
                    oncoprint.setHorzZoom(new_zoom);
                }
            });
            oncoprint.onHorzZoom(function () {
                $zoom_slider.trigger('change');
                $('#oncoprint_zoom_scale_input').val(Math.round(10000 * oncoprint.getHorzZoom()) / 100);
            });

            appendTo($slider, zoom_elt);
            addQTipTo($slider, {
                id: 'oncoprint_zoom_slider_tooltip',
                prerender: true,
                content: {text: 'Zoom in/out of oncoprint'},
                position: {my: 'bottom middle', at: 'top middle', viewport: $(window)},
                style: {classes: 'qtip-light qtip-rounded qtip-shadow qtip-lightwhite'},
                show: {event: "mouseover"},
                hide: {fixed: true, delay: 100, event: "mouseout"}
            });
            // use aria-labelledby instead of aria-describedby, as Section 508
            // requires that inputs have an explicit label for accessibility
            $slider.attr('aria-labelledby', 'qtip-oncoprint_zoom_slider_tooltip');
            $slider.removeAttr('aria-describedby');
            setUpHoverEffect($slider);

            setUpButton($(toolbar_selector + ' #oncoprint_zoomout'), [], ["Zoom out of oncoprint"], null, function () {
                oncoprint.setHorzZoom(oncoprint.getHorzZoom() * zoom_discount);
            });
            setUpButton($(toolbar_selector + ' #oncoprint_zoomin'), [], ["Zoom in to oncoprint"], null, function () {
                oncoprint.setHorzZoom(oncoprint.getHorzZoom() / zoom_discount);
            });

            return $slider;
        })();

        (function setUpToggleCellPadding() {
            var $show_whitespace_checkbox = $(toolbar_selector).find('#oncoprint_diagram_view_menu')
                .find('input[type="checkbox"][name="show_whitespace"]');
            $show_whitespace_checkbox[0].checked = State.cell_padding_on;
            $show_whitespace_checkbox.change(function () {
                State.cell_padding_on = $show_whitespace_checkbox.is(":checked");
                oncoprint.setCellPaddingOn(State.cell_padding_on);
            });
        })();
        (function setUpHideUnalteredCases() {
            var $show_unaltered_checkbox = $(toolbar_selector).find('#oncoprint_diagram_view_menu')
                .find('input[type="checkbox"][name="show_unaltered"]');
            $show_unaltered_checkbox[0].checked = !State.unaltered_cases_hidden;
            $show_unaltered_checkbox.change(function () {
                State.unaltered_cases_hidden = !($show_unaltered_checkbox.is(":checked"));
                if (State.unaltered_cases_hidden) {
                    oncoprint.hideIds(State.getUnalteredIds(), true);
                } else {
                    oncoprint.hideIds([], true);
                }
            });
        })();
        (function setUpZoomToFit() {
            setUpButton($(toolbar_selector + ' #oncoprint_zoomtofit'), [], ["Zoom to fit altered cases in screen"], null, function () {
                $.when(QuerySession.getAlteredSamples(), QuerySession.getAlteredPatients(), QuerySession.getCaseUIDMap()).then(function (altered_samples, altered_patients, case_uid_map) {
                    // TODO: assume multiple studies
                    var study_id = QuerySession.getCancerStudyIds()[0];
                    var getUID = function (id) {
                        return case_uid_map[study_id][id];
                    };
                    oncoprint.setHorzZoomToFit(State.getAlteredIds().map(getUID));
                    oncoprint.scrollTo(0);
                });
            });
        })();
        (function setUpSortByAndColorBy() {
            $('#oncoprint_diagram_showmutationcolor_icon').hide();
            var updateSortByForm = function () {
                var sortby_type_checkbox = $('#oncoprint_diagram_sortby_group').find('input[type="checkbox"][name="type"]');
                ;
                var sortby_recurrence_checkbox = $('#oncoprint_diagram_sortby_group').find('input[type="checkbox"][name="recurrence"]');
                if ((State.sortby !== "data") || !State.colorby_type) {
                    sortby_type_checkbox.attr("disabled", "disabled");
                } else {
                    sortby_type_checkbox.removeAttr("disabled");
                }

                if ((State.sortby !== "data") || !State.colorby_knowledge) {
                    sortby_recurrence_checkbox.attr("disabled", "disabled");
                } else {
                    sortby_recurrence_checkbox.removeAttr("disabled");
                }
            };

            var updateMutationColorForm = function () {
                var colorby_knowledge_checkbox = $('#oncoprint_diagram_mutation_color').find('input[type="checkbox"][name="recurrence"]');
                var colorby_hotspots_checkbox = $('#oncoprint_diagram_mutation_color').find('input[type="checkbox"][name="hotspots"]');
                var colorby_cbioportal_checkbox = $('#oncoprint_diagram_mutation_color').find('input[type="checkbox"][name="cbioportal"]');
                var colorby_cosmic_checkbox = $('#oncoprint_diagram_mutation_color').find('input[type="checkbox"][name="cosmic"]');
                var colorby_oncokb_checkbox = $('#oncoprint_diagram_mutation_color').find('input[type="checkbox"][name="oncokb"]');
                var hide_unknown_checkbox = $('#oncoprint_diagram_mutation_color').find('input[type="checkbox"][name="hide_unknown"]');
                var cosmic_threshold_input = $('#oncoprint_diagram_mutation_color').find('#cosmic_threshold');
                var cbioportal_threshold_input = $('#oncoprint_diagram_mutation_color').find('#cbioportal_threshold');

                var known_mutation_settings = window.QuerySession.getKnownMutationSettings();
                colorby_knowledge_checkbox.prop('checked', State.colorby_knowledge);
                colorby_hotspots_checkbox.prop('checked', known_mutation_settings.recognize_hotspot);
                colorby_cbioportal_checkbox.prop('checked', known_mutation_settings.recognize_cbioportal_count);
                colorby_cosmic_checkbox.prop('checked', known_mutation_settings.recognize_cosmic_count);
                colorby_oncokb_checkbox.prop('checked', known_mutation_settings.recognize_oncokb_oncogenic);
                hide_unknown_checkbox.prop('checked', known_mutation_settings.ignore_unknown);

                if (!State.colorby_knowledge) {
                    hide_unknown_checkbox.attr('disabled', 'disabled');
                } else {
                    hide_unknown_checkbox.removeAttr('disabled');
                }

                cbioportal_threshold_input.val(known_mutation_settings.cbioportal_count_thresh);
                cosmic_threshold_input.val(known_mutation_settings.cosmic_count_thresh);
            };

            var updateRuleSets = function () {
                var rule_set_params = State.getGeneticRuleSetParams();
                var genetic_alteration_track_ids = utils.objectValues(State.genetic_alteration_tracks);
                oncoprint.setRuleSet(genetic_alteration_track_ids[0], rule_set_params);
                for (var i = 1; i < genetic_alteration_track_ids.length; i++) {
                    oncoprint.shareRuleSet(genetic_alteration_track_ids[0], genetic_alteration_track_ids[i]);
                }
            };
            var updateSortComparators = function () {
                var comparator = State.getGeneticComparator();
                oncoprint.keepSorted(false);
                var genetic_alteration_track_ids = utils.objectValues(State.genetic_alteration_tracks);
                for (var i = 0; i < genetic_alteration_track_ids.length; i++) {
                    oncoprint.setTrackSortComparator(genetic_alteration_track_ids[i], comparator);
                }
                oncoprint.keepSorted();
            };
            var updateSortConfig = function () {
                if (State.sortby === "data") {
                    oncoprint.setSortConfig({'type': 'tracks'});
                    State.sorting_by_given_order = false;
                    State.sorting_alphabetically = false;
                } else if (State.sortby === "id") {
                    State.sorting_by_given_order = false;
                    State.sorting_alphabetically = true;
                    // TODO: assume multiple studies
                    $.when(QuerySession.getCaseUIDMap(), State.patient_order_loaded).then(function (case_uid_map) {
                        var study_id = QuerySession.getCancerStudyIds()[0];
                        var getUID = function (id) {
                            return case_uid_map[study_id][id];
                        };
                        oncoprint.setSortConfig({
                            'type': 'order',
                            order: (State.using_sample_data ? QuerySession.getSampleIds().slice().sort().map(getUID) : State.patient_order.slice().sort().map(getUID))
                        });
                    });
                } else if (State.sortby === "custom") {
                    State.sorting_by_given_order = true;
                    State.sorting_alphabetically = false;
                    // TODO: assume multiple studies
                    $.when(QuerySession.getCaseUIDMap(), State.patient_order_loaded).then(function (case_uid_map) {
                        var study_id = QuerySession.getCancerStudyIds()[0];
                        var getUID = function (id) {
                            return case_uid_map[study_id][id];
                        };
                        oncoprint.setSortConfig({
                            'type': 'order',
                            order: (State.using_sample_data ? QuerySession.getSampleIds().map(getUID) : State.patient_order.map(getUID))
                        });
                    });
                }
            };
            $('#oncoprint_diagram_sortby_group').find('input[name="sortby"]').change(function () {
                State.sortby = $('#oncoprint_diagram_sortby_group').find('input[name="sortby"]:checked').val();
                updateSortByForm();
                updateSortConfig();
            });
            $('#oncoprint_diagram_sortby_group').find('input[type="checkbox"][name="type"]').change(function () {
                State.sortby_type = $('#oncoprint_diagram_sortby_group').find('input[type="checkbox"][name="type"]').is(":checked");
                updateSortComparators();
            });
            $('#oncoprint_diagram_sortby_group').find('input[type="checkbox"][name="recurrence"]').change(function () {
                State.sortby_recurrence = $('#oncoprint_diagram_sortby_group').find('input[type="checkbox"][name="recurrence"]').is(":checked");
                updateSortComparators();
            });
            $('#oncoprint_diagram_mutation_color').find('input[type="checkbox"]').change(function (e) {
                if (e.originalEvent === undefined) {
                    return true;
                }
                State.colorby_type = $('#oncoprint_diagram_mutation_color').find('input[type="checkbox"][name="type"]').is(":checked");
                var old_colorby_knowledge = State.colorby_knowledge;
                State.colorby_knowledge = $('#oncoprint_diagram_mutation_color').find('input[type="checkbox"][name="recurrence"]').is(":checked");

                var new_known_mutation_settings = {
                    recognize_hotspot: $('#oncoprint_diagram_mutation_color').find('input[type="checkbox"][name="hotspots"]').is(":checked"),
                    recognize_cbioportal_count: $('#oncoprint_diagram_mutation_color').find('input[type="checkbox"][name="cbioportal"]').is(":checked"),
                    recognize_cosmic_count: $('#oncoprint_diagram_mutation_color').find('input[type="checkbox"][name="cosmic"]').is(":checked"),
                    recognize_oncokb_oncogenic: $('#oncoprint_diagram_mutation_color').find('input[type="checkbox"][name="oncokb"]').is(":checked"),
                    ignore_unknown: $('#oncoprint_diagram_mutation_color').find('input[type="checkbox"][name="hide_unknown"]').is(":checked")
                };

                if (!old_colorby_knowledge && State.colorby_knowledge) {
                    // If driver/passenger has just been selected, set defaults
                    new_known_mutation_settings.recognize_hotspot = true;
                    new_known_mutation_settings.recognize_cbioportal_count = true;
                    new_known_mutation_settings.recognize_cosmic_count = true;
                    new_known_mutation_settings.recognize_oncokb_oncogenic = true;
                } else if (old_colorby_knowledge && !State.colorby_knowledge) {
                    // If driver/passenger has just been deselected, set all to false
                    new_known_mutation_settings.recognize_hotspot = false;
                    new_known_mutation_settings.recognize_cbioportal_count = false;
                    new_known_mutation_settings.recognize_cosmic_count = false;
                    new_known_mutation_settings.recognize_oncokb_oncogenic = false;
                }

                if (new_known_mutation_settings.recognize_hotspot || new_known_mutation_settings.recognize_cbioportal_count
                    || new_known_mutation_settings.recognize_cosmic_count || new_known_mutation_settings.recognize_oncokb_oncogenic) {
                    // If at least one data source selected, update State
                    State.colorby_knowledge = true;
                } else {
                    // If no data sources selected, turn off driver/passenger labeling..
                    State.colorby_knowledge = false;
                    // .. and filtering
                    new_known_mutation_settings.ignore_unknown = false;
                }

                window.QuerySession.setKnownMutationSettings(new_known_mutation_settings);

                updateMutationColorForm();
                updateSortByForm();
                updateRuleSets();
                State.refreshData();
            });
            $('#oncoprint_diagram_mutation_color').find('#cosmic_threshold').change(function () {
                window.QuerySession.setKnownMutationSettings({
                    cosmic_count_thresh: parseInt($('#oncoprint_diagram_mutation_color').find('#cosmic_threshold').val(), 10) || 0
                });
                State.refreshData();
            });
            $('#oncoprint_diagram_mutation_color').find('#cbioportal_threshold').change(function () {
                window.QuerySession.setKnownMutationSettings({
                    cbioportal_count_thresh: parseInt($('#oncoprint_diagram_mutation_color').find('#cbioportal_threshold').val(), 10) || 0
                });
                State.refreshData();
            });
            (function initFormsFromState() {
                var known_mutation_settings = window.QuerySession.getKnownMutationSettings();
                $('#oncoprint_diagram_sortby_group').find('input[name="sortby"][value="' + State.sortby + '"]').prop("checked", true);
                $('#oncoprint_diagram_sortby_group').find('input[type="checkbox"][name="type"]').prop("checked", State.sortby_type);
                $('#oncoprint_diagram_sortby_group').find('input[type="checkbox"][name="recurrence"]').prop("checked", State.sortby_recurrence);

                $('#oncoprint_diagram_mutation_color').find('input[type="checkbox"][name="type"]').prop("checked", State.colorby_type);
                $('#oncoprint_diagram_mutation_color').find('input[type="checkbox"][name="recurrence"]').prop("checked", State.colorby_knowledge);
                $('#oncoprint_diagram_mutation_color').find('input[type="checkbox"][name="hotspots"]').prop("checked", !!known_mutation_settings.recognize_hotspot);
                $('#oncoprint_diagram_mutation_color').find('input[type="checkbox"][name="cbioportal"]').prop("checked", !!known_mutation_settings.recognize_cbioportal_count);
                $('#oncoprint_diagram_mutation_color').find('input[type="checkbox"][name="cosmic"]').prop("checked", !!known_mutation_settings.recognize_cosmic_count);
                $('#oncoprint_diagram_mutation_color').find('input[type="checkbox"][name="oncokb"]').prop("checked", !!known_mutation_settings.recognize_oncokb_oncogenic);
                $('#oncoprint_diagram_mutation_color').find('input[type="checkbox"][name="hide_unknown"]').prop("checked", !!known_mutation_settings.ignore_unknown);

                $('#oncoprint_diagram_mutation_color').find('#cosmic_threshold').val(known_mutation_settings.cosmic_count_thresh);
                $('#oncoprint_diagram_mutation_color').find('#cbioportal_threshold').val(known_mutation_settings.cbioportal_count_thresh);

                updateMutationColorForm();
                updateSortByForm();
            })();
            (function initKnowledgeTooltipAndLinkout() {
                $('#oncoprint_diagram_mutation_color').find('#colorby_hotspot_info').click(function () {
                    window.open("http://www.cancerhotspots.org");
                });
                $('#oncoprint_diagram_mutation_color').find('#colorby_oncokb_info').click(function () {
                    window.open("http://www.oncokb.org");
                });
                addQTipTo($('#oncoprint_diagram_mutation_color').find('#putative_driver_info_icon'), {
                    content: {text: "For missense mutations."},
                    position: {my: 'bottom middle', at: 'top middle', viewport: $(window)},
                    style: {classes: 'qtip-light qtip-rounded qtip-shadow qtip-lightwhite'},
                    show: {event: "mouseover"},
                    hide: {fixed: true, delay: 100, event: "mouseout"}
                });
                addQTipTo($('#oncoprint_diagram_mutation_color').find('#colorby_hotspot_info'), {
                    content: {
                        text: function () {
                            return $("<p>Identified as a recurrent hotspot (statistically significant) in a " +
                                "population-scale cohort of tumor samples of various cancer types using " +
                                "methodology based in part on <a href='http://www.ncbi.nlm.nih.gov/pubmed/26619011' target='_blank'>Chang et al., Nat Biotechnol, 2016.</a>" +
                                "\n" +
                                "Explore all mutations at <a href='http://cancerhotspots.org' target='_blank'>http://cancerhotspots.org</a></p>");
                        }
                    },
                    position: {my: 'bottom middle', at: 'top middle', viewport: $(window)},
                    style: {classes: 'qtip-light qtip-rounded qtip-shadow qtip-lightwhite'},
                    show: {event: "mouseover"},
                    hide: {fixed: true, delay: 100, event: "mouseout"}
                });
                addQTipTo($('#oncoprint_diagram_mutation_color').find('#colorby_oncokb_info'), {
                    content: {text: "Oncogenicity from OncoKB"},
                    position: {my: 'bottom middle', at: 'top middle', viewport: $(window)},
                    style: {classes: 'qtip-light qtip-rounded qtip-shadow qtip-lightwhite'},
                    show: {event: "mouseover"},
                    hide: {fixed: true, delay: 100, event: "mouseout"}
                });
            })();
        })();
        (function setUpShowClinicalLegendsBtn() {
            // set initial state
            var $show_clinical_legends_checkbox = $(toolbar_selector).find('#oncoprint_diagram_view_menu')
                .find('input[type="checkbox"][name="show_clinical_legends"]');
            $show_clinical_legends_checkbox[0].checked = State.clinical_track_legends_shown;
            $show_clinical_legends_checkbox.change(function () {
                State.clinical_track_legends_shown = $show_clinical_legends_checkbox.is(":checked");
                var clinical_track_ids = Object.keys(State.clinical_tracks);
                if (State.clinical_track_legends_shown) {
                    oncoprint.showTrackLegends(clinical_track_ids);
                } else {
                    oncoprint.hideTrackLegends(clinical_track_ids);
                }
            });
        })();
        (function setUpTogglePatientSampleBtn() {
            var $header_btn = $('#switchPatientSample');

            $header_btn.click(function () {
                var curr_selection = $(toolbar_selector).find('#oncoprint_diagram_view_menu')
                    .find('input[type="radio"][name="datatype"]:checked').val();
                $(toolbar_selector).find('#oncoprint_diagram_view_menu')
                    .find('input[type="radio"][name="datatype"][value="' + (curr_selection === "sample" ? "patient" : "sample") + '"]').prop("checked", true);
                $(toolbar_selector).find('#oncoprint_diagram_view_menu')
                    .find('input[type="radio"][name="datatype"]').trigger('change');
            });

            addQTipTo($header_btn, {
                content: {
                    text: function () {
                        if (State.using_sample_data) {
                            return 'Each sample for each patient is in a separate column. Click to show only one column per patient'
                        } else {
                            return 'All samples from a patient are merged into one column. Click to split samples into multiple columns.';
                        }
                    }
                },
                position: {my: 'bottom middle', at: 'top middle', viewport: $(window)},
                style: {classes: 'qtip-light qtip-rounded qtip-shadow qtip-lightwhite'},
                show: {event: "mouseover"},
                hide: {fixed: true, delay: 100, event: "mouseout"}
            });

            var updateHeaderBtnText = function () {
                if (State.using_sample_data) {
                    $header_btn.text('Show only one column per patient');
                } else {
                    $header_btn.text('Show all samples');
                }
            };

            var updateDownloadIdOrderText = function () {
                $('oncoprint-sample-download').text((State.using_sample_data ? "Sample" : "Patient") + " order");
            };

            updateHeaderBtnText();
            updateDownloadIdOrderText();

            // initialize radio buttons
            $(toolbar_selector).find('#oncoprint_diagram_view_menu')
                .find('input[type="radio"][name="datatype"][value="' +
                    (State.using_sample_data ? "sample" : "patient") + '"]')
                .prop("checked", true);

            $(toolbar_selector).find('#oncoprint_diagram_view_menu')
                .find('input[type="radio"][name="datatype"]').change(function (e) {
                State.using_sample_data = $(toolbar_selector).find('#oncoprint_diagram_view_menu')
                        .find('input[type="radio"][name="datatype"]:checked').val() === 'sample';
                if (State.using_sample_data) {
                    State.setDataType('sample');
                } else {
                    State.setDataType('patient');
                }
                updateHeaderBtnText();
                updateDownloadIdOrderText();
            });
        })();
        (function setUpDownload() {
            $('body').on('click', '.oncoprint-diagram-download', function () {
                var fileType = $(this).attr("type");
                var two_megabyte_limit = 2000000;
                if (fileType === 'pdf') {
                    var svg = oncoprint.toSVG(true);
                    var serialized = cbio.download.serializeHtml(svg);
                    if (serialized.length > two_megabyte_limit) {
                        alert("Oncoprint too big to download as PDF - please download as SVG");
                        return;
                    }
                    cbio.download.initDownload(serialized, {
                        filename: "oncoprint.pdf",
                        contentType: "application/pdf",
                        servletName: "svgtopdf.do"
                    });
                } else if (fileType === 'svg') {
                    cbio.download.initDownload(oncoprint.toSVG(), {filename: "oncoprint.svg"});
                } else if (fileType === 'png') {
                    var img = oncoprint.toCanvas(function (canvas, truncated) {
                        canvas.toBlob(function (blob) {
                            if (truncated) {
                                alert("Oncoprint too large - PNG truncated to " + canvas.getAttribute("width") + " by " + canvas.getAttribute("height"));
                            }
                            saveAs(blob, "oncoprint.png");
                        }, 'image/png');
                    }, 2);
                }
            });

            $('body').on('click', '.oncoprint-sample-download', function () {
                var idTypeStr = (State.using_sample_data ? "Sample" : "Patient");
                var content = idTypeStr + " order in the Oncoprint is: \n";
                content += oncoprint.getIdOrder().join('\n');
                var downloadOpts = {
                    filename: 'OncoPrint' + idTypeStr + 's.txt',
                    contentType: "text/plain;charset=utf-8",
                    preProcess: false
                };

                // send download request with filename & file content info
                cbio.download.initDownload(content, downloadOpts);
            });
        })();
    })();
}

window.CreateOncoprinterWithToolbar = function (ctr_selector, toolbar_selector) {

    $('#oncoprint #everything').show();
    $('#oncoprint #oncoprint-diagram-toolbar-buttons').show();

    $(ctr_selector).css({'position': 'relative'});


    window.LoadingBar = (function () {
        var $loading_bar_svg = $('<svg width="100" height="50"></svg><br>')
            .appendTo(ctr_selector)
            .append(utils.makeSVGElement("rect", {
                "width": 100,
                "height": 25,
                "stroke": "black",
                "fill": "white"
            }));
        $loading_bar_svg.append(utils.makeSVGElement("rect", {
            "width": 100,
            "height": 25,
            "stroke": "black",
            "fill": "white"
        }));
        var $loading_bar = $(utils.makeSVGElement("rect", {
            "width": 0,
            "height": 25,
            "fill": "green",
            "stroke": "dark green"
        }))
            .appendTo($loading_bar_svg);
        var $loading_bar_msg = $(utils.makeSVGElement("text", {
            'x': 2,
            'y': 15,
            'font-size': 11,
            'font-family': 'Arial',
            'font-weight': 'normal',
            'text-anchor': 'start',
        }))
            .appendTo($loading_bar_svg);

        return {
            'hide': function () {
                $loading_bar_svg.hide();
            },
            'show': function () {
                $loading_bar_svg.show();
            },
            'msg': function (str) {
                $loading_bar_msg[0].textContent = str;
            },
            'update': function (proportion) {
                $loading_bar.attr('width', proportion * parseFloat($loading_bar_svg.attr('width')));
            },
            'DOWNLOADING_MSG': 'Downloading data..'
        };
    })();

    window.LoadingBar.hide();

    var oncoprint = new window.Oncoprint(ctr_selector, 1050);
    var toolbar_fade_out_timeout;
    $(ctr_selector).add(toolbar_selector).on("mouseover", function (evt) {
        $(toolbar_selector).fadeIn('fast');
        clearTimeout(toolbar_fade_out_timeout);
    });
    $(ctr_selector).add(toolbar_selector).on("mouseleave", function (evt) {
        clearTimeout(toolbar_fade_out_timeout);
        toolbar_fade_out_timeout = setTimeout(function () {
            $(toolbar_selector).fadeOut();
        }, 700);
    });

    State.addAndPopulateClinicalTracks()
    var Toolbar = (function () {
        var events = [];
        var qtips = [];
        var elements = [];

        return {
            'addEventHandler': function ($elt, evt, callback) {
                $elt.on(evt, callback);
                events.push({'$elt': $elt, 'evt': evt, 'callback': callback});
            },
            'onMouseDownAndClick': function ($elt, mousedown_callback, click_callback) {
                this.addEventHandler($elt, 'mousedown', mousedown_callback);
                this.addEventHandler($elt, 'click', click_callback);
            },
            'onHover': function ($elt, enter_callback, leave_callback) {
                this.addEventHandler($elt, 'mouseenter', enter_callback);
                this.addEventHandler($elt, 'mouseleave', leave_callback);
            },
            'onClick': function ($elt, callback) {
                this.addEventHandler($elt, 'click', callback);
            },
            'destroy': function () {
                // Destroy events
                for (var i = 0; i < events.length; i++) {
                    var event = events[i];
                    event['$elt'].off(event['evt'], event['callback']);
                }

                // Destroy qtips

                // Destroy elements
            },
        };
    })();

    oncoprint.setCellPaddingOn(State.cell_padding_on);

    (function setUpToolbar() {
        var zoom_discount = 0.7;
        var to_remove_on_destroy = [];
        var to_remove_qtip_on_destroy = [];


        var appendTo = function ($elt, $target) {
            $elt.appendTo($target);
            to_remove_on_destroy.push($elt);
        };
        var addQTipTo = function ($elt, qtip_params) {
            $elt.qtip(qtip_params);
            to_remove_qtip_on_destroy.push($elt);
        };

        var setUpHoverEffect = function ($elt) {
            $elt.hover(function () {
                    $(this).css({
                        'fill': '#0000FF',
                        'font-size': '18px',
                        'cursor': 'pointer'
                    });
                },
                function () {
                    $(this).css({
                        'fill': '#87CEFA',
                        'font-size': '12px'
                    });
                }
            );
        };

        var setUpButton = function ($elt, img_urls, qtip_descs, index_fn, callback) {
            index_fn = index_fn || function () {
                    return 0;
                };
            var updateButton = function () {
                if (img_urls.length > 0) {
                    $elt.find('img').attr('src', img_urls[index_fn()]);
                }
                $elt.css({'background-color': '#efefef'});
            };
            var hoverButton = function () {
                if (img_urls.length > 0) {
                    $elt.find('img').attr('src', img_urls[(index_fn() + 1) % img_urls.length]);
                }
                $elt.css({'background-color': '#d9d9d9'});
            };
            if (qtip_descs.length > 0) {
                addQTipTo($elt, {
                    content: {
                        text: function () {
                            return qtip_descs[index_fn()];
                        }
                    },
                    position: {my: 'bottom middle', at: 'top middle', viewport: $(window)},
                    style: {classes: 'qtip-light qtip-rounded qtip-shadow qtip-lightwhite'},
                    show: {event: "mouseover"},
                    hide: {fixed: true, delay: 100, event: "mouseout"}
                });
            }
            Toolbar.onHover($elt, function () {
                hoverButton();
            }, function () {
                updateButton();
            });
            Toolbar.onMouseDownAndClick($elt, function () {
                    $elt.css({'background-color': '#c7c7c7'});
                },
                function () {
                    callback();
                    updateButton();
                });
            updateButton();
        };
        var $zoom_slider = (function setUpZoom() {
            var zoom_elt = $(toolbar_selector + ' #oncoprint_diagram_slider_icon');
            var $slider = $('<input>', {
                id: "oncoprint_zoom_slider",
                type: "range",
                min: 0,
                max: 1,
                step: 0.0001,
                value: 1,
                change: function (evt) {
                    if (evt.originalEvent) {
                        this.value = oncoprint.setHorzZoom(parseFloat(this.value));
                    } else {
                        this.value = oncoprint.getHorzZoom();
                    }
                },
            });

            $('#oncoprint_zoom_scale_input').on("keypress", function (e) {
                if (e.keyCode === 13) {
                    // 'Enter' key
                    var new_zoom = parseFloat($('#oncoprint_zoom_scale_input').val()) / 100;
                    new_zoom = Math.min(1, new_zoom);
                    new_zoom = Math.max(0, new_zoom);
                    oncoprint.setHorzZoom(new_zoom);
                }
            });
            oncoprint.onHorzZoom(function () {
                $zoom_slider.trigger('change');
                $('#oncoprint_zoom_scale_input').val(Math.round(10000 * oncoprint.getHorzZoom()) / 100);
            });

            appendTo($slider, zoom_elt);
            addQTipTo($slider, {
                id: 'oncoprint_zoom_slider_tooltip',
                prerender: true,
                content: {text: 'Zoom in/out of oncoprint'},
                position: {my: 'bottom middle', at: 'top middle', viewport: $(window)},
                style: {classes: 'qtip-light qtip-rounded qtip-shadow qtip-lightwhite'},
                show: {event: "mouseover"},
                hide: {fixed: true, delay: 100, event: "mouseout"}
            });
            // use aria-labelledby instead of aria-describedby, as Section 508
            // requires that inputs have an explicit label for accessibility
            $slider.attr('aria-labelledby', 'qtip-oncoprint_zoom_slider_tooltip');
            $slider.removeAttr('aria-describedby');
            setUpHoverEffect($slider);

            setUpButton($(toolbar_selector + ' #oncoprint_zoomout'), [], ["Zoom out of oncoprint"], null, function () {
                oncoprint.setHorzZoom(oncoprint.getHorzZoom() * zoom_discount);
            });
            setUpButton($(toolbar_selector + ' #oncoprint_zoomin'), [], ["Zoom in to oncoprint"], null, function () {
                oncoprint.setHorzZoom(oncoprint.getHorzZoom() / zoom_discount);
            });

            return $slider;
        })();

        (function setUpSortBySelector() {
            $(toolbar_selector + ' #by_data_a').click(function () {
                oncoprint.setSortConfig({'type': 'tracks'});
                State.sorting_by_given_order = false;
            });
            $(toolbar_selector + ' #alphabetically_first_a').click(function () {
                oncoprint.setSortConfig({'type': 'alphabetical'});
                State.sorting_by_given_order = false;
            });
            $(toolbar_selector + ' #user_defined_first_a').click(function () {
                State.sorting_by_given_order = true;
                State.patient_order_loaded.then(function () {
                    oncoprint.setSortConfig({'type': 'order', order: State.user_specified_order});
                });
            });
        })();


        (function setUpToggleCellPadding() {
            setUpButton($(toolbar_selector + ' #oncoprint-diagram-removeWhitespace-icon'),
                ['images/unremoveWhitespace.svg', 'images/removeWhitespace.svg'],
                ["Remove whitespace between columns", "Show whitespace between columns"],
                function () {
                    return (State.cell_padding_on ? 0 : 1);
                },
                function () {
                    State.cell_padding_on = !State.cell_padding_on;
                    oncoprint.setCellPaddingOn(State.cell_padding_on);
                });
        })();
        (function setUpHideUnalteredCases() {
            setUpButton($(toolbar_selector + ' #oncoprint-diagram-removeUCases-icon'),
                ['images/unremoveUCases.svg', 'images/removeUCases.svg'],
                ['Hide unaltered cases', 'Show unaltered cases'],
                function () {
                    return (State.unaltered_cases_hidden ? 1 : 0);
                },
                function () {
                    State.unaltered_cases_hidden = !State.unaltered_cases_hidden;
                    if (State.unaltered_cases_hidden) {
                        oncoprint.hideIds(State.unaltered_ids, true);
                    } else {
                        oncoprint.hideIds([], true);
                    }
                });
        })();
        (function setUpZoomToFit() {
            setUpButton($(toolbar_selector + ' #oncoprint_zoomtofit'), [], ["Zoom to fit altered cases in screen"], null, function () {
                oncoprint.setHorzZoomToFit(State.altered_ids);
                oncoprint.scrollTo(0);
            });
        })();
        (function setUpChangeMutationRuleSet() {
            $('#oncoprint_diagram_showmutationcolor_icon').show();
            $('#oncoprint_diagram_mutation_color').hide();
            var setGeneticAlterationTracksRuleSet = function (rule_set_params) {
                var genetic_alteration_track_ids = Object.keys(State.genetic_alteration_tracks);
                oncoprint.setRuleSet(genetic_alteration_track_ids[0], rule_set_params);
                for (var i = 1; i < genetic_alteration_track_ids.length; i++) {
                    oncoprint.shareRuleSet(genetic_alteration_track_ids[0], genetic_alteration_track_ids[i]);
                }
            };

            setUpButton($(toolbar_selector + ' #oncoprint_diagram_showmutationcolor_icon'),
                ['images/colormutations.svg', 'images/uncolormutations.svg', 'images/mutationcolorsort.svg'],
                ['Show all mutations with the same color', 'Color-code mutations but don\'t sort by type', 'Color-code mutations and sort by type',],
                function () {
                    if (State.mutations_colored_by_type && State.sorted_by_mutation_type) {
                        return 0;
                    } else if (!State.mutations_colored_by_type) {
                        return 1;
                    } else if (State.mutations_colored_by_type && !State.sorted_by_mutation_type) {
                        return 2;
                    }
                },
                function () {
                    oncoprint.keepSorted(false);
                    oncoprint.suppressRendering();
                    var genetic_alteration_track_ids = Object.keys(State.genetic_alteration_tracks);
                    if (State.mutations_colored_by_type && !State.sorted_by_mutation_type) {
                        State.sorted_by_mutation_type = true;
                        for (var i = 0; i < genetic_alteration_track_ids.length; i++) {
                            oncoprint.setTrackSortComparator(genetic_alteration_track_ids[i], comparator_utils.makeGeneticComparator(true));
                        }
                    } else if (State.mutations_colored_by_type && State.sorted_by_mutation_type) {
                        State.mutations_colored_by_type = false;
                        setGeneticAlterationTracksRuleSet(window.geneticrules.genetic_rule_set_same_color_for_all_no_recurrence);
                    } else if (!State.mutations_colored_by_type) {
                        State.mutations_colored_by_type = true;
                        State.sorted_by_mutation_type = false;
                        setGeneticAlterationTracksRuleSet(window.geneticrules.genetic_rule_set_different_colors_no_recurrence);
                        for (var i = 0; i < genetic_alteration_track_ids.length; i++) {
                            oncoprint.setTrackSortComparator(genetic_alteration_track_ids[i], comparator_utils.makeGeneticComparator(false));
                        }
                    }
                    oncoprint.keepSorted();
                    oncoprint.releaseRendering();
                });
        })();
        (function setUpDownload() {
            var xml_serializer = new XMLSerializer();
            addQTipTo($(toolbar_selector + ' #oncoprint-diagram-downloads-icon'), {
                //id: "#oncoprint-diagram-downloads-icon-qtip",
                style: {classes: 'qtip-light qtip-rounded qtip-shadow qtip-lightwhite'},
                show: {event: "mouseover"},
                hide: {fixed: true, delay: 100, event: "mouseout"},
                position: {my: 'top center', at: 'bottom center', viewport: $(window)},
                content: {
                    text: function () {
                        return "<button class='oncoprint-diagram-download' type='pdf' style='cursor:pointer;width:90px;'>PDF</button> <br/>" +
                            "<button class='oncoprint-diagram-download' type='png' style='cursor:pointer;width:90px;'>PNG</button> <br/>" +
                            "<button class='oncoprint-diagram-download' type='svg' style='cursor:pointer;width:90px;'>SVG</button> <br/>" +
                            "<button class='oncoprint-sample-download'  type='txt' style='cursor:pointer;width:90px;'>" + (State.using_sample_data ? "Sample" : "Patient") + " order</button>";
                    }
                },
                events: {
                    render: function (event) {
                        $('body').on('click', '.oncoprint-diagram-download', function () {
                            var fileType = $(this).attr("type");
                            var two_megabyte_limit = 2000000;
                            if (fileType === 'pdf') {
                                var svg = oncoprint.toSVG(true);
                                var serialized = cbio.download.serializeHtml(svg);
                                if (serialized.length > two_megabyte_limit) {
                                    alert("Oncoprint too big to download as PDF - please download as SVG");
                                    return;
                                }
                                cbio.download.initDownload(serialized, {
                                    filename: "oncoprint.pdf",
                                    contentType: "application/pdf",
                                    servletName: "svgtopdf.do"
                                });
                            }
                            else if (fileType === 'svg') {
                                cbio.download.initDownload(oncoprint.toSVG(), {filename: "oncoprint.svg"});
                            } else if (fileType === 'png') {
                                var img = oncoprint.toCanvas(function (canvas, truncated) {
                                    canvas.toBlob(function (blob) {
                                        if (truncated) {
                                            alert("Oncoprint too large - PNG truncated to " + canvas.getAttribute("width") + " by " + canvas.getAttribute("height"));
                                        }
                                        saveAs(blob, "oncoprint.png");
                                    }, 'image/png');
                                }, 2);
                            }
                        });

                        $('body').on('click', '.oncoprint-sample-download', function () {
                            var idTypeStr = (State.using_sample_data ? "Sample" : "Patient");
                            var content = idTypeStr + " order in the Oncoprint is: \n";
                            content += oncoprint.getIdOrder().join('\n');
                            var downloadOpts = {
                                filename: 'OncoPrint' + idTypeStr + 's.txt',
                                contentType: "text/plain;charset=utf-8",
                                preProcess: false
                            };

                            // send download request with filename & file content info
                            cbio.download.initDownload(content, downloadOpts);
                        });
                    }
                }
            });
        })();
    })();
    return function (data_by_gene, id_key, altered_ids_by_gene, id_order, gene_order) {
        State.setData(data_by_gene, id_key, altered_ids_by_gene, id_order, gene_order);
    };
}
