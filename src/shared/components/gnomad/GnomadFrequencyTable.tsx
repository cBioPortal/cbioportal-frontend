import * as React from 'react';
import { GnomadData, frequencyOutput} from '../mutationTable/column/GnomadColumnFormatter';
import SimpleTable from '../simpleTable/SimpleTable';
import styles from "shared/components/mutationTable/column/gnomad.module.scss";
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
        const ret: JSX.Element[] = [];
        const titles = ['Population', 'Allele Count', 'Allele Number', 'Number of Homozygotes', 'Allele Frequency'];
        titles.forEach(title => {
            ret.push(
                <td>{title}</td>
            );
        });
        return ret;
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
                https://myvariant.info/
            </a>
        );

        function gnomadLink(gnomadUrl: string) {
            return (
            <a href={gnomadUrl} target="_blank">
                gnomAD
            </a>
        )};

        return (
            
            <div className='cbioportal-frontend'>
                <div className={styles["link"]} title="Data version in myVariant.info and gnomAD.org maybe different." >
                    Data from {myvariantLink} and {gnomadLink(this.props.gnomadUrl)}.
                </div>
                <SimpleTable
                    headers={this.getHeaders()}
                    rows={this.getRows()}
                />
            </div>

        );
    }

}
