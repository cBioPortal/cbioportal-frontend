import React from 'react';
import { observer } from 'mobx-react';
import { observable, computed } from 'mobx';

import tabsStyles from './tabs.module.scss';
import OncoKbCardLevelsOfEvidenceDropdown from './OncoKbCardLevelsOfEvidenceDropdown';
import mainStyles from './main.module.scss';
import OncoKBSuggestAnnotationLinkout from './OncoKBSuggestAnnotationLinkout';
import { IndicatorQueryResp } from 'oncokb-ts-api-client';
import OncoKbCardTreatmentContent from './OncoKbCardTreatmentContent';
import OncoKbHelper, { OncoKbCardDataType } from './OncoKbHelper';
import { ICache } from '../../model/SimpleCache';

const OncoKbMedicalDisclaimer = (
    <p className={mainStyles.disclaimer}>
        The information above is intended for research purposes only and should
        not be used as a substitute for professional diagnosis and treatment.
    </p>
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

@observer
export default class OncoKbCardBody extends React.Component<
    OncoKbCardBodyProps
> {
    @observable activeTab: 'oncogenicity' | 'mutationEffect' = 'oncogenicity';

    getBody(indicator: IndicatorQueryResp) {
        switch (this.props.type) {
            case OncoKbCardDataType.TX:
                return (
                    <OncoKbCardTreatmentContent
                        variant={indicator.query.alteration}
                        oncogenicity={indicator.oncogenic}
                        mutationEffect={indicator.mutationEffect.knownEffect}
                        biologicalSummary={indicator.mutationEffect.description}
                        mutationEffectCitations={
                            indicator.mutationEffect.citations
                        }
                        geneSummary={indicator.geneSummary}
                        variantSummary={indicator.variantSummary}
                        tumorTypeSummary={indicator.tumorTypeSummary}
                        treatments={indicator.treatments}
                        pmidData={this.props.pmidData}
                        usingPublicOncoKbInstance={
                            this.props.usingPublicOncoKbInstance
                        }
                    />
                );
            default:
                return <></>;
        }
    }

    @computed get levelsOfEvidence() {
        switch (this.props.type) {
            case OncoKbCardDataType.TX:
                return {
                    levels: OncoKbHelper.LEVELS,
                    levelDes: OncoKbHelper.LEVEL_DESC,
                };
            default:
                return {
                    levels: [],
                    levelDes: {},
                };
        }
    }

    render() {
        return (
            <>
                {!this.props.geneNotExist && (
                    <div>
                        {this.props.indicator &&
                            this.getBody(this.props.indicator)}
                        {!this.props.usingPublicOncoKbInstance && (
                            <>
                                {/*Use tab pane style for the disclaimer to keep the consistency since the info is attached right under the tab pane*/}
                                <div className={tabsStyles['tab-pane']}>
                                    {OncoKbMedicalDisclaimer}
                                </div>
                                {this.levelsOfEvidence && (
                                    <OncoKbCardLevelsOfEvidenceDropdown
                                        levels={this.levelsOfEvidence.levels}
                                        levelDes={
                                            this.levelsOfEvidence.levelDes
                                        }
                                    />
                                )}
                            </>
                        )}
                    </div>
                )}
                {!this.props.isCancerGene && (
                    <div
                        className={mainStyles['additional-info']}
                        data-test={'oncokb-card-additional-info'}
                    >
                        There is currently no information about this gene in
                        OncoKB.
                    </div>
                )}
                {this.props.geneNotExist && this.props.isCancerGene && (
                    <div className={mainStyles['additional-info']}>
                        <OncoKBSuggestAnnotationLinkout
                            gene={this.props.hugoSymbol!}
                        />
                    </div>
                )}
            </>
        );
    }
}
