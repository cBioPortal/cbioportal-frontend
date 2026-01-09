import React from 'react';
import UsageAgreement from 'shared/components/UsageAgreement';
import { getServerConfig } from 'config/config';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import expiredStorage from 'expired-storage';

const TEMPO_VIEW_WARNING_PERSISTENCE_KEY =
    'tempo_private_study_link_warning_dismissed';

export function shouldShowTempoWarning() {
    const showTempoWarning =
        ['tempo-portal'].includes(getServerConfig().app_name!) &&
        !getBrowserWindow().isMSKCIS;

    return (
        showTempoWarning &&
        new expiredStorage().getItem(TEMPO_VIEW_WARNING_PERSISTENCE_KEY) !==
            'true'
    );
}

export const TempoAgreement: React.FunctionComponent<{}> = function({}) {
    return (
        <UsageAgreement
            alertMessage={
                <>
                    <span style={{ color: 'red' }}>Attention:</span>
                    &nbsp;Please read and follow the{' '}
                    <a
                        target="_blank"
                        href={
                            'https://mskcc.sharepoint.com/sites/pub-ResearchDG/SitePages/Home.aspx?ga=1'
                        }
                    >
                        rules about usage of MSK clinical sequencing data in
                        manuscripts
                    </a>
                    .
                </>
            }
            dismissButtonText={'Acknowledge'}
            persistenceKey={TEMPO_VIEW_WARNING_PERSISTENCE_KEY}
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
