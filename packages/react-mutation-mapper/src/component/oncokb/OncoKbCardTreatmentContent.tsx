import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { Citations, IndicatorQueryTreatment } from 'oncokb-ts-api-client';
import classnames from 'classnames';
import { action, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { Else, If, Then } from 'react-if';

import { ICache } from '../../model/SimpleCache';
import OncoKbTreatmentTable from './OncoKbTreatmentTable';
import ReferenceList from './ReferenceList';
import SummaryWithRefs from './SummaryWithRefs';

import mainStyles from './main.module.scss';
import tabsStyles from './tabs.module.scss';
import autobind from 'autobind-decorator';

type OncoKbCardTreatmentContentProps = {
    variant: string;
    oncogenicity: string;
    mutationEffect: string;
    mutationEffectCitations: Citations;
    geneSummary: string;
    variantSummary: string;
    tumorTypeSummary: string;
    biologicalSummary: string;
    treatments: IndicatorQueryTreatment[];
    pmidData: ICache;
    usingPublicOncoKbInstance: boolean;
};

const ONCOKB_DATA_ACCESS_PAGE_LINK =
    'https://docs.cbioportal.org/2.4-integration-with-other-webservices/oncokb-data-access';

const OncoKbMedicalDisclaimer = (
    <p className={mainStyles.disclaimer}>
        The information above is intended for research purposes only and should
        not be used as a substitute for professional diagnosis and treatment.
    </p>
);

const publicInstanceDisclaimerOverLay = (
    <div>
        <p>
            This instance of cBioPortal does not currently have a license for
            full OncoKB content and is therefore missing therapeutic
            implications. To obtain a license, please follow{' '}
            <a href={ONCOKB_DATA_ACCESS_PAGE_LINK} target={'_blank'}>
                these instructions
            </a>
            .
        </p>
        {OncoKbMedicalDisclaimer}
    </div>
);

enum ActiveTabEnum {
    ONCOGENICITY = 'oncogenicity',
    MUTATION_EFFECT = 'mutationEffect',
}

@observer
export default class OncoKbCardTreatmentContent extends React.Component<
    OncoKbCardTreatmentContentProps
> {
    @observable activeTab: ActiveTabEnum = ActiveTabEnum.ONCOGENICITY;

    // TODO we should replace the tabs with an actual ReactBootstrap Tab,
    public render() {
        return (
            <div className={mainStyles['oncokb-card']} data-test="oncokb-card">
                <div className={tabsStyles['tabs-wrapper']}>
                    <div className={tabsStyles.tabs}>
                        <div
                            key={ActiveTabEnum.ONCOGENICITY}
                            data-test={`${ActiveTabEnum.ONCOGENICITY}-tab`}
                            className={classnames(
                                tabsStyles.tab,
                                'enable-hover'
                            )}
                        >
                            <a
                                className={classnames(
                                    ActiveTabEnum.ONCOGENICITY,
                                    tabsStyles['tab-title-a'],
                                    mainStyles['enable-hover-a'],
                                    this.activeTab ===
                                        ActiveTabEnum.ONCOGENICITY
                                        ? mainStyles['enable-hover-active']
                                        : ''
                                )}
                                onClick={this.handleOncogenicityTabSelect}
                            >
                                <span className={tabsStyles['tab-title']}>
                                    clinical implications
                                </span>
                                <span className={tabsStyles['tab-subtitle']}>
                                    {this.props.oncogenicity || 'Unknown'}
                                </span>
                            </a>
                        </div>
                        <div
                            data-test={`${ActiveTabEnum.MUTATION_EFFECT}-tab`}
                            key="mutationEffect"
                            className={classnames(
                                tabsStyles.tab,
                                'enable-hover'
                            )}
                        >
                            <a
                                className={classnames(
                                    'mutation-effect',
                                    tabsStyles['tab-title-a'],
                                    mainStyles['enable-hover-a'],
                                    this.activeTab ===
                                        ActiveTabEnum.MUTATION_EFFECT
                                        ? mainStyles['enable-hover-active']
                                        : ''
                                )}
                                onClick={this.handleMutationEffectTabSelect}
                            >
                                <span className={tabsStyles['tab-title']}>
                                    Biological Effect
                                </span>
                                <span className={tabsStyles['tab-subtitle']}>
                                    {this.props.mutationEffect || 'Unknown'}
                                </span>
                            </a>
                        </div>
                        <div className={mainStyles.indicator} />
                    </div>
                    {this.activeTab === ActiveTabEnum.ONCOGENICITY && (
                        <div>
                            <div
                                className={classnames(tabsStyles['tab-pane'])}
                                data-test={`${ActiveTabEnum.ONCOGENICITY}-pane`}
                            >
                                <p>{this.props.geneSummary}</p>
                                <p>{this.props.variantSummary}</p>
                                {this.props.usingPublicOncoKbInstance ? (
                                    <p className={mainStyles.disclaimer}>
                                        Therapeutic levels are not available in
                                        this instance of cBioPortal.{' '}
                                        <DefaultTooltip
                                            overlayStyle={{
                                                maxWidth: 400,
                                            }}
                                            overlay={
                                                publicInstanceDisclaimerOverLay
                                            }
                                        >
                                            <i
                                                className={'fa fa-info-circle'}
                                            ></i>
                                        </DefaultTooltip>
                                    </p>
                                ) : (
                                    <>
                                        <p>{this.props.tumorTypeSummary}</p>

                                        {this.props.treatments!.length > 0 && (
                                            <div
                                                style={{
                                                    marginTop: 10,
                                                }}
                                            >
                                                <OncoKbTreatmentTable
                                                    variant={
                                                        this.props.variant || ''
                                                    }
                                                    pmidData={
                                                        this.props.pmidData!
                                                    }
                                                    treatments={
                                                        this.props.treatments!
                                                    }
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                    {this.activeTab === ActiveTabEnum.MUTATION_EFFECT && (
                        <div
                            className={classnames(tabsStyles['tab-pane'])}
                            data-test={`${ActiveTabEnum.MUTATION_EFFECT}-pane`}
                            style={{
                                maxHeight: 200,
                                overflowY: 'auto',
                            }}
                        >
                            <If
                                condition={
                                    this.props.biologicalSummary !==
                                        undefined &&
                                    this.props.biologicalSummary.length > 0
                                }
                            >
                                <Then>
                                    <SummaryWithRefs
                                        content={this.props.biologicalSummary}
                                        type={'tooltip'}
                                        pmidData={this.props.pmidData!}
                                    />
                                </Then>
                                <Else>
                                    <If
                                        condition={
                                            this.props
                                                .mutationEffectCitations &&
                                            (this.props.mutationEffectCitations
                                                .abstracts.length > 0 ||
                                                this.props
                                                    .mutationEffectCitations
                                                    .pmids.length > 0)
                                        }
                                    >
                                        <Then>
                                            <ReferenceList
                                                pmidData={this.props.pmidData}
                                                pmids={this.props.mutationEffectCitations!.pmids.map(
                                                    pmid => Number(pmid)
                                                )}
                                                abstracts={
                                                    this.props
                                                        .mutationEffectCitations!
                                                        .abstracts
                                                }
                                            />
                                        </Then>
                                        <Else>
                                            Mutation effect information is not
                                            available.
                                        </Else>
                                    </If>
                                </Else>
                            </If>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    @autobind
    private handleOncogenicityTabSelect(): void {
        this.handleTabSelect(ActiveTabEnum.ONCOGENICITY);
    }

    @autobind
    private handleMutationEffectTabSelect(): void {
        this.handleTabSelect(ActiveTabEnum.MUTATION_EFFECT);
    }

    @autobind
    @action
    handleTabSelect(tabName: ActiveTabEnum): void {
        this.activeTab = tabName;
    }

    public insertLink(str: string, link: any) {
        if (!str) {
            return str;
        }

        const content: Array<string | JSX.Element> = [];
        const parts = str.split(link.keyword);

        content.push(parts[0]);

        const comp = (
            <a href={link.link} target={link.target || '_blank'}>
                {link.keyword}
            </a>
        );

        parts.forEach(part => {
            content.push(comp);
            content.push(part);
        });

        return content;
    }
}
