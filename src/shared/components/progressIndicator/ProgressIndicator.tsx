import * as React from "react";
import {observer} from "mobx-react";
import styles from "./styles.module.scss";
import classnames from "classnames";
import LoadingIndicator from "../loadingIndicator/LoadingIndicator";
import {computed} from "mobx";
import _ from "lodash";
import ErrorMessage from "../ErrorMessage";
import Spinner from "react-spinkit";

export interface IProgressIndicatorItem {
    label: string;
    status: "complete" | "pending" | "error" | "notInvoked";
};

export interface IProgressIndicatorProps {
    items:IProgressIndicatorItem[];
    show:boolean;
}

function makeItem(item:IProgressIndicatorItem, index:number) {
    let icon:any = null;
    switch (item.status) {
        case "complete":
            icon = <i className={classnames("fa fa-sm fa-check", styles["fa-check"])}/>;
            break;
        case "pending":
            icon = <Spinner name="double-bounce" fadeIn={false} className={styles["pulse-spinner"]} />
            break;
        case "error":
            icon = <i className={classnames("fa fa-sm fa-exclamation-triangle", styles["fa-exclamation-triangle"])}/>;
            break;
        case "notInvoked":
            // dont show anything
            break;
    }
    return (
        <span className={classnames(styles["item-row"], {[styles["item-row-not-first"]]:(index > 0), [styles["not-invoked-item"]]:(item.status === "notInvoked")})}>
            {item.label}
            <span style={{marginLeft:7}}>{icon}</span>
        </span>
    );
}

@observer
export default class ProgressIndicator extends React.Component<IProgressIndicatorProps, {}> {
    render() {
        if (this.props.show) {
            return (
                <div className={styles.container}>
                        <div className={styles["items-container"]}>
                            {this.props.items.map(makeItem)}
                        </div>
                    { _.some(this.props.items, i=>(i.status==="error")) &&
                        <ErrorMessage/>}
                </div>
            );
        } else {
            return null;
        }
    }
}