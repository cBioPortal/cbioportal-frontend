import * as React from 'react';
import exposeComponentRenderer from 'shared/lib/exposeComponentRenderer';
import QueryContainerOld from "../../shared/components/query/old/QueryContainer";
import QueryContainer from "../../shared/components/query/QueryContainer";
import * as styles_any from './styles.module.scss';
import {FlexCol, FlexRow} from "../../shared/components/flexbox/FlexBox";
import devMode from "../../shared/lib/devMode";
import {observer} from "../../../node_modules/mobx-react/index";
import DevTools from "../../../node_modules/mobx-react-devtools/index";
import {toJS, observable, action, computed, whyRun, expr} from "../../../node_modules/mobx/lib/mobx";
import queryStore from "../../shared/components/query/QueryStore";
import {Select, StateToggle} from "../../shared/components/ExperimentalControls";

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

    public componentDidMount() {
      this.exposeComponentRenderersToParentScript();
    }

    exposeComponentRenderersToParentScript() {
        exposeComponentRenderer('renderQueryContainer', QueryContainer);
    }

	@observable selectorVersion:'new'|'old' = 'new';

    public render()
    {
    	let selectorVersionToggle = (
    		<a style={{alignSelf: 'center'}} onClick={() => this.selectorVersion = this.selectorVersion == 'new' ? 'old' : 'new' }>
    			Switch to {this.selectorVersion == 'new' ? 'old' : 'new'} view
    		</a>
		);

    	if (this.selectorVersion == 'old')
			return (
				<FlexCol className={styles.HomePage}>
					<QueryContainerOld/>
					{selectorVersionToggle}
				</FlexCol>
			);

        return (
			<FlexRow padded flex={1} className={styles.HomePage}>

				<QueryContainer/>

				{!!(devMode.enabled) && (
					<FlexCol padded overflow>
						{/* demo controls */}
						<FlexCol padded style={{border: '1px solid #ddd', borderRadius: 5, padding: 5}}>
							<StateToggle label='Click tree node again to deselect' target={this.store} name='clickAgainToDeselectSingle' defaultValue={this.store.clickAgainToDeselectSingle}/>
							<Select
								label="Tree depth: "
								selected={this.store.maxTreeDepth}
								options={[
									{label: "0"},
									{label: "1"},
									{label: "2"},
									{label: "3"},
									{label: "4"},
									{label: "5"},
									{label: "6"},
									{label: "7"},
									{label: "8"},
									{label: "9"},
								]}
								onChange={option => this.store.maxTreeDepth = parseInt(option.label)}
							/>
							<span>Note: Use cmd+click to select/deselect multiple cancer types.</span>
						</FlexCol>

						{/* display state for demo */}
						<pre>
							{JSON.stringify(this.store.stateToSerialize, null, 4)}
						</pre>

						{/*devMode.enabled && selectorVersionToggle*/}

					</FlexCol>
				)}

				{devMode.enabled && <DevTools/>}

			</FlexRow>
		);
    }
}
