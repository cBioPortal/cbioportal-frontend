import * as React from 'react';
import classNames from 'classnames';
import {observer} from "mobx-react";
import {computed} from "mobx";
import DefaultTooltip from "./DefaultTooltip";

export interface ITruncatedTextProps
{
    text: string;
    className?: string;
    maxLength?: number; // max allowed length of the text
    buffer?: number;    // buffer length before considering truncating the text
    suffix?: string;    // will be added to the end of the text if truncated
    addTooltip?: 'truncated'|'always'; // when to add the tooltip
    tooltip?: JSX.Element; // tooltip content
}

export function isTooLong(text: string, maxLength: number, buffer?: number):boolean
{
    return text != null && (text.length > maxLength + (buffer || 0));
}

export function truncateText(text: string, suffix: string, maxLength: number, buffer?: number)
{
    if (isTooLong(text, maxLength, buffer))
    {
        return text.substring(0, maxLength) + suffix;
    }
    else {
        return text;
    }
}

/**
 * @author Selcuk Onur Sumer
 */
@observer
export default class TruncatedText extends React.Component<ITruncatedTextProps, {}> {
    public static defaultProps = {
        maxLength: 50,
        buffer: 2,
        suffix: "...",
        addTooltip: 'truncated'
    };

    public render()
    {
        let content = (
            <span
                style={{whiteSpace: "nowrap"}}
                className={classNames(this.props.className)}
            >
                {this.truncatedText}
            </span>
        );

        if (this.needsTooltip) {
            content = (
                <DefaultTooltip
                    overlay={() => this.props.tooltip || <span />}
                    placement="right"
                    destroyTooltipOnHide={true}
                >
                    {content}
                </DefaultTooltip>
            );
        }

        return content;
    }

    @computed get needsTooltip(): boolean
    {
        return (
            this.props.tooltip !== undefined &&
            (this.props.addTooltip === 'always' || (this.props.addTooltip === 'truncated' && this.isTooLong))
        );
    }

    @computed get isTooLong(): boolean
    {
        return isTooLong(
            this.props.text,
            this.props.maxLength || TruncatedText.defaultProps.maxLength,
            this.props.buffer
        );
    }

    @computed get truncatedText(): string
    {
        return truncateText(
            this.props.text,
            this.props.suffix || TruncatedText.defaultProps.suffix,
            this.props.maxLength || TruncatedText.defaultProps.maxLength,
            this.props.buffer
        );
    }
}
