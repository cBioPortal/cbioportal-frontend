import * as React from "react";
import {CancerStudy} from "../../api/generated/CBioPortalAPI";
import {Link} from "react-router";

export class StudyLink extends React.Component<{ studyId: string, className?: string }, {}> {
    render() {
        return <Link to={`/study?id=${this.props.studyId}`}
                     className={this.props.className}>{this.props.children}</Link>
    }
}