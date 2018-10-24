import * as React from "react";
import {CancerStudy} from "../../api/generated/CBioPortalAPI";

export class StudyLink extends React.Component<{ study: CancerStudy, onClick?: () => void, href?:string }, {}> {
    render() {
        return (<a href={this.props.href || `study?id=${this.props.study.studyId}`} target="_blank" style={{cursor:'pointer'}} onClick={this.props.onClick || (()=>{})}>{this.props.study.name}</a>);
    }
}