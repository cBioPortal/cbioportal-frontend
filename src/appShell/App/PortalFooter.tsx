import * as React from 'react';
import AppConfig from "appConfig";
import { If } from 'react-if';

export default class PortalFooter extends React.Component<{}, {}> {

    render(){
        return <div id="footer">
            <a href="http://cbioportal.org">cBioPortal</a>
            <span id="footer-span-version"> Version 1.14.0-SNAPSHOT</span>
            <span className="pipeSeperator">|</span><a href="http://www.mskcc.org/mskcc/html/44.cfm">MSKCC</a><span className="pipeSeperator">|</span>
            <a href="http://cancergenome.nih.gov/">TCGA</a>
            <br/>
            Questions and feedback: <span className="mailme" title="Contact us">{AppConfig.serverConfig.skin_email_contact}</span>

            <If condition={AppConfig.serverConfig.app_version === "public_portal"}>
                <span className="pipeSeperator">|</span>
                <a target="_blank" href="http://groups.google.com/group/cbioportal">User discussion group</a>
                <span className="pipeSeperator">|</span>
                <a target="_blank" href="https://github.com/cBioPortal/">
                <i className="fa fa-github" aria-hidden="true"></i> GitHub</a>
            </If>

        </div>
    }

}

