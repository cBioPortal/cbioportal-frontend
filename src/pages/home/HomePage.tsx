import * as React from 'react';
import exposeComponentRenderer from 'shared/lib/exposeComponentRenderer';
import QueryContainer from "../../shared/components/query/QueryContainer";
import * as styles_any from './styles.module.scss';
import {FlexCol, FlexRow} from "../../shared/components/flexbox/FlexBox";
import devMode from "../../shared/lib/devMode";
import {observer} from "mobx-react";
import DevTools from "mobx-react-devtools";
import {toJS, observable, action, computed, whyRun, expr} from "mobx";
import queryStore from "../../shared/components/query/QueryStore";
import LabeledCheckbox from "../../shared/components/labeledCheckbox/LabeledCheckbox";
import ReactSelect from 'react-select';

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

	get store() { return queryStore; }

	public componentDidMount()
	{
	  this.exposeComponentRenderersToParentScript();
	}

	exposeComponentRenderersToParentScript()
	{
		exposeComponentRenderer('renderQueryContainer', QueryContainer);
	}

	public render()
	{
		return (
			<FlexRow padded flex={1} className={styles.HomePage}>

				<QueryContainer/>

				{!!(devMode.enabled) && (
					<FlexCol padded overflow>
						{/* demo controls */}
						<FlexCol padded overflow style={{border: '1px solid #ddd', borderRadius: 5, padding: 5}}>
							<LabeledCheckbox checked={this.store.clickAgainToDeselectSingle} onChange={event => this.store.clickAgainToDeselectSingle = event.target.checked}>
								Click tree node again to deselect
							</LabeledCheckbox>
							<FlexRow padded overflow>
								<span>Tree depth:</span>
								<ReactSelect

									value={this.store.maxTreeDepth}
									options={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => ({value: n, label: n}))}
									onChange={(option:{value:number}) => this.store.maxTreeDepth = option.value}
								/>
							</FlexRow>
							<span>Note: Use cmd+click to select/deselect multiple cancer types.</span>
						</FlexCol>

						{/* display state for demo */}
						<pre>
							{JSON.stringify(this.store.stateToSerialize, null, 4)}
						</pre>

					</FlexCol>
				)}

				{devMode.enabled && <DevTools/>}

			</FlexRow>
		);
	}
}
