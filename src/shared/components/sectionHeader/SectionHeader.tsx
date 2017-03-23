import * as React from 'react';
import Spinner from 'react-spinkit';
import MobxPromise from "mobxpromise";
import {observer} from "mobx-react";
import FontAwesome from "react-fontawesome";
import * as styles_any from './styles.module.scss';
import classNames from 'classnames';

const styles = styles_any as {
	SectionHeader: string,
	error: string,
	icon: string,
	message: string,
};

interface ISectionHeaderProps extends React.HTMLProps<HTMLDivElement>
{
	promises?: MobxPromise<any>[];
}

@observer
export default class SectionHeader extends React.Component<ISectionHeaderProps, void>
{
	render()
	{
		let {promises, children, className, ...divProps} = this.props;
		return (
			<div className={classNames(className, styles.SectionHeader)} {...divProps}>
				{!!(promises && promises.some(promise => promise.isPending)) && (
					<Spinner/>
				)}
				<h2>{children}</h2>
				{promises && promises.filter(promise => promise.error).map(promise => (
					<div className={classNames(className, styles.error)} {...divProps}>
						<FontAwesome className={styles.icon} name='exclamation-triangle'/>
						<span className={styles.message}>{promise.error + ''}</span>
					</div>
				))}
			</div>
		);
	}
}
