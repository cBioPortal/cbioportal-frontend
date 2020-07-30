import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react-lite';

import 'cbioportal-clinical-timeline/dist/styles.css';

import {
    TimelineTrack,
    TimelineStore,
    Timeline,
    TimelineEvent,
} from 'cbioportal-clinical-timeline';

import { ClinicalEvent } from 'cbioportal-ts-api-client';
import { configureTracks } from 'cbioportal-clinical-timeline';
import { getAttributeValue } from 'cbioportal-clinical-timeline';
import SampleManager from 'pages/patientView/SampleManager';
import VAFChartWrapper from 'pages/patientView/timeline2/VAFChartWrapper';
import SampleMarker from 'pages/patientView/timeline2/SampleMarker';

function getData(eventData: any) {
    return _.groupBy(eventData, (e: any) => e.eventType.toUpperCase());
}

function makeItems(items: any) {
    return items.map((e: any) => {
        return {
            end:
                e.endNumberOfDaysSinceDiagnosis ||
                e.startNumberOfDaysSinceDiagnosis,
            start: e.startNumberOfDaysSinceDiagnosis,
            event: e,
        };
    });
}

function splitCats(splits: string[], cat: any): TimelineTrack {
    if (!cat[0].attributes.find((att: any) => att.key === splits[0])) {
        return {
            type: 'moo',
            items: makeItems(cat),
        };
    }

    const groups = _.groupBy(
        cat,
        item => item.attributes.find((att: any) => att.key === splits[0]).value
    );

    const tracks: TimelineTrack[] = _.map(groups, (group, key) => {
        if (splits.length > 1) {
            const track = splitCats(splits.slice(1), group);
            track.type = key;
            return track;
        } else {
            return {
                type: key,
                items: makeItems(group),
            };
        }
    });

    const track = {
        type: cat[0].attributes.find((att: any) => att.key === splits[0]).value,
        tracks,
        items: [],
    };

    return track;
}

export interface ISampleMetaDeta {
    color: { [sampleId: string]: string };
    index: { [sampleId: string]: number };
    label: { [sampleId: string]: string };
}

export interface ITimeline2Props {
    data: ClinicalEvent[];
    caseMetaData: ISampleMetaDeta;
    sampleManager: SampleManager;
    width: number;
}

