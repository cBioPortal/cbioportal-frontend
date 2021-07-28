import * as React from 'react';
import { action, computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';

type TrackRectProps = {
    x: number;
    y: number;
    width?: number;
    height?: number;
    hitZoneClassName?: string;
    hitZoneXOffset?: number;
    spec: TrackRectSpec;
};

export type TrackRectSpec = {
    startCodon: number;
    endCodon?: number;
    label?: string;
    labelColor?: string;
    color?: string;
    tooltip?: JSX.Element;
};

@observer
export default class TrackRect extends React.Component<TrackRectProps, {}> {
    @observable private textElt: SVGTextElement | null = null;
    private handlers: any;
    constructor(props: any) {
        super(props);
        makeObservable(this);
        this.state = {
            displayText: props.label || '',
        };
        this.handlers = {
            textRef: action((text: SVGTextElement | null) => {
                this.textElt = text;
            }),
        };
    }

    public static defaultProps = {
        width: 50,
        height: 10,
    };

    private get centerX() {
        return this.props.x + this.props.width! / 2;
    }

    private get centerY() {
        return this.props.y + this.props.height! / 2;
    }

    @computed private get displayText() {
        // Truncate text if necessary
        const label = this.props.spec.label || '';
        if (!this.textElt) {
            return label;
        }

        if (!$(this.textElt).is(':visible')) {
            return label;
        }

        let substringLength = label.length;
        // Find the number of characters that will fit inside
        while (
            substringLength > 0 &&
            this.textElt.getSubStringLength(0, substringLength) >
                this.props.width!
        ) {
            substringLength -= 1;
        }
        let displayText = label;
        if (substringLength < label.length) {
            // If we have to do shortening
            substringLength -= 2; // make room for ellipsis ".."
            if (substringLength <= 0) {
                // too short to show any string
                displayText = '';
            } else {
                // if it's long enough to show anything at all
                displayText = label.substr(0, substringLength) + '..';
            }
        }
        return displayText;
    }

    private makeTextElement(reference: boolean) {
        let props: any = {
            x: this.centerX,
            y: this.centerY,
            textAnchor: 'middle',
            dy: '0.3em',
            fill: this.props.spec.labelColor || '#FFFFFF',
            style: {
                fontSize: '12px',
                fontFamily: 'arial',
            },
        };
        const text = reference
            ? this.props.spec.labelColor || ''
            : this.displayText;
        if (reference) {
            props.ref = this.handlers.textRef;
            props.visibility = 'hidden';
            props.style = { opacity: 0 };
            props.className = this.props.hitZoneClassName;
        }
        return <text {...props}>{text}</text>;
    }

    public render() {
        return (
            <g>
                <rect
                    stroke="#BABDB6"
                    strokeWidth="0.5"
                    fill={this.props.spec.color}
                    width={this.props.width}
                    height={this.props.height}
                    x={this.props.x}
                    y={this.props.y}
                />
                {this.makeTextElement(true)};{this.makeTextElement(false)}
                <rect
                    className={this.props.hitZoneClassName}
                    x={this.props.x}
                    y={this.props.y}
                    width={this.props.width}
                    height={this.props.height}
                    style={{ opacity: 0 }}
                />
            </g>
        );
    }
}
