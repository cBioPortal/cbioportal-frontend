import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { SyntheticEvent } from 'react';
import { action, computed, observable, makeObservable } from 'mobx';
import autobind from 'autobind-decorator';
import classnames from 'classnames';

import {
    defaultHitzoneConfig,
    DefaultTooltip,
    getComponentIndex,
    HitZoneConfig,
    initHitZoneFromConfig,
    unhoverAllComponents,
} from 'cbioportal-frontend-commons';

import { DataFilter } from '../../model/DataFilter';
import DataStore from '../../model/DataStore';
import {
    updatePositionHighlightFilters,
    updatePositionSelectionFilters,
} from '../../util/FilterUtils';
import TrackItem, { TrackItemSpec, TrackItemType } from './TrackItem';
import styles from './trackStyles.module.scss';

const DEFAULT_ID_CLASS_PREFIX = 'track-circle-';

export type TrackProps = {
    dataStore: DataStore;
    width: number;
    proteinLength: number;
    trackItems?: TrackItemSpec[];
    trackTitle?: JSX.Element;
    hideBaseline?: boolean;
    xOffset?: number;
    defaultFilters?: DataFilter[];
    idClassPrefix?: string;
};

@observer
export default class Track extends React.Component<TrackProps, {}> {
    @observable private hitZoneConfig: HitZoneConfig = defaultHitzoneConfig();
    @observable private shiftPressed = false;
    private tooltipActive = false;

    private shapes: { [index: string]: TrackItem };

    constructor(props: TrackProps) {
        super(props);
        makeObservable<
            Track,
            | 'hitZoneConfig'
            | 'shiftPressed'
            | 'unhoverAllComponents'
            | 'tooltipVisible'
            | 'hitZone'
        >(this);
    }

    @autobind
    setHitZone(
        hitRect: { x: number; y: number; width: number; height: number },
        content?: JSX.Element,
        onMouseOver?: () => void,
        onClick?: () => void,
        onMouseOut?: () => void,
        cursor: string = 'pointer',
        tooltipPlacement: string = 'top'
    ) {
        this.hitZoneConfig = {
            hitRect,
            content,
            onMouseOver,
            onClick,
            onMouseOut,
            cursor,
            tooltipPlacement,
        };
    }

    @autobind
    getOverlay() {
        return this.hitZoneConfig.content;
    }

    @autobind
    getOverlayPlacement() {
        return this.hitZoneConfig.tooltipPlacement;
    }

    @action.bound
    onMouseLeave() {
        if (this.hitZoneConfig.onMouseOut) {
            this.hitZoneConfig.onMouseOut();
        }
    }

    @autobind
    onBackgroundMouseMove() {
        if (this.hitZoneConfig.onMouseOut) {
            this.hitZoneConfig.onMouseOut();
        }
    }

    @action.bound
    onBackgroundClick() {
        this.props.dataStore.clearSelectionFilters();
    }

    @action.bound
    onTrackCircleClick(circleComponent: TrackItem) {
        updatePositionSelectionFilters(
            this.props.dataStore,
            circleComponent.props.spec.startCodon,
            this.shiftPressed,
            this.props.defaultFilters
        );
    }

    @action.bound
    onTrackRectClick(rectComponent: TrackItem) {
        updatePositionSelectionFilters(
            this.props.dataStore,
            rectComponent.props.spec.startCodon,
            this.shiftPressed,
            this.props.defaultFilters
        );
    }

    @action.bound
    onTrackCircleHover(circleComponent: TrackItem) {
        updatePositionHighlightFilters(
            this.props.dataStore,
            circleComponent.props.spec.startCodon,
            this.props.defaultFilters
        );
        circleComponent.isHovered = true;
    }

    @action.bound
    onTrackRectHover(rectComponent: TrackItem) {
        updatePositionHighlightFilters(
            this.props.dataStore,
            rectComponent.props.spec.startCodon,
            this.props.defaultFilters
        );
        rectComponent.isHovered = true;
    }

    @action.bound
    onKeyDown(e: JQueryKeyEventObject) {
        if (e.which === 16) {
            this.shiftPressed = true;
        }
    }

    @action.bound
    onKeyUp(e: JQueryKeyEventObject) {
        if (e.which === 16) {
            this.shiftPressed = false;
        }
    }

    @action.bound
    onMouseOver(e: SyntheticEvent<any>) {
        // No matter what, unhover all components - if we're hovering one, we'll set it later in this method
        this.unhoverAllComponents();

        const target = e.target as SVGElement;
        const className = target.getAttribute('class') || '';
        const componentIndex: number | null = this.getComponentIndex(className);

        if (componentIndex !== null) {
            const shapeComponent = this.shapes[componentIndex];

            if (shapeComponent.props.spec.itemType === TrackItemType.CIRCLE) {
                let circleComponent = shapeComponent;
                this.setHitZone(
                    circleComponent.hitRectangle,
                    circleComponent.props.spec.tooltip,
                    action(() => this.onTrackCircleHover(circleComponent)),
                    action(() => this.onTrackCircleClick(circleComponent)),
                    this.onHitzoneMouseOut,
                    'pointer',
                    'bottom'
                );
            } else {
                let rectComponent = shapeComponent;
                this.setHitZone(
                    rectComponent.hitRectangle,
                    rectComponent.props.spec.tooltip,
                    action(() => this.onTrackRectHover(rectComponent)),
                    action(() => this.onTrackRectClick(rectComponent)),
                    this.onHitzoneMouseOut,
                    'pointer',
                    'bottom'
                );
            }
        }
    }

