import * as _ from "lodash";
import * as React from "react";
import CancerStudySelector from "./CancerStudySelector";
import {FlexRow, FlexCol} from "../flexbox/FlexBox";
import * as styles_any from './styles.module.scss';
import classNames from "../../lib/classNames";
import GeneticProfileSelector from "./GeneticProfileSelector";
import {observable, computed, action} from 'mobx';
import {observer} from "mobx-react";
import DataTypePrioritySelector from "./DataTypePrioritySelector";
import GeneSetSelector from "./GeneSetSelector";
import LabeledCheckbox from "../labeledCheckbox/LabeledCheckbox";
import {QueryStore} from "./QueryStore";
import {providesStoreContext} from "../../lib/ContextUtils";
import AppConfig from "appConfig";
import CaseSetSelector from "./CaseSetSelector";

const styles = styles_any as {
	QueryContainer: string,
	queryContainerContent: string,
	downloadSubmitExplanation: string,
	transposeDataMatrix: string,
	submitRow: string,
	submit: string,
	genomeSpace: string,
	errorMessage: string,
};

interface QueryContainerProps
{
	store:QueryStore;
}

@providesStoreContext(QueryStore)
@observer
export default class QueryContainer extends React.Component<QueryContainerProps, {}>
{
	get store()
	{
		return this.props.store;
	}

    render():JSX.Element
    {
        let error = this.store.cancerTypes.error
        	|| this.store.cancerStudies.error
        	|| this.store.geneticProfiles.error
        	|| this.store.sampleLists.error
        	|| this.store.mutSigForSingleStudy.error
        	|| this.store.gisticForSingleStudy.error
        	|| this.store.genes.error;
        if (error)
			return <span className={styles.errorMessage}>{error.toString()}</span>;

        return (
			<FlexCol padded overflow className={styles.QueryContainer}>
				<CancerStudySelector/>

				{!!(this.store.singleSelectedStudyId) && (
					<GeneticProfileSelector/>
				)}

				{!!(this.store.singleSelectedStudyId) && (
					<CaseSetSelector/>
				)}

				{!!(!this.store.singleSelectedStudyId) && (
					<DataTypePrioritySelector/>
				)}

				<GeneSetSelector/>

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
					<button className={classNames('cta', styles.submit)} onClick={() => this.store.submit()}>
						Submit
					</button>
					{!!(this.store.forDownloadTab && AppConfig.genomespaceEnabled) && (
						<button className={styles.genomeSpace} onClick={() => this.store.sendToGenomeSpace()}>
							Send to GenomeSpace
						</button>
					)}
				</FlexRow>
			</FlexCol>
        );
    }
}
