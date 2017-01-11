import * as React from 'react';
import QueryContainer from "../../shared/components/query/old/QueryContainer";
import QueryContainer2 from "../../shared/components/query2/QueryContainer";
import * as styles_any from './styles.module.scss';
import {FlexCol} from "../../shared/components/flexbox/FlexBox";

function getRootElement()
{
	for (let node of document.childNodes)
		if (node instanceof HTMLElement)
			return node;
	throw new Error("No HTMLElement found");
}

const styles = styles_any as {
	rootHtml: string,
};

interface IHomePageProps
{
}

interface IHomePageState
{
	mode: number;
}

export default class HomePage extends React.Component<IHomePageProps, IHomePageState>
{
    constructor(props:IHomePageProps)
    {
        super(props);
        this.state = {mode: 2}
    }

    componentDidMount()
    {
		getRootElement().className += ' ' + styles.rootHtml
    }

    componentWillUnmount()
	{
		getRootElement().className = getRootElement().className.split(styles.rootHtml).join('');
	}

    public render()
    {
        return (
        	<FlexCol style={{height: '100%'}}>
				<a style={{alignSelf: 'center'}} onClick={() => this.setState({ mode: this.state.mode == 2 ? 1 : 2 })}>Switch to {this.state.mode == 2 ? 'old' : 'new'} view</a>
				{this.state.mode == 2 ? <QueryContainer2/> : <QueryContainer/>}
			</FlexCol>
		);
    }
}
