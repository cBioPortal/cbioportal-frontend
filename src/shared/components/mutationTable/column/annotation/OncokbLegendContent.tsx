import * as React from 'react';
import classnames from 'classnames';
import { Tab, Tabs } from 'react-bootstrap';
import { LegendDescription, LegendTable } from './AnnotationHeaderTooltipCard';
import _ from 'lodash';
import {
    levelIconClassNames,
    normalizeLevel,
    oncogenicityIconClassNames,
} from 'react-mutation-mapper';

enum OncokbTabs {
    ONCOGENIC = 'Oncogenic',
    THERAPEUTIC_LEVELS = 'Therapeutic Levels',
    DIAGNOSTIC_LEVELS = 'Diagnostic Levels',
    PROFNOSTIC_LEVELS = 'Prognostic Levels',
}

enum OncokbOncogenicIconEnum {
    ONCOGENIC = 'oncogenic',
    NUETRAL = 'neutral',
    INCONCLUSIVE = 'inconclusive',
    VUS = 'vus',
    UNKNOWN = 'unknown',
}

enum OncokbTherapeuticLevelIconEnum {
    LEVEL_1 = '1',
    LEVEL_2 = '2',
    LEVEL_3A = '3A',
    LEVEL_3B = '3B',
    LEVEL_4 = '4',
    LEVEL_R1 = 'R1',
    LEVEL_R2 = 'R2',
}

enum OncokbDiagnosticLevelIconEnum {
    LEVEL_DX1 = 'Dx1',
    LEVEL_DX2 = 'Dx2',
    LEVEL_DX3 = 'Dx3',
}

enum OncokbPrognosticLevelIconEnum {
    LEVEL_PX1 = 'Px1',
    LEVEL_PX2 = 'Px2',
    LEVEL_PX3 = 'Px3',
}

const oncokbDescription: _.Dictionary<string> = {
    [OncokbOncogenicIconEnum.ONCOGENIC]:
        'Oncogenic/Likely Oncogenic/Predicted Oncogenic/Resistance',
    [OncokbOncogenicIconEnum.NUETRAL]: 'Likely Neutral',
    [OncokbOncogenicIconEnum.INCONCLUSIVE]: 'Inconclusive',
    [OncokbOncogenicIconEnum.VUS]: 'VUS',
    [OncokbOncogenicIconEnum.UNKNOWN]: 'Unknown',
    [OncokbTherapeuticLevelIconEnum.LEVEL_1]:
        'FDA-recognized biomarker predictive of response to an FDA-approved drug in this indication',
    [OncokbTherapeuticLevelIconEnum.LEVEL_2]:
        'Standard care biomarker recommended by the NCCN or other expert panels predictive of response to an FDA-approved drug in this indication',
    [OncokbTherapeuticLevelIconEnum.LEVEL_3A]:
        'Compelling clinical evidence supports the biomarker as being predictive of response to a drug in this indication',
    [OncokbTherapeuticLevelIconEnum.LEVEL_3B]:
        'Standard care or investigational biomarker predictive of response to an FDA-approved or investigational drug in another indication',
    [OncokbTherapeuticLevelIconEnum.LEVEL_4]:
        'Compelling biological evidence supports the biomarker as being predictive of response to a drug',
    [OncokbTherapeuticLevelIconEnum.LEVEL_R1]:
        'Standard care biomarker predictive of resistance to an FDA-approved drug in this indication',
    [OncokbTherapeuticLevelIconEnum.LEVEL_R2]:
        'Compelling clinical evidence supports the biomarker as being predictive of resistance to a drug',
    [OncokbDiagnosticLevelIconEnum.LEVEL_DX1]:
        'FDA and/or professional guideline-recognized biomarker required for diagnosis in this indication',
    [OncokbDiagnosticLevelIconEnum.LEVEL_DX2]:
        'FDA and/or professional guideline-recognized biomarker that supports diagnosis in this indication',
    [OncokbDiagnosticLevelIconEnum.LEVEL_DX3]:
        'Biomarker that may assist disease diagnosis in this indication based on clinical evidence',
    [OncokbPrognosticLevelIconEnum.LEVEL_PX1]:
        'FDA and/or professional guideline-recognized biomarker prognostic in this indication based on well-powered studie(s)',
    [OncokbPrognosticLevelIconEnum.LEVEL_PX2]:
        'FDA and/or professional guideline-recognized biomarker prognostic in this indication based on a single or multiple small studies',
    [OncokbPrognosticLevelIconEnum.LEVEL_PX3]:
        'Biomarker is prognostic in this indication based on clinical evidence in well-powered studies',
};

const oncokbData: _.Dictionary<LegendDescription[]> = {
    [OncokbTabs.ONCOGENIC]: Object.values(OncokbOncogenicIconEnum).map(d => {
        return {
            legend: <i className={oncogenicityIconClassNames(d)} />,
            description: oncokbDescription[d],
        };
    }),
    [OncokbTabs.DIAGNOSTIC_LEVELS]: Object.values(
        OncokbDiagnosticLevelIconEnum
    ).map(d => {
        return {
            legend: (
                <i className={levelIconClassNames(normalizeLevel(d) || '')} />
            ),
            description: oncokbDescription[d],
        };
    }),
    [OncokbTabs.PROFNOSTIC_LEVELS]: Object.values(
        OncokbPrognosticLevelIconEnum
    ).map(d => {
        return {
            legend: (
                <i className={levelIconClassNames(normalizeLevel(d) || '')} />
            ),
            description: oncokbDescription[d],
        };
    }),
    [OncokbTabs.THERAPEUTIC_LEVELS]: Object.values(
        OncokbTherapeuticLevelIconEnum
    ).map(d => {
        return {
            legend: (
                <i className={levelIconClassNames(normalizeLevel(d) || '')} />
            ),
            description: oncokbDescription[d],
        };
    }),
};

function getOncokbTabContent(tab: string) {
    return <LegendTable legendDescriptions={oncokbData[tab]} />;
}

function getOncokbTabs() {
    return Object.values(OncokbTabs).map(tab => {
        return (
            <Tab eventKey={tab} title={tab}>
                {getOncokbTabContent(tab)}
            </Tab>
        );
    });
}

const OncokbLegendContent: React.FunctionComponent<{}> = props => {
    return (
        <Tabs
            defaultActiveKey={OncokbTabs.ONCOGENIC}
            className={classnames('oncokb-card-tabs')}
            style={{ height: 460, paddingTop: 10 }}
        >
            {getOncokbTabs()}
        </Tabs>
    );
};

export default OncokbLegendContent;
