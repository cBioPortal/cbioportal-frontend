import * as React from "react";
import CancerStudySelector from "./CancerStudySelector";
import {FlexCol, FlexRow} from "../flexbox/FlexBox";
import * as styles_any from "./styles/styles.module.scss";
import MolecularProfileSelector from "./MolecularProfileSelector";
import {observer} from "mobx-react";
import DataTypePrioritySelector from "./DataTypePrioritySelector";
import GenesetsSelector from "./GenesetsSelector";
import GeneSetSelector from "./GeneSetSelector";
import LabeledCheckbox from "../labeledCheckbox/LabeledCheckbox";
import {QueryStore} from "./QueryStore";
import {providesStoreContext} from "../../lib/ContextUtils";
import CaseSetSelector from "./CaseSetSelector";
import UnknownStudiesWarning from "../unknownStudies/UnknownStudiesWarning";
import classNames from 'classnames';
import LoadingIndicator from "../loadingIndicator/LoadingIndicator";
import { computed } from "mobx";
import { If, Then, Else } from "react-if";

const styles = styles_any as {
	QueryContainer: string,
	queryContainerContent: string,
	errorMessage: string,
	oqlMessage: string,
	downloadSubmitExplanation: string,
	transposeDataMatrix: string,
	submitRow: string,
	submit: string,
	genomeSpace: string,
};

interface QueryContainerProps
{
	store:QueryStore;
	onSubmit?:()=>void;
}

@providesStoreContext(QueryStore)
@observer
export default class QueryContainer extends React.Component<QueryContainerProps, {}>
{
	constructor(props:QueryContainerProps){

		super(props);

		this.handleSubmit = this.handleSubmit.bind(this);
	}

	get store()
	{
		return this.props.store;
	}

	handleSubmit(){
		this.store.submit();
		if (this.props.onSubmit) {
			this.props.onSubmit();
		}
	}

	// indicates we have loaded the study data necessary to show default selected studies (e.g. modify query scenario), studiesHaveChangedSinceInitialization indicates all data is ready and we don't need to consider other conditions anymore.
	@computed get studiesDataReady() : boolean {
		return this.store.studiesHaveChangedSinceInitialization || this.store.selectableSelectedStudyIds.length > 0 && this.store.initiallySelected.profileIds && this.store.cancerTypes.isComplete && this.store.cancerStudies.isComplete && this.store.profiledSamplesCount.isComplete;
	}
	
    render():JSX.Element
    {
        // {Remove until #3395 is implemented
        //
        //    <OverlappingStudiesWarning studies={this.store.selectedStudies}/>
        //}
        return (
			<FlexCol padded overflow className={classNames('small', styles.QueryContainer)}>
				{/*{this.store.forQuickTab && */}
					{/*<div>*/}
						{/*<QuickSearch/>*/}
						{/*<div style={{paddingTop: 25}}>*/}
							{/*<HomePageSummary/>*/}
						{/*</div>*/}
					{/*</div>*/}
				{/*}*/}
                {
					this.store.unknownStudyIds.isComplete &&
                    <UnknownStudiesWarning ids={this.store.unknownStudyIds.result} />
                }

				{   
					<If condition={this.store.defaultSelectedIds.size === 0 || this.studiesDataReady}>
						<Then>
							<CancerStudySelector queryStore={this.store}/>

							{this.store.physicalStudyIdsInSelection.length > 1 ?
								(<DataTypePrioritySelector/>) :
								(<MolecularProfileSelector/>)
							}

							{(this.store.selectableSelectedStudyIds.length > 0) && (
								<CaseSetSelector/>
							)}

							<GeneSetSelector/>

							{!! (this.store.isGenesetProfileSelected) && (
								<GenesetsSelector/>
							)}

							{!!(this.store.forDownloadTab) && (
								<span className={styles.downloadSubmitExplanation}>
									Clicking submit will generate a tab-delimited file containing your requested data.
								</span>
							)}

							{!!(this.store.forDownloadTab) && (
								<LabeledCheckbox
									labelProps={{className: styles.transposeDataMatrix}}
									checked={this.store.transposeDataMatrix}
									onChange={event => this.store.transposeDataMatrix = event.currentTarget.checked}
								>
									Transpose data matrix
								</LabeledCheckbox>
							)}
							<FlexRow padded className={styles.submitRow}>
								<button style={{paddingLeft:50, paddingRight:50, marginRight:50 }} disabled={!this.store.submitEnabled} className="btn btn-primary btn-lg" onClick={() => this.handleSubmit()} data-test='queryButton'>
									{!this.store.forDownloadTab ? "Submit Query": "Download"}
								</button>
								<FlexCol>
									{!!(this.store.submitError) && (
										<span className={styles.errorMessage} data-test="oqlErrorMessage">
										{this.store.submitError}
									</span>
									)}

									{this.store.oqlMessages.map(msg=>{
										return (
											<span className={styles.oqlMessage}>
												<i className='fa fa-info-circle' style={{marginRight: 5}}/>
												{msg}
											</span>
										);
									})}
								</FlexCol>
							</FlexRow>
						</Then>
						<Else>
							<LoadingIndicator isLoading={true} center={true} size={"big"}/>
						</Else>
					</If>
				}
			</FlexCol>
        );
    }
}
