import * as React from 'react';
import * as _ from 'lodash';
import styles from './styles.module.scss';
import {If} from 'react-if';
import contrast from 'contrast';
import {computed} from 'mobx';

export interface IPillTagProps {
    content: string;
    backgroundColor: string;
    onDelete?: () => void;
}

export class PillTag extends React.Component<IPillTagProps, {}> {

    @computed
    get contentColor() {
        let _contrast = contrast(this.props.backgroundColor);
        if (_contrast === 'light') {
            return '#000';
        } else {
            return '#fff'
        }
    }

    render() {
        return (<div className={styles.main} style={{background: this.props.backgroundColor, color: this.contentColor}}>
            <span className={styles.content}>{this.props.content}</span>
            <If condition={_.isFunction(this.props.onDelete)}>
                <span data-test="pill-tag-delete" className={styles.delete} onClick={this.props.onDelete}><i className="fa fa-times-circle"></i></span>
            </If>
        </div>)
    }
}