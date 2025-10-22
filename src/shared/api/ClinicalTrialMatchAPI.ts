import * as request from 'superagent';
import { ClinicalTrialsGovStudies } from './ClinicalTrialsGovStudyStrucutre';
import { RecruitingStatus } from 'shared/enums/ClinicalTrialsGovRecruitingStatus';

const CTG_V2 = 'https://clinicaltrials.gov/api/v2';
const MAX_PAGE_SIZE = 100;

// helpers
const arr = <T>(x: T[] | undefined) => (Array.isArray(x) ? x : []);
const join = (xs?: (string | undefined)[], sep = ' ') =>
    (xs || []).filter(Boolean).join(sep);
const statusCsv = (s: RecruitingStatus[] = []) => s.filter(Boolean).join(',');

const parseBody = (res: request.Response) => {
    if (res.body && typeof res.body === 'object') {
        return res.body;
    }
    try {
        return JSON.parse(res.text || '{}');
    } catch {
        return {};
    }
};

const fetchStudiesPage = async (query: Record<string, any>) => {
    const res = await request
        .get(`${CTG_V2}/studies`)
        .accept('json')
        .query(query);
    const body = parseBody(res);
    return {
        studies: arr<any>(body.studies),
        nextPageToken: body.nextPageToken as string | undefined,
        totalCount: body.totalCount as number | undefined,
    };
};

// de-duplicate v2 study objects by nctId
const uniqByNctId = (studies: any[]) => {
    const seen = new Set<string>();
    const out: any[] = [];
    for (const s of studies || []) {
        const id = s?.protocolSection?.identificationModule?.nctId;
        if (!id || seen.has(id)) continue;
        seen.add(id);
        out.push(s);
    }
    return out;
};

// fetch all pages for one country (optionally bounded by limit)
async function fetchAllPagesForCountry(
    qBase: Record<string, any>,
    country: string,
    limit?: number
): Promise<any[]> {
    const items: any[] = [];
    let next: string | undefined;

    do {
        const remaining =
            limit !== undefined ? limit - items.length : MAX_PAGE_SIZE;
        const pageSize =
            limit !== undefined
                ? Math.min(MAX_PAGE_SIZE, Math.max(1, remaining))
                : MAX_PAGE_SIZE;

        const { studies, nextPageToken } = await fetchStudiesPage({
            ...qBase,
            ...(country ? { 'query.locn': country } : {}),
            pageSize,
            countTotal: true,
            ...(next ? { pageToken: next } : {}),
        });

        items.push(...studies);
        next = nextPageToken;
    } while (next && (limit === undefined || items.length < limit));

    return limit !== undefined ? items.slice(0, limit) : items;
}

