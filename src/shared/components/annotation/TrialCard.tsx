import * as React from 'react';
import { If, Then, Else } from 'react-if';
import { ICivicVariantData } from "shared/model/Civic.ts";
import "./styles/trialCard.scss";
import * as _ from "lodash";

export interface ICivicCardProps {
    title: string;
    geneName: string;
    geneDescription: string;
    geneUrl: string;
    variants: { [name: string]: ICivicVariantData };
}

export default class CivicCard extends React.Component<ICivicCardProps, {}> {
    constructor() {
        super();
    }

    /**
     * Generate variants
     * @param variantMap
     * @returns {JSX.Element[]}
     */
    public generateVariants(variantMap: { [name: string]: ICivicVariantData }) {
        const list: JSX.Element[] = [];

        if (variantMap) {
            if (_.isEmpty(variantMap)) {
                list.push(this.variantItem());
            } else {
                for (let name in variantMap) {
                    let variant = variantMap[name];
                    let entryTypes: string = '';
                    for (let evidenceType in variant.evidence) {
                        entryTypes += evidenceType.toLowerCase() + ': ' + variant.evidence[evidenceType] + ', ';
                    }
                    entryTypes = entryTypes.slice(0, -2) + '.';

                    list.push(this.variantItem(variant.url, variant.name, entryTypes, variant.description));
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
    public variantItem(url?: string, name?: string, entryTypes?: string, description?: string) {
        let result;

        if (url || name || entryTypes || description) {
            result = (
                <div className="civic-card-variant">
                    <div className="civic-card-variant-header">
                        <span className="civic-card-variant-name"><a href={url} target="_blank">{name}</a></span>
                        <span className="civic-card-variant-entry-types"> Entries: {entryTypes}</span>
                    </div>
                    <div className="civic-card-variant-description summary">{description}</div>
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
                       className="oncokb-logo">Canadian Profiling and Targeted Agent Utilization Trial(CAPTUR)
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
                            <th key="mutation_effect" scope="col">Bio Effect</th>
                            <th key="dose" scope="col">Drug</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td>group2</td>
                            <td>BRCA2</td>
                            <td>S2835*</td>
                            <td>Oncogenic</td>
                            <td>Loss of function</td>
                            <td>
                                <a href="https://www.drugbank.ca/drugs/DB09074">Olaparib
                                </a>
                            </td>
                        </tr>
                        <tr>
                            <td>group2</td>
                            <td>TP53</td>
                            <td>D281Y</td>
                            <td>Oncogenic</td>
                            <td>Loss of function</td>
                            <td>
                                <a href="https://www.drugbank.ca/drugs/DB09074">Olaparib
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
