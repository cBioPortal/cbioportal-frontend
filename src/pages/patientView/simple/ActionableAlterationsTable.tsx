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

type IActionableAlterationsTableWrapperProps = {
    actionableAlterations: MutationAndAnnotation[];
    evidenceCache?: OncoKbEvidenceCache;
    pubMedCache?: OncokbPubMedCache;
    userEmailAddress?:string;
};

class ActionableAlterationsTable extends LazyMobXTable<MutationAndAnnotation[]> {
}

export default class ActionableAlterationsTableWrapper extends React.Component<IActionableAlterationsTableWrapperProps, {}> {
    public render() {
        return (
            <ActionableAlterationsTable
                data={this.props.actionableAlterations.map((x) => [x])}
                columns={[
                    {
                        name:' ',
                        render:(mutAnns:MutationAndAnnotation[])=> {
                            const mutAnn = mutAnns[0];
                            return (<OncoKB
                                hugoGeneSymbol={mutAnn.annotation.hugoGeneSymbol}
                                geneNotExist={!mutAnn.annotation.oncoKbGeneExist}
                                status={mutAnn.annotation.oncoKbStatus}
                                indicator={mutAnn.annotation.oncoKbIndicator}
                                evidenceCache={this.props.evidenceCache}
                                evidenceQuery={mutAnn.annotation.oncoKbIndicator && mutAnn.annotation.oncoKbIndicator.query}
                                pubMedCache={this.props.pubMedCache}
                                userEmailAddress={this.props.userEmailAddress}
                            />);
                        },
                    },
                    {
                        name:'Gene',
                        render:(mutAnns:MutationAndAnnotation[])=> {
                            const mutAnn = mutAnns[0];
                            return (
                                <span><b>{mutAnn.annotation.hugoGeneSymbol}</b></span>
                            );
                        },
                    },
                    {
                        name:'Alteration',
                        render:(mutAnns:MutationAndAnnotation[])=> {
                            const mutAnn = mutAnns[0];
                            return (
                                <span>{mutAnn.annotation.oncoKbIndicator && mutAnn.annotation.oncoKbIndicator.query.alteration}</span>
                            );
                        },
                    },
                    {
                        name:'Level',
                        render:(mutAnns:MutationAndAnnotation[])=> {
                            const mutAnn = mutAnns[0];
                            const level = mutAnn.annotation.oncoKbIndicator? mutAnn.annotation.oncoKbIndicator.highestSensitiveLevel.replace("_"," ").replace("EVEL","evel") : "";
                            return (
                                <span>{level}</span>
                            );
                        },
                    },
                    {
                        name:'Drug',
                        render:(mutAnns:MutationAndAnnotation[])=> {
                            const mutAnn = mutAnns[0];
                            const drugNames = mutAnn.annotation.oncoKbIndicator? _.uniq(_.flatMap(mutAnn.annotation.oncoKbIndicator.treatments, (x) => x.drugs).map((x) => x.drugName)).join(", ") : ''; 
                            return <span>{drugNames}</span>;
                        },
                    }
                  ]}
                  showPagination={false}
                  showColumnVisibility={false}
                  initialItemsPerPage={0}
                  /*initialSortColumn="Attribute"
                  initialSortDirection="asc"*/
                  showFilter={false}
                  showCopyDownload={false}
            />
        );
    }
}