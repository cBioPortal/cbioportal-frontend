import * as _ from 'lodash';
import * as React from 'react';
import {GeneticProfile} from "../../api/CBioPortalAPI";
import LabeledCheckbox from "../labeledCheckbox/LabeledCheckbox";
import firstDefinedValue from "../../lib/firstDefinedValue";
import FontAwesome from "react-fontawesome";
import * as styles_any from './styles.module.scss';

const styles = styles_any as {
	GeneticProfileSelector: string,
	singleCheckbox: string,
	groupCheckbox: string,
	radioGroup: string,
	radioItem: string,
	zScore: string,
	profileName: string,
};

export const DATATYPE_ZSCORE = 'Z-SCORE';
export const defaultSelectedAlterationTypes:GeneticProfile['geneticAlterationType'][] = [
	'MUTATION_EXTENDED',
	'COPY_NUMBER_ALTERATION'
];
export const geneticAlterationTypeGroupLabels:{[K in GeneticProfile['geneticAlterationType']]?: string} = {
	"MRNA_EXPRESSION": "mRNA Expression data",
};

export type IGeneticProfileSelectorProps = {
	profiles: GeneticProfile[];
	onStateChange?: (newState:IGeneticProfileSelectorState) => void;
} & IGeneticProfileSelectorState;

export interface IGeneticProfileSelectorState
{
	selectedProfileIds?: string[];
	zScoreThreshold?: string;
}

export default class GeneticProfileSelector extends React.Component<IGeneticProfileSelectorProps, IGeneticProfileSelectorState>
{
	static defaultProps:IGeneticProfileSelectorProps = {
		profiles: [],
	};

	constructor(props: IGeneticProfileSelectorProps)
	{
		super(props);
		this.state = {zScoreThreshold: '2.0'};
	}

	get selectedProfileIds()
	{
		return firstDefinedValue(this.props.selectedProfileIds, this.state.selectedProfileIds || []);
	}

	get zScoreThreshold()
	{
		return firstDefinedValue(this.props.zScoreThreshold, this.state.zScoreThreshold);
	}

	updateState(newState:IGeneticProfileSelectorState)
	{
		this.setState(newState, () => {
			if (this.props.onStateChange)
				this.props.onStateChange(this.state)
		});
	}

	componentDidMount()
	{
		this.validateState();
	}

	componentDidUpdate()
	{
		this.validateState();
	}

	validateState()
	{
		if (this.props.selectedProfileIds)
			return;

		let selectedProfileIds = this.props.profiles
			.filter(profile => _.includes(defaultSelectedAlterationTypes, profile.geneticAlterationType))
			.map(profile => profile.geneticProfileId);

		//this.updateState({selectedProfileIds});
	}

	render()
	{
		let profiles = this.props.profiles.filter(profile => profile.showProfileInAnalysisTab);
		let groupedProfiles = _.groupBy(profiles, profile => profile.geneticAlterationType);

		// puts default alteration types first
		let altTypes = _.union(
			defaultSelectedAlterationTypes,
			Object.keys(groupedProfiles).sort()
		);

		return (
			<div className={styles.GeneticProfileSelector}>
				{this.renderCheckboxes(altTypes.map(altType => groupedProfiles[altType]))}
			</div>
		);
	}

	renderCheckboxes(groupedProfiles:GeneticProfile[][])
	{
		let output:JSX.Element[] = [];
		for (let profiles of groupedProfiles)
			this.renderGroup(profiles, output);
		return output;
	}

	renderGroup(profiles:GeneticProfile[], output:JSX.Element[])
	{
		if (!profiles || !profiles.length)
			return;

		let firstProfile = profiles[0];
		let altType = firstProfile.geneticAlterationType;
		let ids = profiles.map(profile => profile.geneticProfileId);
		let checked = _.intersection(this.selectedProfileIds, ids).length > 0;
		let label = firstProfile.name;
		if (profiles.length > 1)
		{
			let groupLabel = geneticAlterationTypeGroupLabels[altType] || altType;
			label = `${groupLabel}. Select one of the profiles below:`;
		}

		output.push(
			<div className={profiles.length > 1 ? styles.groupCheckbox : styles.singleCheckbox}>
				<LabeledCheckbox
					key={output.length}
					checked={checked}
					inputProps={{
						onChange: event => this.updateState({
							selectedProfileIds: (
								(event.target as HTMLInputElement).checked
								?   _.union(this.selectedProfileIds, [ids[0]])
								:   _.difference(this.selectedProfileIds, ids)
							)
						})
					}}
				>
					{label}
				</LabeledCheckbox>

				{!!(profiles.length == 1) && (
					<FontAwesome name='question-circle' {...{alt: firstProfile.description}}/>
				)}
			</div>
		);

		if (profiles.length > 1)
		{
			output.push(
				<div className={styles.radioGroup}>
					{profiles.map(profile => (
						<div className={styles.radioItem}>
							<label>
								<input
									type='radio'
									checked={_.includes(this.selectedProfileIds, profile.geneticProfileId)}
									style={{userSelect: 'text'}}
									onChange={event => {
										if ((event.target as HTMLInputElement).checked)
											this.updateState({
												selectedProfileIds: (
													_.union(
														_.difference(this.selectedProfileIds, ids),
														[profile.geneticProfileId]
													)
												)
											})
									}}
								/>
								<span className={styles.profileName}>{profile.name}</span>
							</label>
							<FontAwesome name='question-circle' {...{alt: profile.description}}/>
						</div>
					))}
				</div>
			);
		}

		if (firstProfile.datatype == DATATYPE_ZSCORE)
		{
			output.push(
				<div className={styles.zScore} key={output.length}>
					Enter a z-score threshold ±:
					<input
						type="text"
						value={this.zScoreThreshold}
						onChange={event => {
							let zScoreThreshold = (event.target as HTMLInputElement).value;
							this.updateState({zScoreThreshold});
						}}
					/>
				</div>
			);
		}
	}
}

