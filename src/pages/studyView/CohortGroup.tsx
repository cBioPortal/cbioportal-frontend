import * as React from 'react';
import * as _ from 'lodash';
import { observer } from "mobx-react";
import { observable, action } from 'mobx';
import { Sample } from 'shared/api/generated/CBioPortalAPI';
import { If, Then, Else } from 'react-if';
import { Group } from 'pages/studyView/StudyViewPageStore';
import autobind from 'autobind-decorator';

export interface ICohortGroupProps {
    selectedSamples: Sample[];
    groups: Group[];
    user?: string;
}

@observer
export default class CohortGroup extends React.Component<ICohortGroupProps, {}> {

    @observable private name: string = '';
    @observable private groups: Group[] = [];
    @observable private creating = false;

    constructor(props: ICohortGroupProps) {
        super(props);
    }

    @autobind
    @action onCreateClick() {
        this.creating = true;
        if (this.name && this.props.selectedSamples.length > 0) {
            const newGroup: Group = {
                name: this.name,
                samples: this.props.selectedSamples
            };
            this.groups.push(newGroup);
        }
        this.name = '';
        this.creating = false;
        this.groups = _.union(this.props.groups, this.groups);
    }

    render() {
        return (
            <div style={{width:350}}>
                <span>Groups</span>
                <div>
                    <ul className="list-group">
                        {this.groups.map(function(group){
                            return <li className="list-group-item"><input type="checkbox" /><span style={{ marginLeft: 10 }}>{group.name}</span><span className="badge" style={{ float: 'right'}}>{group.samples.length}</span></li>;
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