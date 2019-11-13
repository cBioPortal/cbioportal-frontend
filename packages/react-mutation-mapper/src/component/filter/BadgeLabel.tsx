import * as React from "react";
import {CSSProperties} from "react";

export type BadgeLabelProps = {
    label: JSX.Element | string;
    badgeContent?: number | string;
    badgeStyleOverride?: CSSProperties;
    badgeClassName?: string;
    badgeFirst?: boolean;
};

export const DEFAULT_BADGE_STYLE = {
    color: "#FFF",
    backgroundColor: "#000",
    borderStyle: "solid",
    borderWidth: "thin"
};

export class BadgeLabel extends React.Component<BadgeLabelProps, {}>
{
    public static defaultProps: Partial<BadgeLabelProps> = {
        badgeClassName: "badge",
        badgeFirst: false
    };

    protected get badgeStyle()
    {
        if (this.props.badgeFirst) {
            return {
                ...DEFAULT_BADGE_STYLE,
                marginRight: 5,
            };
        }
        else {
            return {
                ...DEFAULT_BADGE_STYLE,
                marginLeft: 5,
            };
        }
    }

    protected get badge(): JSX.Element
    {
        return (
            <span
                className={this.props.badgeClassName}
                style={{
                    ...this.badgeStyle,
                    ...this.props.badgeStyleOverride
                }}
            >
                {this.props.badgeContent}
            </span>
        );
    }

    protected get badgeFirst(): JSX.Element
    {
        return (
            <React.Fragment>
                {this.badge}
                {this.props.label}
            </React.Fragment>
        );
    }

    protected get badgeLast(): JSX.Element
    {
        return (
            <React.Fragment>
                {this.props.label}
                {this.badge}
            </React.Fragment>
        );
    }

    public render(): JSX.Element
    {
        return this.props.badgeFirst ? this.badgeFirst: this.badgeLast;
    }
}

export default BadgeLabel;
