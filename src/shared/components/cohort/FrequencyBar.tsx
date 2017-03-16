import * as React from 'react';
import DefaultTooltip from 'shared/components/DefaultTooltip';

export interface IFrequencyBarProps
{
    totalCount: number;
    counts: number[];
    freqColors?: string[];
    barColor?: string;
    barWidth?: number;
    barHeight?: number;
    textMargin?: number;
    tooltip?: JSX.Element;
}

/**
 * @author Selcuk Onur Sumer
 */
export default class FrequencyBar extends React.Component<IFrequencyBarProps, {}>
{
    public static defaultProps = {
        freqColors: ["lightgreen", "green"],
        barColor: "#ccc",
        textMargin: 6,
        barWidth: 30,
        barHeight: 8
    };

    public static get TEXT_WIDTH() {
        return 35;
    }

    constructor(props:IFrequencyBarProps) {
        super(props);
    }

    public mainContent()
    {
        const {
            barWidth, barHeight, barColor, totalCount, counts, textMargin
        } = this.props;

        const freqColors = this.props.freqColors || FrequencyBar.defaultProps.freqColors;
        const mainProportion = counts[0] / totalCount; // assuming the first count in the list is the main
        const textPos = (barWidth || 0) + (textMargin || 0);
        const totalWidth = textPos + FrequencyBar.TEXT_WIDTH;

        // create a frequency rectangle for each count
        const freqRects: JSX.Element[] = [];

        counts.forEach((count: number, index: number) => {
            const colorIdx = index % freqColors.length;
            const color = colorIdx >= 0 ? freqColors[colorIdx] : freqColors[0];

            freqRects.push(this.frequencyRectangle(count, totalCount, color));
        });

        return (
            <svg width={totalWidth} height="12">
                <text
                    x={textPos}
                    y="9.5"
                    textAnchor="start"
                    fontSize="10"
                >
                    {`${(100 * mainProportion).toFixed(1)}%`}
                </text>
                <rect
                    y="2"
                    width={barWidth}
                    height={barHeight}
                    fill={barColor}
                />
                {freqRects}
            </svg>
        );
    }

    public frequencyRectangle(count: number, totalCount: number, color: string)
    {
        const proportion = count / totalCount;
        const {barWidth, barHeight} = this.props;

        return (
            <rect
                y="2"
                width={proportion * (barWidth || 0)}
                height={barHeight}
                fill={color}
            />
        );
    }

    public render()
    {
        let content = this.mainContent();

        // add tooltip if provided
        if (this.props.tooltip)
        {
            content = (
                <DefaultTooltip
                    placement="left"
                    overlay={this.props.tooltip}
                    arrowContent={<div className="rc-tooltip-arrow-inner"/>}
                >
                    {content}
                </DefaultTooltip>
            );
        }

        return content;
    }
}
