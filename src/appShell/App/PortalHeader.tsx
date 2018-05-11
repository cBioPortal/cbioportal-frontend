import * as React from 'react';

export default class PortalHeader extends React.Component<{}, {}> {

    render(){
        return <header>
            <div id="leftHeaderContent">
                <a id="cbioportal-logo" href="index.do"><img src={require("./cbioportal_logo.png")} alt="cBioPortal Logo"/></a>

                <nav id="main-nav">
                    <ul>
                        <li className="internal">
                            <a href="data_sets.jsp">Data Sets</a>
                        </li>

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

