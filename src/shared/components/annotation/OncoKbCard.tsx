import * as React from 'react';
import * as _ from 'lodash';
import Collapse from 'react-collapse';
import {If, Then, Else} from 'react-if';
import DefaultTooltip from 'shared/components/DefaultTooltip';
import {mergeAlterations} from 'shared/lib/OncoKbUtils';
// TODO these need to be defined as modules, and class names used in this component need to be updated
import "./styles/oncoKbCard.scss";
import "./styles/oncoKbCard.custom.scss";

export interface IOncoKbCardProps {
    title: string;
    gene: string;
    oncogenicity: string;
    oncogenicityPmids: number[];
    mutationEffect: string;
    mutationEffectPmids: number[];
    geneSummary: string;
    variantSummary: string;
    tumorTypeSummary: string;
    biologicalSummary: string;
    treatments: any[];
    pmids: any;
    handleFeedbackOpen?: React.EventHandler<any>;
}

export interface IOncoKbCardState {
    activeTab: "oncogenicity" | "mutationEffect";
    levelsCollapsed: boolean;
}

export default class OncoKbCard extends React.Component<IOncoKbCardProps, IOncoKbCardState>
{
    public static get LEVELS(): string[]
    {
        return ['1', '2A', '2B', '3A', '3B', '4', 'R1'];
    }

    public static get LEVEL_DESC(): {[level:string]: JSX.Element}
    {
        return {
            '1': (<span><b>FDA-recognized</b> biomarker predictive of response to an <b>FDA-approved</b> drug <b>in this indication</b></span>),
            '2A': (<span><b>Standard care</b> biomarker predictive of response to an <b>FDA-approved</b> drug <b>in this indication</b></span>),
            '2B': (<span><b>Standard care</b> biomarker predictive of response to an <b>FDA-approved</b> drug <b>in another indication</b>, but not standard care for this indication</span>),
            '3A': (<span><b>Compelling clinical evidence</b> supports the biomarker as being predictive of response to a drug <b>in this indication</b>, but neither biomarker and drug are standard care</span>),
            '3B': (<span><b>Compelling clinical evidence</b> supports the biomarker as being predictive of response to a drug <b>in another indication</b>, but neither biomarker and drug are standard care</span>),
            '4': (<span><b>Compelling biological evidence</b> supports the biomarker as being predictive of response to a drug, but neither biomarker and drug are standard care</span>),
            'R1': (<span><b>Standard care</b> biomarker predictive of <b>resistance</b> to an <b>FDA-approved</b> drug <b>in this indication</b></span>)
        };
    }

    constructor()
    {
        super();

        this.state = {
            activeTab: "oncogenicity",
            levelsCollapsed: true
        };

        this.handleOncogenicityTabSelect = this.handleOncogenicityTabSelect.bind(this);
        this.handleMutationEffectTabSelect = this.handleMutationEffectTabSelect.bind(this);
        this.handleLevelCollapse = this.handleLevelCollapse.bind(this);
    }

    // TODO abstracts:Abstract[]
    public treatmentRow(index:number,
                        level:string,
                        levelDes:JSX.Element,
                        variant:string|string[],
                        treatment:string,
                        cancerType: string,
                        pmidData: any,
                        pmids:number[],
                        abstracts:any[])
    {
        const arrowContent = <div className="rc-tooltip-arrow-inner"/>;

        const levelTooltipContent = (
            <div style={{maxWidth: "200px"}}>
                {levelDes}
            </div>
        );

        let treatmentTooltipContent = <span/>;

        if (abstracts.length > 0 || pmids.length > 0)
        {
            treatmentTooltipContent = (
                <div style={{maxWidth: "400px", maxHeight: "200px", overflowY: "auto"}}>
                    <ul className="list-group" style={{marginBottom: 0}}>
                        {this.abstractList(abstracts)}
                        {this.pmidList(pmids, pmidData.result)}
                    </ul>
                </div>
            );
        }

        // qtip-content="{{levelDes}}" position-my="top center" position-at="bottom center"
        // qtip-treatment-index={treatmentIndex} position-my="top right" position-at="bottom left"
        return (
            <tr key={index}>
                <td key="level">
                    <DefaultTooltip
                        overlay={levelTooltipContent}
                        placement="left"
                        trigger={['hover', 'focus']}
                        arrowContent={arrowContent}
                    >
                        <i className={`level-icon level-${level}`}/>
                    </DefaultTooltip>
                </td>
                <td key="alterations">{mergeAlterations(variant)}</td>
                <td key="treatment">{treatment}</td>
                <td key="cancerType">{cancerType}</td>
                <td key="citations">
                    <If condition={abstracts.length > 0 || pmids.length > 0}>
                        <DefaultTooltip
                            overlay={treatmentTooltipContent}
                            placement="right"
                            trigger={['hover', 'focus']}
                            arrowContent={arrowContent}
                        >
                            <i className="fa fa-book"/>
                        </DefaultTooltip>
                    </If>
                </td>
            </tr>
        );
    }

