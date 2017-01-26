import * as _ from "lodash";
import * as React from "react";
import * as ReactBootstrap from 'react-bootstrap';
import Spinner from "react-spinkit";
import Dictionary = _.Dictionary;
import CancerStudySelector from "./CancerStudySelector";
import {FlexRow, FlexCol} from "../flexbox/FlexBox";
import Radio = ReactBootstrap.Radio;
import Checkbox = ReactBootstrap.Checkbox;
import {Select, StateToggle} from "../ExperimentalControls";
import * as styles_any from './styles.module.scss';
import firstDefinedValue from "../../lib/firstDefinedValue";
import GeneticProfileSelector from "./GeneticProfileSelector";
import {IGeneticProfileSelectorState} from "./GeneticProfileSelector";
import {observer} from "../../../../node_modules/mobx-react/custom";
import queryStore from "./QueryStore";
import DevTools from "../../../../node_modules/mobx-react-devtools/index";
import devMode from "../../lib/devMode";

const styles = styles_any as {
	QueryContainer: string,
	CancerStudySelector: string,
};

export interface IQueryContainerProps
{
}

export type IQueryContainerState = {
} & IGeneticProfileSelectorState;

@observer
export default class QueryContainer extends React.Component<IQueryContainerProps, IQueryContainerState>
{
    constructor(props:IQueryContainerProps)
    {
        super(props);
        this.state = {};
    }

    render():JSX.Element
    {
        if (queryStore.cancerTypes.status == 'fetching' || queryStore.cancerStudies.status == 'fetching')
            return <Spinner/>;
        if (!queryStore.cancerTypes.result || !queryStore.cancerStudies.result)
            return <span>No data</span>;

        return (
            <FlexCol padded flex={1} className={styles.QueryContainer}>

                <CancerStudySelector/>

				{!!(devMode && queryStore.geneticProfiles.result) && (
					<GeneticProfileSelector
						profiles={queryStore.geneticProfiles.result}
						selectedProfileIds={this.state.selectedProfileIds}
					/>
				)}

				{!!(devMode) && (
					<FlexRow padded>
						{/* demo controls */}
						<FlexCol className={styles.CancerStudySelector} padded style={{border: '1px solid #ddd', borderRadius: 5, padding: 5}}>
							<StateToggle label='Click tree node again to deselect' target={queryStore} name='clickAgainToDeselectSingle' defaultValue={queryStore.clickAgainToDeselectSingle}/>
							<Select
								label="Tree depth: "
								selected={queryStore.maxTreeDepth}
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
								onChange={option => queryStore.maxTreeDepth = parseInt(option.label)}
							/>
							<span>Note: Use cmd+click to select/deselect multiple cancer types.</span>
						</FlexCol>

						{/* display state for demo */}
						<pre style={{flex: 1, height: 200}}>
							{
								JSON.stringify({
									selectedCancerTypeIds: queryStore.selectedCancerTypeIds,
									selectedStudyIds: queryStore.selectedCancerStudyIds,
								}, null, 4)
							}
						</pre>
					</FlexRow>
				)}

				{devMode && <DevTools/>}

            </FlexCol>
        );
    }
}
