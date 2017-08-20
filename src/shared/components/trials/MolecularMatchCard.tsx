import * as React from 'react';
import {If, Then, Else} from 'react-if';
import "./styles/molecularCard.scss";
import {Mutation} from "../../api/generated/CBioPortalAPI";

export interface IMolecularMatchCardProps {
    count: number | undefined;
    trials: any;
    sampleIDtoTumorType?: { [sampleId: string]: string };
    mutationData?: Mutation;
}

export interface IMolecularMatchCardState {
    showMoreCollapsed: boolean;
}

export default class MolecularMatchCard extends React.Component<IMolecularMatchCardProps, IMolecularMatchCardState> {

    constructor() {
        super();

        this.state = {
            showMoreCollapsed: true
        };
        this.handleLevelCollapse = this.handleLevelCollapse.bind(this);
    }

    public trialRow(id: string,
                    briefTitle: string,
                    phase: string,
                    count: number,
                    total: number) {

        return (
            <tr key={id} style={{borderBottom: this.getRowStyle(count, total)}}>
                <td key={id + "td"}>
                    <table className="molecular-table">
                        <tbody>
                        <tr key={id + "td1"}>
                            <td key="id" style={{minWidth: '100px', fontSize: '30px'}}>
                                <a style={{color: '#00a5b5'}} href={'https://app.molecularmatch.com/trial/' + id}
                                   target="_blank" className="molecular-row-link">
                                    <b> {id} </b>
                                </a>
                            </td>
                            <td key="briefTitle" colSpan={2} style={{paddingLeft: '10px'}}>{briefTitle}</td>
                        </tr>
                        <tr key={id + "td2"}>
                            <td key="phase"><b>{phase}</b></td>
                            <td key="showMore" colSpan={2} style={{paddingLeft: '10px', color: '#546474'}}>
                                <i style={{color: '#f29e1a'}} className="showmore-icon fa fa-chevron-down fa-2"></i><span>&nbsp;Show more about this trial</span>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        );
    }

    getRowStyle(count: number, total:number): string {
        let style = '1pt solid #00a6b5';
        if (count == total) {
            style = '0';
        }
        return style;
    }


    public generateClinicalTrialRows(trials: any): JSX.Element[] {
        const trialsArr = JSON.parse(trials);
        const rows: JSX.Element[] = [];
        let count = 0;

        for (let trial in trialsArr) {
            if (trialsArr.hasOwnProperty(trial)) {
                rows.push(
                    this.trialRow(
                        trialsArr[trial].id,
                        trialsArr[trial].briefTitle,
                        trialsArr[trial].phase,
                        ++count,
                        trialsArr.length)
                );
            }
        }
        return rows;
    }


    public render() {
        return (
            <div className="mm-card">
                <div className="panel-heading panel-gray result-header">
                    <div className="row">
                        <div className="col-md-10 col-sm-9 col-xs-8">
                            <i className="fa fa-clipboard"></i>&nbsp; Matching Trials |
                            <a href={this.getCondition()}
                               style={{color: '#FFF'}}
                               target="_blank">
                                <span className="trialTotal">{this.props.count}</span>
                            </a>
                        </div>
                    </div>
                </div>

                <div className="scroll-wrapper">
                    <div id="trials" className="widget-main padding-6 no-padding-left no-padding-right trial-results"
                         style={{display: 'block'}}>
                        <If condition={this.props.trials != undefined && this.props.trials.length > 2}>
                            <Then>
                                <table className="molecular-table table-style">
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

    private handleLevelCollapse(): void {
        this.setState(({showMoreCollapsed: !this.state.showMoreCollapsed} as IMolecularMatchCardState));
    }

    private getCondition(): string {

        let key;
        let link = '#';

        if (this.props.sampleIDtoTumorType) {
            for (let i in this.props.sampleIDtoTumorType) {
                key = this.props.sampleIDtoTumorType[i];
            }
        }

        if (this.props.mutationData && key) {
            link = 'https://app.molecularmatch.com/search/' + key + '%20' + this.props.mutationData.gene.hugoGeneSymbol + '%20' + this.props.mutationData.proteinChange;
        }
        return link;
    }
}