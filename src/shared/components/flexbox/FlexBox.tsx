/*
	Copyright (c) 2015 Weave Visual Analytics, Inc.

	This Source Code Form is subject to the terms of the
	Mozilla Public License, v. 2.0. If a copy of the MPL
	was not distributed with this file, You can obtain
	one at https://mozilla.org/MPL/2.0/.
*/

import * as React from "react";
import * as _ from 'underscore';
import styles from './styles';
import classNames from "shared/lib/classNames";

export interface BoxProps <T> extends React.HTMLProps<T>
{
	padded?:boolean;
	overflow?:boolean;
}

export class BoxProps<T>
{
	static renderBox<T>(props:BoxProps<T>, flexDirection:"row"|"column"):JSX.Element
	{
		var attributes:React.HTMLAttributes = _.omit(props, 'padded', 'overflow');
		var style:React.CSSProperties = _.extend(
			{
				display: "flex",
				overflow: props.overflow ? "visible" : "auto"
			},
			props.style,
			{
				flexDirection
			}
		);
		let className = classNames(props.className, styles[flexDirection], props.padded ? styles.padded : null);
		return <div {...attributes} style={style} className={className}/>;
	}
}

export class HBox extends React.Component<BoxProps<HBox>, {}>
{
	render():JSX.Element
	{
		return BoxProps.renderBox(this.props, "row");
	}
}

export class VBox extends React.Component<BoxProps<VBox>, {}>
{
	render():JSX.Element
	{
		return BoxProps.renderBox(this.props, "column");
	}
}
