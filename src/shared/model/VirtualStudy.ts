export interface VirtualStudyData {
    name: string;
    description: string;
    studies:{ id:string, samples: string[] }[];
    origin: string[];
    filters:{ patients: Map<string, string[]>;
              samples:  Map<string, string[]>};
};

export interface VirtualStudy {
    id: string;
    data: VirtualStudyData;
};