    public levelListItem(level:string, levelDes:JSX.Element)
    {
        return (
            <li key={level}>
                <i className={`level-icon level-${level}`}/>
                {levelDes}
            </li>
        );
    }

    public pmidList(pmids:number[], articlesData:any)
    {
        const list:JSX.Element[] = [];

        if (articlesData &&
            _.isArray(articlesData.uids) &&
            articlesData.uids.length > 0)
        {
            pmids.forEach((uid:number) => {
                const articleContent = articlesData[uid];

                if (articleContent)
                {
                    list.push(
                        this.pmidItem(articleContent.title,
                            (_.isArray(articleContent.authors) && articleContent.authors.length > 0) ? (articleContent.authors[0].name + ' et al.') : 'Unknown',
                            articleContent.source,
                            (new Date(articleContent.pubdate)).getFullYear().toString(),
                            articleContent.uid)
                    );
                }
            });
        }

        return list;
    }

    public pmidItem(title:string, author:string, source:string, date:string, pmid:string)
    {
        return (
            <li key={pmid} className="list-group-item" style={{width: "100%"}}>
                <a href={`http://www.ncbi.nlm.nih.gov/pubmed/${pmid}`} target="_blank">
                    <b>{title}</b>
                </a>
                <br/>
                <div style={{width: "100%"}}>
                    {author} {source}. {date} <span style={{float: "right"}}>PMID: {pmid}</span>
                </div>
            </li>
        );
    }

    public abstractList(abstracts:any[])
    {
        const list:JSX.Element[] = [];

        abstracts.forEach((abstract:any, index:number) => {
            list.push(this.abstractItem(index, abstract.abstract, abstract.link));
        });

        return list;
    }

