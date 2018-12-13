import * as React from 'react';
import {AppStore} from "../../AppStore";
import AppConfig from "appConfig";
import getBrowserWindow from "../../shared/lib/getBrowserWindow";
import {observer} from "mobx-react";
import {buildCBioPortalPageUrl} from "../../shared/api/urls";
import './errorScreen.scss';

@observer
export default class ErrorScreen extends React.Component<{ appStore: AppStore }, {}> {

    public render() {

        const location = getBrowserWindow().location.href;
        const subject = "cBioPortal user reported error";

        const body = [getBrowserWindow().location.href].concat(this.props.appStore.undismissedSiteErrors.map((error)=>error.message))
            .join("\n");

        return (
            <div className={"errorScreen"}>
                <a id="cbioportal-logo" href={buildCBioPortalPageUrl("/")}><img src={require("./cbioportal_logo.png")} alt="cBioPortal Logo"/></a>

                <h4>Oops, there's been an error.</h4>

                <a className={"btn btn-default"} href={buildCBioPortalPageUrl("/")}>Click to start a new query</a>

                <hr />

                {
                    (AppConfig.serverConfig.skin_email_contact) && (
                        <p>
                            If this error persists, please contact us at <a href={`mailto:${AppConfig.serverConfig.skin_email_contact}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}>{AppConfig.serverConfig.skin_email_contact}</a>
                        </p>
                    )
                }

                <br />


                <div className="form-group">
                    <label>Error log:</label>
                    <textarea className={"form-control"}>
                        {
                            [getBrowserWindow().location.href].concat(this.props.appStore.undismissedSiteErrors.map((err)=>err.message))
                                .join("\n")
                        }
                    </textarea>
                </div>


            </div>
        )
    }
}
