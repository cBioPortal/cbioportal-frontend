export type PfamDomain = {
    description: string;
    name: string;
    pfamAccession: string;
};

export type PfamDomainRange = {
    pfamDomainId: string;
    pfamDomainStart: number;
    pfamDomainEnd: number;
};