let sample_profiles:Partial<GeneticProfile>[] = [
  {
    "geneticAlterationType": "METHYLATION",
    "datatype": "CONTINUOUS",
    "name": "Methylation (HM450)",
    "description": "Methylation (HM450) beta-values for genes in 194 cases. For genes with multiple methylation probes, the probe most anti-correlated with expression.",
    "showProfileInAnalysisTab": false,
    "geneticProfileId": "laml_tcga_methylation_hm450",
    "studyId": "laml_tcga"
  },
  {
    "geneticAlterationType": "METHYLATION",
    "datatype": "CONTINUOUS",
    "name": "Methylation (HM27)",
    "description": "Methylation (HM27) beta-values for genes in 194 cases. For genes with multiple methylation probes, the probe most anti-correlated with expression.",
    "showProfileInAnalysisTab": false,
    "geneticProfileId": "laml_tcga_methylation_hm27",
    "studyId": "laml_tcga"
  },
  {
    "geneticAlterationType": "COPY_NUMBER_ALTERATION",
    "datatype": "CONTINUOUS",
    "name": "Relative linear copy-number values",
    "description": "Relative linear copy-number values for each gene (from Affymetrix SNP6).",
    "showProfileInAnalysisTab": false,
    "geneticProfileId": "laml_tcga_linear_CNA",
    "studyId": "laml_tcga"
  },
  {
    "geneticAlterationType": "MRNA_EXPRESSION",
    "datatype": "Z-SCORE",
    "name": "mRNA Expression z-Scores (RNA Seq V2 RSEM)",
    "description": "mRNA z-Scores (RNA Seq V2 RSEM) compared to the expression distribution of each gene tumors that are diploid for this gene.",
    "showProfileInAnalysisTab": true,
    "geneticProfileId": "laml_tcga_rna_seq_v2_mrna_median_Zscores",
    "studyId": "laml_tcga"
  },
  {
    "geneticAlterationType": "MRNA_EXPRESSION",
    "datatype": "CONTINUOUS",
    "name": "mRNA expression (RNA Seq RPKM)",
    "description": "Expression levels for 20443 genes in 179 aml cases (RNA Seq RPKM).",
    "showProfileInAnalysisTab": false,
    "geneticProfileId": "laml_tcga_rna_seq_mrna",
    "studyId": "laml_tcga"
  },
  {
    "geneticAlterationType": "MRNA_EXPRESSION",
    "datatype": "CONTINUOUS",
    "name": "mRNA expression (RNA Seq V2 RSEM)",
    "description": "Expression levels for 20532 genes in 173 aml cases (RNA Seq V2 RSEM).",
    "showProfileInAnalysisTab": false,
    "geneticProfileId": "laml_tcga_rna_seq_v2_mrna",
    "studyId": "laml_tcga"
  },
  {
    "geneticAlterationType": "MRNA_EXPRESSION",
    "datatype": "Z-SCORE",
    "name": "mRNA Expression z-Scores (RNA Seq RPKM)",
    "description": "mRNA z-Scores (RNA Seq RPKM) compared to the expression distribution of each gene tumors that are diploid for this gene.",
    "showProfileInAnalysisTab": true,
    "geneticProfileId": "laml_tcga_rna_seq_mrna_median_Zscores",
    "studyId": "laml_tcga"
  },
  {
    "geneticAlterationType": "COPY_NUMBER_ALTERATION",
    "datatype": "DISCRETE",
    "name": "Putative copy-number alterations from GISTIC",
    "description": "Putative copy-number calls on 191 cases determined using GISTIC 2.0. Values: -2 = homozygous deletion; -1 = hemizygous deletion; 0 = neutral / no change; 1 = gain; 2 = high level amplification.",
    "showProfileInAnalysisTab": true,
    "geneticProfileId": "laml_tcga_gistic",
    "studyId": "laml_tcga"
  },
  {
    "geneticAlterationType": "MUTATION_EXTENDED",
    "datatype": "MAF",
    "name": "Mutations",
    "description": "Mutation data from whole exome sequencing.",
    "showProfileInAnalysisTab": true,
    "geneticProfileId": "laml_tcga_mutations",
    "studyId": "laml_tcga"
  }
];
