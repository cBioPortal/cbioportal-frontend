import * as React from 'react';
import * as _ from 'lodash';
import styles from "./styles.module.scss";
import { observer } from "mobx-react";
import { computed, observable, action } from 'mobx';
import { CancerStudy, Sample } from 'shared/api/generated/CBioPortalAPI';
import classnames from 'classnames';
import { remoteData } from 'shared/api/remoteData';
import sessionServiceClient from "shared/api//sessionServiceInstance";
import { If, Then, Else } from 'react-if';
import { getStudySummaryUrl, buildCBioPortalUrl } from 'shared/api/urls';
import {SampleIdentifier, StudyViewFilter} from 'shared/api/generated/CBioPortalAPIInternal';
import {StudyWithSamples, ChartMeta, Group} from 'pages/studyView/StudyViewPageStore';
import { getVirtualStudyDescription, getCurrentDate } from 'pages/studyView/StudyViewUtils';
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import autobind from 'autobind-decorator';
import client from "shared/api/cbioportalClientInstance";
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";

const Clipboard = require('clipboard');

export interface ICohortGroupProps {
    // studyWithSamples: StudyWithSamples[];
    selectedSamples: Sample[];
    groups: Group[];
    // filter: StudyViewFilter;
    // attributesMetaSet: { [id: string]: ChartMeta };
    user?: string;
}

@observer
export default class CohortGroup extends React.Component<ICohortGroupProps, {}> {

    @observable private name: string = '';
    @observable private groups: Group[] = [];
    // @observable private description: string = '';

    @observable private creating = false;
    // @observable private sharing = false;
    // @observable private copied = false;

    constructor(props: ICohortGroupProps) {
        super(props);
        // this.onCreateClick = this.onCreateClick.bind(this);
    }

    // export type Group = {
    //     name: string,
    //     sampleIds: SampleIdentifier[]
    // }

    // export type SampleIdentifier = {
    //     'sampleId': string
    //
    //     'studyId': string
    //
    // };

    @autobind
    @action onCreateClick() {
        this.creating = true;
        if (this.name) {
            const sampleIds: SampleIdentifier[] = [];
            _.map(this.props.selectedSamples, function(sample) {
                sampleIds.push({
                    'sampleId': sample.sampleId,
                    'studyId': sample.studyId
                });
            });
            if (sampleIds.length > 0) {
                const newGroup: Group = {
                    name: this.name,
                    sampleIds: sampleIds
                };
                this.groups.push(newGroup);
            }
        }
        this.name = '';
        this.creating = false;
    }



    render() {
        return (
            <div style={{width:350}}>
                <span>Save to...</span>
                <div>
                    <ul className="list-group">
                        {this.groups.map(function(group){
                            return <li className="list-group-item"><input type="checkbox" /><span style={{ marginLeft: 10 }}>{group.name}</span><span className="badge" style={{ float: 'right'}}>{group.sampleIds.length}</span></li>;
                        })}
                    </ul>
                </div>

                <div className="input-group">
                    <input
                        type="text"
                        className="form-control"
                        placeholder={"Cohort Group name"}
                        onInput={(event) => this.name = event.currentTarget.value} />
                    <div className="input-group-btn">
                        <button
                            className="btn btn-default"
                            type="button"
                            onClick={(event) => { this.onCreateClick() }}>
                            {this.creating ? <i className="fa fa-spinner fa-spin" aria-hidden="true"></i> : "Create"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}