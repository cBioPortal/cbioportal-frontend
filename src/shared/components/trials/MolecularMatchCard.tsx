import * as React from 'react';
import * as _ from 'lodash';
import Collapse from 'react-collapse';
import {If, Then, Else} from 'react-if';
import DefaultTooltip from 'shared/components/DefaultTooltip';
import {mergeAlterations} from 'shared/lib/OncoKbUtils';
import {ICache} from "shared/lib/SimpleCache";
// TODO these need to be defined as modules, and class names used in this component need to be updated
import "./styles/molecularCard.scss";

export interface IMolecularMatchCardProps {
    count: number | undefined;
    trials: any;
    // handleFeedbackOpen?: React.EventHandler<any>;
}

export interface IMolecularMatchCardState {
    // activeTab: "oncogenicity" | "mutationEffect";
    showMoreCollapsed: boolean;
}

export default class MolecularMatchCard extends React.Component<IMolecularMatchCardProps, IMolecularMatchCardState>
{
    // public static get PHASES(): string[]
    // {
    //     return ['1', '2', '3', '4'];
    // }
    //
    // public static get LEVEL_ICON_STYLE()
    // {
    //     return {
    //         backgroundImage: `url(${require('./images/levels_colors_v2_09302016.png')})`
    //     };
    // }

    // public static get LEVEL_DESC(): {[level:string]: JSX.Element}
    // {
    //     return {
    //         '1': (<span><b>FDA-recognized</b> biomarker predictive of response to an <b>FDA-approved</b> drug <b>in this indication</b></span>),
    //         '2A': (<span><b>Standard care</b> biomarker predictive of response to an <b>FDA-approved</b> drug <b>in this indication</b></span>),
    //         '2B': (<span><b>Standard care</b> biomarker predictive of response to an <b>FDA-approved</b> drug <b>in another indication</b>, but not standard care for this indication</span>),
    //         '3A': (<span><b>Compelling clinical evidence</b> supports the biomarker as being predictive of response to a drug <b>in this indication</b>, but neither biomarker and drug are standard care</span>),
    //         '3B': (<span><b>Compelling clinical evidence</b> supports the biomarker as being predictive of response to a drug <b>in another indication</b>, but neither biomarker and drug are standard care</span>),
    //         '4': (<span><b>Compelling biological evidence</b> supports the biomarker as being predictive of response to a drug, but neither biomarker and drug are standard care</span>),
    //         'R1': (<span><b>Standard care</b> biomarker predictive of <b>resistance</b> to an <b>FDA-approved</b> drug <b>in this indication</b></span>)
    //     };
    // }

    constructor()
    {
        super();

        this.state = {
            showMoreCollapsed: true
        };

        // this.handleOncogenicityTabSelect = this.handleOncogenicityTabSelect.bind(this);
        // this.handleMutationEffectTabSelect = this.handleMutationEffectTabSelect.bind(this);
        this.handleLevelCollapse = this.handleLevelCollapse.bind(this);
    }