// map V2 → V1 format
function v2ToV1Study(study: any) {
    const ps = study?.protocolSection || {};
    const idm = ps.identificationModule || {};
    const sm = ps.statusModule || {};
    const dm = ps.designModule || {};
    const desc = ps.descriptionModule || {};
    const cm = ps.conditionsModule || {};
    const ai = ps.armsInterventionsModule || {};
    const om = ps.outcomesModule || {};
    const elg = ps.eligibilityModule || {};
    const cl = ps.contactsLocationsModule || {};
    const rf = ps.referencesModule || {};
    const ipd = ps.ipdSharingStatementModule || {};
    const der = study?.derivedSection || {};
    const ibm = der.interventionBrowseModule || {};
    const cbm = der.conditionBrowseModule || {};
    const misc = der.miscInfoModule || {};

    return {
        ProtocolSection: {
            IdentificationModule: {
                NCTId: idm.nctId,
                OrgStudyIdInfo: {
                    OrgStudyId: idm.orgStudyIdInfo?.orgStudyId || '',
                },
                SecondaryIdInfoList: {
                    SecondaryIdInfo: arr(
                        idm.secondaryIdInfoList?.secondaryIdInfo
                    ).map((x: any) => ({
                        SecondaryId: x.secondaryId || '',
                        SecondaryIdType: x.secondaryIdType || '',
                    })),
                },
                Organization: {
                    OrgFullName: idm.organization?.orgFullName || '',
                    OrgClass: idm.organization?.orgClass || '',
                },
                BriefTitle: idm.briefTitle || '',
                OfficialTitle: idm.officialTitle || '',
            },
            StatusModule: {
                StatusVerifiedDate: sm.statusVerifiedDate || '',
                OverallStatus: sm.overallStatus || '',
                ExpandedAccessInfo: {
                    HasExpandedAccess:
                        sm.expandedAccessInfo?.hasExpandedAccess || '',
                },
                StartDateStruct: {
                    StartDate: sm.startDateStruct?.startDate || '',
                    StartDateType: sm.startDateStruct?.startDateType || '',
                },
                PrimaryCompletionDateStruct: {
                    PrimaryCompletionDate:
                        sm.primaryCompletionDateStruct?.primaryCompletionDate ||
                        '',
                    PrimaryCompletionDateType:
                        sm.primaryCompletionDateStruct
                            ?.primaryCompletionDateType || '',
                },
                CompletionDateStruct: {
                    CompletionDate:
                        sm.completionDateStruct?.completionDate || '',
                    CompletionDateType:
                        sm.completionDateStruct?.completionDateType || '',
                },
                StudyFirstSubmitDate: sm.studyFirstSubmitDate || '',
                StudyFirstSubmitQCDate: sm.studyFirstSubmitQCDate || '',
                StudyFirstPostDateStruct: {
                    StudyFirstPostDate:
                        sm.studyFirstPostDateStruct?.studyFirstPostDate || '',
                    StudyFirstPostDateType:
                        sm.studyFirstPostDateStruct?.studyFirstPostDateType ||
                        '',
                },
                LastUpdateSubmitDate: sm.lastUpdateSubmitDate || '',
                LastUpdatePostDateStruct: {
                    LastUpdatePostDate:
                        sm.lastUpdatePostDateStruct?.lastUpdatePostDate || '',
                    LastUpdatePostDateType:
                        sm.lastUpdatePostDateStruct?.lastUpdatePostDateType ||
                        '',
                },
            },
            SponsorCollaboratorsModule: {
                ResponsibleParty: {
                    ResponsiblePartyType:
                        ps.sponsorCollaboratorsModule?.responsibleParty
                            ?.responsiblePartyType || '',
                },
                LeadSponsor: {
                    LeadSponsorName:
                        ps.sponsorCollaboratorsModule?.leadSponsor
                            ?.leadSponsorName || '',
                    LeadSponsorClass:
                        ps.sponsorCollaboratorsModule?.leadSponsor
                            ?.leadSponsorClass || '',
                },
            },
            OversightModule: {
                IsFDARegulatedDrug:
                    ps.oversightModule?.isFdaRegulatedDrug || '',
                IsFDARegulatedDevice:
                    ps.oversightModule?.isFdaRegulatedDevice || '',
            },
            DescriptionModule: { BriefSummary: desc.briefSummary || '' },
            ConditionsModule: {
                ConditionList: { Condition: arr(cm.conditions) },
                KeywordList: { Keyword: arr(cm.keywords) },
            },
            DesignModule: {
                StudyType: dm.studyType || '',
                PhaseList: { Phase: arr(dm.phases) },
                DesignInfo: {
                    DesignAllocation: dm.designInfo?.designAllocation || '',
                    DesignInterventionModel:
                        dm.designInfo?.designInterventionModel || '',
                    DesignPrimaryPurpose:
                        dm.designInfo?.designPrimaryPurpose || '',
                    DesignMaskingInfo: {
                        DesignMasking:
                            dm.designInfo?.designMaskingInfo?.designMasking ||
                            '',
                    },
                },
                EnrollmentInfo: {
                    EnrollmentCount:
                        dm.enrollmentInfo?.enrollmentCount?.toString?.() || '',
                    EnrollmentType: dm.enrollmentInfo?.enrollmentType || '',
                },
                ExpandedAccessTypes: {
                    ExpAccTypeTreatment:
                        dm.expandedAccessTypes?.expAccTypeTreatment || '',
                },
            },
            ArmsInterventionsModule: {
                ArmGroupList: {
                    ArmGroup: arr(ai.armGroupList?.armGroup).map((g: any) => ({
                        ArmGroupLabel: g.armGroupLabel || '',
                        ArmGroupType: g.armGroupType || '',
                        ArmGroupDescription: g.armGroupDescription || '',
                        ArmGroupInterventionList: {
                            ArmGroupInterventionName: arr(
                                g.armGroupInterventionList
                                    ?.armGroupInterventionName
                            ),
                        },
                    })),
                },
                // robustly collect interventions from multiple possible V2 shapes
                InterventionList: {
                    Intervention: arr(
                        ai.interventionList?.intervention ||
                            ps.interventionList?.intervention ||
                            ai.interventions ||
                            ai.intervention ||
                            []
                    ).map((iv: any) => ({
                        InterventionType: iv.interventionType || iv.type || '',
                        InterventionName:
                            iv.interventionName ||
                            iv.name ||
                            iv.intervention ||
                            iv.intervention_name ||
                            '',
                        InterventionDescription:
                            iv.interventionDescription || iv.description || '',
                        InterventionArmGroupLabelList: {
                            InterventionArmGroupLabel: arr(
                                iv.interventionArmGroupLabelList
                                    ?.interventionArmGroupLabel ||
                                    iv.armGroupLabels ||
                                    iv.armGroupLabel ||
                                    []
                            ),
                        },
                    })),
                },
            },
            OutcomesModule: {
                PrimaryOutcomeList: {
                    PrimaryOutcome: arr(om.primaryOutcomes).map((o: any) => ({
                        PrimaryOutcomeMeasure: o.primaryOutcomeMeasure || '',
                        PrimaryOutcomeDescription:
                            o.primaryOutcomeDescription || '',
                        PrimaryOutcomeTimeFrame:
                            o.primaryOutcomeTimeFrame || '',
                    })),
                },
                SecondaryOutcomeList: {
                    SecondaryOutcome: arr(om.secondaryOutcomes).map(
                        (o: any) => ({
                            SecondaryOutcomeMeasure:
                                o.secondaryOutcomeMeasure || '',
                            SecondaryOutcomeDescription:
                                o.secondaryOutcomeDescription || '',
                            SecondaryOutcomeTimeFrame:
                                o.secondaryOutcomeTimeFrame || '',
                        })
                    ),
                },
            },
            EligibilityModule: {
                EligibilityCriteria: elg.eligibilityCriteria || '',
                HealthyVolunteers: elg.healthyVolunteers || '',
                Gender: elg.sex || '',
                MinimumAge: elg.minimumAge || '',
                StdAgeList: { StdAge: arr(elg.stdAgeList?.stdAge) },
                MaximumAge: elg.maximumAge || '',
            },
            ContactsLocationsModule: {
                OverallOfficialList: {
                    OverallOfficial: arr(cl.overallOfficials).map((x: any) => ({
                        OverallOfficialName: x.overallOfficialName || '',
                        OverallOfficialAffiliation:
                            x.overallOfficialAffiliation || '',
                        OverallOfficialRole: x.overallOfficialRole || '',
                    })),
                },
                LocationList: {
                    Location: arr(
                        cl.locationList?.location ||
                            cl.locations ||
                            cl.location ||
                            []
                    ).map((x: any) => {
                        const addr = x.address || x.locationAddress || {};
                        // facility: try top-level names then address.* variants
                        const facility =
                            x.facilityName ||
                            x.locationFacility ||
                            x.facility ||
                            x.name ||
                            addr.facilityName ||
                            addr.name ||
                            addr.organization ||
                            '';
                        // city: prefer explicit postal address city fields, avoid numeric 'distance'
                        const city =
                            addr.city ||
                            x.city ||
                            x.locationCity ||
                            x.town ||
                            '';
                        const state =
                            addr.state ||
                            x.state ||
                            x.locationState ||
                            x.region ||
                            '';
                        const postal =
                            addr.postalCode ||
                            x.postalCode ||
                            x.locationZip ||
                            ''; // keep postal separate from distance
                        const country =
                            addr.country ||
                            x.country ||
                            x.locationCountry ||
                            x.countryName ||
                            '';
                        const distance =
                            x.distance ||
                            x.distance_km ||
                            x.distanceKm ||
                            x.dist ||
                            addr.distance ||
                            '';
                        return {
                            LocationFacility: facility,
                            LocationCity: city,
                            LocationState: state,
                            LocationZip: postal,
                            LocationCountry: country,
                            LocationDistance: distance,
                        };
                    }),
                },
                CentralContactList: {
                    CentralContact: arr(cl.centralContacts).map((x: any) => ({
                        CentralContactName: x.centralContactName || '',
                        CentralContactRole: x.centralContactRole || '',
                        CentralContactPhone: x.centralContactPhone || '',
                        CentralContactEMail: x.centralContactEmail || '',
                    })),
                },
                ReferencesModule: {
                    ReferenceList: {
                        Reference: arr(rf.references).map((r: any) => ({
                            ReferencePMID: r.referencePmid || '',
                            ReferenceType: r.referenceType || '',
                            ReferenceCitation: r.referenceCitation || '',
                        })),
                    },
                },
                IPDSharingStatementModule: { IPDSharing: ipd.ipdSharing || '' },
            },
            DerivedSection: {
                MiscInfoModule: { VersionHolder: misc.versionHolder || '' },
                InterventionBrowseModule: {
                    InterventionMeshList: {
                        InterventionMesh: arr(
                            ibm.interventionMeshList?.interventionMesh
                        ).map((m: any) => ({
                            InterventionMeshId: m.interventionMeshId || '',
                            InterventionMeshTerm: m.interventionMeshTerm || '',
                        })),
                    },
                    InterventionAncestorList: {
                        InterventionAncestor: arr(
                            ibm.interventionAncestorList?.interventionAncestor
                        ).map((m: any) => ({
                            InterventionAncestorId:
                                m.interventionAncestorId || '',
                            InterventionAncestorTerm:
                                m.interventionAncestorTerm || '',
                        })),
                    },
                    InterventionBrowseLeafList: {
                        InterventionBrowseLeaf: arr(
                            ibm.interventionBrowseLeafList
                                ?.interventionBrowseLeaf
                        ).map((m: any) => ({
                            InterventionBrowseLeafId:
                                m.interventionBrowseLeafId || '',
                            InterventionBrowseLeafName:
                                m.interventionBrowseLeafName || '',
                            InterventionBrowseLeafAsFound:
                                m.interventionBrowseLeafAsFound || '',
                            InterventionBrowseLeafRelevance:
                                m.interventionBrowseLeafRelevance || '',
                        })),
                    },
                    InterventionBrowseBranchList: {
                        InterventionBrowseBranch: arr(
                            ibm.interventionBrowseBranchList
                                ?.interventionBrowseBranch
                        ).map((m: any) => ({
                            InterventionBrowseBranchAbbrev:
                                m.interventionBrowseBranchAbbrev || '',
                            InterventionBrowseBranchName:
                                m.interventionBrowseBranchName || '',
                        })),
                    },
                },
                ConditionBrowseModule: {
                    ConditionMeshList: {
                        ConditionMesh: arr(
                            cbm.conditionMeshList?.conditionMesh
                        ).map((m: any) => ({
                            ConditionMeshId: m.conditionMeshId || '',
                            ConditionMeshTerm: m.conditionMeshTerm || '',
                        })),
                    },
                    ConditionAncestorList: {
                        ConditionAncestor: arr(
                            cbm.conditionAncestorList?.conditionAncestor
                        ).map((m: any) => ({
                            ConditionAncestorId: m.conditionAncestorId || '',
                            ConditionAncestorTerm:
                                m.conditionAncestorTerm || '',
                        })),
                    },
                    ConditionBrowseLeafList: {
                        ConditionBrowseLeaf: arr(
                            cbm.conditionBrowseLeafList?.conditionBrowseLeaf
                        ).map((m: any) => ({
                            ConditionBrowseLeafId:
                                m.conditionBrowseLeafId || '',
                            ConditionBrowseLeafName:
                                m.conditionBrowseLeafName || '',
                            ConditionBrowseLeafAsFound:
                                m.conditionBrowseLeafAsFound || '',
                            ConditionBrowseLeafRelevance:
                                m.conditionBrowseLeafRelevance || '',
                        })),
                    },
                    ConditionBrowseBranchList: {
                        ConditionBrowseBranch: arr(
                            cbm.conditionBrowseBranchList?.conditionBrowseBranch
                        ).map((m: any) => ({
                            ConditionBrowseBranchAbbrev:
                                m.conditionBrowseBranchAbbrev || '',
                            ConditionBrowseBranchName:
                                m.conditionBrowseBranchName || '',
                        })),
                    },
                },
            },
        },
    };
}
// v2 pagination (min_rnk/max_rnk simulation)
async function fetchV2Paged(
    q: Record<string, any>,
    minRank: number,
    maxRank: number
) {
    const safeMin = Math.max(1, minRank || 1);
    const safeMax = Math.max(safeMin, maxRank || safeMin);
    const want = Math.max(0, safeMax - safeMin + 1);

    let next: string | undefined;
    let skipped = 0;
    const items: any[] = [];
    let total: number | undefined;

    while (items.length < want) {
        const pageSize = Math.min(
            MAX_PAGE_SIZE,
            Math.max(1, want - items.length)
        );
        const { studies, nextPageToken, totalCount } = await fetchStudiesPage({
            ...q,
            pageSize,
            countTotal: true,
            ...(next ? { pageToken: next } : {}),
        });

        total = total ?? totalCount;

        if (skipped < safeMin - 1) {
            const need = safeMin - 1 - skipped;
            if (studies.length <= need) {
                skipped += studies.length;
                next = nextPageToken;
                if (!next) {
                    break;
                }
                continue;
            }
            const trimmed = studies.slice(need);
            skipped += need;
            items.push(...trimmed.slice(0, want - items.length));
        } else {
            items.push(...studies.slice(0, want - items.length));
        }

        if (!nextPageToken) {
            break;
        }
        next = nextPageToken;
    }

    return { items, totalCount: total ?? skipped + items.length };
}

