import { Mutation, DiscreteCopyNumberData } from "shared/api/generated/CBioPortalAPI";
import { IAnnotation } from "shared/components/mutationTable/column/AnnotationColumnFormatter";
import LazyMobXTable from "shared/components/lazyMobXTable/LazyMobXTable";
import React from "react";
import _ from "lodash";
import OncoKB from "shared/components/annotation/OncoKB";
import OncoKbEvidenceCache from "shared/cache/OncoKbEvidenceCache";
import OncokbPubMedCache from "shared/cache/PubMedCache";

export type MutationAndAnnotation = {
    mutation: Mutation;
    annotation: IAnnotation;
};

export type DiscreteCopyNumberDataAndAnnotation = {
    discreteCopyNumberData: DiscreteCopyNumberData;
    annotation: IAnnotation;
};

type IActionableAlterationsTableWrapperProps = {
    actionableAlterations: (MutationAndAnnotation|DiscreteCopyNumberDataAndAnnotation)[];
    evidenceCache?: OncoKbEvidenceCache;
    pubMedCache?: OncokbPubMedCache;
    userEmailAddress?:string;
};

class ActionableAlterationsTable extends LazyMobXTable<(MutationAndAnnotation|DiscreteCopyNumberDataAndAnnotation)[]> {
}

export default class ActionableAlterationsTableWrapper extends React.Component<IActionableAlterationsTableWrapperProps, {}> {
    public render() {
        return (
            <ActionableAlterationsTable
                data={this.props.actionableAlterations.map((x) => [x])}
                columns={[
                    {
                        name:' ',
                        render:(actionAnns:(MutationAndAnnotation|DiscreteCopyNumberDataAndAnnotation)[])=> {
                            const actionAnn = actionAnns[0];
                            return (<OncoKB
                                hugoGeneSymbol={actionAnn.annotation.hugoGeneSymbol}
                                geneNotExist={!actionAnn.annotation.oncoKbGeneExist}
                                status={actionAnn.annotation.oncoKbStatus}
                                indicator={actionAnn.annotation.oncoKbIndicator}
                                evidenceCache={this.props.evidenceCache}
                                evidenceQuery={actionAnn.annotation.oncoKbIndicator && actionAnn.annotation.oncoKbIndicator.query}
                                pubMedCache={this.props.pubMedCache}
                                userEmailAddress={this.props.userEmailAddress}
                            />);
                        },
                    },
                    {
                        name:'Gene',
                        render:(actionAnns:(MutationAndAnnotation|DiscreteCopyNumberDataAndAnnotation)[])=> {
                            const actionAnn = actionAnns[0];
                            return (
                                <span><b>{actionAnn.annotation.hugoGeneSymbol}</b></span>
                            );
                        },
                    },
                    {
                        name:'Alteration',
                        render:(actionAnns:(MutationAndAnnotation|DiscreteCopyNumberDataAndAnnotation)[])=> {
                            const actionAnn = actionAnns[0];
                            return (
                                <span>{actionAnn.annotation.oncoKbIndicator && actionAnn.annotation.oncoKbIndicator.query.alteration}</span>
                            );
                        },
                    },
                    {
                        name:'Level',
                        render:(actionAnns:(MutationAndAnnotation|DiscreteCopyNumberDataAndAnnotation)[])=> {
                            const actionAnn = actionAnns[0];
                            const level = actionAnn.annotation.oncoKbIndicator? actionAnn.annotation.oncoKbIndicator.highestSensitiveLevel.replace("_"," ").replace("EVEL","evel") : "";
                            return (
                                <span>{level}</span>
                            );
                        },
                        sortBy: (actionAnns:(MutationAndAnnotation|DiscreteCopyNumberDataAndAnnotation)[])=> { 
                            const actionAnn = actionAnns[0];
                            return OncoKB.sortValue(actionAnn.annotation.oncoKbIndicator);
                        }
                    },
                    {
                        name:'Drug',
                        render:(actionAnns:(MutationAndAnnotation|DiscreteCopyNumberDataAndAnnotation)[])=> {
                            const actionAnn = actionAnns[0];
                            const drugNames = actionAnn.annotation.oncoKbIndicator? _.uniq(_.flatMap(actionAnn.annotation.oncoKbIndicator.treatments, (x) => x.drugs).map((x) => x.drugName)).join(", ") : ''; 
                            return <span>{drugNames}</span>;
                        },
                    }
                  ]}
                  showPagination={false}
                  showColumnVisibility={false}
                  initialItemsPerPage={0}
                  initialSortColumn="Level"
                  initialSortDirection="desc"
                  showFilter={false}
                  showCopyDownload={false}
                  className="actionable-alterations-table"
            />
        );
    }
}