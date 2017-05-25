import * as React from 'react';
import Spinner from 'react-spinkit';
import MobxPromise from "mobxpromise";
import {observer} from "mobx-react";
import * as styles_any from './styles.module.scss';
import classNames from 'classnames';
import ErrorBox from "../errorBox/ErrorBox";
import ReactElement = React.ReactElement;

const styles = styles_any as {
	SectionHeader: string,
	error: string,
	message: string,
	icon: string,
};

interface ISectionHeaderProps extends React.HTMLProps<HTMLDivElement>
{
	promises?: MobxPromise<any>[];
	secondaryComponent?:ReactElement<any>;
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

				{
					(!!this.props.secondaryComponent) && (
						this.props.secondaryComponent
					)
				}

				{promises && promises.map(promise => (
					!!(promise.error) && (
						<ErrorBox className={styles.error} error={promise.error}/>
					)
				))}
			</div>
		);
	}
}
