import * as React from 'react';
import {ThreeBounce} from 'better-react-spinkit';
import {If, Else, Then} from 'react-if';
import Spinner from "react-spinkit";
import Portal from 'react-portal';
import classNames from 'classnames';
import styles from './styles.module.scss';

export interface ILoader {
    isLoading: boolean;
    style?: any;
    small?: boolean;
    big?: boolean;
    inline?: boolean;
    center?: boolean;
    size?: "big" | "small"
    className?:string;
}

export default class LoadingIndicator extends React.Component<ILoader, {}> {

    public static defaultProps = {
        inline: true,
        center: false,
        size: "small"
    };

    public render() {

        const spinnerStyles = {
            [styles.small]: this.props.size === "small",
            [styles.big]: this.props.size === "big",
            inlineBlock: this.props.inline
        }

        const parentStyles = {
            [styles.centered]:this.props.center,
            [styles["centered-with-children"]]:this.props.center && (React.Children.count(this.props.children) > 0),
            inlineBlock: this.props.inline
        };

        return (
            <If condition={this.props.isLoading}>
                <Then>
                    <div className={classNames(parentStyles, this.props.className)} style={this.props.style||{}}>
                        <Spinner fadeIn="none"
                                 className={classNames(styles.color, spinnerStyles)}
                                 style={{display: 'inline-block'}}
                                 name="line-scale-pulse-out"/>
                        {
                            this.props.children
                        }
                    </div>
                </Then>
            </If>
        );

    }
}


export class GlobalLoader extends React.Component<ILoader, {}> {

    public render() {
        return <Portal isOpened={this.props.isLoading}>
            <Spinner className={classNames(styles.color, styles.centered, styles.big)} fadeIn="none" name="line-scale-pulse-out" />
        </Portal>
    }

}
