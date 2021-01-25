import React, { useState } from 'react';
import classnames from 'classnames';
import { IndicatorQueryResp, MutationEffectResp } from 'oncokb-ts-api-client';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { OncoKbCardDataType } from 'cbioportal-utils';

import OncoKbCardLevelsOfEvidenceDropdown from './OncoKbCardLevelsOfEvidenceDropdown';
import OncoKBSuggestAnnotationLinkout from './OncoKBSuggestAnnotationLinkout';
import OncoKbHelper from './OncoKbHelper';
import { ICache } from '../../model/SimpleCache';
import { Tab, Tabs } from 'react-bootstrap';
import { BiologicalContent } from './oncokbCard/BiologicalContent';
import { ImplicationContent } from './oncokbCard/ImplicationContent';
import OncoKbTreatmentTable from './OncoKbTreatmentTable';

import tabsStyles from './tabs.module.scss';
import mainStyles from './main.module.scss';

const OncoKbMedicalDisclaimer = (
    <p className={mainStyles.disclaimer}>
        The information above is intended for research purposes only and should
        not be used as a substitute for professional diagnosis and treatment.
    </p>
);

const ONCOKB_DATA_ACCESS_PAGE_LINK =
    'https://docs.cbioportal.org/2.4-integration-with-other-webservices/oncokb-data-access';

const publicInstanceDisclaimerOverLay = (
    <div>
        <p>
            This cBioPortal instance is not linked to an OncoKB license, and
            therefore some OncoKB content is not available including
            therapeutic, diagnostic and prognostic implications. To obtain a
            license, please follow{' '}
            <a href={ONCOKB_DATA_ACCESS_PAGE_LINK} target={'_blank'}>
                these instructions
            </a>
            .
        </p>
        {OncoKbMedicalDisclaimer}
    </div>
);

export type OncoKbCardBodyProps = {
    type: OncoKbCardDataType;
    geneNotExist: boolean;
    isCancerGene: boolean;
    hugoSymbol: string;
    pmidData: ICache;
    indicator?: IndicatorQueryResp;
    usingPublicOncoKbInstance: boolean;
};

const TabContentWrapper: React.FunctionComponent<{}> = props => {
    return <div className={mainStyles['tab-content']}>{props.children}</div>;
};

