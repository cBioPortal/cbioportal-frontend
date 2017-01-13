// components for controlling experimental options

import * as React from 'react';
import firstDefinedValue from "../lib/firstDefinedValue";
import LabeledCheckbox from "./labeledCheckbox/LabeledCheckbox";

export type ISelectOption<V> = {
	label:string,
	callback?:()=>void,
	value?:V
};

export interface ISelectProps<V>
{
	label?: string;
	selected: V;
	options: ISelectOption<V>[];
	onChange: (option:ISelectOption<V>)=>void;
};


export function EditableDropdown(props:ISelectProps<string>)
{
	let textInput:HTMLInputElement;

	function onChange(event:React.FormEvent/*<HTMLInputElement>*/)
	{
		if (props.onChange)
			props.onChange({label: textInput.value, value: textInput.value});
	}

	function onSelect(option:ISelectOption<string>)
	{
		textInput.value = option.value || option.label;
		if (option.callback)
			option.callback();
		if (props.onChange)
			props.onChange(option);
	}

	return (
		<label>
			{props.label}
			<div className="input-group dropdown">
				<input
					type="text"
					className="form-control dropdown-toggle"
					value={props.selected}
					ref={input => textInput = input}
					onChange={onChange}
				/>
				<ul className="dropdown-menu">
					{
						props.options.map((option, i) => (
							<a key={i} href="#" onClick={() => onSelect(option)}>{option.label}</a>
						))
					}
				</ul>
				<span role="button" className="input-group-addon dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
					<span className="caret"/>
				</span>
			</div>
		</label>
	);
}

export function Select(props:ISelectProps<any>)
{
	function onChange(event:React.FormEvent/*<HTMLSelectElement>*/)
	{
		let option = props.options[parseInt((event.target as HTMLInputElement).value)];
		if (option.callback)
			option.callback();
		if (props.onChange)
			props.onChange(option);
	}

	let defaultValue = "0";

	let optionsJSX = props.options.map((option, i) => {
		if (props.selected == (option.value !== undefined ? option.value : i))
			defaultValue = i + '';
		return (
			<option key={i} value={i + ''}>
				{option.label}
			</option>
		);
	});

	return (
		<label>
			{props.label}
			<select onChange={onChange} defaultValue={defaultValue}>
				{optionsJSX}
			</select>
		</label>
	);
}

export interface IStateToggleProps<S>
{
	label?: string;
	target: React.Component<any, S>;
	name: keyof S;
	defaultValue: boolean;
}

export function StateToggle(props:IStateToggleProps<any>)
{
	let {label, target, name, defaultValue} = props;
	return (
		<LabeledCheckbox
			checked={firstDefinedValue(target.state[name], defaultValue)}
			inputProps={{
				onChange: event => target.setState({[name]: (event.target as HTMLInputElement).checked})
			}}
		>
			{label || name}
		</LabeledCheckbox>
	);
}
