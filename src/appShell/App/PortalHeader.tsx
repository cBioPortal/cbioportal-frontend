import * as React from 'react';
import { Link } from 'react-router';
import AppConfig from "appConfig";

export default class PortalHeader extends React.Component<{}, {}> {

    private tabs(){

        return [

            {
                id:"datasets",
                text:"Data Sets",
                address:"datasets",
                internal:true,
                hide:()=>AppConfig.skinShowDataSetsTab === false
            },

            {
                id:"webAPI",
                text:"Web API",
                address:"webAPI",
                internal:true,
                hide:()=>AppConfig.skinShowWebAPITab === false
            },

            {
                id:"rMatlab",
                text:"R/MATLAB",
                address:"rmatlab",
                internal:true,
                hide:()=>AppConfig.skinShowRmatLABTab === false
            },

            {
                id:"tutorials",
                text:"Tutorials",
                address:"tutorials",
                internal:true,
                hide:()=>AppConfig.skinShowTutorialsTab === false
            },

            {
                id:"faq",
                text:"FAQ",
                address:"faq",
                internal:true,
                hide:()=>AppConfig.skinShowFAQSTab === false
            },

            {
                id:"news",
                text:"News",
                address:"news",
                internal:true,
                hide:()=>AppConfig.skinShowNewsTab === false
            },

            {
                id:"visualize",
                text:"Visualize Your Data",
                address:"visualize",
                internal:true,
                hide:()=>AppConfig.skinShowToolsTab === false
            },

            {
                id:"about",
                text:"About",
                address:"about",
                internal:true,
                hide:()=>AppConfig.skinShowAboutTab === false
            },

        ];


    }

    private getTabs(){
        const shownTabs = this.tabs().filter((t)=>{
            return !t.hide()
        });

        console.log(shownTabs);

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
                <Link to="/spa" id="cbioportal-logo"><img src={require("./cbioportal_logo.png")} alt="cBioPortal Logo"/></Link>
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

