import {SampleIdentifier} from "../../shared/api/generated/CBioPortalAPI";

export type SampleGroup = {
    id:string,
    name?:string,
    sampleIdentifiers:SampleIdentifier[],
    color?: string;
    legendText?: string;
};

export const TEMP_localStorageGroupsKey = "__tmp__groupComparisonGroups";