// ===================== Exports: giữ nguyên chữ ký cũ =====================

export async function searchStudiesForKeyword(
    keyword: string,
    nec_search_symbols: string[],
    min_rnk: number,
    max_rnk: number,
    locations: string[],
    status: RecruitingStatus[]
): Promise<string> {
    const term = join([keyword, ...nec_search_symbols]);
    const qBase: Record<string, any> = {};
    if (term) qBase['query.term'] = term;
    if (status?.length) qBase['filter.overallStatus'] = statusCsv(status);

    const safeMin = Math.max(1, min_rnk || 1);
    const safeMax = Math.max(safeMin, max_rnk || safeMin);
    const startIndex = safeMin - 1;
    const windowSize = Math.max(0, safeMax - safeMin + 1);
    const totalNeeded = startIndex + windowSize;

    let studies: any[] = [];
    let reportedTotal: number | undefined;

    // If multiple countries, query per-country to avoid v2 "Too complicated query"
    if (locations?.length > 1) {
        const perCountryLimit =
            totalNeeded > 0 ? totalNeeded + MAX_PAGE_SIZE : MAX_PAGE_SIZE;
        const countries = locations.filter(Boolean);

        for (const country of countries) {
            const chunk = await fetchAllPagesForCountry(
                qBase,
                country,
                perCountryLimit
            );
            studies.push(...chunk);
            studies = uniqByNctId(studies);
            if (totalNeeded > 0 && studies.length >= totalNeeded) {
                break;
            }
        }
    } else {
        const singleQ = { ...qBase };
        const locn = join(locations);
        if (locn) singleQ['query.locn'] = locn;

        const { items, totalCount } = await fetchV2Paged(
            singleQ,
            safeMin,
            safeMax
        );
        studies = items;
        reportedTotal = totalCount;
    }

    const unique = uniqByNctId(studies);
    const totalCount = reportedTotal ?? unique.length;
    const start = Math.max(0, startIndex);
    const end = Math.max(start, Math.min(unique.length, safeMax));
    const window = unique.slice(start, end);

    const FullStudies = window.map((s: any, i: number) => ({
        Rank: start + 1 + i,
        Study: v2ToV1Study(s),
    }));

    return JSON.stringify({
        FullStudiesResponse: {
            APIVrs: '2',
            DataVrs: '',
            Expression: term || '',
            NStudiesAvail: totalCount,
            NStudiesFound: totalCount,
            MinRank: min_rnk,
            MaxRank: max_rnk,
            NStudiesReturned: FullStudies.length,
            FullStudies,
        },
    });
}

