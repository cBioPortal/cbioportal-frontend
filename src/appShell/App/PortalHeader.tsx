import * as React from 'react';
import { Link } from 'react-router';
import AppConfig from "appConfig";

export default class PortalHeader extends React.Component<{}, {}> {

    private tabs(){

        return [

            {
                id:"datasets",
                text:"Data Sets",
                address:"/s/datasets",
                internal:true,
                hide:()=>AppConfig.skinShowDataSetsTab !== true
            },

            {
                id:"webAPI",
                text:"Web API",
                address:"/s/webAPI",
                internal:true,
                hide:()=>AppConfig.skinShowWebAPITab !== true
            },

            {
                id:"rMatlab",
                text:"R/MATLAB",
                address:"/s/rmatlab",
                internal:true,
                hide:()=>AppConfig.skinShowRmatLABTab !== true
            },

            {
                id:"tutorials",
                text:"Tutorials",
                address:"/s/tutorials",
                internal:true,
                hide:()=>AppConfig.skinShowTutorialsTab !== true
            },

            {
                id:"faq",
                text:"FAQ",
                address:"/s/faq",
                internal:true,
                hide:()=>AppConfig.skinShowFAQSTab !== true
            },

            {
                id:"news",
                text:"News",
                address:"/s/news",
                internal:true,
                hide:()=>AppConfig.skinShowNewsTab !== true
            },

            {
                id:"visualize",
                text:"Visualize Your Data",
                address:"/s/visualize",
                internal:true,
                hide:()=>AppConfig.skinShowToolsTab !== true
            },

            {
                id:"about",
                text:"About",
                address:"/s/about",
                internal:true,
                hide:()=>AppConfig.skinShowAboutTab !== true
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

            <div id="rightHeaderContent"></div>
        </header>
    }

}

