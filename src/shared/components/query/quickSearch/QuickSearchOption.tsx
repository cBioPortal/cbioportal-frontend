import * as React from "react";
import {observer} from "mobx-react";
import {OptionType} from "./OptionType";
import autobind from 'autobind-decorator';
import { Label } from 'react-bootstrap';
import {SHOW_MORE_SIZE} from "./QuickSearch";

export interface IQuickSearchOptionProps {
    option: any;
    onFocus: any;
    onSelect: any;
    isFocused: boolean;
    className: string;
}

@observer
export default class QuickSearchOption extends React.Component<IQuickSearchOptionProps, {}> {
    
    @autobind
	private handleMouseDown(event: any) {
		this.props.onSelect(this.props.option, event);
    }
    
    @autobind
	private handleMouseEnter(event: any) {
		this.props.onFocus(this.props.option, event);
    }
    
    @autobind
	private handleMouseMove(event: any) {
		if (!this.props.isFocused) {
            this.props.onFocus(this.props.option, event);
        }
	}

    render() {

        let label;
        let typeStyle;
        let details;
        let clickInfo;
        if (this.props.option.type === OptionType.STUDY) {
            label = this.props.option.name;
            typeStyle = "primary";
            details = this.props.option.allSampleCount + " samples";
            clickInfo = "Click on a study to open its summary";
        } else if (this.props.option.type === OptionType.GENE) {
            label = this.props.option.hugoGeneSymbol;
            typeStyle = "success";
            details = this.props.option.cytoband || "-";
            clickInfo = "Click on a gene to query it across all TCGA PanCancer Atlas studies";
        } else if (this.props.option.type === OptionType.PATIENT) {
            label = this.props.option.patientId;
            typeStyle = "danger";
            details = this.props.option.studyName;
            clickInfo = "Click on a patient to see a summary";
        } else {
            label = this.props.option.value + " more " + this.props.option.type + " (click to load " + 
            (this.props.option.value < SHOW_MORE_SIZE ? this.props.option.value : SHOW_MORE_SIZE) + " more)";
        }

        return (
            <div className="quick-search-link">
                <div className={this.props.className}
                    onMouseDown={this.handleMouseDown}
                    onMouseEnter={this.handleMouseEnter}
                    onMouseMove={this.handleMouseMove} style={{display:"flex", alignItems: "center"}}>
                    {typeStyle &&
                        <div style={{marginRight: 8}}><Label bsStyle={typeStyle}>{this.props.option.type}</Label></div>
                    }
                    <div>
                        <div style={{fontSize: typeStyle ? 14: 12, color: typeStyle ? null : "#4ca4ff", textDecoration: typeStyle ? null : "underline"}}>
                            {this.props.option.index === 0 && 
                                <span style={{right: 10, position: "absolute", fontWeight: "bold"}}>{clickInfo}</span>}
                            {label}
                        </div>
                        <div style={{display: "block", whiteSpace: "nowrap", fontSize: 12, color: "gray", maxWidth: 800, 
                            overflow: "hidden", textOverflow: "ellipsis"}}>
                            {details}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
