import {SampleIdentifier} from "../../shared/api/generated/CBioPortalAPI";

export type SampleGroup = {
    id:string,
    name?:string,
    sampleIdentifiers:SampleIdentifier[]
};