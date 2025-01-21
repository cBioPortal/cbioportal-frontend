import * as React from 'react';
import { CancerStudy } from 'cbioportal-ts-api-client';
import { Link } from 'react-router-dom';

export class StudyLink extends React.Component<
    { studyId: string; useDashboard?: boolean; className?: string },
    {}
> {
    render() {
        const targetPage = this.props.useDashboard === true ? 'dash' : 'study';
        return (
            <Link
                to={`/${targetPage}?id=${this.props.studyId}`}
                className={this.props.className}
            >
                {this.props.children}
            </Link>
        );
    }
}
