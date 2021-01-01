import * as React from 'react';
import { If, Then, Else } from 'react-if';
import {IPharmacoDBView, IPharmacoDBCnaRequest, IPharmacoDBCnaEntry} from "shared/model/PharmacoDB.ts";
import {observer} from "mobx-react";
import "./styles/pharmacoDbCard.scss";
import * as _ from "lodash";
import { getPharmacoDBCnaDetails } from 'shared/lib/PharmacoDBUtils';
import {remoteData} from "../../../shared/api/remoteData";
import PharmacoDBCard from './PharmacoDBCard';


export interface IPharmacoDBTooltipProps {
    oncoTreeCode: string;
    geneName: string;
    cna: string;
    direction: string;
}

@observer
export default class PharmacoDBTooltip extends React.Component<IPharmacoDBTooltipProps, {}>
{

    public getPharmacoDBCnaDetails(cnareq: IPharmacoDBCnaRequest): IPharmacoDBCnaEntry {

        let pharmacoDBcnaentry = null;
        pharmacoDBcnaentry = remoteData<IPharmacoDBCnaEntry>({
            invoke: async () => {
                return getPharmacoDBCnaDetails(cnareq);
            },
            onError: () => {
                // fail silently
            },
        });
        return pharmacoDBcnaentry.result!;
    }

    public render()
    {
        const cnareq: IPharmacoDBCnaRequest = {oncotreecode:this.props.oncoTreeCode, gene:this.props.geneName, cna:this.props.cna};
        const pharmacoDBCnaEntry = this.getPharmacoDBCnaDetails(cnareq);
        let tooltipContent: JSX.Element = <span />;
        tooltipContent = (
            <PharmacoDBCard
                oncoTreeCode={this.props.oncoTreeCode}
                geneName={this.props.geneName}
                cna={this.props.cna}
                direction={this.props.direction}
                cardCnaData={pharmacoDBCnaEntry}
            />);

        return tooltipContent;
    }

}