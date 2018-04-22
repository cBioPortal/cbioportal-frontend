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
                for (let name in variantMap) {
                    let variant = variantMap[name];
                    let trialTitle: string = '';
                    for (const title in variant.match) {
                        trialTitle += trialTitle.toLowerCase() + ': ' + variant.match[title] + ', ';
                    }
                    trialTitle = trialTitle.slice(0, -2) + '.';

                    list.push(this.variantItem(variant.name, trialTitle, variant.gene));
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
    public variantItem(name?: string, trialTitle?: string, gene?: string) {
        let result;

        if (name || trialTitle || gene) {
            result = (
                <div className="civic-card-variant">
                    <div className="civic-card-variant-header">
                        <span className="civic-card-variant-name">{name}</span>
                        <span className="civic-card-variant-entry-types"> Trial: {trialTitle}</span>
                    </div>
                    <div className="civic-card-variant-description summary">{gene}</div>
                </div>
            );
        } else {
            result = (
                <div className="civic-card-variant">
                    <div className="civic-card-variant-description summary">Information about the oncogenic activity of
                        this alteration is not yet available in CIViC.
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
                <div className="trial-card-trial-header">
                    <span>
                    <a href="https://clinicaltrials.gov/ct2/show/NCT03297606"
                       className="oncokb-logo">Canadian Profiling and Targeted Agent Utilization Trial
                        <img src={require("./images/open-sign.png")} className="trial-logo"/>
                    </a>
                    </span>
                </div>
                <div>
                    <table className="table" style={{marginTop:6}}>
                        <thead>
                        <tr>
                            <th key="match_type" scope="col">Arm</th>
                            <th key="match_level" scope="col">Gene</th>
                            <th key="alteration" scope="col">Alteration</th>
                            <th key="oncogenic" scope="col">Implication</th>
                            <th key="mutation_effect" scope="col">Effect</th>
                            <th key="dose" scope="col">Drug</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td>group2</td>
                            <td>ERBB2</td>
                            <td>V777L</td>
                            <td>Oncogenic</td>
                            <td>Gain-of-function</td>
                            <td>
                                <a href="https://www.drugbank.ca/drugs/DB09074">Olaparib if loss of function
                                </a>
                            </td>
                        </tr>
                        </tbody>
                    </table>
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
