import * as React from 'react';
import {DiscreteCopyNumberData} from "shared/api/generated/CBioPortalAPI";

export enum AlterationTypes {
    'DeepDel' = -2,
    'AMP'= 2
}

export default class CnaColumnFormatter
{
    public static renderAlterationTypes(value: number)
    {
        switch(value) {
            case AlterationTypes.DeepDel:
                return <span style={{color:'#FF0000'}}>{AlterationTypes[AlterationTypes.DeepDel]}</span>;
            case AlterationTypes.AMP:
                return <span style={{color:'#0000FF'}}>{AlterationTypes[AlterationTypes.AMP]}</span>;
            default:
                return <span/>;
        }
    }

    public static renderFunction(d:DiscreteCopyNumberData)
    {
        return <span>{CnaColumnFormatter.renderAlterationTypes(d.alteration)}</span>;
    }

    public static download(d:DiscreteCopyNumberData)
    {
        return AlterationTypes[d.alteration];
    }

    public static sortValue(d:DiscreteCopyNumberData)
    {
        return d.alteration;
    }
}

