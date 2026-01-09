import React from 'react';
import UsageAgreement from 'shared/components/UsageAgreement';
import { getServerConfig } from 'config/config';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import expiredStorage from 'expired-storage';

const TEMPO_STUDY_WARNING_PERSISTENCE_KEY =
    'tempo-study-usage-agreement';

export function shouldShowTempoWarning() {
    // Detect whether we are on the study view page
    const routingStore = getBrowserWindow().routingStore;
    const pathname = routingStore?.location?.pathname || '';
    const isStudyViewPage = pathname.startsWith('/study');

    // Detect whether we are viewing the TEMPO study
    // TODO: should we cover an aggregate study view (TEMPO + another study) too?
    const query = routingStore?.query || {};
    const rawStudyId =
        (query.id as string | string[] | undefined) ||
        (query.studyId as string | string[] | undefined) ||
        (query.cancer_study_id as string | string[] | undefined);
    const studyIds = Array.isArray(rawStudyId)
        ? rawStudyId.flatMap(id => id.split(','))
        : (rawStudyId || '').split(',');
    const isTempoStudy =
        studyIds.length === 1 && studyIds[0] === 'tempo_msk';

    const showTempoWarning =
        ['mskcc-portal'].includes(getServerConfig().app_name!) &&
        !getBrowserWindow().isMSKCIS &&
        isStudyViewPage &&
        isTempoStudy;

    return (
        showTempoWarning &&
        new expiredStorage().getItem(TEMPO_STUDY_WARNING_PERSISTENCE_KEY) !==
            'true'
    );
}

export const TempoAgreement: React.FunctionComponent<{}> = function({}) {
    return (
        <UsageAgreement
            displayImmediately={true}
            persistenceKey={TEMPO_STUDY_WARNING_PERSISTENCE_KEY}
            expirationInDays={90}
            clauses={[
                <>
                    When adding a link to a cBioPortal cohort in a manuscript,{' '}
                    <strong>
                        I will not link to this private portal (
                        {window.location.hostname})
                    </strong>
                    , but will instead link to this study on the public
                    cBioPortal (
                    <a href="https://www.cbioportal.org/" target="_blank">
                        cbioportal.org
                    </a>
                    ). Contact{' '}
                    <a href="mailto:cbioportal@cbio.mskcc.org">
                        cbioportal@cbio.mskcc.org
                    </a>{' '}
                    with any questions about getting the data transferred to the
                    public cBioPortal.
                </>,
                <>
                    I have read and agree to the{' '}
                    <a
                        href="https://mskcc.sharepoint.com/sites/pub-ResearchDG/SitePages/Home.aspx?ga=1"
                        target="_blank"
                    >
                        Memorial Hospital Research Data Governance publication
                        guidelines
                    </a>
                    .
                </>,
            ]}
        />
    );
};
