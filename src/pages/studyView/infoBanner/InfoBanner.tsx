import * as React from 'react';
import * as _ from 'lodash';
import {observer} from "mobx-react";
import {Sample} from "../../../shared/api/generated/CBioPortalAPIInternal";
import {NewChart} from "../StudyViewPageStore";

export interface IInfoBannerProps {
    message:string;
}


@observer
export default class InfoBanner extends React.Component<IInfoBannerProps, {}> {
    render() {
        return <div className='alert alert-success' style={{marginTop: '10px', marginBottom: '0 !important'}}>
                    <span>
                        <i className='fa fa-md fa-check'/> {this.props.message}
                    </span>
        </div>
    }
}