const TimelineWrapper: React.FunctionComponent<ITimeline2Props> = observer(
    function({ data, caseMetaData, sampleManager, width }: ITimeline2Props) {
        const [events, setEvents] = useState<TimelineTrack[] | null>(null);

        const [store, setStore] = useState<TimelineStore | null>(null);

        useEffect(() => {
            var isGenieBpcStudy = window.location.href.includes('genie_bpc');

            let baseConfig: any = {
                sortOrder: [
                    'Specimen',
                    'Surgery',
                    'Med Onc Assessment',
                    'Status',
                    'Diagnostics',
                    'Diagnostic',
                    'Imaging',
                    'Lab_test',
                    'Treatment',
                ],
                splitConfig: [
                    ['TREATMENT', 'TREATMENT_TYPE', 'SUBTYPE', 'AGENT'],
                    ['LAB_TEST', 'TEST'],
                ],
                trackEventRenderers: [
                    {
                        trackTypeMatch: /LAB_TEST/i,
                        configureTrack: (cat: TimelineTrack) => {
                            const psaTrack = cat.tracks
                                ? cat.tracks.find(t => t.type === 'PSA')
                                : undefined;

                            if (psaTrack && psaTrack && psaTrack.items.length) {
                                const psaValues = psaTrack.items.map(event => {
                                    const val = getAttributeValue(
                                        'VALUE',
                                        event
                                    );

                                    return val
                                        ? parseFloat(val.replace(/^[<>]/gi, ''))
                                        : undefined;
                                });

                                //console.log(psaValues.map(v => v.value));
                                const max = _.max(psaValues);

                                psaTrack.items.forEach(event => {
                                    event.render = () => {
                                        let perc =
                                            getAttributeValue('VALUE', event) /
                                            (max || 1)!;
                                        perc = perc > 0.2 ? perc : 0.2;
                                        return (
                                            <svg width="18" height="19">
                                                <circle
                                                    cx={10}
                                                    cy={10}
                                                    r={8 * perc}
                                                    fill={'#999999'}
                                                />
                                            </svg>
                                        );
                                    };
                                });
                            }
                        },
                    },
                    {
                        trackTypeMatch: /SPECIMEN|SAMPLE ACQUISITION|SEQUENCING/i,
                        configureTrack: (cat: TimelineTrack) => {
                            // we want a custom tooltip for samples, which includes clinical data
                            // not included in the timeline event
                            cat.renderTooltip = function(event: TimelineEvent) {
                                const hoveredSample = event.event.attributes.find(
                                    (att: any) => att.key === 'SAMPLE_ID'
                                );

                                const sampleWithClinicalData = sampleManager.samples.find(
                                    sample => {
                                        return (
                                            sample.id === hoveredSample.value
                                        );
                                    }
                                );

                                if (sampleWithClinicalData) {
                                    return (
                                        <table>
                                            <tr>
                                                <th>SAMPLE ID</th>
                                                <td>
                                                    {sampleWithClinicalData.id}
                                                </td>
                                            </tr>
                                            {sampleWithClinicalData.clinicalData.map(
                                                d => {
                                                    return (
                                                        <tr>
                                                            <th>
                                                                {d.clinicalAttributeId
                                                                    .toUpperCase()
                                                                    .replace(
                                                                        /_/g,
                                                                        ' '
                                                                    )}
                                                            </th>
                                                            <td>{d.value}</td>
                                                        </tr>
                                                    );
                                                }
                                            )}
                                            <tr>
                                                <th>START DATE</th>
                                                <td>{event.start}</td>
                                            </tr>
                                        </table>
                                    );
                                } else {
                                    return (
                                        <div>
                                            Error. Cannot find data for sample.
                                        </div>
                                    );
                                }
                            };

                            cat.items.forEach((event, i) => {
                                const sampleId = event.event.attributes.find(
                                    (att: any) => att.key === 'SAMPLE_ID'
                                );
                                if (sampleId) {
                                    const color =
                                        caseMetaData.color[sampleId.value] ||
                                        '#333333';
                                    const label =
                                        caseMetaData.label[sampleId.value] ||
                                        '-';
                                    event.render = event => {
                                        return (
                                            <SampleMarker
                                                color={color}
                                                label={label}
                                            />
                                        );
                                    };
                                }
                            });
                        },
                    },
                ],
            };

            if (isGenieBpcStudy) {
                baseConfig.sortOrder = [
                    'Sample acquisition',
                    'Sequencing',
                    'Surgery',
                    'Diagnostics',
                    'Diagnostic',
                    'Treatment',
                    'Lab_test',
                    'Status',
                    'IMAGING',
                    'Med Onc Assessment',
                ];

                // this differs from default in that on genie, we do NOT split on subtype. we hide on subtype
                baseConfig.splitConfig = [
                    ['TREATMENT', 'TREATMENT_TYPE', 'AGENT'],
                    ['LAB_TEST', 'TEST'],
                ];

                // status track
                baseConfig.trackEventRenderers.push({
                    trackTypeMatch: /STATUS|Med Onc Assessment/i,
                    configureTrack: (cat: TimelineTrack) => {
                        cat.label = 'Med Onc Assessment';
                        const colorMappings = [
                            { re: /indeter/i, color: '#ffffff' },
                            { re: /stable/i, color: 'gainsboro' },
                            { re: /mixed/i, color: 'goldenrod' },
                            { re: /improving/i, color: 'rgb(44, 160, 44)' },
                            { re: /worsening/i, color: 'rgb(214, 39, 40)' },
                        ];
                        cat.items.forEach((event, i) => {
                            const status = event.event.attributes.find(
                                (att: any) => att.key === 'STATUS'
                            );
                            let color = '#ffffff';
                            if (status) {
                                const colorConfig = colorMappings.find(m =>
                                    m.re.test(status.value)
                                );
                                if (colorConfig) {
                                    color = colorConfig.color;
                                }
                            }
                            event.render = event => {
                                return (
                                    <svg width="10" height="10">
                                        <circle
                                            cx="5"
                                            cy="5"
                                            r="4"
                                            stroke="#999999"
                                            fill={color}
                                        />
                                    </svg>
                                );
                            };
                        });
                    },
                });

                // imaging track
                baseConfig.trackEventRenderers.push({
                    trackTypeMatch: /IMAGING/i,
                    configureTrack: (cat: TimelineTrack) => {
                        cat.label = 'Imaging Assessment';

                        const colorMappings = [
                            {
                                re: /indeter|does not mention/i,
                                color: '#ffffff',
                            },
                            { re: /stable/i, color: 'gainsboro' },
                            { re: /mixed/i, color: 'goldenrod' },
                            { re: /improving/i, color: 'rgb(44, 160, 44)' },
                            { re: /worsening/i, color: 'rgb(214, 39, 40)' },
                        ];
                        if (cat.items && cat.items.length) {
                            cat.items.forEach((event, i) => {
                                const status = event.event.attributes.find(
                                    (att: any) => att.key === 'IMAGE_OVERALL'
                                );
                                let color = '#ffffff';
                                if (status) {
                                    const colorConfig = colorMappings.find(m =>
                                        m.re.test(status.value)
                                    );
                                    if (colorConfig) {
                                        color = colorConfig.color;
                                    }
                                }
                                event.render = event => {
                                    return (
                                        <svg width="10" height="10">
                                            <circle
                                                cx="5"
                                                cy="5"
                                                r="4"
                                                stroke="#999999"
                                                fill={color}
                                            />
                                        </svg>
                                    );
                                };
                            });
                        }
                    },
                });
            } else {
            }

            const keyedSplits = _.keyBy(baseConfig.splitConfig, arr => arr[0]);

            //data[0].startNumberOfDaysSinceDiagnosis = -720;

            const cats = getData(data);

            //configureTracks(_.values(d), baseConfig.trackEventRenderers);

            const merged = _.uniq(
                baseConfig.sortOrder
                    .map((name: string) => name.toUpperCase())
                    .concat(Object.keys(cats))
            );
            const sortedCats = _.reduce(
                merged,
                (agg: { [k: string]: any }, key: string) => {
                    if (key in cats) {
                        agg[key] = cats[key];
                    }
                    return agg;
                },
                {}
            );

            const d = _.map(sortedCats, (cat, key) => {
                if (key in keyedSplits) {
                    const splits = splitCats(keyedSplits[key].slice(1), cat);
                    return {
                        type: key,
                        items: [],
                        tracks: splits.tracks,
                    };
                } else {
                    return {
                        type: key,
                        items: makeItems(cat),
                    };
                }
            });

            configureTracks(d, baseConfig.trackEventRenderers);

            const store = new TimelineStore(d);

            setStore(store);

            (window as any).store = store;
        }, []);

        if (store) {
            return (
                <Timeline
                    store={store}
                    width={width}
                    customRows={store => {
                        return (
                            <VAFChartWrapper
                                store={store}
                                sampleMetaData={caseMetaData}
                            />
                        );
                    }}
                />
            );
        } else {
            return <div></div>;
        }
    }
);

export default TimelineWrapper;
