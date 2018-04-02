import * as _ from "lodash";
import * as React from "react";
import CancerStudySelector from "./CancerStudySelector";
import {FlexRow, FlexCol} from "../flexbox/FlexBox";
import * as styles_any from './styles/styles.module.scss';
import classNames from 'classnames';
import MolecularProfileSelector from "./MolecularProfileSelector";
import {observable, computed, action} from 'mobx';
import {observer} from "mobx-react";
import DataTypePrioritySelector from "./DataTypePrioritySelector";
import GenesetsSelector from "./GenesetsSelector";
import GeneSetSelector from "./GeneSetSelector";
import LabeledCheckbox from "../labeledCheckbox/LabeledCheckbox";
import {QueryStore} from "./QueryStore";
import {providesStoreContext} from "../../lib/ContextUtils";
import AppConfig from "appConfig";
import CaseSetSelector from "./CaseSetSelector";
import OverlappingStudiesWarning from "../overlappingStudiesWarning/OverlappingStudiesWarning";
import UnknownStudiesWarning from "../unknownStudies/UnknownStudiesWarning"

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
	constructor(){

		super();

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
	

    render():JSX.Element
    {
        // {Remove until #3395 is implemented
        //
        //    <OverlappingStudiesWarning studies={this.store.selectedStudies}/>
        //}
        return (
			<FlexCol padded overflow className={styles.QueryContainer}>
                {
                    <UnknownStudiesWarning ids={this.store.unknownStudyIds} />
                }

				<CancerStudySelector/>

				{this.store.isVirtualStudyQuery ?
					(<DataTypePrioritySelector/>) :
					(<MolecularProfileSelector/>)
				}

				{(this.store.selectedStudyIds.length > 0) && (
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
					{!!(this.store.forDownloadTab && AppConfig.genomespaceEnabled) && (
						<button disabled={!this.store.submitEnabled} className={styles.genomeSpace} onClick={ ()=>this.store.sendToGenomeSpace() }>
							Send to GenomeSpace
						</button>
					)}
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
			</FlexCol>
        );
    }
}
