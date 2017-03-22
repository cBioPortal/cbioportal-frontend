import * as React from 'react';
import Spinner from 'react-spinkit';
import MobxPromise from "mobxpromise";
import {observer} from "mobx-react";
import FontAwesome from "react-fontawesome";
import * as styles_any from './styles.module.scss';
import classNames from 'classnames';

const styles = styles_any as {
	pending: string,
	complete: string,
	error: string,
	icon: string,
	message: string,
};

interface IAsyncStatusProps extends React.HTMLProps<HTMLDivElement>
{
	promise: MobxPromise<any> | Array<MobxPromise<any>>;
	showLastError?: boolean;
}

@observer
export default class AsyncStatus extends React.Component<IAsyncStatusProps, {}>
{
	private readonly promise = new MobxPromise({
		await: () => Array.isArray(this.props.promise) ? this.props.promise : [this.props.promise],
		invoke: async () => null
	});

	render()
	{
		let {promise, children, className, showLastError, ...divProps} = this.props;
		let {status, error} = this.promise;
		if (showLastError && error)
			status = 'error';
		switch (status)
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
						<span className={styles.message}>{this.promise.error + ''}</span>
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

			default:
				return null;
		}
	}
}
