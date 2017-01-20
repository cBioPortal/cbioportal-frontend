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
import {observable, computed} from "../../../../node_modules/mobx/lib/mobx";
import {GeneticProfile} from "../../api/CBioPortalAPI";

const styles = styles_any as {
	QueryContainer: string,
	CancerStudySelector: string,
};

export interface IQueryContainerProps
{
    data?: QueryData,
}

export type IQueryContainerState = {
} & ICancerStudySelectorExperimentalOptions & ICancerStudySelectorState & IGeneticProfileSelectorState;

// class RemoteData<P, R, M extends (params:P)=>Promise<R>>
// {
// 	constructor(apiMethod:M)
// 	{
// 		this.params.observe(
// 	}
//
// 	@observable params:P;
// 	@observable private status:'idle'|'fetching'|'ready' = 'idle';
// 	@computed get result():R
// 	{
// 		if (observable(
// 	}
// 	@observable result:R;
// }

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
		QueryConnector.actions.loadQueryData();
    }

    // for demo only
    onStateChange = (selectionState: ICancerStudySelectorState) =>
    {
        this.setState(selectionState);
    }

    @observable store = {

	};

	@memoize
    requestGeneticProfiles(studyId:string)
    {
    	return client.getAllGeneticProfilesInStudyUsingGET({studyId})
    		.then(result => {
    			console.log('forcing update for', studyId, this.getGeneticProfiles());
    			this.forceUpdate();
    			return result;
			});
	}

	// @observable.shallow geneticProfiles:GeneticProfile[];
	getGeneticProfiles()
	{
		let studyIds = this.state.selectedStudyIds;
		if (studyIds && studyIds.length == 1)
			return getPromiseResult(this.requestGeneticProfiles(studyIds[0]), () => this.forceUpdate()) || [];
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

				{/*if*/(this.state.selectedStudyIds && this.state.selectedStudyIds.length) && (
					<GeneticProfileSelector
							profiles={this.getGeneticProfiles()}
							selectedProfileIds={this.state.selectedProfileIds}
            			/>
				)}

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
