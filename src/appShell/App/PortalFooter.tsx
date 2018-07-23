import * as React from 'react';

export default class PortalFooter extends React.Component<{}, {}> {

    render(){
        return <div id="footer">
            <a href="http://cbioportal.org">cBioPortal</a>
            <span id="footer-span-version"> Version 1.14.0-SNAPSHOT</span>
            &nbsp;|&nbsp;<a href="http://www.mskcc.org/mskcc/html/44.cfm">MSKCC</a>&nbsp;|&nbsp;<a
            href="http://cancergenome.nih.gov/">TCGA</a>
            <br/>
            Questions and feedback: <span className="mailme" title="Contact us">cbioportal at googlegroups dot com</span>&nbsp;|&nbsp;<a target="_blank" href="http://groups.google.com/group/cbioportal">User discussion group</a>
            &nbsp;|&nbsp;<a target="_blank" href="https://github.com/cBioPortal/"><i className="fa fa-github" aria-hidden="true"></i> GitHub</a>
        </div>
    }

}

