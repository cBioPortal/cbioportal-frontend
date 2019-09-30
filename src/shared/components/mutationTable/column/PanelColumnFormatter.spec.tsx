import PanelColumnFormatter from './PanelColumnFormatter';
import { shallow } from 'enzyme';
import { assert } from 'chai';
import SampleManager from 'pages/patientView/SampleManager';

const mockData = [
  {
    alteration: 1,
    entrezGeneId: 1,
    gene: { 
      entrezGeneId: 1, 
      hugoGeneSymbol: 'test', 
      geneticEntityId: 1, 
      type: 'test'
    },
    molecularProfileId: 'test',
    patientId: 'test',
    sampleId: 'sampleId',
    studyId: 'test',
    uniquePatientKey: 'test',
    uniqueSampleKey: 'test',
  }
];

const mockSamples = [
  { id: 'sampleId', clinicalData: [] }
]

const mockSampleToGenePanelId = { 'sampleId': 'genePanelId' };
const mockGenePanelIdToGene = { 'genePanelId': [1] };
const mockSampleManager = new SampleManager(mockSamples);

const mock = {
  data: mockData,
  sampleToGenePanelId: mockSampleToGenePanelId,
  sampleManager: mockSampleManager,
  genePanelIdToGene: mockGenePanelIdToGene
}

describe('PanelColumnFormatter', () => {
  it('renders spinner icon if sampleToGenePanelId object is empty', () => {
    const PanelColumn = shallow(PanelColumnFormatter.renderFunction({...mock, sampleToGenePanelId: {}}));
    assert.isTrue(PanelColumn.find('i.fa-spinner').exists());
  });
  
  it('renders gene panel information', () => {
    const PanelColumn = shallow(PanelColumnFormatter.renderFunction(mock));
    assert.isTrue(PanelColumn.text().includes('genePanelId'));
  });
  
  it('returns a list of gene panel ids on download', () => {
    const genePanelIds = PanelColumnFormatter.download(mock);
    assert.deepEqual(genePanelIds, ['genePanelId'])
  });
  
  it('returns a list of gene panel ids on getGenePanelIds', () => {
    const genePanelIds = PanelColumnFormatter.getGenePanelIds(mock);
    assert.deepEqual(genePanelIds, ['genePanelId'])
  });
})
