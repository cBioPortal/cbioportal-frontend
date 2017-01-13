/*
	Copyright (c) 2015 Weave Visual Analytics, Inc.

	This Source Code Form is subject to the terms of the
	Mozilla Public License, v. 2.0. If a copy of the MPL
	was not distributed with this file, You can obtain
	one at https://mozilla.org/MPL/2.0/.
*/

import * as React from "react";
import * as _ from 'lodash';
import styles from './styles.module.scss';
import classNames from "shared/lib/classNames";

export interface IFlexBoxProps <T> extends React.HTMLProps<T>
{
	flex?:number;
	padded?:boolean;
	overflow?:boolean;
}

export class IFlexBoxProps<T>
{
	static renderBox<T>(props:IFlexBoxProps<T>, flexDirection:"row"|"column"):JSX.Element
	{
		let {padded, overflow, flex, ...attributes} = props;
		let style:React.CSSProperties = {
			flex,
			display: "flex",
			overflow: overflow ? "visible" : "auto",
			...props.style,
			flexDirection
		};
		let className = classNames(props.className, styles[flexDirection], padded && styles.padded);
		return <div {...attributes as React.HTMLAttributes} style={style} className={className}/>;
	}
}

export class FlexRow extends React.Component<IFlexBoxProps<FlexRow>, {}>
{
	render():JSX.Element
	{
		return IFlexBoxProps.renderBox(this.props, "row");
	}
}

export class FlexCol extends React.Component<IFlexBoxProps<FlexCol>, {}>
{
	render():JSX.Element
	{
		return IFlexBoxProps.renderBox(this.props, "column");
	}
}
