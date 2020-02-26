import {
    getNCBIlink,
    Citations,
    IndicatorQueryTreatment,
} from 'cbioportal-frontend-commons';
import classnames from 'classnames';
import { action, computed, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { Collapse } from 'react-collapse';

import { ICache } from '../../model/SimpleCache';
import { levelIconClassNames } from '../../util/OncoKbUtils';
import OncoKBSuggestAnnotationLinkout from './OncoKBSuggestAnnotationLinkout';
import OncoKbTreatmentTable from './OncoKbTreatmentTable';
import OncoKbHelper from './OncoKbHelper';
import ReferenceList from './ReferenceList';
import SummaryWithRefs from './SummaryWithRefs';

import oncoKbLogoImgSrc from '../../images/oncokb_logo.png';
import collapsibleStyles from './collapsible.module.scss';
import levelStyles from './level.module.scss';
import mainStyles from './main.module.scss';
import tabsStyles from './tabs.module.scss';

type OncoKbCardPropsBase = {
    title: string;
    gene: string;
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
    handleFeedbackOpen?: React.EventHandler<any>;
};

export type OncoKbCardProps =
    | (OncoKbCardPropsBase & { geneNotExist: boolean; isCancerGene: boolean })
    | (Partial<OncoKbCardPropsBase> & {
          geneNotExist: boolean;
          isCancerGene: boolean;
      });

@observer
export default class OncoKbCard extends React.Component<OncoKbCardProps> {
    @observable activeTab: 'oncogenicity' | 'mutationEffect' = 'oncogenicity';
    @observable levelsCollapsed: boolean = true;

    @computed
    get oncokbLinkOut() {
        let link: string | undefined = undefined;
        if (this.props.gene) {
            link = `https://oncokb.org/gene/${this.props.gene}`;
            if (this.props.variant) {
                link = `${link}/${this.props.variant}`;
            }
        }
        return link;
    }

    constructor(props: OncoKbCardProps) {
        super(props);

        this.handleOncogenicityTabSelect = this.handleOncogenicityTabSelect.bind(
            this
        );
        this.handleMutationEffectTabSelect = this.handleMutationEffectTabSelect.bind(
            this
        );
        this.handleLevelCollapse = this.handleLevelCollapse.bind(this);
    }

    public levelListItem(level: string, levelDes: JSX.Element) {
        return (
            <li key={level} className={levelStyles['levels-li']}>
                <i className={levelIconClassNames(level)} />
                {levelDes}
            </li>
        );
    }

    public generateLevelRows(
        levels: string[],
        levelDes: { [level: string]: JSX.Element }
    ): JSX.Element[] {
        const rows: JSX.Element[] = [];

        levels.forEach(level => {
            rows.push(this.levelListItem(level, levelDes[level]));
        });

        return rows;
    }

    // TODO we should replace the tabs with an actual ReactBootstrap Tab,
    // also divide this component into smaller components
    public render() {
        const oncokbLogo = (
            <img
                src={oncoKbLogoImgSrc}
                className={mainStyles['oncokb-logo']}
                alt="OncoKB"
            />
        );
        return (
            <div className={mainStyles['oncokb-card']} data-test="oncokb-card">
                <div>
                    {!this.props.geneNotExist && (
                        <span>
                            <div className={tabsStyles['tabs-wrapper']}>
                                <div
                                    className={mainStyles['title']}
                                    data-test="oncokb-card-title"
                                >
                                    {this.props.title}
                                </div>
                                <div className={tabsStyles.tabs}>
                                    <div
                                        key="oncogenicity"
                                        className={classnames(
                                            tabsStyles.tab,
                                            'enable-hover'
                                        )}
                                    >
                                        <a
                                            className={classnames(
                                                'oncogenicity',
                                                tabsStyles['tab-title-a'],
                                                mainStyles['enable-hover-a'],
                                                this.activeTab ===
                                                    'oncogenicity'
                                                    ? mainStyles[
                                                          'enable-hover-active'
                                                      ]
                                                    : ''
                                            )}
                                            onClick={
                                                this.handleOncogenicityTabSelect
                                            }
                                        >
                                            <span
                                                className={
                                                    tabsStyles['tab-title']
                                                }
                                            >
                                                clinical implications
                                            </span>
                                            <span
                                                className={
                                                    tabsStyles['tab-subtitle']
                                                }
                                            >
                                                {this.props.oncogenicity ||
                                                    'Unknown'}
                                            </span>
                                        </a>
                                    </div>
                                    <div
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
                                                    'mutationEffect'
                                                    ? mainStyles[
                                                          'enable-hover-active'
                                                      ]
                                                    : ''
                                            )}
                                            onClick={
                                                this
                                                    .handleMutationEffectTabSelect
                                            }
                                        >
                                            <span
                                                className={
                                                    tabsStyles['tab-title']
                                                }
                                            >
                                                Biological Effect
                                            </span>
                                            <span
                                                className={
                                                    tabsStyles['tab-subtitle']
                                                }
                                            >
                                                {this.props.mutationEffect ||
                                                    'Unknown'}
                                            </span>
                                        </a>
                                    </div>
                                    <div className={mainStyles.indicator} />
                                </div>
                                {this.activeTab === 'oncogenicity' && (
                                    <div>
                                        <div
                                            className={classnames(
                                                tabsStyles['tab-pane']
                                            )}
                                        >
                                            <p>{this.props.geneSummary}</p>
                                            <p>
                                                {this.insertLink(
                                                    this.props.variantSummary!,
                                                    {
                                                        keyword:
                                                            'Chang et al. 2016',
                                                        link: getNCBIlink(
                                                            '/pubmed/26619011'
                                                        ),
                                                    }
                                                )}
                                            </p>
                                            <p style={{ marginBottom: 0 }}>
                                                {this.props.tumorTypeSummary}
                                            </p>

                                            {this.props.treatments!.length >
                                                0 && (
                                                <div style={{ marginTop: 10 }}>
                                                    <OncoKbTreatmentTable
                                                        variant={
                                                            this.props
                                                                .variant || ''
                                                        }
                                                        pmidData={
                                                            this.props.pmidData!
                                                        }
                                                        treatments={
                                                            this.props
                                                                .treatments!
                                                        }
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {this.activeTab === 'mutationEffect' && (
                                    <div
                                        className={classnames(
                                            tabsStyles['tab-pane']
                                        )}
                                        style={{
                                            maxHeight: 200,
                                            overflowY: 'auto',
                                        }}
                                    >
                                        {this.props.biologicalSummary !==
                                            undefined &&
                                        this.props.biologicalSummary.length >
                                            0 ? (
                                            <SummaryWithRefs
                                                content={
                                                    this.props.biologicalSummary
                                                }
                                                type={'tooltip'}
                                                pmidData={this.props.pmidData!}
                                            />
                                        ) : this.props
                                              .mutationEffectCitations &&
                                          (this.props.mutationEffectCitations
                                              .abstracts.length > 0 ||
                                              this.props.mutationEffectCitations
                                                  .pmids.length > 0) ? (
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
                                        ) : (
                                            <span>
                                                Mutation effect information is
                                                not available.
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className={mainStyles.disclaimer}>
                                <span>
                                    The information above is intended for
                                    research purposes only and should not be
                                    used as a substitute for professional
                                    diagnosis and treatment.
                                </span>
                            </div>

                            <div>
                                <div
                                    className={
                                        collapsibleStyles['collapsible-header']
                                    }
                                    onClick={this.handleLevelCollapse}
                                >
                                    Levels
                                    <span style={{ float: 'right' }}>
                                        {this.levelsCollapsed ? (
                                            <i
                                                className={classnames(
                                                    'fa fa-chevron-down',
                                                    mainStyles['orange-icon']
                                                )}
                                            />
                                        ) : (
                                            <i
                                                className={classnames(
                                                    'fa fa-chevron-up',
                                                    mainStyles['orange-icon']
                                                )}
                                            />
                                        )}
                                    </span>
                                </div>
                                <Collapse isOpened={!this.levelsCollapsed}>
                                    <div
                                        className={classnames(
                                            levelStyles.levels,
                                            collapsibleStyles['levels-collapse']
                                        )}
                                    >
                                        <ul
                                            style={{
                                                lineHeight: 8,
                                                padding: 0,
                                            }}
                                        >
                                            {this.generateLevelRows(
                                                OncoKbHelper.LEVELS,
                                                OncoKbHelper.LEVEL_DESC
                                            )}
                                        </ul>
                                    </div>
                                </Collapse>
                            </div>
                        </span>
                    )}
                    {!this.props.isCancerGene && (
                        <div className={mainStyles['additional-info']}>
                            There is currently no information about this gene in
                            OncoKB.
                        </div>
                    )}
                    {this.props.geneNotExist && this.props.isCancerGene && (
                        <div className={mainStyles['additional-info']}>
                            <OncoKBSuggestAnnotationLinkout
                                gene={this.props.gene!}
                            />
                        </div>
                    )}

                    <div className={mainStyles.footer}>
                        {this.oncokbLinkOut === undefined ? (
                            { oncokbLogo }
                        ) : (
                            <a href={`${this.oncokbLinkOut}`} target="_blank">
                                {oncokbLogo}
                            </a>
                        )}
                        {this.props.handleFeedbackOpen && (
                            <span
                                className={classnames(
                                    'pull-right',
                                    mainStyles.feedback
                                )}
                            >
                                <button
                                    className="btn btn-default btn-sm btn-xs"
                                    onClick={this.props.handleFeedbackOpen}
                                >
                                    Feedback
                                </button>
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    private handleOncogenicityTabSelect(): void {
        this.handleTabSelect('oncogenicity');
    }

    private handleMutationEffectTabSelect(): void {
        this.handleTabSelect('mutationEffect');
    }

    @action
    handleTabSelect(tabName: 'oncogenicity' | 'mutationEffect'): void {
        this.activeTab = tabName;
    }

    @action
    handleLevelCollapse(): void {
        this.levelsCollapsed = !this.levelsCollapsed;
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

        for (let i = 1; i < parts.length; i++) {
            content.push(comp);
            content.push(parts[i]);
        }

        return content;
    }
}
