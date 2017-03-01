import * as React from 'react';
import Spinner from 'react-spinkit';
import {MobxPromiseUnionType, MobxPromiseUnionTypeWithDefault} from "../../api/MobxPromise";
import {observer} from "mobx-react";
import FontAwesome from "react-fontawesome";
import * as styles_any from './styles.module.scss';
import classNames from "../../lib/classNames";

const styles = styles_any as {
	pending: string,
	complete: string,
	error: string,
	icon: string,
	message: string,
};

interface IAsyncStatusProps extends React.HTMLProps<HTMLDivElement>
{
	promise: MobxPromiseUnionType<any> | MobxPromiseUnionTypeWithDefault<any>;
}

@observer
export default class AsyncStatus extends React.Component<IAsyncStatusProps, {}>
{
	render()
	{
		let {promise, children, className, ...divProps} = this.props;
		switch (promise.status)
		{
			case 'pending':
				return (
					<div className={classNames(className, styles.pending)} {...divProps}>
						<Spinner/>
					</div>
				);
			case 'error':
				return (
					<div className={classNames(className, styles.error)} {...divProps}>
						<FontAwesome className={styles.icon} name='exclamation-triangle'/>
						<span className={styles.message}>{promise.error.toString()}</span>
					</div>
				);
			case 'complete':
				if (children)
					return (
						<div className={classNames(className, styles.complete)} {...divProps}>
							{children}
						</div>
					);
				return null;
		}
	}
}
