import {Group, GroupData} from "../../../shared/api/ComparisonGroupClient";
import {StudyViewPageStore} from "../../studyView/StudyViewPageStore";
import {SampleIdentifier} from "../../../shared/api/generated/CBioPortalAPI";
import _ from "lodash";
import {getSampleIdentifiers} from "../GroupComparisonUtils";

export function getSelectedGroups(
    allGroups:Group[],
    store:StudyViewPageStore
) {
    return allGroups.filter(group=>store.isComparisonGroupSelected(group.id));
}

export function getStudiesAttr(sampleIdentifiers:SampleIdentifier[]) {
    return _.map(
        _.groupBy(sampleIdentifiers, id=>id.studyId),
        (sampleIdentifiers, studyId)=>({
            id: studyId,
            samples: sampleIdentifiers.map(id=>id.sampleId)
        })
    );
}

export function getGroupParameters(
    name:string,
    selectedSamples:SampleIdentifier[],
    store:StudyViewPageStore
) {
    return {
        name,
        description: "",
        studies: getStudiesAttr(selectedSamples),
        origin: store.studyIds,
        studyViewFilter: store.filters as any
    };
}

export function addSamplesParameters(
    group:GroupData,
    sampleIdentifiers:SampleIdentifier[]
) {
    group = Object.assign({}, group);
    const prevSampleIdentifiers = getSampleIdentifiers([group]);
    const newSampleIdentifiers = _.uniqWith(
        prevSampleIdentifiers.concat(sampleIdentifiers),
        (a,b)=>(a.studyId === b.studyId)&&(a.sampleId === b.sampleId)
    );
    group.studies = getStudiesAttr(newSampleIdentifiers);
    return group;
}