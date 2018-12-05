import * as React from 'react';
import * as _ from 'lodash';
import { Link } from 'react-router';
import AppConfig from "appConfig";
import {If, Then, Else} from 'react-if';
import {openSocialAuthWindow} from "../../shared/lib/openSocialAuthWindow";
import {AppStore} from "../../AppStore";
import {observer} from "mobx-react";
import {buildCBioPortalPageUrl} from "../../shared/api/urls";

@observer
export default class PortalHeader extends React.Component<{ appStore:AppStore }, {}> {

    private tabs(){

        return [

            {
                id:"datasets",
                text:"Data Sets",
                address:"/datasets",
                internal:true,
                hide:()=>AppConfig.serverConfig.skin_show_data_tab === false
            },

            {
                id:"webAPI",
                text:"Web API",
                address:"/webAPI",
                internal:true,
                hide:()=>AppConfig.serverConfig.skin_show_web_api_tab === false
            },

            {
                id:"rMatlab",
                text:"R/MATLAB",
                address:"/rmatlab",
                internal:true,
                hide:()=>AppConfig.serverConfig.skin_show_r_matlab_tab === false
            },

            {
                id:"tutorials",
                text:"Tutorials",
                address:"/tutorials",
                internal:true,
                hide:()=>AppConfig.serverConfig.skin_show_tutorials_tab === false
            },

            {
                id:"faq",
                text:"FAQ",
                address:"/faq",
                internal:true,
                hide:()=>AppConfig.serverConfig.skin_show_faqs_tab === false
            },

            {
                id:"news",
                text:"News",
                address:"/news",
                internal:true,
                hide:()=>AppConfig.serverConfig.skin_show_news_tab === false
            },

            {
                id:"visualize",
                text:"Visualize Your Data",
                address:"/visualize",
                internal:true,
                hide:()=>AppConfig.serverConfig.skin_show_tools_tab === false
            },

            {
                id:"about",
                text:"About",
                address:"/about",
                internal:true,
                hide:()=>AppConfig.serverConfig.skin_show_about_tab === false
            },

        ];


    }

    private getTabs(){
        const shownTabs = this.tabs().filter((t)=>{
            return !t.hide()
        });

        return shownTabs.map((tab)=>{
            return <li>
                {
                    (tab.internal) ? <Link activeClassName={'selected'} to={tab.address}>{tab.text}</Link> :  <a href={tab.address}>{tab.text}</a>
                }
            </li>
        })

    }

    render(){
        return <header>
            <div id="leftHeaderContent">
                <Link to="/" id="cbioportal-logo"><img src={require("./cbioportal_logo.png")} alt="cBioPortal Logo"/></Link>
                <nav id="main-nav">
                    <ul>
                        {
                           this.getTabs()
                        }
                    </ul>
                </nav>
            </div>

            <div id="rightHeaderContent">
                <If condition={!AppConfig.hide_login}>
                    <If condition={this.props.appStore.isLoggedIn}>
                        <Then>
                            <div className="identity">Logged in as {this.props.appStore.userName}
                                <span className="pipeSeperator">|</span>
                                 <a href={buildCBioPortalPageUrl(this.props.appStore.logoutUrl)}>Sign out</a>

                            </div>
                        </Then>
                        <Else>
                            <If condition={AppConfig.serverConfig.authenticationMethod === "social_auth"}>
                                <div className="identity"><button className="btn btn-default" onClick={()=>openSocialAuthWindow(this.props.appStore)}>Login</button></div>
                            </If>
                        </Else>
                    </If>
                </If>

                <If condition={!_.isEmpty(AppConfig.serverConfig.skin_right_logo)}>
                    <img id="institute-logo" src={`images/${AppConfig.serverConfig.skin_right_logo!}`} alt="Institute Logo" />
                </If>

            </div>
        </header>
    }
}
