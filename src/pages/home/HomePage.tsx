import * as React from 'react';
import {VBox} from "shared/components/flexbox/FlexBox";

interface HomePageProps
{
}

interface HomePageState
{
}

type TreeStruct = {label:string, children?:TreeStruct[]};

export default class HomePage extends React.Component<HomePageProps, HomePageState>
{
	treeData:TreeStruct;

	constructor(props:HomePageProps)
	{
		super(props);

		// mock data for test
		this.treeData = {label: "All", children: [
			{label: "Category 1", children: [
				{label: "Item 1.1"},
				{label: "Item 1.2"}
			]},
			{label: "Category 2", children: [
				{label: "Item 2.1"},
				{label: "Item 2.2"}
			]},
		]};
	}

	private renderTree(tree:TreeStruct, style?:React.CSSProperties):JSX.Element
	{
		// this is just a test to make sure we can reference other components like VBox and have its local styles work
		if (tree.children && tree.children.length)
			return (
				<VBox padded style={style}>
					<span>{tree.label}</span>
					{tree.children.map(child => this.renderTree(child, {paddingLeft: "1em"}))}
				</VBox>
			);
		return <span style={style}>{tree.label}</span>;
	}

	render()
	{
		return this.renderTree(this.treeData);
	}
};
