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
import GeneticProfileSelector from "./GeneticProfileSelector";
import {observer} from "../../../../node_modules/mobx-react/index";
import queryStore from "./QueryStore";
import devMode from "../../lib/devMode";
import DataTypePrioritySelector from "./DataTypePrioritySelector";
import GeneSetSelector from "./GeneSetSelector";
import SampleListSelector from "./SampleListSelector";
import MutSigGeneSelector from "./MutSigGeneSelector";
import GisticGeneSelector from "./GisticGeneSelector";
import PopupWindow from "../popupWindow/PopupWindow";

const styles = styles_any as {
	QueryContainerParent: string,
	QueryContainer: string,
	MutSigGeneSelectorWindow: string,
	GisticGeneSelectorWindow: string,
	SubmitButton: string,
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
        if (this.store.cancerTypes.isPending || this.store.cancerStudies.isPending)
            return <Spinner/>;

        let error = this.store.cancerTypes.error
        	|| this.store.cancerStudies.error
        	|| this.store.geneticProfiles.error
        	|| this.store.sampleLists.error
        	|| this.store.mutSigForSingleStudy.error
        	|| this.store.gisticForSingleStudy.error
        	|| this.store.genes.error;
        if (error)
			return <span className={styles.errorMessage}>{`Error: ${error}`}</span>;


        if (!this.store.cancerTypes.result.length || !this.store.cancerStudies.result.length)
            return <span>No data</span>;

        return (
			<FlexCol padded overflow className={styles.QueryContainer}>
				<CancerStudySelector/>

				{!!(devMode.enabled && this.store.singleSelectedStudyId) && (
					<GeneticProfileSelector/>
				)}

				{!!(devMode.enabled && this.store.singleSelectedStudyId) && (
					<SampleListSelector/>
				)}

				{!!(devMode.enabled && !this.store.singleSelectedStudyId) && (
					<DataTypePrioritySelector/>
				)}

				{!!(devMode.enabled) && (
					<GeneSetSelector/>
				)}

				{!!(devMode.enabled && this.store.showMutSigPopup) && (
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

				{!!(devMode.enabled && this.store.showGisticPopup) && (
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

				{!!(devMode.enabled) && (
					<button className={styles.SubmitButton}>
						Submit
					</button>
				)}
			</FlexCol>
        );
    }
}
