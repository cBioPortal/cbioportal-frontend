import * as React from 'react';
import {observer} from "mobx-react";
import styles from "./styles.module.scss";
import {StudyViewPageStore} from 'pages/studyView/StudyViewPageStore';
import RightPanel from "./rightPanel/RightPanel";
import StudySummary from "./studySummary/StudySummary";
import {ServerConfigHelpers} from "../../../config/config";


export interface IStudyPageHeaderProps {
    store: StudyViewPageStore,
}

@observer
export default class StudyPageHeader extends React.Component<IStudyPageHeaderProps, {}> {
    render() {
        return (
            <div style={{display: 'flex', margin: '5px 20px'}}>
                <StudySummary
                    studies={this.props.store.displayedStudies.result}
                    originStudies={this.props.store.originStudies}
                    showOriginStudiesInSummaryDescription={this.props.store.showOriginStudiesInSummaryDescription}
                />
                <RightPanel
                    user={ServerConfigHelpers.getUserEmailAddress()}
                    store={this.props.store}/>
            </div>
        )
    }
}