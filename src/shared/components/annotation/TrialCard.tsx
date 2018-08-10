import * as React from 'react';
import { If, Then, Else } from 'react-if';
import { ITrialMatchVariantData } from "shared/model/TrialMatch.ts";
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

                        for (const trial in variant.match) {
                            if (variant.match.hasOwnProperty(trial)) {
                                const trialInfo = trial.split(";");
                                list.push(this.variantItem(trialInfo[0], trialInfo[1], trialInfo[2],
                                                           variant.match[trial].split(";")));
                            }
                        }
                    }
                }
            }
        }

        return list;
    }

    public trialMatchRow(index:number, match: string[])
    {
        return (
            <tr key={index}>
                <td key="arm code">{match[0]}</td>
                <td key="match level">{match[2]}</td>
                <td key="match type">{match[3]}</td>
                <td key="dose">{match[1]}</td>
            </tr>
        );
    }

    public generateTrialMatchRows(arms:any[]):JSX.Element[]
    {
        const rows:JSX.Element[] = [];

        arms.forEach((arm:string, index:number) => {
            rows.push(
                this.trialMatchRow(index, arm.split(",")));
        });

        return rows;
    }

    /**
     * Get variant item
     * @param url
     * @param name
     * @param entryTypes
     * @param description
     * @returns {any}
     */
    public variantItem(trialTitle?:string, nctId?:string, trialStatus?:string, arms?:any) {
        let result;
        const url: string = "https://clinicaltrials.gov/ct2/show/"+nctId;
        const img = trialStatus === 'open'? require('./images/open-sign.png') : require('./images/close-sign.png');
        if (trialTitle || trialStatus || nctId) {
            result = (
                <div className="trial-card">
                    <div className="trial-card-trial-header">
                        <span className="civic-card-variant-name">
                            <a href={url}>{trialTitle}
                                <img src={img} className="trial-logo"/>
                            </a>
                        </span>
                    </div>
                    <div>
                        <If condition={this.props.variants} >
                            <div className="treatments-wrapper">
                                <table className="table" style={{marginTop:6}}>
                                    <thead>
                                    <tr>
                                        <th key="code" scope="col">Arm Code</th>
                                        <th key="level" scope="col">Match Level</th>
                                        <th key="type" scope="col">Match Type</th>
                                        <th key="Drug" scope="col">Dose</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {
                                        this.generateTrialMatchRows(arms)
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
                <div className="civic-card-variant">
                    <div className="civic-card-variant-description summary">Information about the oncogenic activity of
                        this alteration is not yet available.
                    </div>
                </div>
            );
        }
        return result;
    }

    /**
     * Render civic card component
     * @returns {any}
     */
    public render() {
        return (
            <div className="trial-card">
                <div className="col s12 tip-header">
                    <span>{this.props.title}</span>
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
