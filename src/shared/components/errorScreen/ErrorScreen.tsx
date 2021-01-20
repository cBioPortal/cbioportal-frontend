import * as React from 'react';
import getBrowserWindow from "../../../public-lib/lib/getBrowserWindow";
import {observer} from "mobx-react";
import './errorScreen.scss';
import AppConfig from "appConfig";
import {buildCBioPortalPageUrl} from "shared/api/urls";

interface IErrorScreenProps {
    errorLog?:string;
    title?:string;
    body?:string|JSX.Element;
}

@observer
export default class ErrorScreen extends React.Component<IErrorScreenProps, {}> {

    public render(){

        const location = getBrowserWindow().location.href;
        const subject = "cBioPortal user reported error";

        return (
            <div className={"errorScreen"}>

                <a className={'errorLogo'} href={buildCBioPortalPageUrl("/")}><img src={require("../../../globalStyles/images/cbioportal_logo.png")} alt="cBioPortal Logo"/></a>

                {
                    this.props.title && <h4>{this.props.title}</h4>
                }

                {
                    (this.props.body) && (
                        <div>{this.props.body}</div>
                    )
                }

                {
                    (AppConfig.serverConfig.skin_email_contact) && (
                        <div style={{marginTop:20}}>
                            If this error persists, please contact us at <a href={`mailto:${AppConfig.serverConfig.skin_email_contact}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(this.props.errorLog||'')}`}>{AppConfig.serverConfig.skin_email_contact}</a>
                        </div>
                    )
                }

                {
                    (this.props.errorLog) && (
                        <div style={{marginTop:20}} className="form-group">
                            <label>Error log:</label>
                            <textarea value={this.props.errorLog} className={"form-control"}></textarea>
                            </div>
                    )
                }


            </div>
        );
    }
}
