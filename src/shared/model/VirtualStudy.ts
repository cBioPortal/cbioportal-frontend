import { StudyViewFilter } from 'cbioportal-ts-api-client';

export interface VirtualStudyData {
    name: string;
    description: string;
    studies: { id: string; samples: string[] }[];
    origin: string[];
    studyViewFilter: StudyViewFilter;
}

export interface VirtualStudy {
    id: string;
    data: VirtualStudyData;
}
