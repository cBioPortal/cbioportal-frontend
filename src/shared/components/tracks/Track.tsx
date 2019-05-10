import * as React from "react";
import $ from "jquery";
import {observer} from "mobx-react";
import {SyntheticEvent} from "react";
import {action, computed, observable} from "mobx";
import autobind from "autobind-decorator";
import classnames from "classnames";

import {defaultHitzoneConfig, HitZoneConfig, initHitZoneFromConfig} from "../HitZone";
import TrackCircle, {TrackItemSpec} from "./TrackCircle";
import {unhoverAllComponents, getComponentIndex} from "shared/lib/SvgComponentUtils";
import DefaultTooltip from "shared/components/defaultTooltip/DefaultTooltip";
import {Mutation} from "shared/api/generated/CBioPortalAPI";
import MutationMapperDataStore from "shared/components/mutationMapper/MutationMapperDataStore";

import styles from "./trackStyles.module.scss";

const DEFAULT_ID_CLASS_PREFIX = "track-circle-";

export type TrackProps = {
    dataStore: MutationMapperDataStore;
    width: number;
    proteinLength: number;
    trackItems?: TrackItemSpec[];
    trackTitle?: JSX.Element;
    hideBaseline?: boolean;
    xOffset?: number;
    dataHighlightFilter?: (d: Mutation[]) => boolean
    dataSelectFilter?: (d: Mutation[]) => boolean
    idClassPrefix?: string;
};

@observer
export default class Track extends React.Component<TrackProps, {}>
{
    @observable private hitZoneConfig: HitZoneConfig = defaultHitzoneConfig();
    @observable private shiftPressed = false;
    private tooltipActive = false;

    private circles: {[index:string]: TrackCircle};

    constructor(props: TrackProps) {
        super(props);
    }

