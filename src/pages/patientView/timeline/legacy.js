import $ from 'jquery';
import * as _ from 'lodash';
import * as d3 from 'd3';

import clinicalTimelineExports from './timeline-lib';

const SAMPLE_ID_ALIASES = [
    'SAMPLE_ID',
    'SPECIMEN_REFERENCE_NUMBER',
    'SpecimenReferenceNumber',
];

// TODO: these are some styling hacks for genie. Need to figure out how to add
// proper support for this in the library (or the future reactified library)
function addMoreGenieTimelineStylingHacks() {
    $("circle[id^='timelineItem_2']").attr('stroke', 'gray');
    $("circle[id^='timelineItem_2']").attr('stroke-width', '0.5px');
    $("circle[id^='timelineItem_2']").attr('r', '4.5');
    $("circle[id^='timelineItem_3']").attr('stroke', 'gray');
    $("circle[id^='timelineItem_3']").attr('stroke-width', '0.5px');
    $("circle[id^='timelineItem_3']").attr('r', '4.5');
    $("circle[id^='timelineItem_4']").attr('stroke', 'gray');
    $("circle[id^='timelineItem_4']").attr('stroke-width', '0.5px');
    $("circle[id^='timelineItem_4']").attr('r', '4.5');
}

function plotCaseLabelsInTimeline(
    timelineClasses,
    caseIds,
    clinicalDataMap,
    caseMetaData
) {
    var fillColorAndLabelForCase = function(circle, caseId) {
        var label = caseMetaData.label[caseId];
        var color = caseMetaData.color[caseId];
        circle.select('circle').attr('fill', color);
        circle
            .append('text')
            .attr('y', 4)
            .attr('r', 6)
            .attr('text-anchor', 'middle')
            .attr('font-size', 10)
            .attr('fill', 'white')
            .text(label);
    };

    for (var i = 0; i < caseIds.length; i++) {
        var caseId = caseIds[i];
        var clinicalData = clinicalDataMap[caseId];
        var compareAgainstIds = [caseId];

        var OtherSampleId = clinicalData['OTHER_SAMPLE_ID'];
        if (OtherSampleId) {
            compareAgainstIds = compareAgainstIds.concat(OtherSampleId);
        }
        timelineClasses.forEach(timelineRow => {
            var circle = d3.selectAll(timelineRow).filter(function(x) {
                if (x.tooltip_tables.length === 1) {
                    var specRefNum = x.tooltip_tables[0].filter(function(x) {
                        return SAMPLE_ID_ALIASES.includes(x[0]);
                    })[0];
                    if (specRefNum) {
                        return compareAgainstIds.indexOf(specRefNum[1]) !== -1;
                    }
                }
                return undefined;
            });
            if (circle[0][0]) {
                var g = document.createElementNS(
                    'http://www.w3.org/2000/svg',
                    'g'
                );
                if (circle.attr('cx') !== null && circle.attr('cy') !== null) {
                    $(g).attr(
                        'transform',
                        'translate(' +
                            circle.attr('cx') +
                            ',' +
                            circle.attr('cy') +
                            ')'
                    );
                }
                $(circle[0]).removeAttr('cx');
                $(circle[0]).removeAttr('cy');
                $(circle[0]).removeAttr('style');
                $(circle[0]).qtip('destroy');
                $(circle[0]).unbind('mouseover mouseout');
                $(circle[0]).wrap(g);
                g = $(circle[0]).parent();
                g.prop('__data__', $(circle[0]).prop('__data__'));
                fillColorAndLabelForCase(d3.select(g.get(0)), caseId);
                window.pvTimeline.addDataPointTooltip(g);
            }
        });
    }
}

