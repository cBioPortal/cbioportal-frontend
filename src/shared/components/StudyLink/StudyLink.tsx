import * as React from "react";
import {CancerStudy} from "../../api/generated/CBioPortalAPI";
import {buildCBioLink} from "../../api/urls";

export class StudyLink extends React.Component<{ study: CancerStudy, onClick?: () => void, href?:string }, {}> {
    render() {
        const url = this.props.href || `study?id=${this.props.study.studyId}`;
        return (<a href={buildCBioLink(url)} target="_blank" style={{cursor:'pointer'}} onClick={this.props.onClick || (()=>{})}>{this.props.study.name}</a>);
    }
}