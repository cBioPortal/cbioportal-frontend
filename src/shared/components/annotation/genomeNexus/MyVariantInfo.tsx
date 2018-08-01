import * as React from "react";
import annotationStyles from "./../styles/annotation.module.scss";
import classNames from 'classnames';
import {MyVariantInfo as MyVariantInfoData} from 'shared/api/generated/GenomeNexusAPIInternal';
import myVariantInfoColumn from "./styles/MyVariantInfoColumn.module.scss";

export interface IMyVariantInfoProps {
    myVariantInfo: MyVariantInfoData;
}

export default class MyVariantInfo extends React.Component<IMyVariantInfoProps, {}> {
    public static download(myVariantInfoData: MyVariantInfoData|undefined): string
    {
        if (myVariantInfoData) {
            return `dbsnp: ${myVariantInfoData.dbsnp.rsid}`;
        }
        else {
            return "Error";
        }
    }

    public render() {
        let mviContent: JSX.Element = (
            <span className={`${annotationStyles["annotation-item-text"]}`}/>
        )
        if (this.props.myVariantInfo.dbsnp && this.props.myVariantInfo.dbsnp.rsid !== null) {
            mviContent = (
                <span className={classNames(annotationStyles["annotation-item-text"])}>
                </span>
            );
        }
        return mviContent;
    }
}