import * as React from 'react';
import AppConfig from "appConfig";
import { If } from 'react-if';
// tslint:disable-next-line:no-import-side-effect
import './footer.scss';
import _ from 'lodash';
import { Link } from 'react-router';
import {
    default as CBioPortalAPIInternal
} from "shared/api/generated/CBioPortalAPIInternal";
import internalClient from "shared/api/cbioportalInternalClientInstance";


interface IPortalFooterState {
    version?: string;
}

export default class PortalFooter extends React.Component<{}, IPortalFooterState> {
    constructor(props:IPortalFooterState) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        internalClient.getInfoUsingGET({}).then((res) => {
            if (res && res.portalVersion) {
                // only show the closest tagged version in the footer, don't
                // show full describe output if portalVersion is higher than
                // commit version, use that instead
                this.setState({"version":`v${res.portalVersion.split('-')[0]}`,});
            }
        });
    }

    render() {
            if (AppConfig.serverConfig.skin_footer && !_.isEmpty(AppConfig.serverConfig.skin_footer)) {
                return (
                    <div id="footer" dangerouslySetInnerHTML={{__html: 
                        "<a href='http://www.cbioportal.org'>cBioPortal</a> | " +
                        `<a href='${AppConfig.apiRoot}api/info'>${this.state.version? this.state.version : "Version Info"}</a> ` +
                        AppConfig.serverConfig.skin_footer +
                        "<br />" +
                        `Questions and Feedback: <a href="mailto:${AppConfig.serverConfig.skin_email_contact}">${AppConfig.serverConfig.skin_email_contact}</a>`
                    }}>
                    </div>
                );
            } else {
                return (
                    <div id="footer">
                        <div className="footer-layout">
                            <div className="footer-elem">
                                <img src={require("./cbioportal_logo.png")} style={{width: 142, filter:"grayscale(100%)"}} alt="cBioPortal Logo"/>
                                {this.state.version && (
                                    <a href={`${AppConfig.apiRoot}api/info`}><div style={{paddingTop:9,textAlign:"center"}}>{this.state.version}</div></a>
                                )}
                            </div>
                            <If condition={AppConfig.serverConfig.skin_show_tutorials_tab !== false || AppConfig.serverConfig.skin_show_faqs_tab}>
                                <div className="footer-elem">
                                    <h3>HELP</h3>
                                    <ul>
                                        <If condition={AppConfig.serverConfig.skin_show_tutorials_tab !== false}>
                                            <li><Link to="/tutorials">Tutorials</Link></li>
                                        </If>
                                        <If condition={AppConfig.serverConfig.skin_show_faqs_tab}>
                                            <li><Link to="/faq">FAQ</Link></li>
                                        </If>
                                        <li><a target="_blank" href="https://groups.google.com/forum/#!forum/cbioportal">User Group</a></li>
                                    </ul>
                                </div>
                            </If>
                            <If condition={AppConfig.serverConfig.skin_show_news_tab || AppConfig.serverConfig.skin_show_about_tab}>
                                <div className="footer-elem">
                                    <h3>INFO</h3>
                                    <ul>
                                        <If condition={AppConfig.serverConfig.skin_show_news_tab}>
                                            <li><Link to="/news">News</Link></li>
                                        </If>
                                        <If condition={AppConfig.serverConfig.skin_show_about_tab}>
                                            <li><Link to="/about">About</Link></li>
                                        </If>
                                        <If condition={AppConfig.serverConfig.skin_show_r_matlab_tab || AppConfig.serverConfig.skin_show_web_api_tab}>
                                            <li><a href={`${AppConfig.apiRoot}api`}>API Docs</a></li>
                                        </If>
                                        <If condition={AppConfig.serverConfig.app_name === "public-portal"}>
                                            <li><a target="_blank" href="https://www.twitter.com/cbioportal">Twitter</a></li>
                                        </If>
                                    </ul>
                                </div>
                            </If>
                           <If condition={AppConfig.serverConfig.app_name === "public-portal"}>
                               <div className="footer-elem">
                                   <h3>DEV</h3>
                                   <ul>
                                       <li>
                                            <a target="_blank" href="https://github.com/cBioPortal/">
                                                GitHub
                                            </a>
                                        </li>
                                       <li><a target="_blank" href="https://slack.cbioportal.org">Slack</a></li>
                                   </ul>
                               </div>
                               <div className="footer-elem">
                                   <h3>STATUS</h3>
                                   <ul>
                                       <li><a href="https://status.cbioportal.org">cBioPortal Status</a></li>
                                   </ul>
                               </div>
                           </If>
                           <div className="footer-elem">
                               <h3>CONTACT</h3>
                               <ul>
                                   <li><a href={`mailto:${AppConfig.serverConfig.skin_email_contact}`}>{AppConfig.serverConfig.skin_email_contact}</a></li>
                               </ul>
                           </div>
                        </div>
                    </div>
                );
            }
    }
}