export async function searchStudiesForKeywordAsString(
    keyword: string,
    nec_search_symbols: string[],
    min_rnk: number,
    max_rnk: number,
    locations: string[],
    status: RecruitingStatus[]
): Promise<ClinicalTrialsGovStudies> {
    const txt = await searchStudiesForKeyword(
        keyword,
        nec_search_symbols,
        min_rnk,
        max_rnk,
        locations,
        status
    );
    return JSON.parse(txt) as ClinicalTrialsGovStudies;
}

export async function getStudiesNCTIds(
    opt_search_symbols: string[],
    nec_search_symbols: string[],
    tumor_types: string[],
    locations: string[],
    status: RecruitingStatus[]
): Promise<string[]> {
    if (!tumor_types?.length) return [];
    const qBase: any = {};
    const cond = join(tumor_types);
    const term = join([...opt_search_symbols, ...nec_search_symbols]);
    if (cond) qBase['query.cond'] = cond;
    if (term) qBase['query.term'] = term;
    if (status?.length) qBase['filter.overallStatus'] = statusCsv(status);

    const ids: string[] = [];
    const seen = new Set<string>();

    // nhiều country → gọi từng country để tránh 400
    const countries = locations?.length ? locations : [''];
    for (const country of countries) {
        let next: string | undefined;
        do {
            const { studies, nextPageToken } = await fetchStudiesPage({
                ...qBase,
                ...(country ? { 'query.locn': country } : {}),
                fields: 'NCTId',
                pageSize: MAX_PAGE_SIZE,
                ...(next ? { pageToken: next } : {}),
            });
            for (const s of studies || []) {
                const id = s?.protocolSection?.identificationModule?.nctId;
                if (id && !seen.has(id)) {
                    seen.add(id);
                    ids.push(id);
                }
            }
            next = nextPageToken;
        } while (next);
    }

    return ids;
}

