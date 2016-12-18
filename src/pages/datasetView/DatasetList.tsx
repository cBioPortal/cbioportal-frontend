import * as React from "react";
import * as _ from 'lodash';
import { Table, unsafe }  from 'reactableMSK';
import Connector from './Connector';
import { CancerStudy }  from 'shared/api/CBioPortalAPI';
import Spinner from "react-spinkit";
import exposeComponentRenderer from 'shared/lib/exposeComponentRenderer';


export interface IDatasetPageUnconnectedProps {

    datasets?:Array<CancerStudy> | null;
    loadDatasetsInfo?:void;

};

class CancerStudyCell extends React.Component<{ data:any },{}> {

    render(){
        return (
            <span>
                <a href={`http://www.cbioportal.org/study?id=${ this.props.data.cancerStudyIdentifier }#summary`}
                    target='_blank' >{ this.props.data.name }</a>
                <a href={`https://github.com/cBioPortal/datahub/blob/master/public/${ this.props.data.cancerStudyIdentifier }.tar.gz`} download><i class='fa fa-download'></i></a>
            </span>
        );

    }

}

class ReferenceCell extends React.Component<{ data:any },{}> {

    render(){
        return (
            <a target='_blank' href={`https://www.ncbi.nlm.nih.gov/pubmed/${ this.props.data.pmid }`}>{ this.props.data.citation }</a>
        );

    }

}




@Connector.decorator
export default class DataSetPageUnconnected extends React.Component<IDatasetPageUnconnectedProps, {}> {


    componentDidMount() {

        this.props.loadDatasetsInfo();

    }

    render() {
        if (this.props.datasets) {
            const rows: Array<any> = [];

            let sortedDatasets: Array<CancerStudy> = _.sortBy(this.props.datasets, 'name');

            sortedDatasets.forEach((item: CancerStudy) => {
                const tempObj: any = {
                    CancerStudy:  { cancerStudyIdentifier: item.cancerStudyIdentifier, name: item.name },
                    Reference: { pmid:item.pmid, citation:item.citation },
                    All: item.allSampleCount,
                    Sequenced: item.sequencedSampleCount,
                    CNA: item.cnaSampleCount,
                    "Tumor mRNA (RNA-Seq V2)": item.mrnaRnaSeqV2SampleCount,
                    "Tumor mRNA (microarray)": item.mrnaMicroarraySampleCount,
                    "Tumor miRNA": item.miRnaSampleCount,
                    "Methylation (HM27)": item.methylationHm27SampleCount,
                    RPPA: item.rppaSampleCount,
                    Complete: item.completeSampleCount
                };
                rows.push(tempObj);
            });

            return <Table
                          className="table"
                          data={rows}
                          sortable={true}
                          columnFormatters={{ CancerStudy: CancerStudyCell, Reference: ReferenceCell }}
            />;
        } else {
            return <div><Spinner spinnerName="three-bounce" /></div>;;
        }
    }
}
;



