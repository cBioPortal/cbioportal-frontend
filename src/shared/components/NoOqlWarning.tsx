import * as React from "react";
import {ResultsViewPageStore} from "../../pages/resultsView/ResultsViewPageStore";
import {observer} from "mobx-react";

@observer
export default class NoOqlWarning extends React.Component<{store:ResultsViewPageStore}, {}> {
    render() {
        if (this.props.store.queryContainsOql) {
            return (
                <span data-test="NoOqlWarning" style={{color:"#74bedb", fontFamily:"arial", fontSize:"13px", fontWeight:"bold"}}>
                    <span style={{marginRight:4, verticalAlign:"middle"}}>
                        <i className="fa fa-md fa-info-circle"/>
                    </span>
                    This tab does not reflect the OQL specification from your query.
                </span>
            );
        } else {
            return null;
        }
    }
};
