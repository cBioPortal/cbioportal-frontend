import * as React from 'react';
import * as _ from 'lodash';
import { Link } from 'react-router';
import AppConfig from "appConfig";
import {getLogoutURL} from "../../shared/api/urls";
import {If, Then, Else} from 'react-if';
import {openSocialAuthWindow} from "../../shared/lib/openSocialAuthWindow";

export default class PortalHeader extends React.Component<{}, {}> {

    private tabs(){

        return [

            {
                id:"datasets",
                text:"Data Sets",
                address:"/s/datasets",
                internal:true,
                hide:()=>AppConfig.skinShowDataSetsTab === false
            },

            {
                id:"webAPI",
                text:"Web API",
                address:"/s/webAPI",
                internal:true,
                hide:()=>AppConfig.skinShowWebAPITab === false
            },

            {
                id:"rMatlab",
                text:"R/MATLAB",
                address:"/s/rmatlab",
                internal:true,
                hide:()=>AppConfig.skinShowRmatLABTab === false
            },

            {
                id:"tutorials",
                text:"Tutorials",
                address:"/s/tutorials",
                internal:true,
                hide:()=>AppConfig.skinShowTutorialsTab === false
            },

            {
                id:"faq",
                text:"FAQ",
                address:"/s/faq",
                internal:true,
                hide:()=>AppConfig.skinShowFAQSTab === false
            },

            {
                id:"news",
                text:"News",
                address:"/s/news",
                internal:true,
                hide:()=>AppConfig.skinShowNewsTab === false
            },

            {
                id:"visualize",
                text:"Visualize Your Data",
                address:"/s/visualize",
                internal:true,
                hide:()=>AppConfig.skinShowToolsTab === false
            },

            {
                id:"about",
                text:"About",
                address:"/s/about",
                internal:true,
                hide:()=>AppConfig.skinShowAboutTab === false
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
                <If condition={!_.isEmpty(AppConfig.authUserName)}>
                    <Then>
                        <div className="identity">Logged in as <span dangerouslySetInnerHTML={{__html:AppConfig.authUserName!}}></span>
                            &nbsp;|&nbsp;
                            {
                                (!_.isEmpty(AppConfig.authLogoutUrl)) && (
                                    <a href={getLogoutURL()}>Sign out</a>
                                )
                            }
                        </div>
                    </Then>
                    <Else>
                        <If condition={AppConfig.authGoogleLogin}>
                            <div className="identity"><button className="btn btn-default" onClick={openSocialAuthWindow}>Login</button></div>
                        </If>
                    </Else>
                </If>

                <If condition={!_.isEmpty(AppConfig.skinRightLogo)}>
                    <img id="institute-logo" src={AppConfig.skinRightLogo} alt="Institute Logo" />
                </If>

            </div>
        </header>
    }

}