    // TODO abstracts:Abstract[]
    public trialRow(id:string,
                        briefTitle:string,
                        phase:string,
                        slots:number)
    {
        console.log("trial row created");
        // const levelTooltipContent = () => (
        //     <div style={{maxWidth: "200px"}}>
        //         {levelDes}
        //     </div>
        // );

        // const trrialTooltipContent = (abstracts.length > 0 || pmids.length > 0) ?
        //     () => (
        //         <div style={{maxWidth: "400px", maxHeight: "200px", overflowY: "auto"}}>
        //             <ul className="list-group" style={{marginBottom: 0}}>
        //                 {this.abstractList(abstracts)}
        //                 {this.pmidList(pmids, pmidData)}
        //             </ul>
        //         </div>
        //     ) : <span/>;

        // qtip-content="{{levelDes}}" position-my="top center" position-at="bottom center"
        // qtip-treatment-index={treatmentIndex} position-my="top right" position-at="bottom left"
        return (
<tr key={id} style={{borderBottom: '1pt solid #00a6b5'}}>
    <td key={id+"td"}>
    <table className="molecular-table">
        <tbody>
        <tr key={id+"td1"}>
            <td key="id" style={{minWidth:'120px'}}>
                <a href={'/trial/NCT02967692?sk=BJfUBamrW&amp;lc='} className="molecular-row-link">
                    <div className="bs-tooltip" style={{display: 'inline-block'}} title="" data-toggle="tooltip" data-placement="left" data-original-title="High confidence drugs matched your molecular target and your condition on the FDA label">
                <button style={{backgroundColor:'#00a6b5'}} type="button" className="btn btn-drug-legend-high">{id}
            </button>
                    </div>
                </a>
            </td>
            <td key="briefTitle" colSpan={2} style={{padding: '10px 10px 10px 10px'}}>{briefTitle}</td>
        </tr>
        <tr key={id+"td2"}>
            <td key="phase"><b> {phase} &ensp;&ensp;Slots: {slots} &ensp;&ensp; </b></td>
            <td key="showMore"><div className="drug-item-footer ">
                {/*<div className="drug-item-more center show-more-drug-link">*/}
                <i className="showmore-icon fa fa-chevron-down fa-2"></i><span>Show more about this trial</span>
                {/*</div>*/}
            </div></td>
            {/*<td key="slots">{slots} <div className="drug-item-footer ">*/}
                {/*/!*<div className="drug-item-more center show-more-drug-link">*!/*/}
                    {/*<i className="showmore-icon fa fa-chevron-down fa-2"></i><span>Show more about this trial</span>*/}
                {/*/!*</div>*!/*/}
            {/*</div></td>*/}
        </tr>
        {/*<tr key={id+"td3"}>*/}
            {/*<td key="showMore" colSpan={2}><div className="drug-item-footer ">*/}
                {/*<div className="drug-item-more center show-more-drug-link">*/}
                    {/*<i className="showmore-icon fa fa-chevron-down fa-2"></i><span>Show more about this trial</span>*/}
                {/*</div>*/}
            {/*</div></td>*/}
        {/*</tr>*/}
        </tbody>
    </table>
    </td>
</tr>
        );
    }

    // public levelListItem(level:string, levelDes:JSX.Element)
    // {
    //     return (
    //         <li key={level}>
    //             <i
    //                 className={`level-icon level-${level}`}
    //                 style={OncoKbCard.LEVEL_ICON_STYLE}
    //             />
    //             {levelDes}
    //         </li>
    //     );
    // }

    // public pmidList(pmids:number[], pmidData:ICache<any>)
    // {
    //     const list:JSX.Element[] = [];
    //
    //     pmids.forEach((uid:number) => {
    //         const cacheData = pmidData[uid.toString()];
    //         const articleContent = cacheData ? cacheData.data : null;
    //
    //         if (articleContent)
    //         {
    //             list.push(
    //                 this.pmidItem(articleContent.title,
    //                     (_.isArray(articleContent.authors) && articleContent.authors.length > 0) ? (articleContent.authors[0].name + ' et al.') : 'Unknown',
    //                     articleContent.source,
    //                     (new Date(articleContent.pubdate)).getFullYear().toString(),
    //                     articleContent.uid)
    //             );
    //         }
    //     });
    //
    //
    //     return list;
    // }

    // public pmidItem(title:string, author:string, source:string, date:string, pmid:string)
    // {
    //     return (
    //         <li key={pmid} className="list-group-item" style={{width: "100%"}}>
    //             <a href={`http://www.ncbi.nlm.nih.gov/pubmed/${pmid}`} target="_blank">
    //                 <b>{title}</b>
    //             </a>
    //             <br/>
    //             <div style={{width: "100%"}}>
    //                 {author} {source}. {date} <span style={{float: "right"}}>PMID: {pmid}</span>
    //             </div>
    //         </li>
    //     );
    // }