    public abstractItem(key:number, abstract:string, link?:string)
    {
        let content = (<b>{abstract}</b>);

        if (link) {
            content = (
                <a href={link} target="_blank">
                    {content}
                </a>
            );
        }

        return (
            <li key={`abstract_${key}`} className="list-group-item" style={{width: "100%"}}>
                {content}
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

    public generateTreatmentRows(treatments:any[], levelDes:{[level:string]: JSX.Element}, pmidData:any):JSX.Element[]
    {
        const rows:JSX.Element[] = [];

        treatments.forEach((treatment:any, index:number) => {
            rows.push(
                this.treatmentRow(index,
                    treatment.level,
                    levelDes[treatment.level],
                    treatment.variant,
                    treatment.treatment,
                    treatment.cancerType,
                    pmidData,
                    treatment.pmids,
                    treatment.abstracts)
            );
        });

        return rows;
    }

    // TODO we should replace the tabs with an actual ReactBootstrap Tab,
    // also divide this component into smaller components
    public render()
    {
        return (
            <div className="oncokb-card">
                <div className="z-depth-2">
                    <If condition={this.props.gene.length > 0}>
                        <Then>
                            <span>
                                <div className="item tabs-wrapper">
                                    <div className="col s12 tip-header">
                                        {this.props.title}
                                    </div>
                                    <div className="col s12">
                                        <ul className="tabs">
                                            <li key="oncogenicity" className="tab col s6 enable-hover">
                                                <a
                                                    className="oncogenicity"
                                                    onClick={this.handleOncogenicityTabSelect}
                                                >
                                                    <span className="title">clinical implications</span>
                                                    <span className="title-content">{this.props.oncogenicity}</span>
                                                </a>
                                            </li>
                                            <li key="mutationEffect" className="tab col s6 enable-hover">
                                                <a
                                                    className="mutation-effect"
                                                    onClick={this.handleMutationEffectTabSelect}
                                                >
                                                    <span className="title">Biological Effect</span>
                                                    <span className="title-content">{this.props.mutationEffect}</span>
                                                </a>
                                            </li>
                                            <div className="indicator"/>
                                        </ul>
                                    </div>
                                    <If condition={this.state.activeTab === "oncogenicity"}>
                                        <div className="col s12 oncogenicity">
                                            <div className="summary" style={{padding:'10px 0'}}>
                                                <p>
                                                    {this.props.geneSummary}
                                                </p>
                                                <p>
                                                    {
                                                        this.insertLink(this.props.variantSummary, {
                                                            keyword: 'Chang et al. 2016',
                                                            link: 'https://www.ncbi.nlm.nih.gov/pubmed/26619011'
                                                        })
                                                    }
                                                </p>
                                                <p>
                                                    {this.props.tumorTypeSummary}
                                                </p>
                                            </div>
                                            <If condition={this.props.treatments.length > 0}>
                                                <div>
                                                    <table className="table" style={{marginTop:6}}>
                                                        <thead>
                                                            <tr>
                                                                <th key="level" scope="col">Level</th>
                                                                <th key="alterations" scope="col">Alteration(s)</th>
                                                                <th key="drugs" scope="col">Drug(s)</th>
                                                                <th key="cancerTypes" scope="col">Level-associated<br/>cancer type(s)</th>
                                                                <th key="citations" scope="col">Citation(s)</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {
                                                                this.generateTreatmentRows(this.props.treatments,
                                                                    OncoKbCard.LEVEL_DESC,
                                                                    this.props.pmids)
                                                            }
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </If>
                                        </div>
                                    </If>
                                    <If condition={this.state.activeTab === "mutationEffect"}>
                                        <div className="col s12 tab-pane mutation-effect">
                                            <If condition={this.props.biologicalSummary && this.props.biologicalSummary.length > 0}>
                                                <Then>
                                                    <div>
                                                        {this.props.biologicalSummary}
                                                    </div>
                                                </Then>
                                                <Else>
                                                    <If condition={this.props.mutationEffectPmids.length > 0}>
                                                        <Then>
                                                            <div className="refs">
                                                                <ul className="list-group" style={{marginBottom: 0}}>
                                                                    {
                                                                        this.pmidList(
                                                                            this.props.mutationEffectPmids,
                                                                            this.props.pmids.result
                                                                        )
                                                                    }
                                                                </ul>
                                                            </div>
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

                                <div className="item disclaimer">
                                    <span>
                                        The information above is intended for research purposes only and should not be used as a
                                        substitute for professional diagnosis and treatment.
                                    </span>
                                </div>

                                <div className="item-list levels-wrapper">
                                    <div className="collapsible-header" onClick={this.handleLevelCollapse}>Levels
                                        <span className="secondary-content">
                                            <If condition={this.state.levelsCollapsed}>
                                                <i className="fa fa-chevron-down"/>
                                            </If>
                                            <If condition={!this.state.levelsCollapsed}>
                                                <i className="fa fa-chevron-up"/>
                                            </If>
                                        </span>
                                    </div>
                                    <Collapse isOpened={!this.state.levelsCollapsed}>
                                        <div className="levels oncokb-card-levels-collapse">
                                            <ul>
                                                {this.generateLevelRows(OncoKbCard.LEVELS, OncoKbCard.LEVEL_DESC)}
                                            </ul>
                                        </div>
                                    </Collapse>
                                </div>
                            </span>
                        </Then>
                        <Else>
                            <div className="additional-info">There is currently no information about this gene in OncoKB.</div>
                        </Else>
                    </If>

                    <div className="item footer">
                        <a href="http://oncokb.org/#/gene/{{gene}}" target="_blank">
                            <img src={require("./images/oncokb.png")} className="oncokb-logo" alt="OncoKB"/>
                        </a>
                        <span className="pull-right feedback">
                            <button className="btn btn-default btn-sm" onClick={this.props.handleFeedbackOpen}>
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

    private handleTabSelect(tabName:'oncogenicity'|'mutationEffect'): void {
        this.setState(({activeTab : tabName} as IOncoKbCardState));
    }

    private handleLevelCollapse(): void {
        this.setState(({levelsCollapsed : !this.state.levelsCollapsed} as IOncoKbCardState));
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
