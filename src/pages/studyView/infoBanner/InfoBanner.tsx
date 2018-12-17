import * as React from 'react';
import {observer} from "mobx-react";

export interface IInfoBannerProps {
    message:string;
}


@observer
export default class InfoBanner extends React.Component<IInfoBannerProps, {}> {
    render() {
        return (
            <div className='alert alert-success' style={{marginTop: '10px', marginBottom: '0'}}>
                <span>
                    <i className='fa fa-md fa-check'/> {this.props.message}
                </span>
            </div>
        );
    }
}