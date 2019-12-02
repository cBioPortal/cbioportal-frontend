import * as React from 'react';
import {map} from 'lodash';
import SampleManager from 'pages/patientView/SampleManager';
import { ClinicalDataBySampleId } from 'shared/api/api-types-extended';
import TumorColumnFormatter from 'pages/patientView/mutation/column/TumorColumnFormatter';

interface PanelColumnFormatterProps {
	data: {sampleId:string, entrezGeneId:number}[];
	sampleToGenePanelId: {[sampleId: string]: string|undefined};
	sampleManager: SampleManager|null;
	genePanelIdToGene: {[genePanelId: string]: number[]}
}

class PanelColumn extends React.Component<PanelColumnFormatterProps, {}> {
	constructor(props: PanelColumnFormatterProps) {
		super(props);
	}

	render() {
		const { sampleToGenePanelId, sampleManager } = this.props;
    if (!sampleToGenePanelId || !sampleManager) return;

		if (sampleToGenePanelId && !Object.keys(sampleToGenePanelId).length) {
			return <i className='fa fa-spinner fa-pulse' />;
		}

		const genePanelIds: string[] = getGenePanelIds(this.props);

		return (
			<div style={{ position: 'relative' }}>
				<ul style={{ marginBottom: 0 }} className='list-inline list-unstyled'>
					{genePanelIds.join(', ')}
				</ul>
			</div>
		);
	}
}

const getGenePanelIds = (props:PanelColumnFormatterProps) => {
	const { data, sampleToGenePanelId, sampleManager, genePanelIdToGene } = props;
  if (sampleToGenePanelId && sampleManager) {
		const samples =  sampleManager.samples;
		const sampleIds = map(samples, (sample:ClinicalDataBySampleId) => sample.id)
		const entrezGeneId = data[0].entrezGeneId;
		const mutatedSamples = TumorColumnFormatter.getPresentSamples(data);
		const profiledSamples = TumorColumnFormatter.getProfiledSamplesForGene(entrezGeneId, sampleIds, sampleToGenePanelId, genePanelIdToGene);
		
		const genePanelsIds = samples.map(sample => {
			const isMutated = sample.id in mutatedSamples;
			const isProfiled = sample.id in profiledSamples && profiledSamples[sample.id];
			if (isProfiled && !isMutated) return "";
			return sampleToGenePanelId[sample.id] || "N/A";
		});
		
		return genePanelsIds.filter(id => id);
  }
  return [];
};

export default {
	renderFunction: (
		props:PanelColumnFormatterProps
	) => (
		<PanelColumn
			data={props.data}
			sampleToGenePanelId={props.sampleToGenePanelId}
			sampleManager={props.sampleManager}
			genePanelIdToGene={props.genePanelIdToGene}
		/>
	),
	download: (
		props:PanelColumnFormatterProps) => getGenePanelIds(props),
	getGenePanelIds
};
