import * as React from "react";
import * as _ from 'lodash';
import { Table, Tr, Td }  from 'reactableMSK';
import Connector, { DatasetDownloads } from './Connector';
import { CancerStudy }  from 'shared/api/CBioPortalAPI';
import Spinner from "react-spinkit";
import exposeComponentRenderer from 'shared/lib/exposeComponentRenderer';
import TableHeaderControls from "shared/components/tableHeaderControls/TableHeaderControls";



export interface IDatasetPageUnconnectedProps {

    datasets?:Array<CancerStudy> | null;
    loadDatasetsInfo?:void;
    status?: any;

};

class CancerStudyCell extends React.Component<{ study:CancerStudy },{}> {

    render(){
        return (
            <span>
                <a href={`http://www.cbioportal.org/study?id=${ this.props.study.studyId }#summary`}
                    target='_blank'>{ this.props.study.name }</a>&nbsp;
                <a href={`https://github.com/cBioPortal/datahub/blob/master/public/${ this.props.study.studyId }.tar.gz`} download><i className='fa fa-download'></i></a>
            </span>
        );

    }

}

class ReferenceCell extends React.Component<{ study:CancerStudy },{}> {

    render(){
        return (
            <a target='_blank' href={`https://www.ncbi.nlm.nih.gov/pubmed/${ this.props.study.pmid }`}>{ this.props.study.citation }</a>
        );

    }

}

@Connector.decorator
export default class DataSetPageUnconnected extends React.Component<IDatasetPageUnconnectedProps, { filter: string; }> {

    constructor(){
        super();
        this.state = { filter:'' };
    }

    componentDidMount() {

        this.props.loadDatasetsInfo();

    }

    buildTable(){

        if (this.props.datasets) {
            return (
                <Table
                    className="table table-striped"
                    filterable={['Name','Reference']}
                    sortable={true}
                    hideFilterInput={true}
                    defaultSort={{column: 'Name', direction: 'asc'}}
                    filterBy={this.state.filter}
                    noDataText="No matching results"
                >
                    {
                        _.map(this.props.datasets, (study: CancerStudy) => {
                            return (
                                <Tr>
                                    <Td column="Name" value={study.name}>
                                        <CancerStudyCell study={study}/>
                                    </Td>
                                    <Td column="Reference" value={study.citation}>
                                        <ReferenceCell study={study}/>
                                    </Td>
                                    <Td column="All" data={study.allSampleCount || ""}/>
                                    <Td column="Sequenced" data={study.sequencedSampleCount || ""}/>
                                    <Td column="CNA" data={study.cnaSampleCount}/>
                                    <Td column="Tumor mRNA (RNA-Seq V2)" data={study.mrnaRnaSeqV2SampleCount || ""}/>
                                    <Td column="Tumor mRNA (microarray)" data={study.mrnaMicroarraySampleCount || ""}/>
                                    <Td column="Tumor miRNA" data={study.miRnaSampleCount || ""}/>
                                    <Td column="Methylation (HM27)" data={study.methylationHm27SampleCount || "" }/>
                                    <Td column="RPPA" data={study.rppaSampleCount || "" }/>
                                    <Td column="Compete" data={study.completeSampleCount || ""}/>
                                </Tr>
                            );
                        })
                    }
                </Table>


            );
        }

    }

    render() {
        if (this.props.datasets) {

            let sortedDatasets: Array<CancerStudy> = _.sortBy(this.props.datasets, 'name');

            return (<div>
                        <TableHeaderControls showCopyAndDownload={false} handleInput={(filter: string)=>this.setState({ filter:filter })} showSearch={true} className="pull-right" />
                        { this.buildTable() }
                    </div>);

        } else {
            return <div><Spinner spinnerName="three-bounce" /></div>;
        }
    }
}
;