export async function getStudiesByCondtionsFromOncoKBasString(): Promise<
    String
> {
    const oncokb_studies_url = 'https://test.oncokb.org/trials';
    return request
        .get(oncokb_studies_url)
        .then(res => {
            return res.text;
        })
        .catch(err => {
            var result = '{}';
            return result;
        });
}

export async function getStudiesByCondtionsFromOncoKB(): Promise<
    IOncoKBStudyDictionary
> {
    const oncokb_studies_url = 'https://test.oncokb.org/trials';
    return request
        .get(oncokb_studies_url)
        .then(res => {
            var result: IOncoKBStudyDictionary = JSON.parse(res.text);
            return result;
        })
        .catch(err => {
            var result: IOncoKBStudyDictionary = {};
            return result;
        });
}

//Only includes fields relevant for ClinicalTrials.Gov search
interface IOncoKBStudy {
    briefTitle: string;
    currentTrialStatus: string;
    nctId: string;
}

interface IOncoKBStudyListByOncoTreeCode {
    nciCode: string;
    nciMainType: string;
    trials: IOncoKBStudy[];
}

export interface IOncoKBStudyDictionary {
    [index: string]: IOncoKBStudyListByOncoTreeCode;
}

export function getAllStudyNctIdsByOncoTreeCode(
    studyDictionary: IOncoKBStudyDictionary,
    oncoTreeCode: string
): string[] {
    var result: string[] = [];
    var studyList: IOncoKBStudyListByOncoTreeCode =
        studyDictionary[oncoTreeCode];
    var trials: IOncoKBStudy[];

    if (!studyList) {
        return result;
    }

    trials = studyDictionary[oncoTreeCode].trials;

    for (var std of trials) {
        result.push(std.nctId);
    }

    return result;
}

export function getAllStudyNctIdsByOncoTreeCodes(
    studyDictionary: IOncoKBStudyDictionary | undefined,
    oncoTreeCodes: string[]
): string[] {
    var result: string[] = [];

    for (var oc = 0; oc < oncoTreeCodes.length; oc++) {
        var oncoTreeCode: string = oncoTreeCodes[oc];
        var studyList: IOncoKBStudyListByOncoTreeCode = studyDictionary![
            oncoTreeCode
        ];
        var trials: IOncoKBStudy[];

        if (studyList) {
            trials = studyDictionary![oncoTreeCode].trials;
            for (var std of trials) {
                result.push(std.nctId);
            }
        }
    }

    return result;
}
