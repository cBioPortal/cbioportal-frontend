import * as React from 'react';
import * as styles_any from './styles.module.scss';
import classNames from '../../lib/classNames';
import FontAwesome from "react-fontawesome";

const styles = styles_any as {
	treeNodeList: string,
	treeNodeItem: string,
	row: string,
	arrow: string,
	noIndent: string,
};

export interface IBasicTreeNode {
	expanded?: boolean;
	content: React.ReactChild;
	children?: this[];
	listItemProps?:React.HTMLAttributes|undefined;
	data?: any;
}

/**
 * Default tree descriptor.
 * Allows tree to be defined completely in a nested object
 * rather than having to provide a separate descriptor object.
 */
export class BasicTreeDescriptor<TreeNode extends IBasicTreeNode> implements ITreeDescriptor<TreeNode>
{
	isExpanded(node:TreeNode) { return !!node.expanded; }
	getContent(node:TreeNode) { return node.content; }
	getChildren(node:TreeNode) { return node.children; }
	getListItemProps(node:TreeNode) { return node.listItemProps; }
}

export interface ITreeDescriptor<TreeNode>
{
    isExpanded(node:TreeNode):boolean;
    getContent(node:TreeNode):React.ReactChild;
    getChildren(node:TreeNode):TreeNode[]|undefined;

    /**
	 * Allows customizing the LI element of each node.
	 */
    getListItemProps?(node:TreeNode):React.HTMLAttributes|undefined;
}

export interface IDescriptorTreeProps<TreeNode>
{
    treeDescriptor?: ITreeDescriptor<TreeNode>;
    node: TreeNode;

    className?: string;
    style?: React.CSSProperties;
    onExpand?: (node:TreeNode, expand:boolean, event:React.MouseEvent)=>void;
    isChild?: boolean;
    showRoot?: boolean;
}

export interface IDescriptorTreeState
{
    expand?: boolean;
}

/**
 * DescriptorTree makes it easy to compute a tree on the fly
 * rather than specifying the tree data entirely in a nested object structure.
 *
 * To use with JSX, create an alias like so:
 *     const FooTree = DescriptorTree.of<FooNode>();
 */
export default class DescriptorTree<TreeNode> extends React.Component<IDescriptorTreeProps<TreeNode>, IDescriptorTreeState>
{
	/**
	 * Provides a workaround for the current lack of support for generics in JSX.
	 * See https://github.com/Microsoft/TypeScript/issues/6395
	 */
	static of<T>():new(p:IDescriptorTreeProps<T>) => DescriptorTree<T>
	{
		return DescriptorTree as new(p:IDescriptorTreeProps<T>) => DescriptorTree<T>;
	}

	static get defaultProps():IDescriptorTreeProps<any>
	{
		return {
			treeDescriptor: new BasicTreeDescriptor(),
			node: {},

			showRoot: true
		};
	}

    constructor(props:IDescriptorTreeProps<TreeNode>)
    {
        super(props);
        this.state = {};
    }

    onExpand = (event:React.MouseEvent) =>
    {
        let expand = !this.expand;
        if (this.props.onExpand)
            this.props.onExpand(this.props.node, expand, event);
        this.setState({expand});
    }

    get expand():boolean
    {
		let desc = this.props.treeDescriptor as ITreeDescriptor<TreeNode>;
        let expand = this.state.expand;
        if (expand === undefined || this.props.onExpand)
            expand = desc.isExpanded(this.props.node);
        return expand;
    }

    renderChildNodes(children:TreeNode[] | undefined):JSX.Element[]
	{
		return (children || []).map((child, i) => (
			<DescriptorTree
				key={i}
				treeDescriptor={this.props.treeDescriptor}
				node={child}
				onExpand={this.props.onExpand}
				isChild={true}
			/>
		))
	}

	renderUL(asRootElement:boolean, children:React.ReactNode):JSX.Element
	{
		let className, style;
		if (asRootElement)
		{
			className = classNames(styles.noIndent, styles.treeNodeList, this.props.className);
			style = this.props.style;
		}
		else
		{
			className = styles.treeNodeList;
		}

		return (
			<ul className={className} style={style}>
				{children}
			</ul>
		);
	}

    render():JSX.Element
    {
    	let desc = this.props.treeDescriptor as ITreeDescriptor<TreeNode>;
    	let node = this.props.node;
        let children = desc.getChildren(node);

		// if we're hiding the root node, render children at top level
        if (!this.props.showRoot)
			return this.renderUL(true, this.renderChildNodes(children));

        // to keep indentation consistent, we always render an icon for the arrow and style controls visibility
        let expand = this.expand;
        let showArrow = !!children && children.length > 0;
        let arrowStyle = showArrow ? undefined : {visibility: 'hidden'};
        let arrow = (
            <FontAwesome
            	className={styles.arrow}
                name={expand ? 'caret-down' : 'caret-right'}
                style={arrowStyle}
                onMouseDown={this.onExpand}
            />
        );

		// the node is rendered as an LI element
		let customProps = desc.getListItemProps && desc.getListItemProps(node);
		let liProps = {...customProps};
		liProps.className = classNames(liProps.className, styles.treeNodeItem);

		let content = desc.getContent(node);
		let childList = expand && this.renderUL(false, this.renderChildNodes(children));

		let liElement = (
			<li {...liProps}>
				<div className={styles.row}>
					{arrow}
					{content}
				</div>
				{childList}
			</li>
		);

		// if this is a child node, don't render outer UL element
		if (this.props.isChild)
			return liElement;

		// root node needs an outer UL element
		return this.renderUL(true, liElement);
    }
}

/**
 * BasicTree allows the tree data to be defined completely in a nested
 * object structure implementing IBasicTreeNode.
 * It is not necessary to provide a treeDescriptor prop.
 */
export class BasicTree extends DescriptorTree<IBasicTreeNode> { };
