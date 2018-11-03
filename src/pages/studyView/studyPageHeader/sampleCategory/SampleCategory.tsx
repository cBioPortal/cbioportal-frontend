import * as React from 'react';
import {action, computed, observable} from 'mobx';
import {observer} from "mobx-react";
import styles from "./styles.module.scss";
import {If} from 'react-if';
import {bind} from 'bind-decorator';
import MobxPromise from 'mobxpromise';
import LoadingIndicator from "../../../../shared/components/loadingIndicator/LoadingIndicator";

export interface ISampleCategoryProps {
    subtitle: string,
    promise: MobxPromise<Number>,
    onToggle: () => void,
    isSelected: boolean,
}

@observer
export class SampleCategory extends React.Component<ISampleCategoryProps, {}> {
    @observable mouseInChart: boolean = false;

    @bind
    @action
    mouseIn() {
        this.mouseInChart = true;
    }

    @bind
    @action
    mouseOut() {
        this.mouseInChart = false;
    }

    @computed
    get number() {
        return this.props.promise.result ? this.props.promise.result : 0;
    }

    render() {
        return <div className={styles.main}
                    onMouseEnter={this.mouseIn}
                    onMouseLeave={this.mouseOut}
        >

            <div className={styles.number}>
                <LoadingIndicator isLoading={this.props.promise.isPending}/>
                {(this.props.promise.isComplete && (this.number))}
            </div>
            <span className={styles.subtitle}>{this.props.subtitle}</span>
            <If condition={this.mouseInChart || this.props.isSelected}>
                <input type='checkbox'
                       className={styles.checkbox}
                       checked={this.props.isSelected}
                       disabled={this.number === 0}
                       onChange={this.props.onToggle}></input>
            </If>
        </div>
    };
}
