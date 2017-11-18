import * as React from 'react';
import getOverlappingStudies from "../../lib/getOverlappingStudies";
import {CancerStudy} from "../../api/generated/CBioPortalAPI";

export default class OverlappingStudiesWarning extends React.Component<{ studies:CancerStudy[] }, {}>{
    render(){
        const overlapping = getOverlappingStudies(this.props.studies);
        if (overlapping.length > 0) {
            return (
                <div className="alert alert-danger" style={{marginBottom: 0}}>
                    <i className="fa fa-exclamation-triangle"></i> You have selected duplicated versions of TCGA studies.
                </div>
            );
        } else {
            return null;
        }
    }
}