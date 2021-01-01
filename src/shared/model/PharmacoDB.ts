export interface IPharmacoDBGeneDrugAssociationData {
    drug_name: string;
    drug_url: string;
    in_clinical_trials: boolean;
    fda_approved: boolean;
    correlation: string;
}

export interface IPharmacoDBCnaRequest
{
    oncotreecode: string,
    gene: string;
    cna: string;
}

export interface IPharmacoDBmRnaEntry {
    gene: string;
    onco_tree_code: string;
    tissue_name: string;
    direction: string;
    gene_url: string;
    gene_drug_associations: IPharmacoDBGeneDrugAssociationData[];
}

export interface IPharmacoDBCnaEntry {
    gene: string;
    onco_tree_code: string;
    tissue_name: string;
    status: string;
    gene_url: string;
    gene_drug_associations: IPharmacoDBGeneDrugAssociationData[];
}

export interface IPharmacoDBView {
    onco_tree_code: string;
    gene: string;
    status: string;
    dataAvailable: boolean;
}

export interface IPharmacoDBViewList {[name:string]:IPharmacoDBView;}

export type MobXStatus = "pending" | "error" | "complete";

export interface IPharmacoDBmRnaEntryDataWrapper {
    status: MobXStatus;
    result?: IPharmacoDBmRnaEntry;
}

export interface IPharmacoDBViewListDataWrapper {
    status: MobXStatus;
    result?: IPharmacoDBViewList;
}

export interface IPharmacoDBCnaEntryDataWrapper {
    status: MobXStatus;
    result?: IPharmacoDBCnaEntry;
}