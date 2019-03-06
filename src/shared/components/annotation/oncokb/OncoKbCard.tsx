import * as React from 'react';
import * as _ from 'lodash';
import Collapse from 'react-collapse';
import {Else, If, Then} from 'react-if';
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import {mergeAlterations} from 'shared/lib/OncoKbUtils';
import {ICache} from "shared/lib/SimpleCache";
import {action, computed, observable} from "mobx";
import {observer} from "mobx-react";
// TODO these need to be defined as modules, and class names used in this component need to be updated
import mainStyles from '../styles/oncokb/main.module.scss';
import collapsibleStyles from '../styles/oncokb/collapsible.module.scss';
import levelStyles from '../styles/oncokb/level.module.scss';
import tabsStyles from '../styles/oncokb/tabs.module.scss';
import {ArticleAbstract, Citations} from "../../../api/generated/OncoKbAPI";
import {getNCBIlink} from "../../../api/urls";
import classnames from 'classnames';
import OncoKbTreatmentTable from "./OncoKbTreatmentTable";
import ReferenceList from "./ReferenceList";
import SummaryWithRefs from "./SummaryWithRefs";

type OncoKbCardPropsBase = {
    title: string;
    gene: string;
    variant: string,
    oncogenicity: string;
    oncogenicityPmids: number[];
    mutationEffect: string;
    mutationEffectCitations: Citations;
    geneSummary: string;
    variantSummary: string;
    tumorTypeSummary: string;
    biologicalSummary: string;
    treatments: OncoKbTreatment[];
    pmidData: ICache<any>;
    handleFeedbackOpen?: React.EventHandler<any>;
};

export type OncoKbTreatment = {
    level: string,
    variant: string[],
    cancerType: string,
    pmids: number[],
    abstracts: ArticleAbstract[],
    description: string,
    treatment: string
}

export type OncoKbCardProps =
    (OncoKbCardPropsBase & { geneNotExist:false}) |
    (Partial<OncoKbCardPropsBase> & {geneNotExist: true});

export const LEVEL_ICON_STYLE = {
    backgroundImage: `url(${require('../images/levels_colors_v2_09302016.png')})`
};


@observer
export default class OncoKbCard extends React.Component<OncoKbCardProps>
{
    @observable activeTab:"oncogenicity" | "mutationEffect" = "oncogenicity";
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

    public static get LEVELS(): string[] {
        return ['1', '2A', '2B', '3A', '3B', '4', 'R1', 'R2'];
    }

    public static get LEVEL_DESC(): {[level:string]: JSX.Element}
    {
        return {
            '1': (<span><b>FDA-recognized</b> biomarker predictive of response to an <b>FDA-approved</b> drug <b>in this indication</b></span>),
            '2A': (<span><b>Standard care</b> biomarker predictive of response to an <b>FDA-approved</b> drug <b>in this indication</b></span>),
            '2B': (<span><b>Standard care</b> biomarker predictive of response to an <b>FDA-approved</b> drug <b>in another indication</b>, but not standard care for this indication</span>),
            '3A': (<span><b>Compelling clinical evidence</b> supports the biomarker as being predictive of response to a drug <b>in this indication</b></span>),
            '3B': (<span><b>Compelling clinical evidence</b> supports the biomarker as being predictive of response to a drug <b>in another indication</b></span>),
            '4': (<span><b>Compelling biological evidence</b> supports the biomarker as being predictive of response to a drug</span>),
            'R1': (<span><b>Standard care</b> biomarker predictive of <b>resistance</b> to an <b>FDA-approved</b> drug <b>in this indication</b></span>),
            'R2': (<span><b>Compelling clinical evidence</b> supports the biomarker as being predictive of <b>resistance</b> to a drug</span>)
        };
    }