    // public abstractList(abstracts:any[])
    // {
    //     const list:JSX.Element[] = [];
    //
    //     abstracts.forEach((abstract:any, index:number) => {
    //         list.push(this.abstractItem(index, abstract.abstract, abstract.link));
    //     });
    //
    //     return list;
    // }

    // public abstractItem(key:number, abstract:string, link?:string)
    // {
    //     let content = (<b>{abstract}</b>);
    //
    //     if (link) {
    //         content = (
    //             <a href={link} target="_blank">
    //                 {content}
    //             </a>
    //         );
    //     }
    //
    //     return (
    //         <li key={`abstract_${key}`} className="list-group-item" style={{width: "100%"}}>
    //             {content}
    //         </li>
    //     );
    // }

    // public generateLevelRows(levels:string[], levelDes:{[level:string]: JSX.Element}):JSX.Element[]
    // {
    //     const rows:JSX.Element[] = [];
    //
    //     levels.forEach((level) => {
    //         rows.push(this.levelListItem(level, levelDes[level]));
    //     });
    //
    //     return rows;
    // }

    public generateClinicalTrialRows(trials:any):JSX.Element[]
    {
        console.log("sathya : "+ trials);
        var trialsArr = JSON.parse(trials);
        const rows:JSX.Element[] = [];

        for (var trial in trialsArr) {
            if (trialsArr.hasOwnProperty(trial)) {
                console.log("$$$$$$$$$$$$$$$$$$$$$$" + trialsArr[trial].id);
                console.log("$$$$$$$$$$$$$$$$$$$$$$" + trialsArr[trial].phase);
                rows.push(

                    this.trialRow(
                        trialsArr[trial].id,
                        trialsArr[trial].briefTitle,
                        trialsArr[trial].phase,
                        6)
                );
            }
        }
        // trialsArr.forEach((trial:any) => {
        //     rows.push(
        //         this.trialRow(
        //             trial.id,
        //             trial.briefTitle,
        //             trial.phase,
        //             6)
        //     );
        // });

        console.log("trials done");
        return rows;
    }

    // TODO we should replace the tabs with an actual ReactBootstrap Tab,
    // also divide this component into smaller components
    public render()
    {
        return (
            <div classID="mm-card">
                <div className="panel-heading panel-gray result-header">
                    <div className="row">
                        <div className="col-md-10 col-sm-9 col-xs-8">
                                <i className="fa fa-clipboard"></i>&nbsp; Matching Trials | <span className="trialTotal">{this.props.count}</span>
                        </div>
                    </div>
                </div>


                <div className="scroll-wrapper">
                    <div id="trials" className="widget-main padding-6 no-padding-left no-padding-right trial-results" style={{display: 'block'}}>
                        <If condition={this.props.trials !== undefined && this.props.trials.length > 2}>
                            <Then>
                                <table className="molecular-table">
                                    <tbody>
                                {

                                    this.generateClinicalTrialRows(this.props.trials)
                                }
                                    </tbody>
                                </table>
                            </Then>
                            <Else>

                                <span><br/><br/>No trial matches found in MolecularMatch.</span>
                            </Else>
                        </If>
                    </div>
                </div>
            </div>
        );
    }

    // private handleOncogenicityTabSelect(): void {
    //     this.handleTabSelect("oncogenicity");
    // }

    // private handleMutationEffectTabSelect(): void {
    //     this.handleTabSelect("mutationEffect");
    // }

    // private handleTabSelect(tabName:'oncogenicity'|'mutationEffect'): void {
    //     this.setState(({activeTab : tabName} as IOncoKbCardState));
    // }

    private handleLevelCollapse(): void {
        this.setState(({showMoreCollapsed : !this.state.showMoreCollapsed} as IMolecularMatchCardState));
    }