    @action.bound
    onSVGMouseLeave(e: SyntheticEvent<any>) {
        const target = e.target as Element;
        if (target.tagName.toLowerCase() === 'svg') {
            this.onMouseLeave();
        }
    }

    @action.bound
    onTooltipVisibleChange(visible: boolean) {
        this.tooltipActive = visible;

        if (!visible) {
            this.unhoverAllComponents();
        }
    }

    @action.bound
    onHitzoneMouseOut() {
        if (!this.tooltipActive) {
            this.unhoverAllComponents();
        }
    }

    get svgHeight() {
        return 10;
    }

    get items() {
        this.shapes = {};

        return (this.props.trackItems || []).map((spec, index) => {
            if (spec.itemType === TrackItemType.RECTANGLE) {
                return (
                    <TrackItem
                        ref={(rect: TrackItem) => {
                            if (rect !== null) {
                                this.shapes[index] = rect;
                            }
                        }}
                        key={spec.startCodon}
                        hitZoneClassName={`${this.props.idClassPrefix}${index}`}
                        hitZoneXOffset={this.props.xOffset}
                        x={spec.startCodon}
                        y={this.svgHeight / 2}
                        dim1={spec.endCodon! - spec.startCodon}
                        dim2={50}
                        spec={{ ...spec, endCodon: spec.endCodon! }}
                    />
                );
            } else {
                return (
                    <TrackItem
                        ref={(circle: TrackItem) => {
                            if (circle !== null) {
                                this.shapes[index] = circle;
                            }
                        }}
                        key={spec.startCodon}
                        hitZoneClassName={`${this.props.idClassPrefix}${index}`}
                        hitZoneXOffset={this.props.xOffset}
                        x={
                            (this.props.width / this.props.proteinLength) *
                            spec.startCodon
                        }
                        y={this.svgHeight / 2}
                        dim1={
                            this.props.dataStore.isPositionSelected(
                                spec.startCodon
                            ) ||
                            this.props.dataStore.isPositionHighlighted(
                                spec.startCodon
                            )
                                ? 5
                                : 2.8
                        }
                        dim2={5}
                        spec={spec}
                    />
                );
            }
        });
    }

    @action
    private unhoverAllComponents() {
        unhoverAllComponents(this.shapes);
        this.props.dataStore.clearHighlightFilters();
    }

    private getComponentIndex(classes: string): number | null {
        return getComponentIndex(
            classes,
            this.props.idClassPrefix || DEFAULT_ID_CLASS_PREFIX
        );
    }

    @computed private get tooltipVisible() {
        return !!this.hitZoneConfig.content;
    }

    @computed private get hitZone() {
        return initHitZoneFromConfig(this.hitZoneConfig);
    }

    get tooltipVisibleProps() {
        const tooltipVisibleProps: any = {};

        if (!this.tooltipVisible) {
            tooltipVisibleProps.visible = false;
        }

        return tooltipVisibleProps;
    }

    public componentDidMount() {
        // Make it so that if you hold down shift, you can select more than one item at once
        $(document).on('keydown', this.onKeyDown);
        $(document).on('keyup', this.onKeyUp);
    }

    componentWillUnmount() {
        $(document).off('keydown', this.onKeyDown as any);
        $(document).off('keyup', this.onKeyUp as any);
    }

    public render() {
        return (
            <div
                style={{
                    position: 'relative',
                    display: 'flex',
                }}
            >
                <span className={classnames(styles.trackTitle, 'small')}>
                    {this.props.trackTitle}
                </span>
                <span>
                    <DefaultTooltip
                        placement={this.getOverlayPlacement()}
                        overlay={this.getOverlay}
                        onVisibleChange={this.onTooltipVisibleChange}
                        destroyTooltipOnHide={true}
                        {...this.tooltipVisibleProps}
                    >
                        {this.hitZone}
                    </DefaultTooltip>
                    <span
                        style={{ marginLeft: this.props.xOffset }}
                        onMouseOver={this.onMouseOver}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={this.props.width}
                            height={this.svgHeight}
                            className="track-svgnode"
                            onMouseLeave={this.onSVGMouseLeave}
                            style={{ overflow: 'visible' }}
                        >
                            <rect
                                fill="#FFFFFF"
                                x={0}
                                y={0}
                                width={this.props.width}
                                height={this.svgHeight}
                                onClick={action(this.onBackgroundClick)}
                                onMouseMove={this.onBackgroundMouseMove}
                            />
                            {!this.props.hideBaseline && (
                                <line
                                    stroke="#666666"
                                    strokeWidth="0.5"
                                    x1={0}
                                    x2={this.props.width}
                                    y1={this.svgHeight / 2}
                                    y2={this.svgHeight / 2}
                                />
                            )}
                            {this.items}
                        </svg>
                    </span>
                </span>
            </div>
        );
    }
}
