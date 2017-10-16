import * as React from 'react';
import * as styles_any from './styles.module.scss';
import {Modal} from 'react-bootstrap';
import ReactSelect from 'react-select';
import {observer} from "mobx-react";
import {computed} from 'mobx';
import {FlexRow, FlexCol} from "../flexbox/FlexBox";
import gene_lists from './gene_lists';
import GeneSymbolValidator from "./GeneSymbolValidator";
import classNames from 'classnames';
import {getOncoQueryDocUrl} from "../../api/urls";
import {QueryStoreComponent} from "./QueryStore";
import MutSigGeneSelector from "./MutSigGeneSelector";
import GisticGeneSelector from "./GisticGeneSelector";
import SectionHeader from "../sectionHeader/SectionHeader";
import AppConfig from "appConfig";

const styles = styles_any as {
	GeneSetSelector: string,
	MutSigGeneSelectorWindow: string,
	GisticGeneSelectorWindow: string,
	buttonRow: string,
	geneSet: string,
	empty: string,
	notEmpty: string,
	sectionSpinner: string,
};

export interface GeneSetSelectorProps
{
}

@observer
export default class GeneSetSelector extends QueryStoreComponent<GeneSetSelectorProps, {}>
{
	@computed get selectedGeneListOption()
	{
		let option = this.geneListOptions.find(opt => opt.value == this.store.geneQuery);
		return option ? option.value : '';
	}

	@computed get geneListOptions()
	{
	    let geneList: {"id": string, "genes": string[]}[] = gene_lists;
	    if (AppConfig.querySetsOfGenes) {
	        geneList = AppConfig.querySetsOfGenes;
	    }

	    return [
	        {
	            label: 'User-defined List',
	            value: ''
	        },
	        ...geneList.map(item => ({
	            label: `${item.id} (${item.genes.length} genes)`,
	            value: item.genes.join(' ')
	        }))
	    ];
	}

	@computed get textAreaRef()
	{
		if (this.store.geneQueryErrorDisplayStatus === 'shouldFocus')
			return (textArea:HTMLTextAreaElement) => {
				let {error} = this.store.oql;
				if (textArea && error)
				{
					textArea.focus();
					textArea.setSelectionRange(error.start, error.end);
					this.store.geneQueryErrorDisplayStatus = 'focused';
				}
			};
	}

	render()
	{
		return (
			<FlexRow padded overflow className={styles.GeneSetSelector}>
				<SectionHeader className="sectionLabel"
							   secondaryComponent={<a target="_blank" href={getOncoQueryDocUrl()}>Advanced: Onco Query Language (OQL)</a>}
							   promises={[this.store.mutSigForSingleStudy, this.store.gisticForSingleStudy, this.store.genes]}
				>
					Enter Gene Set:
				</SectionHeader>

				<FlexCol overflow>
				<ReactSelect
					value={this.selectedGeneListOption}
					options={this.geneListOptions}
					onChange={option => this.store.geneQuery = option ? option.value : ''}
				/>

				{!!(this.store.mutSigForSingleStudy.result.length || this.store.gisticForSingleStudy.result.length) && (
					<FlexRow padded className={styles.buttonRow}>
						{!!(this.store.mutSigForSingleStudy.result.length) && (
							<button className="btn btn-default btn-sm" onClick={() => this.store.showMutSigPopup = true}>
								Select from Recurrently Mutated Genes (MutSig)
							</button>
						)}
						{!!(this.store.gisticForSingleStudy.result.length) && (
							<button className="btn btn-default btn-sm" onClick={() => this.store.showGisticPopup = true}>
								Select Genes from Recurrent CNAs (Gistic)
							</button>
						)}
					</FlexRow>
				)}

				<textarea
					ref={this.textAreaRef}
					className={classNames(styles.geneSet, this.store.geneQuery ? styles.notEmpty : styles.empty)}
					rows={5}
					cols={80}
					placeholder="Enter HUGO Gene Symbols or Gene Aliases"
					title="Enter HUGO Gene Symbols or Gene Aliases"
					value={this.store.geneQuery}
					onChange={event => this.store.geneQuery = event.currentTarget.value}
					data-test='geneSet'
				/>

				<GeneSymbolValidator/>

				<Modal
					className={classNames('cbioportal-frontend',styles.MutSigGeneSelectorWindow)}
					show={this.store.showMutSigPopup}
					onHide={() => this.store.showMutSigPopup = false}
				>
					<Modal.Header closeButton>
						<Modal.Title>Recently Mutated Genes</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<MutSigGeneSelector
							initialSelection={this.store.geneIds}
							data={this.store.mutSigForSingleStudy.result}
							onSelect={map_geneSymbol_selected => {
								this.store.applyGeneSelection(map_geneSymbol_selected);
								this.store.showMutSigPopup = false;
							}}
						/>
					</Modal.Body>
				</Modal>

				<Modal
					className={classNames('cbioportal-frontend',styles.GisticGeneSelectorWindow)}
					show={this.store.showGisticPopup}
					onHide={() => this.store.showGisticPopup = false}
				>
					<Modal.Header closeButton>
						<Modal.Title>Recurrent Copy Number Alterations (Gistic)</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						<GisticGeneSelector
							initialSelection={this.store.geneIds}
							data={this.store.gisticForSingleStudy.result}
							onSelect={map_geneSymbol_selected => {
								this.store.applyGeneSelection(map_geneSymbol_selected);
								this.store.showGisticPopup = false;
							}}
						/>
					</Modal.Body>
				</Modal>
				</FlexCol>
			</FlexRow>
		);
	}
}
