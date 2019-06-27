import * as React from "react";
import {observer} from "mobx-react";
import {action, computed, observable} from "mobx";
import autobind from "autobind-decorator";
import {Popover} from "react-bootstrap";
import classnames from "classnames";
import styles from "../../pages/resultsView/survival/styles.module.scss";
import {truncateWithEllipsisReport} from "../../public-lib/lib/TextTruncationUtils";
import Portal from "react-portal";

export interface ITruncatedTextSVGProps {
    text?:string;
    maxWidth?:number;
    suffix?:string;
    tooltip?:(datum:any)=>JSX.Element;
    tooltipPlacement?:string;
    dy?:any;
    //victory
    data?:any;
    datum?:any;
    style?:{
        fontSize:number;
        fontFamily:string;
    };
}

@observer
export default class TruncatedTextWithTooltipSVG extends React.Component<ITruncatedTextSVGProps, {}> {

    static defaultProps:Partial<ITruncatedTextSVGProps> = {
        maxWidth:100,
        suffix:"..."
    };

    @observable mousePosition = { x:0, y:0 };
    @observable tooltipOpen = false;

    @computed get tooltipElt() {
        if (this.props.tooltip && this.props.datum) {
            return this.props.tooltip(this.props.datum);
        } else {
            return <span>{this.props.text}</span>;
        }
    }

    @autobind
    @action private onMouseOver() {
        this.tooltipOpen = true;
    }

    @autobind
    @action private onMouseOut() {
        this.tooltipOpen = false;
    }

    @autobind private onMouseMove(e:React.MouseEvent<any>) {
        this.mousePosition.x = e.pageX;
        this.mousePosition.y = e.pageY;
    }

    @computed get fontFamily() {
        let font = "Arial";
        if (this.props.style) {
            font = this.props.style.fontFamily.split(", ")[0];
        }
        return font;
    }

    @computed get fontSize() {
        let size = "13px";
        if (this.props.style) {
            size = this.props.style.fontSize + "px";
        }
        return size;
    }

    @computed get textReport() {
        return truncateWithEllipsisReport(
            this.props.text || "",
            this.props.maxWidth!,
            this.fontFamily,
            this.fontSize
        );
    }

    render() {
        const {text, maxWidth, data, datum, suffix, tooltip,
            tooltipPlacement, ...rest} = this.props;
        return (
            <>
                <text
                    {...rest}
                    onMouseOver={this.onMouseOver}
                    onMouseOut={this.onMouseOut}
                    onMouseMove={this.onMouseMove}
                >
                    {this.textReport.text}
                </text>
                {this.textReport.truncated && this.tooltipOpen && (
                    <Portal isOpened={true} node={document.body}>
                        <Popover
                            arrowOffsetTop={17}
                            className={classnames("cbioportal-frontend", "cbioTooltip", styles.Tooltip)}
                            positionLeft={this.mousePosition.x+(tooltipPlacement === "left" ? -8 : 8)}
                            positionTop={this.mousePosition.y-17}
                            style={{
                            transform: (tooltipPlacement === "left" ? "translate(-100%,0%)" : undefined)
                        }}
                            placement={tooltipPlacement}
                        >
                            {this.tooltipElt}
                        </Popover>
                    </Portal>
                )}
            </>
        )
    }
}