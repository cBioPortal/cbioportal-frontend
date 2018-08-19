import * as React from 'react';
import { If, Then, Else } from 'react-if';
import {ITrialMatchVariantData, TrialMatchData} from "shared/model/TrialMatch.ts";
import "./styles/trialCard.scss";
import * as _ from "lodash";
import {ICache} from "../../lib/SimpleCache";
import {ArticleAbstract} from "../../api/generated/OncoKbAPI";
import DefaultTooltip from "../defaultTooltip/DefaultTooltip";
import {mergeAlterations} from "../../lib/OncoKbUtils";

export interface ITrialCardProps {
    title: string;
    geneName: string;
    variants: { [name: string]: ITrialMatchVariantData };
}

export default class TrialCard extends React.Component<ITrialCardProps, {}> {
    constructor() {
        super();
    }

    /**
     * Generate variants
     * @param variantMap
     * @returns {JSX.Element[]}
     */
    public generateVariants(variantMap: { [name: string]: ITrialMatchVariantData }) {
        const list: JSX.Element[] = [];

        if (variantMap) {
            if (!_.isEmpty(variantMap)) {
                for (const name in variantMap) {
                    if (variantMap.hasOwnProperty(name)) {
                        const variant = variantMap[name];

                        for (const trial in variant.matches) {
                            if (variant.matches.hasOwnProperty(trial)) {
                                const trialInfo = trial.split(";");
                                list.push(this.variantItem(trial, variant.matches[trial]));
                            }
                        }
                    }
                }
            }
        }

        return list;
    }

    public trialMatchRow(index:number, match: TrialMatchData)
    {
        return (
            <tr key={index}>
                <td key="arm code">{match.code}</td>
                <td key="molecular type">{match.matchMolecularType}</td>
                <td key="cancer type">{match.matchCancerType}</td>
                <td key="dose">{match.dose.split(":")[0]}</td>
            </tr>
        );
    }

    public generateTrialMatchRows(matches:TrialMatchData[]):JSX.Element[]
    {
        const rows:JSX.Element[] = [];

        matches.forEach((match:TrialMatchData, index:number) => {
            rows.push(
                this.trialMatchRow(index, match));
        });

        return rows;
    }

    /**
     * Get variant item
     * @param trialTitle
     * @param matches
     * @returns {any}
     */
    public variantItem(trialTitle:string, matches:TrialMatchData[]) {
        let result;
        const url: string = "https://clinicaltrials.gov/ct2/show/"+matches[0].nctID;
        const img = matches[0].status === 'open'? require('./images/open-sign.png') : require('./images/close-sign.png');
        if (matches) {
            result = (
                <div className="trial-card">
                    <div className="tip-header">
                        <a href={url}><img src={img} className="trial-logo"/>{trialTitle}</a>
                    </div>
                    <div>
                        <If condition={this.props.variants} >
                            <div className="treatments-wrapper">
                                <table className="table" style={{marginTop:6}}>
                                    <thead>
                                    <tr>
                                        <th key="code" scope="col">Arm Code</th>
                                        <th key="type" scope="col">Match Molecular Type</th>
                                        <th key="cancerType" scope="col">Match Cancer Type</th>
                                        <th key="drug" scope="col">Drug</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {
                                        this.generateTrialMatchRows(matches)
                                    }
                                    </tbody>
                                </table>
                            </div>
                        </If>
                    </div>
                </div>

            );
        } else {
            result = (
                <div className="trial-card-variant">
                    <div className="trial-card-variant-description summary">Information about the oncogenic activity of
                        this alteration is not yet available.
                    </div>
                </div>
            );
        }
        return result;
    }

    public getTrialTitle(variantMap: { [name: string]: ITrialMatchVariantData }, title:string) {
        if (variantMap) {
            if (!_.isEmpty(variantMap)) {
                for (const name in variantMap) {
                    if (variantMap.hasOwnProperty(name)) {
                        const variant = variantMap[name];
                        if (variant.exonNumber) {
                            if (variant.oncogenicity && variant.mutEffect && variant.oncogenicity !== 'Unknown'
                                    && variant.mutEffect !== 'Unknown') {
                               return (
                                   <span>{title}<br />{variant.gene}&nbsp;{variant.name}&nbsp;
                                       (Exon {variant.exonNumber.replace(".0","")})<br />
                                       {variant.oncogenicity}&nbsp;&amp;&nbsp;{variant.mutEffect}</span>);
                            } else {
                                return (<span>{title}<br />{variant.gene}&nbsp;{variant.name}&nbsp;
                                    (Exon {variant.exonNumber.replace(".0","")})</span>);
                            }
                        } else {
                            if (variant.oncogenicity && variant.mutEffect && variant.oncogenicity !== 'Unknown'
                                    && variant.mutEffect !== 'Unknown') {
                                return (<span>{title}<br />{variant.gene}&nbsp;{variant.name}<br />
                                    {variant.oncogenicity}&nbsp;&amp;&nbsp;{variant.mutEffect}</span>);
                            } else {
                                return (<span>{title}<br />{variant.gene}&nbsp;{variant.name}</span>);
                            }
                        }
                    }
                }
            }
        }
    }
    /**
     * Render civic card component
     * @returns {any}
     */
    public render() {
        return (
            <div className="trial-card">
                <div className="trial-card-trial-header">
                    {this.getTrialTitle(this.props.variants, this.props.title)}
                </div>
                <div className="col s12">
                    <ul>
                        {this.generateVariants(this.props.variants)}
                    </ul>
                </div>
                <div className="item disclaimer">
                    <span>
                        Disclaimer: This resource is intended for purely research purposes.
                        It should not be used for medical or professional advice.
                    </span>
                </div>
            </div>
        );
    }
}
