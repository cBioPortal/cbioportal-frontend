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
                hide:()=>AppConfig.skinShowDataSetsTab !== true
            }


        ];


    }

    private getTabs(){
        const shownTabs = this.tabs().filter((t)=>{
            return !t.hide()
        });
        return shownTabs.map((tab)=>{
            return <li>
                {
                    (tab.internal) ? <Link to={tab.address}>{tab.text}</Link> :  <a href={tab.address}>{tab.text}</a>
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

                        <li className="internal">
                            <a href="web_api.jsp">Web API</a>
                        </li>

                        <li className="internal">
                            <a href="cgds_r.jsp">R/MATLAB</a>
                        </li>

                        <li className="internal">
                            <a href="tutorial.jsp">Tutorials</a>
                        </li>


                        <li className="internal">
                            <a href="faq.jsp">FAQ</a>
                        </li>


                        <li className="internal">
                            <a href="news.jsp">News</a>
                        </li>

                        <li className="internal">
                            <a href="tools.jsp">Visualize Your Data</a>
                        </li>

                        <li className="internal">
                            <a href="about_us.jsp">About</a>
                        </li>
                    </ul>
                </nav>
            </div>

            <div id="rightHeaderContent"></div>
        </header>
    }

}