export const OncoKbCardBody: React.FunctionComponent<OncoKbCardBodyProps> = props => {
    let defaultTabActiveKey: OncoKbCardDataType | undefined;
    // Do not assign a default key if the data type specified through the property does not have any content
    // When the content is not available, we do not render the tab.
    if (dataTypeHasContent(props.type)) {
        defaultTabActiveKey = props.type;
        // Both TXS and TXR are therapeutic implication data type which will be shown in the same tab. We use TXS as the tab key when rendering
        if (
            [OncoKbCardDataType.TXS, OncoKbCardDataType.TXR].includes(
                defaultTabActiveKey
            )
        ) {
            defaultTabActiveKey = OncoKbCardDataType.TXS;
        }
    }

    const [activateTabKey, setActivateTabKey] = useState(defaultTabActiveKey);
    const [levelsOfEvidence, setLevelsOfEvidence] = useState(
        getLevelsOfEvidence(activateTabKey)
    );

    function updateActivateTabKey(newKey: any) {
        setActivateTabKey(newKey);
        setLevelsOfEvidence(getLevelsOfEvidence(newKey));
    }

    function hasMutationEffectInfo(mutationEffect?: MutationEffectResp) {
        return (
            mutationEffect &&
            (mutationEffect.description ||
                mutationEffect.citations.abstracts.length > 0 ||
                mutationEffect.citations.pmids.length > 0)
        );
    }

    function dataTypeHasContent(type: OncoKbCardDataType) {
        switch (type) {
            case OncoKbCardDataType.BIOLOGICAL:
                return hasMutationEffectInfo(props.indicator?.mutationEffect);
            case OncoKbCardDataType.TXS:
            case OncoKbCardDataType.TXR:
                return (
                    !!props.indicator?.highestSensitiveLevel ||
                    !!props.indicator?.highestResistanceLevel
                );
            case OncoKbCardDataType.DX:
                return !!props.indicator?.highestDiagnosticImplicationLevel;
            case OncoKbCardDataType.PX:
                return !!props.indicator?.highestPrognosticImplicationLevel;
            default:
                return false;
        }
    }

    function getBody(type: OncoKbCardDataType, indicator: IndicatorQueryResp) {
        const tabs = [];
        if (dataTypeHasContent(OncoKbCardDataType.BIOLOGICAL)) {
            tabs.push(
                <Tab
                    eventKey={OncoKbCardDataType.BIOLOGICAL}
                    title="Biological Effect"
                >
                    <TabContentWrapper>
                        <BiologicalContent
                            mutationEffectCitations={
                                indicator.mutationEffect.citations
                            }
                            biologicalSummary={
                                indicator.mutationEffect.description
                            }
                            pmidData={props.pmidData}
                        />
                    </TabContentWrapper>
                </Tab>
            );
        }
        if (
            !props.usingPublicOncoKbInstance &&
            dataTypeHasContent(OncoKbCardDataType.TXS)
        ) {
            tabs.push(
                <Tab
                    eventKey={OncoKbCardDataType.TXS}
                    title="Therapeutic Implications"
                >
                    <TabContentWrapper>
                        <div
                            style={{
                                marginTop: 10,
                            }}
                        >
                            <OncoKbTreatmentTable
                                variant={indicator.query.alteration || ''}
                                pmidData={props.pmidData!}
                                treatments={indicator.treatments!}
                            />
                        </div>
                    </TabContentWrapper>
                </Tab>
            );
        }
        if (
            !props.usingPublicOncoKbInstance &&
            dataTypeHasContent(OncoKbCardDataType.DX)
        ) {
            tabs.push(
                <Tab
                    eventKey={OncoKbCardDataType.DX}
                    title="Diagnostic Implications"
                >
                    <TabContentWrapper>
                        <ImplicationContent
                            variant={indicator.query.alteration}
                            summary={indicator.diagnosticSummary}
                            implications={indicator.diagnosticImplications}
                            pmidData={props.pmidData}
                        />
                    </TabContentWrapper>
                </Tab>
            );
        }
        if (
            !props.usingPublicOncoKbInstance &&
            dataTypeHasContent(OncoKbCardDataType.PX)
        ) {
            tabs.push(
                <Tab
                    eventKey={OncoKbCardDataType.PX}
                    title="Prognostic Implications"
                >
                    <TabContentWrapper>
                        <ImplicationContent
                            variant={indicator.query.alteration}
                            summary={indicator.prognosticSummary}
                            implications={indicator.prognosticImplications}
                            pmidData={props.pmidData}
                        />
                    </TabContentWrapper>
                </Tab>
            );
        }
        return (
            <div style={{ padding: '10px' }}>
                <p>{indicator.geneSummary}</p>
                <p>{indicator.variantSummary}</p>
                {props.usingPublicOncoKbInstance ? (
                    <p className={mainStyles.disclaimer}>
                        Therapeutic, diagnostic and prognostic implications are
                        not available in this instance of cBioPortal.{' '}
                        <DefaultTooltip
                            overlayStyle={{
                                maxWidth: 400,
                            }}
                            overlay={publicInstanceDisclaimerOverLay}
                        >
                            <i className={'fa fa-info-circle'}></i>
                        </DefaultTooltip>
                    </p>
                ) : (
                    <p>{indicator.tumorTypeSummary}</p>
                )}
                {tabs.length > 0 && (
                    <Tabs
                        defaultActiveKey={defaultTabActiveKey}
                        className={classnames('oncokb-card-tabs')}
                        onSelect={updateActivateTabKey}
                    >
                        {tabs}
                    </Tabs>
                )}
            </div>
        );
    }

    function getLevelsOfEvidence(activateTabKey?: OncoKbCardDataType) {
        switch (activateTabKey) {
            case OncoKbCardDataType.TXS:
            case OncoKbCardDataType.TXR:
                return {
                    levels: OncoKbHelper.TX_LEVELS,
                    levelDes: OncoKbHelper.getLevelsDesc(activateTabKey),
                };
            case OncoKbCardDataType.DX:
                return {
                    levels: OncoKbHelper.DX_LEVELS,
                    levelDes: OncoKbHelper.getLevelsDesc(OncoKbCardDataType.DX),
                };
            case OncoKbCardDataType.PX:
                return {
                    levels: OncoKbHelper.PX_LEVELS,
                    levelDes: OncoKbHelper.getLevelsDesc(OncoKbCardDataType.PX),
                };
            default:
                return {
                    levels: [],
                    levelDes: {},
                };
        }
    }

    const UNKNOWN = 'Unknown';

    function getOncogenicity() {
        let oncogenicity = props.indicator?.oncogenic;
        if (!oncogenicity || oncogenicity === UNKNOWN) {
            oncogenicity = 'Unknown Oncogenic Effect';
        }
        return oncogenicity;
    }

    function getMutationEffect() {
        let mutationEffect = props.indicator?.mutationEffect.knownEffect;
        if (!mutationEffect || mutationEffect === UNKNOWN) {
            mutationEffect = 'Unknown Biological Effect';
        }
        return mutationEffect;
    }

    return (
        <>
            {!props.geneNotExist && (
                <div>
                    {props.indicator && (
                        <>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    backgroundColor: '#064785',
                                    color: '#ffa500',
                                    padding: '10px 0',
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                }}
                            >
                                <div style={{ flexGrow: 1 }}>
                                    {getOncogenicity()}
                                </div>
                                <div style={{ flexGrow: 1 }}>
                                    {getMutationEffect()}
                                </div>
                            </div>
                            <div
                                className={mainStyles['oncokb-card']}
                                data-test="oncokb-card"
                            >
                                {getBody(props.type, props.indicator)}
                            </div>
                        </>
                    )}
                    {!props.usingPublicOncoKbInstance && (
                        <>
                            {/*Use tab pane style for the disclaimer to keep the consistency since the info is attached right under the tab pane*/}
                            <div className={tabsStyles['tab-pane']}>
                                {OncoKbMedicalDisclaimer}
                            </div>
                            {levelsOfEvidence &&
                                levelsOfEvidence.levels.length > 0 && (
                                    <OncoKbCardLevelsOfEvidenceDropdown
                                        levels={levelsOfEvidence.levels}
                                        levelDes={levelsOfEvidence.levelDes}
                                    />
                                )}
                        </>
                    )}
                </div>
            )}
            {!props.isCancerGene && (
                <div
                    className={mainStyles['additional-info']}
                    data-test={'oncokb-card-additional-info'}
                >
                    There is currently no information about this gene in OncoKB.
                </div>
            )}
            {props.geneNotExist && props.isCancerGene && (
                <div className={mainStyles['additional-info']}>
                    <OncoKBSuggestAnnotationLinkout gene={props.hugoSymbol!} />
                </div>
            )}
        </>
    );
};
