import * as React from 'react';
import {DiscreteCopyNumberData} from "shared/api/generated/CBioPortalAPI";

export enum AlterationTypes {
    'DeepDel' = -2,
    'AMP'= 2
}

export default class CnaColumnFormatter
{
    public static displayText(d:DiscreteCopyNumberData) {
        return AlterationTypes[d.alteration];
    }

    public static renderFunction(d:DiscreteCopyNumberData)
    {
        let color = null;
        let value = d.alteration;
        switch(value) {
            case -2:
                color = '#0000FF';
                break;
            case 2:
                color = '#FF0000';
                break;
        }
        if (!color) {
            return (<span/>);
        } else {
            return (<span style={{color}}>{CnaColumnFormatter.displayText(d)}</span>);
        }
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

