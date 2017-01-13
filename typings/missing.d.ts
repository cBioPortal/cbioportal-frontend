declare module '*.scss';
declare module '*.json';
declare module 'query-string';
declare module 'react-file-download';
declare module 'react-select';
declare module 'react-zeroclipboard';
declare module 'reactableMSK';
declare module 'redux-seamless-immutable';
declare module 'webpack-raphael';
declare module 'render-if';
declare type PartialPick<T, K extends keyof T> = Partial<Pick<T, K>>;

declare module 'react-radio-group' {
	import * as React from 'react';
	export const RadioGroup:React.ComponentClass<{
		name?: string,
		selectedValue?: string | number | boolean,
		onChange?: React.EventHandler<React.FormEvent>,
		Component?: string | React.ComponentClass<any>,
	}>;

	export const Radio:React.ComponentClass<React.HTMLProps<HTMLInputElement>>;
}