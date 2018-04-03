import * as React from 'react';
import * as styles_any from './styles.module.scss';
import classNames from 'classnames';
import ChangeEventHandler = React.ChangeEventHandler;

const styles = styles_any as {
	labeledCheckbox: string;
};

export interface ILabeledCheckboxProps
{
	checked?: boolean;
	indeterminate?: boolean;
	disabled?: boolean;
	onChange?: ChangeEventHandler<HTMLInputElement>;
	labelProps?: React.HTMLProps<HTMLLabelElement>;
	inputProps?: React.HTMLProps<HTMLInputElement>;
}

export default class LabeledCheckbox extends React.Component<ILabeledCheckboxProps, {}>
{
	private input:HTMLInputElement;

	handleInputRef = (input:HTMLInputElement) =>
	{
		this.input = input;

		if (this.props.inputProps && typeof this.props.inputProps.ref === 'function')
			this.props.inputProps.ref(input);
	}

	componentDidMount()
	{
		this.input.indeterminate = !!this.props.indeterminate;
	}

	componentDidUpdate()
	{
		this.input.indeterminate = !!this.props.indeterminate;
	}

	render()
	{
		let labelPropsClassName = this.props.labelProps && this.props.labelProps.className;
		let className = classNames(styles.labeledCheckbox, labelPropsClassName);
		return (
			<label className={className} {...this.props.labelProps}>
				<input
					type="checkbox"
					checked={this.props.checked}
					onChange={this.props.onChange}
					disabled={this.props.disabled}
					{...this.props.inputProps}
					ref={this.handleInputRef}
				/>
				{this.props.children}
			</label>
		);
	}
}
