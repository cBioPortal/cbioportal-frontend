export enum RecruitingStatus {
    ActiveNotRecruiting = 'ACTIVE_NOT_RECRUITING',
    Completed = 'COMPLETED',
    EnrollingByInvitation = 'ENROLLING_BY_INVITATION',
    NotYetRecruiting = 'NOT_YET_RECRUITING',
    Recruiting = 'RECRUITING',
    Suspended = 'SUSPENDED',
    Terminated = 'TERMINATED',
    Withdrawn = 'WITHDRAWN',
    Available = 'AVAILABLE',
    NoLongerAvailable = 'NO_LONGER_AVAILABLE',
    TemporarilyNotAvailable = 'TEMPORARILY_NOT_AVAILABLE',
    UnknownStatus = 'UNKNOWN',
    Invalid = 'INVALID',
}

const RECRUITING_STATUS_CONFIG: Array<{
    value: RecruitingStatus;
    label: string;
}> = [
    {
        value: RecruitingStatus.ActiveNotRecruiting,
        label: 'Active, not recruiting',
    },
    { value: RecruitingStatus.Completed, label: 'Completed' },
    {
        value: RecruitingStatus.EnrollingByInvitation,
        label: 'Enrolling by invitation',
    },
    { value: RecruitingStatus.NotYetRecruiting, label: 'Not yet recruiting' },
    { value: RecruitingStatus.Recruiting, label: 'Recruiting' },
    { value: RecruitingStatus.Suspended, label: 'Suspended' },
    { value: RecruitingStatus.Terminated, label: 'Terminated' },
    { value: RecruitingStatus.Withdrawn, label: 'Withdrawn' },
    { value: RecruitingStatus.Available, label: 'Available' },
    { value: RecruitingStatus.NoLongerAvailable, label: 'No longer available' },
    {
        value: RecruitingStatus.TemporarilyNotAvailable,
        label: 'Temporarily not available',
    },
    { value: RecruitingStatus.UnknownStatus, label: 'Unknown status' },
    { value: RecruitingStatus.Invalid, label: 'Invalid' },
];

/** Ready-made options for selects and dropdowns */
export const recruitingStatusOptions = RECRUITING_STATUS_CONFIG.map(
    ({ value, label }) => ({
        value,
        label,
    })
);

const recruitingStatusLookup = RECRUITING_STATUS_CONFIG.reduce(
    (acc, { value, label }) => {
        acc[value.toUpperCase()] = label;
        acc[label.toUpperCase()] = label;
        return acc;
    },
    {} as Record<string, string>
);

/** Transform API status codes into readable labels for the UI */
export function recruitingStatusLabel(
    status?: RecruitingStatus | string
): string {
    if (!status) return '';
    const normalized = String(status)
        .trim()
        .toUpperCase();

    const label =
        recruitingStatusLookup[normalized] ??
        normalized
            .split('_')
            .map(word => word[0] + word.slice(1).toLowerCase())
            .join(' ');

    return label;
}
