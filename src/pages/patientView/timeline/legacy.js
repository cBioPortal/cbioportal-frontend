import $ from 'jquery';
import * as _ from 'lodash';
import * as d3 from 'd3';

import clinicalTimelineExports from './timeline-lib';

function plotCaseLabelsInTimeline(caseIds, clinicalDataMap, caseMetaData) {


    var fillColorAndLabelForCase = function (circle, caseId) {
        var label = caseMetaData.label[caseId];
        var color = caseMetaData.color[caseId];
        circle.select("circle").attr("fill", color);
        circle.append("text")
            .attr("y", 4)
            .attr("text-anchor", "middle")
            .attr("font-size", 10)
            .attr("fill", "white")
            .text(label);
    }

    for (var i = 0; i < caseIds.length; i++) {
        var caseId = caseIds[i];
        var clinicalData = clinicalDataMap[caseId];
        var compareAgainstIds = [caseId];

        var OtherSampleId = clinicalData["OTHER_SAMPLE_ID"];
        if (OtherSampleId) {
            compareAgainstIds = compareAgainstIds.concat(OtherSampleId);
        }
        var circle = d3.selectAll(".timelineSeries_0").filter(function (x) {
            if (x.tooltip_tables.length === 1) {
                var specRefNum = x.tooltip_tables[0].filter(function (x) {
                    return x[0] === "SpecimenReferenceNumber" || x[0] === "SPECIMEN_REFERENCE_NUMBER" || x[0] === "SAMPLE_ID";
                })[0];
                if (specRefNum) {
                    return compareAgainstIds.indexOf(specRefNum[1]) !== -1;
                }
            }
            return undefined;
        });
        if (circle[0][0]) {
            var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
            $(g).attr("transform", "translate(" + circle.attr("cx") + "," + circle.attr("cy") + ")");
            $(circle[0]).removeAttr("cx");
            $(circle[0]).removeAttr("cy");
            $(circle[0]).removeAttr("style");
            $(circle[0]).qtip('destroy');
            $(circle[0]).unbind('mouseover mouseout');
            $(circle[0]).wrap(g);
            g = $(circle[0]).parent();
            g.prop("__data__", $(circle[0]).prop("__data__"));
            fillColorAndLabelForCase(d3.select(g.get(0)), caseId);
            window.pvTimeline.addDataPointTooltip(g);
        }
    }
}

export function buildTimeline(params, caseIds, patientInfo, clinicalDataMap, caseMetaData, data, width) {

    if (data.length === 0) return;

    var timeData = clinicalTimelineExports.clinicalTimelineParser(data);
    if (timeData.length === 0) return;

    // order specimens by svg label number
    var specimen = _.find(timeData, (item) => item.label === 'Specimen');
    if (specimen) {
        specimen.times = _.sortBy(specimen.times, function (x) {
            var sortOrder = Infinity;

            var specRefNum = _.filter(x.tooltip_tables[0], function (x) {
                return x[0] === "SPECIMEN_REFERENCE_NUMBER" || x[0] === "SpecimenReferenceNumber" || x[0] === "SAMPLE_ID";
            });
            if (specRefNum) {
                if (specRefNum.length > 1) {
                    console.warn("More than 1 specimen reference number found in tooltip table");
                } else if (specRefNum.length === 1) {
                    sortOrder = caseIds.indexOf(specRefNum[0][1]);
                    if (sortOrder === -1) {
                        sortOrder = Infinity;
                    }
                }
            }
            return sortOrder;
        });
    }

    // add DECEASED point to Status track using data from
    // .*OS_MONTHS$ if .*OS_STATUS$ is DECEASED
    var i;
    var prefixes;
    prefixes = Object.keys(patientInfo).filter(function (x) {
        // find all keys postfixed with "OS_STATUS"
        return /OS_STATUS$/.test(x);
    }).map(function (x) {
        // get the prefixes
        return x.substr(0, x.length - "OS_STATUS".length);
    });

    for (i = 0; i < prefixes.length; i++) {
        var prefix = prefixes[i];
        if (patientInfo[prefix + "OS_STATUS"] === "DECEASED" &&
            prefix + "OS_MONTHS" in patientInfo) {
            var days = Math.round(parseFloat(patientInfo[prefix + "OS_MONTHS"]) * 30.4);
            var timePoint = {
                "starting_time": days,
                "ending_time": days,
                "display": "circle",
                "color": "#000",
                "tooltip_tables": [
                    [
                        ["START_DATE", days],
                        ["STATUS", "DECEASED"]
                    ]
                ]
            }

            var trackData = timeData.filter(function (x) {
                return x.label === "Status";
            })[0];

            if (trackData) {
                trackData.times = trackData.times.concat(timePoint);
            } else {
                timeData = timeData.concat({
                    "label": "Status",
                    "times": [timePoint]
                });
            }
            // Add timepoint only once in case of multiple prefixes
            break;
        }
    }

    window.pvTimeline = clinicalTimelineExports.clinicalTimeline()
        .width(width)
        .data(timeData)
        .divId("#timeline")
        .setTimepointsDisplay("Imaging", "square")
        .orderTracks(["Specimen", "Surgery", "Status", "Diagnostics", "Diagnostic", "Imaging", "Lab_test", "Treatment"])
        .splitByClinicalAttributes("Lab_test", "TEST")
    var splitData = window.pvTimeline.data();
    // Get TEST names that have a RESULT field in their clinical
    // tooltip table. We assume the RESULT field contains
    // integer/float values that can be used to size the dots on the
    // timeline by
    var testsWithResults = splitData.filter(function (x) {
        return x.parent_track === 'Lab_test' &&
            _.every(x.times.map(
                function (t) {
                    return t.tooltip_tables.length === 1 &&
                        t.tooltip_tables[0].filter(function (a) {
                            return a[0] === 'RESULT'
                        }).length > 0;
                })
            )
    }).map(function (x) {
        return x.label;
    });
    // Scale dot size on timepoint by RESULT field
    testsWithResults.forEach(function (test) {
        window.pvTimeline =
            window.pvTimeline
                .sizeByClinicalAttribute(test, "RESULT")
    })
    window.pvTimeline =
        window.pvTimeline
            .splitByClinicalAttributes("Treatment", ["SUBTYPE", "AGENT"])
            .splitByClinicalAttributes("Treatment", ["TREATMENT_TYPE", "AGENT"])
            .collapseAll()
            .toggleTrackCollapse("Specimen")
            .enableTrackTooltips(false)
            .plugins([{obj: new clinicalTimelineExports.trimClinicalTimeline("Trim Timeline"), enabled: true}])
            .addPostTimelineHook(plotCaseLabelsInTimeline.bind(this, caseIds, clinicalDataMap, caseMetaData));
    window.pvTimeline();
    $("#timeline-container").show();


    // $.post("http://www.cbioportal.org/clinical_timeline_data.json",
    //     params,
    //
    //     , "json"
    // );

}
