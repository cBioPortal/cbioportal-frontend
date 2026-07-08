import * as React from 'react';

import mainStyles from './main.module.scss';
import { OncoKbCardTitle } from './OncoKbCardTitle';
import { OncoKbCardBody } from './OncoKbCardBody';
import { OncoKbCardDataType } from 'cbioportal-utils';
import oncoKbLogoImgSrc from 'oncokb-styles/dist/images/logo/oncokb.svg';
import { IndicatorQueryResp } from '../model/OncoKB';

export type OncoKbCardProps = {
    type: OncoKbCardDataType;
    hugoSymbol: string;
    geneNotExist: boolean;
    isCancerGene: boolean;
    usingPublicOncoKbInstance: boolean;
    isGermline?: boolean;
    cDnaChange?: string;
    proteinChange?: string;
    indicator?: IndicatorQueryResp;
    displayHighestLevelInTabTitle?: boolean;
    handleFeedbackOpen?: React.EventHandler<any>;
    hasMultipleCancerTypes?: boolean;
};

export const OncoKbCard: React.FunctionComponent<OncoKbCardProps> = (
    props: OncoKbCardProps
) => {
    function oncokbLinkOut() {
        let link: string | undefined = undefined;
        if (props.hugoSymbol) {
            link = `https://www.oncokb.org/gene/${props.hugoSymbol}`;
            if (!props.geneNotExist && props.indicator?.query?.alteration) {
                link = `${link}/${props.indicator.query.alteration}`;
            }
        }
        return link;
    }

    const oncokbLogo = (
        <img
            src={oncoKbLogoImgSrc}
            className={mainStyles['oncokb-logo']}
            alt="OncoKB™"
        />
    );
    const alteration = props.indicator?.query.alteration;
    const cDnaChange = props.isGermline
        ? props.cDnaChange || alteration
        : props.cDnaChange;
    const proteinChange = props.isGermline
        ? props.proteinChange
        : props.proteinChange || alteration;

    return (
        <div className={mainStyles['oncokb-card']} data-test="oncokb-card">
            <div>
                {!props.geneNotExist && props.indicator && (
                    <OncoKbCardTitle
                        isGermline={props.isGermline}
                        hugoSymbol={props.indicator.query.hugoSymbol}
                        cDnaChange={cDnaChange}
                        tumorType={props.indicator.query.tumorType}
                        proteinChange={proteinChange}
                        displayCancerTypeInTitle={!props.hasMultipleCancerTypes}
                    />
                )}
                <OncoKbCardBody
                    type={props.type}
                    indicator={props.indicator}
                    geneNotExist={props.geneNotExist}
                    isCancerGene={props.isCancerGene}
                    hugoSymbol={props.hugoSymbol}
                    usingPublicOncoKbInstance={props.usingPublicOncoKbInstance}
                    isGermline={props.isGermline}
                    displayHighestLevelInTabTitle={
                        props.displayHighestLevelInTabTitle
                    }
                />
                <div className={mainStyles.footer}>
                    {oncokbLinkOut() === undefined ? (
                        oncokbLogo
                    ) : (
                        <a
                            href={`${oncokbLinkOut()}`}
                            target="_blank"
                            className={mainStyles['oncokb-logo']}
                        >
                            {oncokbLogo}
                        </a>
                    )}
                    {props.handleFeedbackOpen && (
                        <span>
                            <button
                                className="btn btn-default btn-xs"
                                onClick={props.handleFeedbackOpen}
                            >
                                Feedback
                            </button>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
