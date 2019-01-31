import * as React from "react";
import {Circle} from "better-react-spinkit";
import DefaultTooltip from "shared/components/defaultTooltip/DefaultTooltip";
import annotationStyles from "./styles/annotation.module.scss";

export function loaderIcon(className?: string)
{
    return (
        <Circle size={18} scaleEnd={0.5} scaleStart={0.2} color="#aaa" className={className}/>
    );
}

export function errorIcon(errorMessage: string)
{
    return (
        <DefaultTooltip
            overlay={<span>{errorMessage}</span>}
            placement="right"
            trigger={['hover', 'focus']}
            destroyTooltipOnHide={true}
        >
                <span className={`${annotationStyles["annotation-item-error"]}`}>
                    <i className="fa fa-exclamation-triangle text-danger" />
                </span>
        </DefaultTooltip>
    );
}
