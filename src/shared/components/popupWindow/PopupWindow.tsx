import * as React from 'react';
import * as styles_any from './styles.module.scss';
import classNames from "../../lib/classNames";
import FontAwesome from "react-fontawesome";

const styles = styles_any as {
	PopupWindow: string,
	titleBar: string,
	windowTitle: string,
	closeButton: string,
	icon: string,
	content: string,
};

interface IPopupWindowProps extends React.HTMLAttributes<HTMLDivElement>
{
	windowTitle: string;
	onClickClose: React.MouseEventHandler<HTMLDivElement>;
}

interface IPopupWindowState
{
}

export default class PopupWindow extends React.Component<IPopupWindowProps, IPopupWindowState>
{
	constructor(props: IPopupWindowProps)
	{
		super(props);
	}

	render()
	{
		let {className, windowTitle, onClickClose, ...props} = this.props;

		return (
			<div {...props} className={classNames(className, styles.PopupWindow)}>
				<div className={styles.titleBar}>
					<span className={styles.windowTitle}>
						{windowTitle}
					</span>
					<div className={styles.closeButton} onClick={onClickClose}>
						<FontAwesome className={styles.icon} name="times"/>
					</div>
				</div>
				<div className={styles.content}>
					{this.props.children}
				</div>
			</div>
		);
	}
}
