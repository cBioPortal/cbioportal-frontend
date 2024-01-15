import * as React from 'react';
import { Table } from 'react-bootstrap';
import { IBzkfAnnotationProps } from './BzkfAnnotation';
import {
    ISharedTherapyRecommendationData,
    ITherapyRecommendation,
} from './modelCopy/TherapyRecommendation';
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
    AUTH: 'Author',
};

export default class BzkfAnnotationGlobalTRTable extends React.Component<
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
            this.sharedTRData.sharedTherapyRecommendations
                ? this.sharedTRData.sharedTherapyRecommendations.filter(
                      tr =>
                          tr.diagnosis?.some(d =>
                              this.sharedTRData.diagnosis?.some(tdr => tdr == d)
                          ) ||
                          tr.reasoning?.geneticAlterations?.some(
                              alt =>
                                  alt.hugoSymbol == this.props.hugoGeneSymbol &&
                                  alt.alteration ==
                                      this.props.sharedTherapyRecommendationData
                                          ?.proteinChange
                          )
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

    sharedTherapyRecommendationsTableContent = generateTableEntries(
        this.sortedTR.slice(0, 50),
        this.sharedTRData.sharedFollowUps,
        this.props.hugoGeneSymbol,
        this.sharedTRData.proteinChange || '',
        this.sharedTRData.diagnosis || [],
        true
    );

    public render() {
        let oncoKbContent: JSX.Element;

        if (
            this.sharedTRData.sharedFollowUps == undefined ||
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
                key={'BzkfAnnotationGlobalTRTable'}
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
                            <th>Author</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.state.searchInput == ''
                            ? this.sharedTherapyRecommendationsTableContent
                            : generateTableEntries(
                                  this.sortedTR
                                      .filter(tr =>
                                          filterFunc(tr, this.state.searchInput)
                                      )
                                      .slice(0, 50),
                                  this.sharedTRData.sharedFollowUps,
                                  this.props.hugoGeneSymbol,
                                  this.sharedTRData.proteinChange,
                                  this.sharedTRData.diagnosis,
                                  true
                              )}
                    </tbody>
                </Table>
            </div>
        );
    }
}
