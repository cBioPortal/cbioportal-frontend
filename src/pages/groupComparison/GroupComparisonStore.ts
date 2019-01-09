import {ResultsViewPageStore} from "../resultsView/ResultsViewPageStore";
import {SampleGroup} from "./GroupComparisonUtils";
import {remoteData} from "../../shared/api/remoteData";
import ListIndexedMap from "../../shared/lib/ListIndexedMap";
import {Sample, SampleIdentifier} from "../../shared/api/generated/CBioPortalAPI";

export default class GroupComparisonStore {
    constructor(
        private resultsViewPageStore:ResultsViewPageStore
    ) {
    }

    public readonly sampleGroups = remoteData({
        await:()=>[
            this.resultsViewPageStore.samples,
            this.resultsViewPageStore.sampleGroups
        ],
        invoke:()=>{
            const sampleIdentifierToSample = new ListIndexedMap<Sample>();
            for (const sample of this.resultsViewPageStore.samples.result!) {
                sampleIdentifierToSample.set(sample, sample.sampleId, sample.studyId);
            }
            return Promise.resolve(
                this.resultsViewPageStore.sampleGroups.result!.map(group=>({
                    name: group.name,
                    samples: group.sampleIdentifiers.map((si:SampleIdentifier)=>sampleIdentifierToSample.get(si.sampleId, si.studyId))
                }))
            );
        }
    });
}