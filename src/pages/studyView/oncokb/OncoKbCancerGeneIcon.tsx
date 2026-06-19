import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { getOncoKBCancerGeneListLinkout } from 'pages/studyView/oncokb/OncoKBUtils';

const ONCOKB_ICON = require('oncokb-styles/dist/images/oncogenic.svg');

export const OncoKbCancerGeneIcon: React.FunctionComponent<{
    hugoGeneSymbol: string;
}> = ({ hugoGeneSymbol }) => (
    <DefaultTooltip
        placement="right"
        overlay={
            <span>
                {hugoGeneSymbol} is in the {getOncoKBCancerGeneListLinkout()}.
            </span>
        }
    >
        <img
            src={ONCOKB_ICON}
            alt="OncoKB Cancer Gene"
            style={{ height: 12, width: 12, cursor: 'default' }}
            data-test="oncokb-cancer-gene-icon"
        />
    </DefaultTooltip>
);