export function buildTimeline(
    params,
    caseIds,
    patientInfo,
    clinicalDataMap,
    caseMetaData,
    data,
    width
) {
    if (data.length === 0) return;

    var timeData = clinicalTimelineExports.clinicalTimelineParser(data);
    if (timeData.length === 0) return;

    // TODO: remove this, special dev configuration for genie_bpc* studies
    var isGenieBpcStudy = window.location.href.includes('genie_bpc');
    if (isGenieBpcStudy) {
        // color based on state (need to rename Status to Med Onc Assessment)
        var statusGenieData = _.find(
            //DONE
            timeData,
            item =>
                item.label === 'Status' || item.label == 'Med Onc Assessment'
        );
        if (statusGenieData) {
            //DONE
            statusGenieData.label = 'Med Onc Assessment'; //DONE
            statusGenieData.times.forEach(time => {
                //DONE
                var state = _.find(
                    time.tooltip_tables[0],
                    row => row[0] === 'STATUS'
                )[1].toLowerCase();
                if (state.includes('indeter')) {
                    time['color'] = 'white';
                } else if (state.includes('stable')) {
                    time['color'] = 'gainsboro';
                } else if (state.includes('mixed')) {
                    time['color'] = 'goldenrod';
                } else if (state.includes('improving')) {
                    time['color'] = 'rgb(44, 160, 44)';
                } else if (state.includes('worsening')) {
                    time['color'] = 'rgb(214, 39, 40)';
                }
            });
        }
        // same for imaging
        var imagingGenieData = _.find(
            timeData,
            item => item.label === 'Imaging'
        );
        if (imagingGenieData) {
            // CONDITION IS DONE
            imagingGenieData.times.forEach(time => {
                var imageOverall = _.find(
                    time.tooltip_tables[0],
                    row => row[0] === 'IMAGE_OVERALL'
                );
                imageOverall = imageOverall
                    ? imageOverall[1].toLowerCase()
                    : 'indeterminate';
                if (
                    imageOverall.includes('indeter') ||
                    imageOverall.includes('does not mention')
                ) {
                    time['color'] = 'white';
                } else if (imageOverall.includes('stable')) {
                    time['color'] = 'gainsboro';
                } else if (imageOverall.includes('mixed')) {
                    time['color'] = 'goldenrod';
                } else if (imageOverall.includes('improving')) {
                    time['color'] = 'rgb(44, 160, 44)';
                } else if (imageOverall.includes('worsening')) {
                    time['color'] = 'rgb(214, 39, 40)';
                }
            });
        }
    }

    // order specimens by svg label number
    var specimen = _.find(timeData, item => item.label === 'Specimen');
    if (specimen) {
        specimen.times = _.sortBy(specimen.times, function(x) {
            var sortOrder = Infinity;

            var specRefNum = _.filter(x.tooltip_tables[0], function(x) {
                return SAMPLE_ID_ALIASES.includes(x[0]);
            });
            if (specRefNum) {
                if (specRefNum.length > 1) {
                    console.warn(
                        'More than 1 specimen reference number found in tooltip table'
                    );
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

    // add DECEASED point to Status track using data from .*OS_MONTHS$ if
    // .*OS_STATUS$ is DECEASED
    //
    // TODO: we might want to remove this entirely. For now we only remove it
    // for a test study where we have curated the DECEASED points in data rather
    // than computing it on the frontend. That might have to be the future way
    // of doing things
    var isMskImpactJuneTestStudy = window.location.href.includes(
        'mskimpact_test_june'
    );
    if (!isMskImpactJuneTestStudy) {
        var i;
        var prefixes;
        prefixes = Object.keys(patientInfo)
            .filter(function(x) {
                // find all keys postfixed with "OS_STATUS"
                return /OS_STATUS$/.test(x);
            })
            .map(function(x) {
                // get the prefixes
                return x.substr(0, x.length - 'OS_STATUS'.length);
            });

        for (i = 0; i < prefixes.length; i++) {
            var prefix = prefixes[i];
            if (
                patientInfo[prefix + 'OS_STATUS'] === '1:DECEASED' &&
                prefix + 'OS_MONTHS' in patientInfo
            ) {
                var days = Math.round(
                    parseFloat(patientInfo[prefix + 'OS_MONTHS']) * 30.4
                );
                var timePoint = {
                    starting_time: days,
                    ending_time: days,
                    display: 'circle',
                    color: '#000',
                    tooltip_tables: [
                        [['START_DATE', days], ['STATUS', 'DECEASED']],
                    ],
                };

                var trackData = timeData.filter(function(x) {
                    return x.label === 'Status';
                })[0];

                if (trackData) {
                    trackData.times = trackData.times.concat(timePoint);
                } else {
                    timeData = timeData.concat({
                        label: 'Status',
                        times: [timePoint],
                    });
                }
                // Add timepoint only once in case of multiple prefixes
                break;
            }
        }
    }

    window.pvTimeline = clinicalTimelineExports
        .clinicalTimeline()
        .width(width)
        .data(timeData)
        .divId('#timeline')
        .setTimepointsDisplay('Imaging', 'square')
        .orderTracks([
            'Specimen',
            'Surgery',
            'Med Onc Assessment',
            'Status',
            'Diagnostics',
            'Diagnostic',
            'Imaging',
            'Lab_test',
            'Treatment',
        ])
        .splitByClinicalAttributes('Lab_test', 'TEST');
    var splitData = window.pvTimeline.data();

    // Get TEST names that have a RESULT field in their clinical
    // tooltip table. We assume the RESULT field contains
    // integer/float values that can be used to size the dots on the
    // timeline by
    var testsWithResults = splitData
        .filter(function(x) {
            return (
                x.parent_track === 'Lab_test' &&
                _.every(
                    x.times.map(function(t) {
                        return (
                            t.tooltip_tables.length === 1 &&
                            t.tooltip_tables[0].filter(function(a) {
                                return a[0] === 'RESULT';
                            }).length > 0
                        );
                    })
                )
            );
        })
        .map(function(x) {
            return x.label;
        });
    // Scale dot size on timepoint by RESULT field
    testsWithResults.forEach(function(test) {
        window.pvTimeline = window.pvTimeline.sizeByClinicalAttribute(
            test,
            'RESULT'
        );
    });

    if (isGenieBpcStudy) {
        window.pvTimeline = window.pvTimeline
            .orderTracks([
                'Sample acquisition',
                'Sequencing',
                'Surgery',
                'Med Onc Assessment',
                'Status',
                'Diagnostics',
                'Diagnostic',
                'Imaging',
                'Lab_test',
                'Treatment',
            ])
            .setTimepointsDisplay('Imaging', 'circle')
            .splitByClinicalAttributes('Treatment', ['TREATMENT_TYPE', 'AGENT'])
            .enableTrackTooltips(false)
            .plugins([
                {
                    obj: new clinicalTimelineExports.trimClinicalTimeline(
                        'Trim Timeline'
                    ),
                    enabled: true,
                },
            ])
            .addPostTimelineHook(addMoreGenieTimelineStylingHacks.bind(this));
    } else {
        window.pvTimeline = window.pvTimeline
            .splitByClinicalAttributes('Treatment', [
                'TREATMENT_TYPE',
                'SUBTYPE',
                'AGENT',
            ])
            .splitByClinicalAttributes('Diagnosis', ['SUBTYPE'])
            .collapseAll()
            .enableTrackTooltips(false)
            .plugins([
                {
                    obj: new clinicalTimelineExports.trimClinicalTimeline(
                        'Trim Timeline'
                    ),
                    enabled: true,
                },
            ]);
    }
    // find tracks that have a SAMPLE_ID in their tooltip, so we can replace
    // them with the sample label icon (i.e. the circle with 1/2/3 in it)
    var tracksContainingSamples = window.pvTimeline
        .data()
        .reduce(function(previous, currentTrack, i) {
            if (
                currentTrack.times.length > 0 &&
                _.every(
                    currentTrack.times.map(function(t) {
                        return (
                            t.tooltip_tables.length > 0 &&
                            _.every(
                                t.tooltip_tables.map(
                                    table =>
                                        table.filter(function(a) {
                                            return SAMPLE_ID_ALIASES.includes(
                                                a[0]
                                            );
                                        }).length > 0
                                )
                            )
                        );
                    })
                )
            ) {
                return _.concat(previous, [
                    {
                        label: currentTrack.label,
                        index: i,
                        className: `.timelineSeries_${i}`,
                    },
                ]);
            } else {
                return previous;
            }
        }, []);
    // replace tracks with number labels
    if (tracksContainingSamples && tracksContainingSamples.length > 0) {
        tracksContainingSamples.forEach(t => {
            window.pvTimeline.toggleTrackCollapse(t.label);
        });
        window.pvTimeline.addPostTimelineHook(
            plotCaseLabelsInTimeline.bind(
                this,
                tracksContainingSamples.map(t => t.className),
                caseIds,
                clinicalDataMap,
                caseMetaData
            )
        );
    }
    window.pvTimeline();
    $('#timeline-container').show();

    // $.post("http://www.cbioportal.org/clinical_timeline_data.json",
    //     params,
    //
    //     , "json"
    // );
}
