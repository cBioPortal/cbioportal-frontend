import * as React from 'react';
import { observer } from 'mobx-react';
import {
    ClinicalViolinPlotIndividualPoint,
    ClinicalViolinPlotBoxData,
} from 'cbioportal-ts-api-client';
import { computed } from 'mobx';
import {
    getViolinX,
    violinPlotSvgHeight,
    violinPlotXPadding,
} from 'pages/studyView/charts/violinPlotTable/StudyViewViolinPlotUtils';

export interface IStudyViewViolinPlotProps {
    curveMagnitudes: number[];
    violinBounds: { min: number; max: number };
    individualPoints: ClinicalViolinPlotIndividualPoint[];
    boxData: ClinicalViolinPlotBoxData;
    showViolin: boolean;
    showBox: boolean;
    width: number;
    gridValues: number[];
}

export const yPadding = 3;
export const height = violinPlotSvgHeight - 2 * yPadding;

@observer
export default class StudyViewViolinPlot extends React.Component<
    IStudyViewViolinPlotProps,
    {}
> {
    @computed get svgWidth() {
        return this.props.width;
    }
    @computed get violinWidth() {
        return this.svgWidth - 2 * violinPlotXPadding;
    }
    renderCurve() {
        if (this.props.curveMagnitudes.length > 0) {
            const center = violinPlotSvgHeight / 2;

            const curveLimit = height / 2;
            const scale = Math.min(
                1,
                curveLimit / Math.max(...this.props.curveMagnitudes)
            );
            const curve = this.props.curveMagnitudes.map(y => scale * y);

            const stepSize = this.violinWidth / (curve.length - 1);

            let dUpperHalf = `M 0 ${center} L 0 ${center - curve[0]}`;
            let dLowerHalf = `M 0 ${center} L 0 ${center + curve[0]}`;
            for (let i = 1; i < curve.length; i++) {
                dUpperHalf = `${dUpperHalf} L ${i * stepSize} ${center -
                    curve[i]}`;
                dLowerHalf = `${dLowerHalf} L ${i * stepSize} ${center +
                    curve[i]}`;
            }
            dUpperHalf = `${dUpperHalf} L ${this.violinWidth} ${center} L 0 ${center}`;
            dLowerHalf = `${dLowerHalf} L ${this.violinWidth} ${center} L 0 ${center}`;

            return (
                <g transform={`translate(${violinPlotXPadding}, 0)`}>
                    <path d={dUpperHalf} fill={'gray'} />
                    <path d={dLowerHalf} fill={'gray'} />
                </g>
            );
        } else {
            return null;
        }
    }

    private x(v: number) {
        return getViolinX(v, this.props.violinBounds, this.violinWidth);
    }

    renderPoints() {
        const y = violinPlotSvgHeight / 2;
        return this.props.individualPoints.map(d => {
            return <circle cx={this.x(d.value)} cy={y} r={3} />;
        });
    }

    renderBox() {
        const center = violinPlotSvgHeight / 2;
        const whiskerLowerX = this.x(this.props.boxData.whiskerLower);
        const whiskerUpperX = this.x(this.props.boxData.whiskerUpper);
        const whiskerTop = center; //10;
        const whiskerBottom = center; //height - 10;

        const boxWidth =
            this.x(this.props.boxData.q3) - this.x(this.props.boxData.q1);
        const boxHeight = 10; //whiskerBottom - whiskerTop;
        const boxX = this.x(this.props.boxData.q1);
        const boxY = center - boxHeight / 2; //whiskerTop;

        const median = this.x(this.props.boxData.median);

        return (
            <>
                {/*left whisker*/}
                <line
                    x1={whiskerLowerX}
                    x2={whiskerLowerX}
                    y1={whiskerTop}
                    y2={whiskerBottom}
                    stroke="black"
                    strokeWidth={1.5}
                />
                {/*connecting line*/}
                <line
                    x1={whiskerLowerX}
                    x2={whiskerUpperX}
                    y1={center}
                    y2={center}
                    stroke="black"
                />
                {/*right whisker*/}
                <line
                    x1={whiskerUpperX}
                    x2={whiskerUpperX}
                    y1={whiskerTop}
                    y2={whiskerBottom}
                    stroke="black"
                    strokeWidth={1.5}
                />
                {/*box*/}
                <rect
                    x={boxX}
                    y={boxY}
                    width={boxWidth}
                    height={boxHeight}
                    fill={'#dddddd'}
                    stroke={'black'}
                    strokeWidth={0.2}
                />
                {/*median*/}
                <line
                    x1={median}
                    x2={median}
                    y1={boxY}
                    y2={boxY + boxHeight}
                    stroke="black"
                />
            </>
        );
    }

    renderGridLines() {
        return (
            <>
                {this.props.gridValues.map((val, index) => {
                    const x = this.x(val);
                    return (
                        <>
                            <line
                                x1={x}
                                x2={x}
                                y1={0}
                                y2={violinPlotSvgHeight}
                                stroke={'#aaa'}
                                strokeWidth={1}
                                strokeDasharray={'3,2'}
                            />
                        </>
                    );
                })}
            </>
        );
    }

    @computed get onlyPoints() {
        return this.props.curveMagnitudes.length === 0;
    }

    render() {
        return (
            <svg
                width={this.svgWidth}
                height={violinPlotSvgHeight}
                style={{
                    marginTop: 5 /*Not sure why the svgs are naturally misaligned with the row, but they are, making this necessary*/,
                }}
            >
                {this.renderGridLines()}
                {this.props.showViolin && this.renderCurve()}
                {!this.onlyPoints && this.props.showBox && this.renderBox()}
                {this.renderPoints()}
            </svg>
        );
    }
}