    constructor()
    {
        super();

        this.handleOncogenicityTabSelect = this.handleOncogenicityTabSelect.bind(this);
        this.handleMutationEffectTabSelect = this.handleMutationEffectTabSelect.bind(this);
        this.handleLevelCollapse = this.handleLevelCollapse.bind(this);
    }

    public levelListItem(level:string, levelDes:JSX.Element)
    {
        return (
            <li key={level} className={levelStyles["levels-li"]}>
                <i
                    className={classnames(levelStyles['level-icon'], levelStyles[`level-${level}`])}
                    style={LEVEL_ICON_STYLE}
                />
                {levelDes}
            </li>
        );
    }

    public generateLevelRows(levels:string[], levelDes:{[level:string]: JSX.Element}):JSX.Element[]
    {
        const rows:JSX.Element[] = [];

        levels.forEach((level) => {
            rows.push(this.levelListItem(level, levelDes[level]));
        });

        return rows;
    }

    // TODO we should replace the tabs with an actual ReactBootstrap Tab,
    // also divide this component into smaller components
    public render()
    {
        const oncokbLogo = <img src={require("../images/oncokb.png")} className={mainStyles["oncokb-logo"]} alt="OncoKB"/>;
        return (
            <div className={mainStyles["oncokb-card"]} data-test='oncokb-card'>
                <div>
                    {!this.props.geneNotExist && (
                            <span>
                                <div className={tabsStyles["tabs-wrapper"]}>
                                    <div className={mainStyles["title"]} data-test="oncokb-card-title">
                                        {this.props.title}
                                    </div>
                                    <div className={tabsStyles.tabs}>
                                        <div key="oncogenicity"
                                            className={classnames(tabsStyles.tab, "enable-hover")}>
                                            <a
                                                className={classnames('oncogenicity', tabsStyles["tab-title-a"], mainStyles["enable-hover-a"], this.activeTab === "oncogenicity" ? mainStyles["enable-hover-active"] : '')}
                                                onClick={this.handleOncogenicityTabSelect}
                                            >
                                                <span
                                                    className={tabsStyles["tab-title"]}>clinical implications</span>
                                                <span
                                                    className={tabsStyles["tab-subtitle"]}>{this.props.oncogenicity || "Unknown"}</span>
                                            </a>
                                        </div>
                                        <div key="mutationEffect"
                                            className={classnames(tabsStyles.tab, "enable-hover")}>
                                            <a
                                                className={classnames('mutation-effect', tabsStyles["tab-title-a"], mainStyles["enable-hover-a"], this.activeTab === "mutationEffect" ? mainStyles["enable-hover-active"] : '')}
                                                onClick={this.handleMutationEffectTabSelect}
                                            >
                                                <span className={tabsStyles["tab-title"]}>Biological Effect</span>
                                                <span
                                                    className={tabsStyles["tab-subtitle"]}>{this.props.mutationEffect || "Unknown"}</span>
                                            </a>
                                        </div>
                                        <div className={mainStyles.indicator}/>
                                    </div>
                                    <If condition={this.activeTab === "oncogenicity"}>
                                        <div>
                                            <div className={classnames(tabsStyles["tab-pane"])}>
                                                <p>{this.props.geneSummary}</p>
                                                <p>
                                                    {
                                                        this.insertLink(this.props.variantSummary, {
                                                            keyword: 'Chang et al. 2016',
                                                            link: getNCBIlink('/pubmed/26619011')
                                                        })
                                                    }
                                                </p>
                                                <p style={{marginBottom: 0}}>{this.props.tumorTypeSummary}</p>
                                            </div>
                                            <If condition={this.props.treatments.length > 0}>
                                                <OncoKbTreatmentTable pmidData={this.props.pmidData}
                                                                      treatments={this.props.treatments}/>
                                            </If>
                                        </div>
                                    </If>
                                    <If condition={this.activeTab === "mutationEffect"}>
                                        <div className={classnames(tabsStyles["tab-pane"])}
                                             style={{maxHeight: 200, overflowY: 'auto'}}>
                                            <If condition={this.props.biologicalSummary !== undefined && this.props.biologicalSummary.length > 0}>
                                                <Then>
                                                    <SummaryWithRefs content={this.props.biologicalSummary} type={'tooltip'} pmidData={this.props.pmidData}/>
                                                </Then>
                                                <Else>
                                                    <If condition={this.props.mutationEffectCitations && (this.props.mutationEffectCitations.abstracts.length > 0 || this.props.mutationEffectCitations.pmids.length > 0)}>
                                                        <Then>
                                                            <ReferenceList pmidData={this.props.pmidData}
                                                                           pmids={this.props.mutationEffectCitations.pmids.map((pmid) => Number(pmid))}
                                                                           abstracts={this.props.mutationEffectCitations.abstracts}/>
                                                        </Then>
                                                        <Else>
                                                            <span>Mutation effect information is not available.</span>
                                                        </Else>
                                                    </If>
                                                </Else>
                                            </If>
                                        </div>
                                    </If>
                                </div>

                                <div className={mainStyles.disclaimer}>
                                    <span>
                                        The information above is intended for research purposes only and should not be used as a
                                        substitute for professional diagnosis and treatment.
                                    </span>
                                </div>

                                <div>
                                    <div className={collapsibleStyles["collapsible-header"]}
                                         onClick={this.handleLevelCollapse}>Levels
                                        <span style={{float: 'right'}}>
                                            <If condition={this.levelsCollapsed}>
                                                <i className={classnames("fa fa-chevron-down", mainStyles["orange-icon"])}/>
                                            </If>
                                            <If condition={!this.levelsCollapsed}>
                                                <i  className={classnames("fa fa-chevron-up", mainStyles["orange-icon"])}/>
                                            </If>
                                        </span>
                                    </div>
                                    <Collapse isOpened={!this.levelsCollapsed}>
                                        <div className={classnames(levelStyles.levels, collapsibleStyles["levels-collapse"])}>
                                            <ul style={{lineHeight: 8, padding: 0}}>
                                                {this.generateLevelRows(OncoKbCard.LEVELS, OncoKbCard.LEVEL_DESC)}
                                            </ul>
                                        </div>
                                    </Collapse>
                                </div>
                            </span>
                    )}
                    {this.props.geneNotExist && (
                            <div className={mainStyles["additional-info"]}>There is currently no information about this gene in OncoKB.</div>
                    )}

                    <div className={mainStyles.footer}>
                        <If condition={this.oncokbLinkOut===undefined}>
                            <Then>
                                {oncokbLogo}
                            </Then>
                            <Else>
                                <a href={`${this.oncokbLinkOut}`} target="_blank">
                                    {oncokbLogo}
                                </a>
                            </Else>
                        </If>
                        <span className={classnames("pull-right", mainStyles.feedback)}>
                            <button className="btn btn-default btn-xs" onClick={this.props.handleFeedbackOpen}>
                                Feedback
                            </button>
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    private handleOncogenicityTabSelect(): void {
        this.handleTabSelect("oncogenicity");
    }

    private handleMutationEffectTabSelect(): void {
        this.handleTabSelect("mutationEffect");
    }

    @action
    handleTabSelect(tabName:'oncogenicity'|'mutationEffect'): void {
        this.activeTab = tabName;
    }

    @action
    handleLevelCollapse(): void {
        this.levelsCollapsed = !this.levelsCollapsed;
    }

    public insertLink(str:string, link:any)
    {
        if (!str) {
            return str;
        }

        const content:Array<string|JSX.Element> = [];
        const parts = str.split(link.keyword);

        content.push(parts[0]);

        const comp = (
            <a
                href={link.link}
                target={link.target || '_blank'}
            >
                {link.keyword}
            </a>
        );

        for (let i = 1; i < parts.length; i++)
        {
            content.push(comp);
            content.push(parts[i]);
        }

        return content;
    }
}
