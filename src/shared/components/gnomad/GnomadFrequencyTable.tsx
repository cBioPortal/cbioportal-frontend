import * as React from 'react';
import { GnomadData, frequencyOutput} from '../mutationTable/column/GnomadColumnFormatter';
import SimpleTable from '../simpleTable/SimpleTable';
import styles from "shared/components/mutationTable/column/gnomad.module.scss";
import DefaultTooltip from '../defaultTooltip/DefaultTooltip';
export interface IGnomadFrequencyTableProps
{
    data: GnomadData[];
    gnomadUrl: string;
}
export default class GnomadFrequencyTable extends React.Component<IGnomadFrequencyTableProps, {}>
{
    constructor(props: IGnomadFrequencyTableProps)
    {
        super(props);
        this.state = {};
    }

    private getHeaders(): JSX.Element[] {
        return [
            <td>Population</td>,
            <td>
                <DefaultTooltip placement="top" overlay={(
                    <span>Number of individuals with this allele</span>
                )}>
                    <span>Allele Count</span>
                </DefaultTooltip>
            </td>,
            <td>
                <DefaultTooltip placement="top" overlay={(
                    <span>Number of times any allele has been observed at this position in the population</span>
                )}>
                    <span>Allele Number</span>
                </DefaultTooltip>
            </td>,
            <td>
                <DefaultTooltip placement="top" overlay={(
                    <span>Number of individuals carrying this allele in both copies</span>
                )}>
                    <span>Number of Homozygotes</span>
                </DefaultTooltip>
            </td>,
            <td>
                <DefaultTooltip placement="top" overlay={(
                    <span>Proportion of the population with this allele</span>
                )}>
                    <span>Allele Frequency</span>
                </DefaultTooltip>
            </td>

        ];
    }

    private getRows(): JSX.Element[] {
        const ret: JSX.Element[] = [];
        this.props.data.forEach(d => {
                ret.push(
                    <tr>
                        <td>{d.population}</td>
                        <td>{d.alleleCount}</td>
                        <td>{d.alleleNumber}</td>
                        <td>{d.homozygotes}</td>
                        <td>{frequencyOutput(d.alleleFrequency)}</td>
                    </tr>
                    );
        });
        return ret;
    }

    public render()
    {
        const myvariantLink = (
            <a href="https://myvariant.info/" target="_blank">
                myvariant.info
            </a>
        );

        const genomeNexusLink = (
            <a href="https://www.genomenexus.org/" target="_blank">
                genomenexus.org
            </a>
        );

        const gnomadLink = (
            <a href={this.props.gnomadUrl} target="_blank">
                gnomAD
            </a>
        );

        return (
            
            <div className='cbioportal-frontend'>
                <SimpleTable
                    headers={this.getHeaders()}
                    rows={this.getRows()}
                />
                <div style={{fontSize:'x-small',textAlign:"center",paddingTop:5}}>
                    Source: {genomeNexusLink}, which serves
                    {' '}{myvariantLink}'s gnomAD data.<br />
                    Latest {gnomadLink} data may differ.
                </div>
            </div>

        );
    }

}
