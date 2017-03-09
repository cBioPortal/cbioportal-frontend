import * as _ from "lodash";
import * as React from "react";
import Spinner from "react-spinkit";
import Dictionary = _.Dictionary;
import CancerStudySelector from "./CancerStudySelector";
import {FlexRow, FlexCol} from "../flexbox/FlexBox";
import * as styles_any from './styles.module.scss';
import GeneticProfileSelector from "./GeneticProfileSelector";
import {observer} from "mobx-react";
import queryStore from "./QueryStore";
import DataTypePrioritySelector from "./DataTypePrioritySelector";
import GeneSetSelector from "./GeneSetSelector";
import SampleListSelector from "./SampleListSelector";
import MutSigGeneSelector from "./MutSigGeneSelector";
import GisticGeneSelector from "./GisticGeneSelector";
import PopupWindow from "../popupWindow/PopupWindow";
import AsyncStatus from "../asyncStatus/AsyncStatus";
import LabeledCheckbox from "../labeledCheckbox/LabeledCheckbox";

const styles = styles_any as {
	QueryContainer: string,
	queryContainerContent: string,
	MutSigGeneSelectorWindow: string,
	GisticGeneSelectorWindow: string,
	downloadSubmitExplanation: string,
	transposeDataMatrix: string,
	submitRow: string,
	submit: string,
	genomeSpace: string,
	errorMessage: string,
};

@observer
export default class QueryContainer extends React.Component<{}, {}>
{
	get store()
	{
		return queryStore;
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
					<SampleListSelector/>
				)}

				{!!(!this.store.singleSelectedStudyId) && (
					<DataTypePrioritySelector/>
				)}

				<GeneSetSelector/>

				{!!(this.store.showMutSigPopup) && (
					<PopupWindow
						className={styles.MutSigGeneSelectorWindow}
						windowTitle="Recurrently Mutated Genes"
						onClickClose={() => this.store.showMutSigPopup = false}
					>
						<MutSigGeneSelector
							initialSelection={this.store.geneIds}
							data={this.store.mutSigForSingleStudy.result}
							onSelect={map_geneSymbol_selected => {
								this.store.applyGeneSelection(map_geneSymbol_selected);
								this.store.showMutSigPopup = false;
							}}
						/>
					</PopupWindow>
				)}

				{!!(this.store.showGisticPopup) && (
					<PopupWindow
						className={styles.GisticGeneSelectorWindow}
						windowTitle="Recurrent Copy Number Alterations (Gistic)"
						onClickClose={() => this.store.showGisticPopup = false}
					>
						<GisticGeneSelector
							initialSelection={this.store.geneIds}
							data={this.store.gisticForSingleStudy.result}
							onSelect={map_geneSymbol_selected => {
								this.store.applyGeneSelection(map_geneSymbol_selected);
								this.store.showGisticPopup = false;
							}}
						/>
					</PopupWindow>
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
					<button className={styles.submit} onClick={() => this.store.submit()}>
						Submit
					</button>
					{!!(this.store.forDownloadTab) && (
						//<script src="https://gsui.genomespace.org/jsui/upload/gsuploadwindow.js" type="text/javascript"></script>
						<button className={styles.genomeSpace}>
							Send to GenomeSpace
						</button>
					)}
				</FlexRow>
			</FlexCol>
        );
    }
}
