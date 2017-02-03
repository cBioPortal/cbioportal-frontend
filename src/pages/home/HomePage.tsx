import * as React from 'react';
import QueryContainerOld from "../../shared/components/query/old/QueryContainer";
import QueryContainer from "../../shared/components/query/QueryContainer";
import * as styles_any from './styles.module.scss';
import {FlexCol} from "../../shared/components/flexbox/FlexBox";
import devMode from "../../shared/lib/devMode";
import {observer} from "../../../node_modules/mobx-react/index";
import DevTools from "../../../node_modules/mobx-react-devtools/index";
import {toJS, observable, action, computed, whyRun, expr} from "../../../node_modules/mobx/lib/mobx";

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
}

@observer
export default class HomePage extends React.Component<IHomePageProps, IHomePageState>
{
    constructor(props:IHomePageProps)
    {
        super(props);
    }

    componentDidMount()
    {
		getRootElement().className += ' ' + styles.rootHtml;
    }

    componentWillUnmount()
	{
		getRootElement().className = getRootElement().className.split(styles.rootHtml).join('');
	}

	@observable selectorVersion:'new'|'old' = 'new';

    public render()
    {
        return (
        	<FlexCol style={{height: '100%'}}>
				{this.selectorVersion == 'new' ? <QueryContainer/> : <QueryContainerOld/>}
				{/*devMode.enabled && <a style={{alignSelf: 'center'}} onClick={() => this.selectorVersion = this.selectorVersion == 'new' ? 'old' : 'new' }>Switch to {this.selectorVersion == 'new' ? 'old' : 'new'} view</a>*/}
				{devMode.enabled && <DevTools/>}
			</FlexCol>
		);
    }
}
