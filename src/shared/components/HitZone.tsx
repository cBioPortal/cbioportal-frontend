import * as React from "react";
import {observer} from "mobx-react";

type HitZoneProps = {
    x:number;
    y:number;
    width:number;
    height:number;
    cursor?:string;
    onMouseOver?:()=>void;
    onClick?:()=>void;
    onMouseOut?:()=>void;
    onMouseEnter?:()=>void;
    onMouseLeave?:()=>void;
};

//@observer
export class HitZone extends React.Component<HitZoneProps, {}> {
    private handlers:any;

    constructor(props:HitZoneProps) {
        super(props);
        this.handlers = {
            onMouseOver: ()=>{
                this.props.onMouseOver && this.props.onMouseOver();
                this.props.onMouseEnter && this.props.onMouseEnter();
            },
            onMouseOut: ()=>{
                this.props.onMouseOut && this.props.onMouseOut();
                this.props.onMouseLeave && this.props.onMouseLeave();
            }
        };
    }

    render() {
        return (
            <svg
                width={this.props.width}
                height={this.props.height}
                style={{
                     position: "absolute",
                     top: this.props.y,
                     left: this.props.x,
                     cursor: this.props.cursor,
                 }}
                onMouseOver={this.handlers.onMouseOver}
                onClick={this.props.onClick}
                onMouseOut={this.handlers.onMouseOut}
            />
        );
    }
}

export default HitZone;