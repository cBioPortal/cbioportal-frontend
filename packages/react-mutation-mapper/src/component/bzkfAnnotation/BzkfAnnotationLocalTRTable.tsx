import {
    ITherapyRecommendation,
    IFollowUp,
    IResponseCriteria,
    ISharedTherapyRecommendationData,
} from 'cbioportal-utils/src/model/TherapyRecommendation';
import * as React from 'react';
import { Table } from 'react-bootstrap';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { IBzkfAnnotationProps } from './BzkfAnnotation';
import oncoTreeTumorTypes from 'cbioportal-utils/src/model/OncoTreeTumorTypes';
import {
    filterFunc,
    generateTableEntries,
    sortFunc,
} from './BzkfAnnotationUtil';

const ColumnNames = {
    ALT: 'Alteration',
    CT: 'Cancer Type',
    TRT: 'Treatment',
    EL: 'Evidence Level',
    TR: 'Therapy Response',
    CD: 'Clinical Data',
    CM: 'Comment',
    PAT: 'Patient',
};

export default class BzkfAnnotationLocalTRTable extends React.Component<
    IBzkfAnnotationProps,
    {
        searchInput: string;
        sortByColumn: string;
    }
> {
    constructor(props: IBzkfAnnotationProps) {
        super(props);
        this.state = {
            searchInput: '',
            sortByColumn: ColumnNames.CT,
        };
    }

    sharedTRData = this.props.sharedTherapyRecommendationData
        ? this.props.sharedTherapyRecommendationData
        : ({} as ISharedTherapyRecommendationData);

    TRcopy: ITherapyRecommendation[] = JSON.parse(
        JSON.stringify(
            this.sharedTRData.localTherapyRecommendations
                ? this.sharedTRData.localTherapyRecommendations
                      .filter(
                          tr =>
                              tr.diagnosis?.some(d =>
                                  this.sharedTRData.diagnosis?.some(
                                      tdr => tdr == d
                                  )
                              ) ||
                              tr.reasoning?.geneticAlterations?.some(
                                  alt =>
                                      alt.hugoSymbol ==
                                          this.props.hugoGeneSymbol &&
                                      alt.alteration ==
                                          this.props
                                              .sharedTherapyRecommendationData
                                              ?.proteinChange
                              )
                      )
                      .filter(
                          tr =>
                              tr.caseId !=
                                  this.props.sharedTherapyRecommendationData
                                      ?.caseId ||
                              tr.studyId !=
                                  this.props.sharedTherapyRecommendationData
                                      ?.studyId
                      )
                : []
        )
    );

    sortedTR = sortFunc(
        this.TRcopy,
        this.props.hugoGeneSymbol,
        this.sharedTRData.proteinChange || '',
        this.sharedTRData.diagnosis || []
    );

    localTherapyRecommendationsTableContent = generateTableEntries(
        this.sortedTR.slice(0, 50),
        this.sharedTRData.localFollowUps,
        this.props.hugoGeneSymbol,
        this.sharedTRData.proteinChange || '',
        this.sharedTRData.diagnosis || [],
        false
    );

    public render() {
        let oncoKbContent: JSX.Element;

        if (
            this.sharedTRData.localFollowUps == undefined ||
            this.props.hugoGeneSymbol == undefined ||
            this.sharedTRData.proteinChange == undefined ||
            this.sharedTRData.diagnosis == undefined
        ) {
            console.log('ERROR, annotation local Table missing props: ');
            console.log(this.props);
            return (
                <div
                    className="col s12 civic-card-gene"
                    key={'BzkfAnnotationLocalTRTable'}
                >
                    missing data
                </div>
            );
        }

        return (
            <div
                className="col s12 civic-card-gene"
                key={'BzkfAnnotationLocalTRTable'}
            >
                <input
                    placeholder={'Search the table for content'}
                    style={{ width: 1163 }}
                    onChange={ce => {
                        this.setState({ searchInput: ce.target.value });
                    }}
                />
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>
                                Alteration
                                <i className="fa fa-sort-asc lazyMobxTableSortArrowAsc" />
                                <i className="fa fa-sort-asc lazyMobxTableSortArrowAsc" />
                            </th>
                            <th>
                                Cancer Type
                                <i className="fa fa-sort-asc lazyMobxTableSortArrowAsc" />
                            </th>
                            <th>Treatment</th>
                            <th>Evidence Level</th>
                            <th>Therapy Response</th>
                            <th>Clinical Data</th>
                            <th>Comment</th>
                            <th>Patient</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.state.searchInput == ''
                            ? this.localTherapyRecommendationsTableContent
                            : generateTableEntries(
                                  this.sortedTR
                                      .filter(tr =>
                                          filterFunc(tr, this.state.searchInput)
                                      )
                                      .slice(0, 50),
                                  this.sharedTRData.localFollowUps,
                                  this.props.hugoGeneSymbol,
                                  this.sharedTRData.proteinChange,
                                  this.sharedTRData.diagnosis,
                                  false
                              )}
                    </tbody>
                </Table>
            </div>
        );
    }
}
