import * as React from "react";
import {observer} from "mobx-react";
import styles from "./styles.module.scss";
import classnames from "classnames";
import LoadingIndicator from "../loadingIndicator/LoadingIndicator";
import {computed} from "mobx";
import _ from "lodash";
import ErrorMessage from "../ErrorMessage";
import Spinner from "react-spinkit";
import {MobxPromise} from "mobxpromise";
import {getMobxPromiseGroupStatus} from "../../lib/getMobxPromiseGroupStatus";
import autobind from "autobind-decorator";

export interface IProgressIndicatorItem {
    label: string;
    promises?:MobxPromise<any>[]; // if `promises` is not defined, then just show pending
};

export interface IProgressIndicatorProps {
    items:IProgressIndicatorItem[];
    show:boolean;
    sequential?:boolean; // if true, things further in list are not showed as loading until previous in list are completed
}

function getItemStatus(item:IProgressIndicatorItem):"complete"|"pending"|"error" {
    if (item.promises) {
        if (item.promises.length === 0) {
            return "complete";
        } else {
            return getMobxPromiseGroupStatus(...(item.promises));
        }
    } else {
        return "pending";
    }
}

@observer
export default class ProgressIndicator extends React.Component<IProgressIndicatorProps, {}> {
    @computed get firstIncompleteIndex() {
        return this.props.items.findIndex(item=>(getItemStatus(item) !== "complete"));
    }

    @autobind
    private makeItem(item:IProgressIndicatorItem, index:number) {
        let icon:any = null;
        // if sequential option is true, then only show any indicator if all previous items are complete
        const notInvoked = this.props.sequential && (index > this.firstIncompleteIndex);
        if (!notInvoked) {
            switch (getItemStatus(item)) {
                case "complete":
                    icon = <i className={classnames("fa fa-sm fa-check", styles["fa-check"])}/>;
                    break;
                case "pending":
                    icon = <Spinner name="double-bounce" fadeIn={false} className={styles["pulse-spinner"]} />
                    break;
                case "error":
                    icon = <i className={classnames("fa fa-sm fa-exclamation-triangle", styles["fa-exclamation-triangle"])}/>;
                    break;
            }
        }
        return (
            <span className={classnames(styles["item-row"], {[styles["item-row-not-first"]]:(index > 0), [styles["not-invoked-item"]]:notInvoked})}>
            {item.label}
                <span style={{marginLeft:7}}>{icon}</span>
        </span>
        );
    }

    render() {
        if (this.props.show) {
            return (
                <div className={styles.container}>
                        <div className={styles["items-container"]}>
                            {this.props.items.map(this.makeItem)}
                        </div>
                    { _.some(this.props.items, i=>(getItemStatus(i)==="error")) &&
                        <ErrorMessage/>}
                </div>
            );
        } else {
            return null;
        }
    }
}