import * as React from "react";
import {ResultsViewPageStore} from "../../pages/resultsView/ResultsViewPageStore";
import {observer} from "mobx-react";
import classnames from "classnames";


const yesOqlColor = "#117000";
const noOqlColor = "#a81319";

@observer
export default class OqlStatusBanner extends React.Component<{store:ResultsViewPageStore, className?:string, style?:any, tabReflectsOql:boolean}, {}> {
    render() {
        if (this.props.store.queryContainsOql) {
            let className:string;
            let message:string;
            let iconClassName:string;
            let dataTest:string;

            if (this.props.tabReflectsOql) {
                //color = yesOqlColor;
                className="alert alert-success";
                message = "This tab reflects the OQL specification from your query.";
                iconClassName = "fa fa-md fa-check";
                dataTest="OqlStatusBannerYes";
            } else {
                //color = noOqlColor;
                className="alert alert-info";
                message = "This tab does not reflect the OQL specification from your query";
                iconClassName = "fa fa-md fa-exclamation-triangle";
                dataTest="OqlStatusBannerNo";
            }
            const style = {fontFamily:"arial", fontSize:"13px", fontWeight:"bold", marginBottom:4, padding:8};
            return (
                <div data-test={dataTest} className={classnames(className, this.props.className)} style={Object.assign({}, style, this.props.style || {})}>
                    <span style={{marginRight:4, verticalAlign:"middle"}}>
                        <i className={iconClassName}/>
                    </span>
                    {message}
                </div>
            );
        } else {
            return null;
        }
    }
};
