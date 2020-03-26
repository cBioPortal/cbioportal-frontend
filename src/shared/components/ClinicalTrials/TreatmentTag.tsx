import * as React from 'react';
import styles from './styles.module.scss';
import { If } from 'react-if';
import contrast from 'contrast';
import { computed } from 'mobx';

export interface ITreatmentTagProps {
    content: string | JSX.Element;
    backgroundColor: string;
    border?: string;
    defaultContentColor?: string;
}

export class TreatmentTag extends React.Component<ITreatmentTagProps, {}> {
    @computed
    get contentColor() {
        let _contrast = contrast(this.props.backgroundColor);
        if (_contrast === 'light') {
            return this.props.defaultContentColor
                ? this.props.defaultContentColor
                : '#000';
        } else {
            return '#fff';
        }
    }

    @computed
    get border() {
        let border = '';
        if (this.props.border) {
            border = this.props.border;
        }
        return border;
    }

    render() {
        return (
            <div
                className={styles['tag-main']}
                style={{
                    background: this.props.backgroundColor,
                    color: this.contentColor,
                    border: this.border,
                }}
            >
                <span className={styles['tag-content']}>
                    {this.props.content}
                </span>
            </div>
        );
    }
}
