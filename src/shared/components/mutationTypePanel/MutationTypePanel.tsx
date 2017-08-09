import * as React from "react";

export type MutationTypePanelButton = {
    label:string;
    color:string;
    count:number;
    onClick:()=>void;
};

type MutationTypePanelProps = {
    buttons:MutationTypePanelButton[];
};

export default class MutationTypePanel extends React.Component<MutationTypePanelProps, {}> {
    private mutationTypeButton(count:number, label:string, color:string, onClick:()=>void, marginLeft:number) {
        return (
            <span key={label} onClick={onClick} style={{cursor:"pointer", marginLeft}}>
                <span className="badge" style={{
                    backgroundColor: color,
                }}>{count}</span>
                <span style={{color:color, fontWeight:400, marginLeft:"5px"}}>{label}</span>
            </span>
        );
    }
    render() {
        return (
            <div>
                {this.props.buttons.map((button, index)=>{
                    return this.mutationTypeButton(
                        button.count, button.label, button.color, button.onClick, index ? 15 : 0
                    );
                })}
            </div>
        );
    }
}