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

export function Select(props:ISelectProps<any>)
{
	function onChange(event:React.FormEvent)
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
				onChange: (event:React.FormEvent) => target.setState({[name]: (event.target as HTMLInputElement).checked})
			}}
		>
			{label || name}
		</LabeledCheckbox>
	);
}