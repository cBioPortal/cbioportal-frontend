import * as React from 'react';
import { If, Then, Else } from 'react-if';
import { ITrialMatchVariantData } from "shared/model/TrialMatch.ts";
import "./styles/trialCard.scss";
import * as _ from "lodash";

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
            if (_.isEmpty(variantMap)) {
                list.push(this.variantItem());
            } else {
                for (const name in variantMap) {
                    if (variantMap.hasOwnProperty(name)) {
                        const variant = variantMap[name];
                        let trialTitle: string;
                        let nctId: string;
                        let trialStatus: string;
                        let code: string;

                        for (const trial in variant.match) {
                            if (variant.match.hasOwnProperty(trial)) {
                                const trialInfo = trial.split(";");
                                trialTitle = trialInfo[0];
                                nctId = trialInfo[1];
                                trialStatus = trialInfo[2];
                                const arms = variant.match[trial].split(";");
                                arms.forEach(arm => {
                                    const matchItems = arm.split(",");
                                    list.push(this.variantItem(variant.name, trialTitle, variant.gene, code,
                                        variant.oncogenicity, variant.mutEffect, nctId, trialStatus, matchItems[0]));
                                });
                            }
                        }
                    }
                }
            }
        } else {
            list.push(this.variantItem());
        }

        return list;
    }

    /**
     * Get variant item
     * @param url
     * @param name
     * @param entryTypes
     * @param description
     * @returns {any}
     */
    public variantItem(name?: string, trialTitle?: string, gene?: string, code?: string, oncogenicity?:string,
                       mutEffect?:string, nctId?:string, trialStatus?: string, dose?: string) {
        let result;
        const url: string = "https://clinicaltrials.gov/ct2/show/"+nctId;
        const img = trialStatus === 'open'? require('./images/open-sign.png') : require('./images/close-sign.png');
        if (name || trialTitle || gene || nctId) {
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
                        <div>
                            <table className="table" style={{marginTop:6}}>
                                <thead>
                                <tr>
                                    <th key="arm" scope="col">Arm Code</th>
                                    <th key="match_level" scope="col">Gene</th>
                                    <th key="alteration" scope="col">Alteration</th>
                                    <th key="oncogenic" scope="col">Implication</th>
                                    <th key="mutation_effect" scope="col">Effect</th>
                                    <th key="dose" scope="col">Drug</th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr>
                                    <td>{code}</td>
                                    <td>{gene}</td>
                                    <td>{name}</td>
                                    <td>{oncogenicity}</td>
                                    <td>{mutEffect}</td>
                                    <td>{dose}</td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
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
