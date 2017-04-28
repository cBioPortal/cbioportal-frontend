import * as React from 'react';
import {observer, inject } from "mobx-react";
import {reaction, computed} from "mobx";
import validateParameters from 'shared/lib/validateParameters';
import LoadingIndicator from "shared/components/loadingIndicator/LoadingIndicator";
import ValidationAlert from "shared/components/ValidationAlert";
import ResultsViewMutationTable from "./mutation/ResultsViewMutationTable";
import {ResultsViewPageStore} from "./ResultsViewPageStore";

const resultsViewPageStore = new ResultsViewPageStore();

(window as any).resultsViewPageStore = resultsViewPageStore;

export interface IResultsViewPageProps {
    routing: any;
}

@inject('routing')
@observer
export default class ResultsViewPage extends React.Component<IResultsViewPageProps, {}> {

    constructor(props: IResultsViewPageProps) {
        super();

        const reaction1 = reaction(
            () => props.routing.location.query,
            query => {

                const validationResult = validateParameters(query, ['studyId']);

                if (validationResult.isValid) {
                    resultsViewPageStore.urlValidationError = null;

                    resultsViewPageStore.studyId = query.studyId;

                    if ('sampleListId' in query) {
                        resultsViewPageStore.sampleListId = query.sampleListId as string;
                    }

                    // TODO we may want to split by ","

                    if ('sampleList' in query) {
                        resultsViewPageStore.sampleList = (query.sampleList as string).split(" ");
                    }

                    if ('geneList' in query) {
                        resultsViewPageStore.hugoGeneSymbols = (query.geneList as string).split(" ");
                    }
                }
                else {
                    resultsViewPageStore.urlValidationError = validationResult.message;
                }

            },
            { fireImmediately:true }
        );
    }

    public render() {

        if (resultsViewPageStore.urlValidationError) {
            return <ValidationAlert urlValidationError={resultsViewPageStore.urlValidationError} />;
        }

        return (
            <div className="resultsViewPage">
                <LoadingIndicator isLoading={resultsViewPageStore.mutationData.isPending} />

                {
                    (resultsViewPageStore.mutationData.isComplete) && (
                        <ResultsViewMutationTable
                            studyId={resultsViewPageStore.studyId}
                            discreteCNACache={resultsViewPageStore.discreteCNACache}
                            oncoKbEvidenceCache={resultsViewPageStore.oncoKbEvidenceCache}
                            pmidCache={resultsViewPageStore.pmidCache}
                            cancerTypeCache={resultsViewPageStore.cancerTypeCache}
                            mutationCountCache={resultsViewPageStore.mutationCountCache}
                            data={resultsViewPageStore.mergedMutationData}
                            myCancerGenomeData={resultsViewPageStore.myCancerGenomeData}
                            hotspots={resultsViewPageStore.indexedHotspotData}
                            cosmicData={resultsViewPageStore.cosmicData.result}
                            oncoKbData={resultsViewPageStore.oncoKbData.result}
                        />
                    )
                }
            </div>
        );
    }
}
