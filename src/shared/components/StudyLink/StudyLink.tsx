import * as React from "react";
import {CancerStudy} from "../../api/generated/CBioPortalAPI";
import {getStudySummaryUrl, redirectToStudyView} from "../../api/urls";

export class StudyLink extends React.Component<{ study: CancerStudy, onClick?: () => void, href?: string }, {}> {
    render() {
        return (
            <a href={this.props.href || getStudySummaryUrl(this.props.study.studyId)} style={{cursor: 'pointer'}} onClick={this.props.onClick || ((event:any) => {
                event.preventDefault();
                redirectToStudyView(this.props.study.studyId)
            })}>{this.props.study.name}</a>);
    }
}