import * as React from 'react';
import { If, Then, Else } from 'react-if';
import {IPharmacoDBView, IPharmacoDBCnaRequest, IPharmacoDBCnaEntry} from "shared/model/PharmacoDB.ts";
import {observer} from "mobx-react";
import {observable} from "mobx";
import * as _ from "lodash";
import { getPharmacoDBCnaDetails } from 'shared/lib/PharmacoDBUtils';
import {remoteData} from "../../../shared/api/remoteData";
import PharmacoDBCard from './PharmacoDBCard';
import PharmacoDBCnaCache from "shared/cache/PharmacoDBCnaCache";
import {ICache, ICacheData} from "shared/lib/SimpleCache";
import {CacheData} from "shared/lib/LazyMobXCache";
import {default as TableCellStatusIndicator, TableCellStatus} from "shared/components/TableCellStatus";



export interface IPharmacoDBTooltipProps {
    oncoTreeCode: string;
    geneName: string;
    cna: string;
    direction: string;
    pharmacoDBCnaCache?: PharmacoDBCnaCache;
}

@observer
export default class PharmacoDBTooltip extends React.Component<IPharmacoDBTooltipProps, {}>
{
  


    public get pharmacodDbCNACache():CacheData<IPharmacoDBCnaEntry>|undefined
    {
        let cacheData:ICacheData<IPharmacoDBCnaEntry>|undefined;

        if (this.props.pharmacoDBCnaCache)
        {
                const query:IPharmacoDBCnaRequest = {oncotreecode:this.props.oncoTreeCode, gene:this.props.geneName, cna:this.props.cna};
                const cache = this.props.pharmacoDBCnaCache.get(query);
                if (cache) {
                    return cache;
                }
        }
    }

  
    public render()
    {
        let tooltipContent: JSX.Element = <span />;

        const cacheData:CacheData<IPharmacoDBCnaEntry>|undefined = this.pharmacodDbCNACache;

        if (!cacheData)
        {
            tooltipContent =<TableCellStatusIndicator status={TableCellStatus.LOADING} />;
            return tooltipContent;
        }


        if (cacheData.status === 'complete' && cacheData.data)
        {
            tooltipContent = (
                <PharmacoDBCard
                    oncoTreeCode={this.props.oncoTreeCode}
                    geneName={this.props.geneName}
                    cna={this.props.cna}
                    direction={this.props.direction}
                    cardCnaData={cacheData.data}
                />);
        }
        else if (cacheData.status === 'error') {
            tooltipContent = <TableCellStatusIndicator status={TableCellStatus.ERROR} />;
        }

        return tooltipContent;

    }


}