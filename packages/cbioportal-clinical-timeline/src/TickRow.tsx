import { TickIntervalEnum, TimelineTick } from './types';
import React from 'react';
import { TimelineStore } from './TimelineStore';
import { observer } from 'mobx-react';
import _ from 'lodash';

interface ITickRowProps {
    store: TimelineStore;
}

const TickRow: React.FunctionComponent<ITickRowProps> = observer(function({
    store,
}) {
    return (
        <div className={'tl-ticks'}>
            {store.ticks.map((tick: TimelineTick) => {
                let content: JSX.Element | null = null;

                const normalTickWidth = store.tickInterval; //store.ticks[1].end - store.ticks[1].start;

                const minorTicks: JSX.Element[] = [];

                let startPoint;

                if (tick === store.firstTick) {
                    startPoint = tick.end - store.tickInterval + 1; //tick.end - normalTickWidth - 1;
                } else {
                    startPoint = tick.start;
                }

                const majorTickPosition = store.getPosition({
                    start: startPoint,
                });

                const style = majorTickPosition
                    ? {
                          left: majorTickPosition.left,
                      }
                    : undefined;

                if (tick.isTrim === true) {
                    // @ts-ignore
                    const points = [
                        'M0,5',
                        'L2.5,8',
                        'L5,0',
                        'L7.5,10',
                        'L10,0',
                        'L12.5,10',
                        'L15,0',
                        'L17.5,8',
                        'L20,5',
                    ];
                    content = (
                        <div className={'tl-timeline-trim-squiqqle'}>
                            {_.range(1).map(() => {
                                return (
                                    <svg height="10" width="20">
                                        <g className="kink">
                                            <path
                                                d={points.join('')}
                                                stroke={'#999999'}
                                                stroke-width="0.5"
                                                fill="none"
                                                className="kink-line"
                                                style={{ cursor: 'pointer' }}
                                            ></path>
                                        </g>
                                    </svg>
                                );
                            })}
                            <div className={'tl-timeline-tickline'}></div>
                        </div>
                    );
                } else {
                    const count = startPoint / store.tickInterval;
                    const unit =
                        store.tickInterval === TickIntervalEnum.MONTH
                            ? 'm'
                            : 'y';

                    let majorLabel: string = '';

                    if (count < 0) {
                        majorLabel = `${count}${unit}`;
                    }

                    if (count === 0) {
                        majorLabel = '0';
                    }

                    if (count > 0) {
                        majorLabel = `${count}${unit}`;
                    }

                    content = tick.isTrim ? null : (
                        <>
                            {majorLabel}
                            <div className={'tl-tickline'}></div>
                        </>
                    );

                    if (store.tickPixelWidth > 150) {
                        const minorTickWidth = TickIntervalEnum.MONTH;

                        for (let i = 1; i < 12; i++) {
                            let minorStyle = undefined;

                            const position = store.getPosition({
                                start: startPoint + minorTickWidth * i,
                            });

                            if (position) {
                                minorStyle = {
                                    left: position.left,
                                };
                            }

                            let minorLabel = '';
                            let showLabel = false;
                            if (store.tickPixelWidth > 150) {
                                if (i % 4 === 0) {
                                    // only odd
                                    showLabel = true;
                                }
                                if (store.tickPixelWidth > 700) {
                                    showLabel = true;
                                }
                            }

                            if (showLabel) {
                                let minorCount = i;
                                if (count < 0) {
                                    minorCount = 12 - i;
                                    majorLabel =
                                        count + 1 === 0
                                            ? ''
                                            : `${count + 1}${unit}`;
                                    minorLabel =
                                        count === -1
                                            ? `-${minorCount}m`
                                            : `${majorLabel} ${minorCount}m`;
                                } else {
                                    minorLabel =
                                        count === 0
                                            ? `${minorCount}m`
                                            : `${majorLabel} ${minorCount}m`;
                                }
                            }

                            if (minorStyle) {
                                minorTicks.push(
                                    <div
                                        className={'tl-timeline-minortick'}
                                        style={minorStyle}
                                    >
                                        {minorLabel}
                                        <div className={'tl-tickline'}></div>
                                    </div>
                                );
                            }
                        }
                    }
                }

                // DAY TICKS
                // if (store.tickPixelWidth > 2000) {
                //     const dayTickWidth = TickIntervalEnum.MONTH/30;
                //     for (let i = 0; i <= 365; i++) {
                //
                //         if (i % 30 !== 0) {
                //             const position = majorTickPosition && store.getPosition(
                //                 {start: startPoint + dayTickWidth * i},
                //                 store.trimmedLimit
                //             );
                //             if (position) {
                //                 minorTicks.push(
                //                     <div className={'tl-daytick'} style={{left: position.left}}>
                //                         <div className={'tl-tickline'}></div>
                //                     </div>
                //                 )
                //             }
                //         }
                //     }
                //
                //
                // }

                return (
                    <>
                        {style && (
                            <div
                                className={
                                    tick.isTrim ? 'tl-timeline-trim' : ''
                                }
                                style={style}
                            >
                                {content}
                            </div>
                        )}

                        {minorTicks}
                    </>
                );
            })}
        </div>
    );
});

export default TickRow;
