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
import GeneticProfileSelector from "./GeneticProfileSelector";
import client from "../../api/cbioportalClientInstance";
import memoize from "../../lib/memoize";
import getPromiseResult from "../../lib/getPromiseResult";
import {IGeneticProfileSelectorState} from "./GeneticProfileSelector";

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
} & ICancerStudySelectorExperimentalOptions & ICancerStudySelectorState & IGeneticProfileSelectorState;

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

	@memoize
    requestGeneticProfiles(studyId:string)
    {
    	return client.getAllGeneticProfilesInStudyUsingGET({studyId})
    		.then(result => {
    			console.log('forcing update for', studyId);
    			//this.forceUpdate();
    			return result;
			});
	}

	getGeneticProfiles()
	{
		let studyIds = this.state.selectedStudyIds;
		if (studyIds && studyIds.length == 1)
			return getPromiseResult(this.requestGeneticProfiles(studyIds[0])) || [];
		return [];
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
                	searchTextPresets={['lung', 'serous', 'tcga', 'tcga -provisional']}
                    cancerTypes={this.props.data.cancerTypes}
                    studies={this.props.data.studies}
                    onStateChange={this.onStateChange}
					{...this.state}
                />

				{/*
					this.state.selectedStudyIds && this.state.selectedStudyIds.length == 1
					?   <GeneticProfileSelector
							profiles={this.getGeneticProfiles()}
							selectedProfileIds={this.state.selectedProfileIds}
            			/>
            		:   null
				*/}

                <FlexRow padded>
					{/* demo controls */}
                	<FlexCol className={styles.CancerStudySelector} padded style={{border: '1px solid #ddd', borderRadius: 5, padding: 5}}>
                		<StateToggle label='Click tree node again to deselect' target={this} name='clickAgainToDeselectSingle' defaultValue={!!CancerStudySelector.defaultProps.clickAgainToDeselectSingle}/>
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
						<span>Note: Use cmd+click to select/deselect multiple cancer types.</span>
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
