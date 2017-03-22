import * as _ from "lodash";
import * as React from "react";
import CancerStudySelector from "./CancerStudySelector";
import {FlexRow, FlexCol} from "../flexbox/FlexBox";
import * as styles_any from './styles.module.scss';
import classNames from 'classnames';
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
import AsyncStatus from "../asyncStatus/AsyncStatus";

const styles = styles_any as {
	QueryContainer: string,
	queryContainerContent: string,
	errorMessage: string,
	downloadSubmitExplanation: string,
	transposeDataMatrix: string,
	submitRow: string,
	submit: string,
	genomeSpace: string,
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

				{!!(this.store.submitError) && (
					<span className={styles.errorMessage}>
						{this.store.submitError}
					</span>
				)}

				<FlexRow padded className={styles.submitRow}>
					<button disabled={!this.store.submitEnabled} className={classNames('cta', styles.submit)} onClick={() => this.store.submit()}>
						Submit
					</button>
					{!!(this.store.forDownloadTab && AppConfig.genomespaceEnabled) && (
						<button disabled={!this.store.submitEnabled} className={styles.genomeSpace} onClick={() => this.store.sendToGenomeSpace()}>
							Send to GenomeSpace
						</button>
					)}
				</FlexRow>
			</FlexCol>
        );
    }
}
