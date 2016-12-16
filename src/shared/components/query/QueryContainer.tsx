import * as _ from "lodash";
import * as React from "react";
import * as ReactBootstrap from 'react-bootstrap';
import QueryConnector, {QueryData} from "./QueryConnector";
import Spinner from "react-spinkit";
import Dictionary = _.Dictionary;
import CancerStudySelector from "./CancerStudySelector";
import {ICancerStudySelectorState} from "./CancerStudySelector";
import {FlexRow, FlexCol} from "../flexbox/FlexBox";
import Radio = ReactBootstrap.Radio;
import {ICancerStudySelectorExperimentalOptions} from "./CancerStudySelector";
import Checkbox = ReactBootstrap.Checkbox;
import {Select, StateToggle} from "../ExperimentalControls";
import * as styles_any from './styles.module.scss';
import firstDefinedValue from "../../lib/firstDefinedValue";

const styles = styles_any as {
	QueryContainer: string,
	CancerStudySelector: string,
};

export interface IQueryContainerProps
{
    data?: QueryData,

    loadQueryData?: () => void,
}

export type IQueryContainerState = {
	searchText?:string;
} & ICancerStudySelectorExperimentalOptions & ICancerStudySelectorState;

@QueryConnector.decorator
export default class QueryContainer extends React.Component<IQueryContainerProps, IQueryContainerState>
{
    constructor(props:IQueryContainerProps)
    {
        super(props);
        this.state = {};
    }

    componentDidMount()
    {
        if (this.props.loadQueryData)
            this.props.loadQueryData();
    }

    // for demo only
    onStateChange = (selectionState: ICancerStudySelectorState) =>
    {
        this.setState(selectionState);
    }

    render():JSX.Element
    {
        if (this.props.data && this.props.data.status == 'fetching')
            return <Spinner/>;
        if (!this.props.data || !this.props.data.cancerTypes || !this.props.data.studies)
            return <span>No data</span>;

        return (
            <FlexCol padded flex={1} className={styles.QueryContainer}>

                <CancerStudySelector
                    cancerTypes={this.props.data.cancerTypes}
                    studies={this.props.data.studies}
                    onStateChange={this.onStateChange}
                    showStudiesInTree={this.state.showStudiesInTree}
					{...this.state}
                />

                <FlexRow padded>
					{/* demo controls */}
                	<FlexCol className={styles.CancerStudySelector} padded style={{border: '1px solid #ddd', borderRadius: 5, padding: 5}}>
						<label>
							Filter cancer studies: <input onChange={(event:React.FormEvent) => {
								this.setState({
									searchText: (event.target as HTMLInputElement).value,
									selectedCancerTypeIds: [],
								})
							}}/>
						</label>
                		<StateToggle label='Show all studies when nothing is selected' target={this} name='showAllStudiesByDefault' defaultValue={!!CancerStudySelector.defaultProps.showAllStudiesByDefault}/>
                		<StateToggle label='Show root node ("All")' target={this} name='showRoot' defaultValue={!!CancerStudySelector.defaultProps.showRoot}/>
                		<StateToggle label='Click tree node again to deselect' target={this} name='clickAgainToDeselectSingle' defaultValue={!!CancerStudySelector.defaultProps.clickAgainToDeselectSingle}/>
                		<StateToggle label='Filter studies list by tree checkboxes' target={this} name='filterBySelection' defaultValue={!!CancerStudySelector.defaultProps.filterBySelection}/>
                		<StateToggle label='Show studies in tree' target={this} name='showStudiesInTree' defaultValue={!!CancerStudySelector.defaultProps.showStudiesInTree}/>
						<Select
							label="Tree depth: "
							selected={firstDefinedValue(this.state.maxTreeDepth, CancerStudySelector.defaultProps.maxTreeDepth)}
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
							onChange={option => this.setState({
								maxTreeDepth: parseInt(option.label)
							})}
						/>
						<span>Note: Use cmd+click tree node arrow to expand/collapse entire subtree.</span>
						{
							this.state.filterBySelection || this.state.showStudiesInTree
							?   <span>&nbsp;</span>
							:   <span>Note: Use cmd+click to select/deselect multiple tree nodes.</span>
						}
					</FlexCol>

					{/* display state for demo */}
					<pre style={{flex: 1, height: 200}}>
						{
							JSON.stringify({
								selectedCancerTypeIds: this.state.selectedCancerTypeIds,
								selectedStudyIds: this.state.selectedStudyIds,
							}, null, 4)
						}
					</pre>
				</FlexRow>

            </FlexCol>
        );
    }
}
