import {SampleIdentifier} from "../../shared/api/generated/CBioPortalAPI";

export type SampleGroup = {
    id:string,
    name?:string,
    sampleIdentifiers:SampleIdentifier[]
};

export const TEMP_localStorageGroupsKey = "__tmp__groupComparisonGroups";