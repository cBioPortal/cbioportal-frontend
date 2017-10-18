import * as React from 'react';
import MobxPromise from "mobxpromise";
import {observer} from "mobx-react";
import * as styles_any from './styles.module.scss';
import classNames from 'classnames';
import ErrorBox from "../errorBox/ErrorBox";
import ReactElement = React.ReactElement;
import {ThreeBounce} from "better-react-spinkit";

const styles = styles_any as {
	SectionHeader: string,
	error: string,
	message: string,
	icon: string,
};

interface ISectionHeaderProps extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>
{
	promises?: MobxPromise<any>[];
	secondaryComponent?:ReactElement<any>;
}

@observer
export default class SectionHeader extends React.Component<ISectionHeaderProps, {}>
{
	render()
	{
		let {promises, children, className, secondaryComponent, ...divProps} = this.props;
		return (
			<div className={classNames(className, styles.SectionHeader)} {...divProps}>
				<h2>
					{children}
					{!!(promises && promises.some(promise => promise.isPending)) && (
						<ThreeBounce style={{ display:'inline-block', marginLeft:10 }}/>
					)}
				</h2>

				{
					(!!secondaryComponent) && (
						secondaryComponent
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
