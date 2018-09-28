import * as React from "react";
import {ResultsViewPageStore} from "../../../pages/resultsView/ResultsViewPageStore";
import {observer} from "mobx-react";
import classnames from "classnames";
import {computed} from "mobx";
import "./styles.scss";

interface IOqlStatusBannerProps {
    store:ResultsViewPageStore;
    tabReflectsOql:boolean;
    isUnaffected?:boolean;
    onToggle?:()=>void;
    className?:string;
    style?:any;
}

@observer
export default class OqlStatusBanner extends React.Component<IOqlStatusBannerProps, {}> {
    @computed get toggleButton() {
        if (this.props.onToggle && !this.props.isUnaffected) {
            return (
                <span>
                    <button
                        onClick={this.props.onToggle}
                        className="btn btn-default btn-xs"
                        style={{marginLeft:5}}
                    >
                        { this.props.tabReflectsOql ?
                            "Do not filter by OQL" :
                            "Filter by OQL"
                        }
                    </button>
                </span>
            );
        } else {
            return null;
        }
    }

    render() {
        if (this.props.store.queryContainsOql) {
            let className:string;
            let message:string;
            let iconClassName:string;
            let dataTest:string;

            if (this.props.isUnaffected) {
                className="alert alert-unaffected";
                message = "The results below are not affected by the OQL specification from your query.";
                iconClassName = "fa fa-md fa-info-circle";
                dataTest="OqlStatusBannerUnaffected";
            } else if (this.props.tabReflectsOql) {
                className="alert alert-success";
                message = "The results below reflect the OQL specification from your query.";
                iconClassName = "fa fa-md fa-check";
                dataTest="OqlStatusBannerYes";
            } else {
                className="alert alert-info";
                message = "The results below do not reflect the OQL specification from your query.";
                iconClassName = "fa fa-md fa-exclamation-triangle";
                dataTest="OqlStatusBannerNo";
            }

            return (
                <div data-test={dataTest} className={classnames("oql-status-banner", className, this.props.className)} style={Object.assign({}, this.props.style || {})}>
                    <span style={{verticalAlign:"middle"}}>
                        <i
                            className={classnames("banner-icon", iconClassName)}
                            style={{verticalAlign:"middle !important", marginRight:6, marginBottom:1}}
                        />
                        {message}
                        {this.toggleButton}
                    </span>
                </div>
            );
        } else {
            return null;
        }
    }
};
