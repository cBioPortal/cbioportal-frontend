import * as React from 'react';
import exposeComponentRenderer from 'shared/lib/exposeComponentRenderer';
import * as styles_any from './styles.module.scss';
import {FlexCol, FlexRow} from "../../shared/components/flexbox/FlexBox";
import {observer} from "mobx-react";
import DevTools from "mobx-react-devtools";
import {toJS, observable, action, computed, whyRun, expr} from "mobx";
import LabeledCheckbox from "../../shared/components/labeledCheckbox/LabeledCheckbox";
import ReactSelect from 'react-select';
import 'react-select/dist/react-select.css';
import QueryAndDownloadTabs from "../../shared/components/query/QueryAndDownloadTabs";
import {QueryStore} from "../../shared/components/query/QueryStore";

function getRootElement()
{
	for (let node of document.childNodes)
		if (node instanceof HTMLElement)
			return node;
	throw new Error("No HTMLElement found");
}

const styles = styles_any as {
	HomePage: string,
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

	store = new QueryStore(window.location.href);

	public componentDidMount()
	{
		this.exposeComponentRenderersToParentScript();
	}

	exposeComponentRenderersToParentScript()
	{
		exposeComponentRenderer('renderQueryContainer', QueryAndDownloadTabs);
	}

	public render()
	{
		return (
			<FlexRow padded flex={1} className={styles.HomePage}>
				<QueryAndDownloadTabs store={this.store}/>
			</FlexRow>
		);
	}
}