    @autobind
    setHitZone(hitRect:{x:number, y:number, width:number, height:number},
               content?:JSX.Element,
               onMouseOver?:()=>void,
               onClick?:()=>void,
               onMouseOut?:()=>void,
               cursor: string = "pointer",
               tooltipPlacement: string = "top")
    {
        this.hitZoneConfig = {
            hitRect, content, onMouseOver, onClick, onMouseOut, cursor, tooltipPlacement
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

    @autobind
    @action
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

    @autobind
    @action
    onBackgroundClick() {
        this.props.dataStore.clearSelectedPositions();
        this.props.dataStore.clearDataSelectFilter();
    }

    @autobind
    @action
    onTrackCircleClick(codon: number) {
        const isSelected = this.props.dataStore.isPositionSelected(codon);
        if (!this.shiftPressed) {
            this.props.dataStore.clearSelectedPositions();
        }
        this.props.dataStore.setPositionSelected(codon, !isSelected);

        if (this.props.dataSelectFilter) {
            this.props.dataStore.setDataSelectFilter(this.props.dataSelectFilter);
        }
    }

    @autobind
    @action
    onKeyDown(e: JQueryKeyEventObject) {
        if (e.which === 16) {
            this.shiftPressed = true;
        }
    }

    @autobind
    @action
    onKeyUp (e: JQueryKeyEventObject) {
        if (e.which === 16) {
            this.shiftPressed = false;
        }
    }

    @autobind
    @action
    onMouseOver(e: SyntheticEvent<any>) {
        // No matter what, unhover all components - if we're hovering one, we'll set it later in this method
        this.unhoverAllComponents();

        const target = e.target as SVGElement;
        const className = target.getAttribute("class") || "";
        const componentIndex: number | null = this.getComponentIndex(className);

        if (componentIndex !== null)
        {
            const circleComponent = this.circles[componentIndex];

            if (circleComponent)
            {
                this.setHitZone(
                    circleComponent.hitRectangle,
                    circleComponent.props.spec.tooltip,
                    action(() => {
                        if (this.props.dataHighlightFilter) {
                            this.props.dataStore.setDataHighlightFilter(this.props.dataHighlightFilter);
                        }
                        this.props.dataStore.setPositionHighlighted(circleComponent.props.spec.codon, true);
                        circleComponent.isHovered = true;
                    }),
                    action(() => this.onTrackCircleClick(circleComponent.props.spec.codon)),
                    this.onHitzoneMouseOut,
                    "pointer",
                    "bottom"
                );
            }
        }
    }

    @autobind
    @action
    onSVGMouseLeave(e:SyntheticEvent<any>) {
        const target = e.target as Element;
        if (target.tagName.toLowerCase() === "svg") {
            this.onMouseLeave();
        }
    }

    @autobind
    @action
    onTooltipVisibleChange(visible: boolean) {
        this.tooltipActive = visible;

        if (!visible) {
            this.unhoverAllComponents();
        }
    }

    @autobind
    @action
    onHitzoneMouseOut() {
        if (!this.tooltipActive) {
            this.unhoverAllComponents();
        }
    }

    get svgHeight() {
        return 10;
    }

    get items() {
        this.circles = {};

        return (this.props.trackItems || []).map((spec, index) => {
            return (
                <TrackCircle
                    ref={(circle: TrackCircle) => {
                        if (circle !== null) {
                            this.circles[index] = circle;
                        }
                    }}
                    key={spec.codon}
                    hitZoneClassName={`${this.props.idClassPrefix}${index}`}
                    hitZoneXOffset={this.props.xOffset}
                    x={(this.props.width / this.props.proteinLength) * spec.codon}
                    y={this.svgHeight / 2}
                    radius={
                        this.props.dataStore.isPositionSelected(spec.codon) ||
                        this.props.dataStore.isPositionHighlighted(spec.codon) ?
                            5 : 2.8
                    }
                    hoverRadius={5}
                    spec={spec}
                />
            );
        });
    }

    @action
    private unhoverAllComponents() {
        unhoverAllComponents(this.circles);
        this.props.dataStore.clearHighlightedPositions();
    }

    private getComponentIndex(classes:string): number|null {
        return getComponentIndex(classes, this.props.idClassPrefix || DEFAULT_ID_CLASS_PREFIX);
    }

    @computed private get tooltipVisible() {
        return !!this.hitZoneConfig.content;
    }

    @computed private get hitZone() {
        return initHitZoneFromConfig(this.hitZoneConfig);
    }

    get tooltipVisibleProps() {
        const tooltipVisibleProps:any = {};

        if (!this.tooltipVisible) {
            tooltipVisibleProps.visible = false;
        }

        return tooltipVisibleProps;
    }

    public componentDidMount() {
        // Make it so that if you hold down shift, you can select more than one item at once
        $(document).on("keydown",this.onKeyDown);
        $(document).on("keyup", this.onKeyUp);
    }

    public render()
    {
        return (
            <div style={{position: "relative"}}>
                <span className={classnames(styles.trackTitle, "small")}>
                    {this.props.trackTitle}
                </span>
                <span>
                    <DefaultTooltip
                        placement={this.getOverlayPlacement()}
                        overlay={this.getOverlay}
                        onVisibleChange={this.onTooltipVisibleChange}
                        {...this.tooltipVisibleProps}
                    >
                        {this.hitZone}
                    </DefaultTooltip>
                    <span
                        style={{marginLeft: this.props.xOffset}}
                        onMouseOver={this.onMouseOver}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg"
                             width={this.props.width}
                             height={this.svgHeight}
                             className="track-svgnode"
                             onMouseLeave={this.onSVGMouseLeave}
                             style={{overflow: "visible"}}
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
                            {!this.props.hideBaseline &&
                                <line
                                    stroke="#666666"
                                    strokeWidth="0.5"
                                    x1={0}
                                    x2={this.props.width}
                                    y1={this.svgHeight / 2}
                                    y2={this.svgHeight / 2}
                                />
                            }
                            {this.items}
                        </svg>
                    </span>
                </span>
            </div>
        );
    }
}