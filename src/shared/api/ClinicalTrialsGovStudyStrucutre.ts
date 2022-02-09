export interface OrgStudyIdInfo {
    OrgStudyId: string;
}

export interface SecondaryIdInfo {
    SecondaryId: string;
    SecondaryIdType: string;
}

export interface SecondaryIdInfoList {
    SecondaryIdInfo: SecondaryIdInfo[];
}

export interface Organization {
    OrgFullName: string;
    OrgClass: string;
}

export interface IdentificationModule {
    NCTId: string;
    OrgStudyIdInfo: OrgStudyIdInfo;
    SecondaryIdInfoList: SecondaryIdInfoList;
    Organization: Organization;
    BriefTitle: string;
    OfficialTitle: string;
}

export interface ExpandedAccessInfo {
    HasExpandedAccess: string;
}

export interface StartDateStruct {
    StartDate: string;
    StartDateType: string;
}

export interface PrimaryCompletionDateStruct {
    PrimaryCompletionDate: string;
    PrimaryCompletionDateType: string;
}

export interface CompletionDateStruct {
    CompletionDate: string;
    CompletionDateType: string;
}

export interface StudyFirstPostDateStruct {
    StudyFirstPostDate: string;
    StudyFirstPostDateType: string;
}

export interface LastUpdatePostDateStruct {
    LastUpdatePostDate: string;
    LastUpdatePostDateType: string;
}

export interface StatusModule {
    StatusVerifiedDate: string;
    OverallStatus: string;
    ExpandedAccessInfo: ExpandedAccessInfo;
    StartDateStruct: StartDateStruct;
    PrimaryCompletionDateStruct: PrimaryCompletionDateStruct;
    CompletionDateStruct: CompletionDateStruct;
    StudyFirstSubmitDate: string;
    StudyFirstSubmitQCDate: string;
    StudyFirstPostDateStruct: StudyFirstPostDateStruct;
    LastUpdateSubmitDate: string;
    LastUpdatePostDateStruct: LastUpdatePostDateStruct;
}

export interface ResponsibleParty {
    ResponsiblePartyType: string;
}

export interface LeadSponsor {
    LeadSponsorName: string;
    LeadSponsorClass: string;
}

export interface SponsorCollaboratorsModule {
    ResponsibleParty: ResponsibleParty;
    LeadSponsor: LeadSponsor;
}

export interface OversightModule {
    IsFDARegulatedDrug: string;
    IsFDARegulatedDevice: string;
}

export interface DescriptionModule {
    BriefSummary: string;
}

export interface ConditionList {
    Condition: string[];
}

export interface KeywordList {
    Keyword: string[];
}

export interface ConditionsModule {
    ConditionList: ConditionList;
    KeywordList: KeywordList;
}

export interface PhaseList {
    Phase: string[];
}

export interface DesignMaskingInfo {
    DesignMasking: string;
}

export interface DesignInfo {
    DesignAllocation: string;
    DesignInterventionModel: string;
    DesignPrimaryPurpose: string;
    DesignMaskingInfo: DesignMaskingInfo;
}

export interface EnrollmentInfo {
    EnrollmentCount: string;
    EnrollmentType: string;
}

export interface ExpandedAccessTypes {
    ExpAccTypeTreatment: string;
}

export interface DesignModule {
    StudyType: string;
    PhaseList: PhaseList;
    DesignInfo: DesignInfo;
    EnrollmentInfo: EnrollmentInfo;
    ExpandedAccessTypes: ExpandedAccessTypes;
}

export interface ArmGroupInterventionList {
    ArmGroupInterventionName: string[];
}

export interface ArmGroup {
    ArmGroupLabel: string;
    ArmGroupType: string;
    ArmGroupDescription: string;
    ArmGroupInterventionList: ArmGroupInterventionList;
}

export interface ArmGroupList {
    ArmGroup: ArmGroup[];
}

export interface InterventionArmGroupLabelList {
    InterventionArmGroupLabel: string[];
}

export interface Intervention {
    InterventionType: string;
    InterventionName: string;
    InterventionDescription: string;
    InterventionArmGroupLabelList: InterventionArmGroupLabelList;
}

export interface InterventionList {
    Intervention: Intervention[];
}

export interface ArmsInterventionsModule {
    ArmGroupList: ArmGroupList;
    InterventionList: InterventionList;
}

export interface PrimaryOutcome {
    PrimaryOutcomeMeasure: string;
    PrimaryOutcomeDescription: string;
    PrimaryOutcomeTimeFrame: string;
}

export interface PrimaryOutcomeList {
    PrimaryOutcome: PrimaryOutcome[];
}

export interface SecondaryOutcome {
    SecondaryOutcomeMeasure: string;
    SecondaryOutcomeDescription: string;
    SecondaryOutcomeTimeFrame: string;
}

export interface SecondaryOutcomeList {
    SecondaryOutcome: SecondaryOutcome[];
}

export interface OutcomesModule {
    PrimaryOutcomeList: PrimaryOutcomeList;
    SecondaryOutcomeList: SecondaryOutcomeList;
}

export interface StdAgeList {
    StdAge: string[];
}

export interface EligibilityModule {
    EligibilityCriteria: string;
    HealthyVolunteers: string;
    Gender: string;
    MinimumAge: string;
    StdAgeList: StdAgeList;
    MaximumAge: string;
}