    // public insertLink(str:string, link:any)
    // {
    //     if (!str) {
    //         return str;
    //     }
    //
    //     const content:Array<string|JSX.Element> = [];
    //     const parts = str.split(link.keyword);
    //
    //     content.push(parts[0]);
    //
    //     const comp = (
    //         <a
    //             href={link.link}
    //             target={link.target || '_blank'}
    //         >
    //             {link.keyword}
    //         </a>
    //     );
    //
    //     for (let i = 1; i < parts.length; i++)
    //     {
    //         content.push(comp);
    //         content.push(parts[i]);
    //     }
    //
    //     return content;
    // }

    // public refComponent(str:string, componentType:'tooltip'|'linkout')
    // {
    //     const parts = str.split(/pmid|nct/i);
    //
    //     if (parts.length < 2) {
    //         return null;
    //     }
    //
    //     const ids = parts[1].match(/[0-9]+/g);
    //
    //     if (!ids) {
    //         return null;
    //     }
    //
    //     let baseUrl:string|undefined;
    //     let prefix:string|undefined;
    //
    //     if (str.toLowerCase().indexOf("pmid") >= 0) {
    //         baseUrl = "http://www.ncbi.nlm.nih.gov/pubmed/";
    //         prefix = "PMID: ";
    //     }
    //     else if (str.toLowerCase().indexOf("nct") >= 0) {
    //         baseUrl = "http://www.ncbi.nlm.nih.gov/pubmed/";
    //         prefix = "NCT";
    //     }
    //
    //     let link:JSX.Element|undefined;
    //
    //     if (baseUrl && prefix) {
    //         link = (
    //             <a
    //                 target="_blank"
    //                 href={`${baseUrl}${ids.join(",")}`}
    //             >
    //                 {`${prefix}${ids.join(",")}`}
    //             </a>
    //         );
    //     }
    //
    //     if (componentType === 'tooltip')
    //     {
    //         const tooltipContent = () => (
    //             <div style={{maxWidth: "400px", maxHeight: "200px", overflowY: "auto"}}>
    //                 <ul className="list-group" style={{marginBottom: 0}}>
    //                     {this.pmidList(ids.map((id:string) => parseInt(id)), this.props.pmidData)}
    //                 </ul>
    //             </div>
    //         );
    //
    //         return (
    //             <span>
    //                 {parts[0]}
    //                 <DefaultTooltip
    //                     overlay={tooltipContent}
    //                     placement="right"
    //                     trigger={['hover', 'focus']}
    //                     destroyTooltipOnHide={true}
    //                 >
    //                     <i className="fa fa-book" style={{color: "black"}}/>
    //                 </DefaultTooltip>
    //                 {`)`}
    //             </span>
    //         );
    //     }
    //     else if (link)
    //     {
    //         return (
    //             <span>
    //                 {parts[0]}
    //                 {link}
    //                 {`)`}
    //             </span>
    //         );
    //     }
    //     else {
    //         return null;
    //     }
    // }

    // public summaryWithRefs(str:string|undefined, type:'tooltip'|'linkout')
    // {
    //     if (!str) {
    //         return str;
    //     }
    //
    //     const content:Array<string|JSX.Element> = [];
    //
    //     // example delimiters:
    //     //     (PMID: 11900253)
    //     //     (PMID: 11753428, 16007150, 21467160)
    //     //     (cBioPortal, MSKCC, May 2015, PMID: 24718888)
    //     //     (NCT1234567)
    //     const regex = /(\(.*?[PMID|NCT].*?\))/i;
    //
    //     // split the string with delimiters included
    //     const parts = str.split(regex);
    //
    //     parts.forEach((part:string) => {
    //         // if delimiter convert to a JSX component
    //         if(part.match(regex))
    //         {
    //             let component:JSX.Element|null = this.refComponent(part, type);
    //
    //             if (component) {
    //                 content.push(component);
    //             }
    //         }
    //         else {
    //             content.push(part);
    //         }
    //     });
    //
    //     return content;
    // }
}