export interface OverallOfficial {
    OverallOfficialName: string;
    OverallOfficialAffiliation: string;
    OverallOfficialRole: string;
}

export interface OverallOfficialList {
    OverallOfficial: OverallOfficial[];
}

export interface Location {
    LocationFacility: string;
    LocationCity: string;
    LocationState: string;
    LocationZip: string;
    LocationCountry: string;
}

export interface LocationList {
    Location: Location[];
}

export interface CentralContact {
    CentralContactName: string;
    CentralContactRole: string;
    CentralContactPhone: string;
    CentralContactEMail: string;
}

export interface CentralContactList {
    CentralContact: CentralContact[];
}

export interface ContactsLocationsModule {
    OverallOfficialList: OverallOfficialList;
    LocationList: LocationList;
    CentralContactList: CentralContactList;
}

export interface Reference {
    ReferencePMID: string;
    ReferenceType: string;
    ReferenceCitation: string;
}

export interface ReferenceList {
    Reference: Reference[];
}

export interface ReferencesModule {
    ReferenceList: ReferenceList;
}

export interface IPDSharingStatementModule {
    IPDSharing: string;
}

export interface ProtocolSection {
    IdentificationModule: IdentificationModule;
    StatusModule: StatusModule;
    SponsorCollaboratorsModule: SponsorCollaboratorsModule;
    OversightModule: OversightModule;
    DescriptionModule: DescriptionModule;
    ConditionsModule: ConditionsModule;
    DesignModule: DesignModule;
    ArmsInterventionsModule: ArmsInterventionsModule;
    OutcomesModule: OutcomesModule;
    EligibilityModule: EligibilityModule;
    ContactsLocationsModule: ContactsLocationsModule;
    ReferencesModule: ReferencesModule;
    IPDSharingStatementModule: IPDSharingStatementModule;
}

export interface MiscInfoModule {
    VersionHolder: string;
}

export interface InterventionMesh {
    InterventionMeshId: string;
    InterventionMeshTerm: string;
}

export interface InterventionMeshList {
    InterventionMesh: InterventionMesh[];
}

export interface InterventionAncestor {
    InterventionAncestorId: string;
    InterventionAncestorTerm: string;
}

export interface InterventionAncestorList {
    InterventionAncestor: InterventionAncestor[];
}

export interface InterventionBrowseLeaf {
    InterventionBrowseLeafId: string;
    InterventionBrowseLeafName: string;
    InterventionBrowseLeafAsFound: string;
    InterventionBrowseLeafRelevance: string;
}

export interface InterventionBrowseLeafList {
    InterventionBrowseLeaf: InterventionBrowseLeaf[];
}

export interface InterventionBrowseBranch {
    InterventionBrowseBranchAbbrev: string;
    InterventionBrowseBranchName: string;
}

export interface InterventionBrowseBranchList {
    InterventionBrowseBranch: InterventionBrowseBranch[];
}

export interface InterventionBrowseModule {
    InterventionMeshList: InterventionMeshList;
    InterventionAncestorList: InterventionAncestorList;
    InterventionBrowseLeafList: InterventionBrowseLeafList;
    InterventionBrowseBranchList: InterventionBrowseBranchList;
}

export interface ConditionMesh {
    ConditionMeshId: string;
    ConditionMeshTerm: string;
}

export interface ConditionMeshList {
    ConditionMesh: ConditionMesh[];
}

export interface ConditionAncestor {
    ConditionAncestorId: string;
    ConditionAncestorTerm: string;
}

export interface ConditionAncestorList {
    ConditionAncestor: ConditionAncestor[];
}

export interface ConditionBrowseLeaf {
    ConditionBrowseLeafId: string;
    ConditionBrowseLeafName: string;
    ConditionBrowseLeafAsFound: string;
    ConditionBrowseLeafRelevance: string;
}

export interface ConditionBrowseLeafList {
    ConditionBrowseLeaf: ConditionBrowseLeaf[];
}

export interface ConditionBrowseBranch {
    ConditionBrowseBranchAbbrev: string;
    ConditionBrowseBranchName: string;
}

export interface ConditionBrowseBranchList {
    ConditionBrowseBranch: ConditionBrowseBranch[];
}

export interface ConditionBrowseModule {
    ConditionMeshList: ConditionMeshList;
    ConditionAncestorList: ConditionAncestorList;
    ConditionBrowseLeafList: ConditionBrowseLeafList;
    ConditionBrowseBranchList: ConditionBrowseBranchList;
}

export interface DerivedSection {
    MiscInfoModule: MiscInfoModule;
    InterventionBrowseModule: InterventionBrowseModule;
    ConditionBrowseModule: ConditionBrowseModule;
}

export interface Study {
    ProtocolSection: ProtocolSection;
    DerivedSection: DerivedSection;
}

export interface FullStudy {
    Rank: number;
    Study: Study;
}

export interface FullStudiesResponse {
    APIVrs: string;
    DataVrs: string;
    Expression: string;
    NStudiesAvail: number;
    NStudiesFound: number;
    MinRank: number;
    MaxRank: number;
    NStudiesReturned: number;
    FullStudies: FullStudy[];
}

export interface ClinicalTrialsGovStudies {
    FullStudiesResponse: FullStudiesResponse;
}
