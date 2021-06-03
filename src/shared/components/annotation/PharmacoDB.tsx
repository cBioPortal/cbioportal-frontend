import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';
import { Circle } from 'better-react-spinkit';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { errorIcon, loaderIcon } from 'react-mutation-mapper';

import annotationStyles from './styles/annotation.module.scss';
import { IPharmacoDBView } from 'shared/model/PharmacoDB.ts';
import { observable } from 'mobx';

export interface IPharmacoDBProps {
    pharmacoDBEntry: IPharmacoDBView | null | undefined;
    pharmacoDBStatus: 'pending' | 'error' | 'complete';
}

export function hideArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.display = 'none';
}

@observer
export default class PharmacoDB extends React.Component<IPharmacoDBProps> {
    @observable tooltipDataLoadComplete: boolean = false;

    public static sortValue(
        pharmacoDBEntry: IPharmacoDBView | null | undefined
    ): number {
        let score: number = 0;

        if (pharmacoDBEntry) {
            score = 1;
        }

        return score;
    }

    constructor(props: IPharmacoDBProps) {
        super(props);

        this.cardContent = this.cardContent.bind(this);
    }

    public render() {
        let pharmacoDBContent: JSX.Element = (
            <span className={`${annotationStyles['annotation-item']}`} />
        );

        const pharmacoDBImgWidth: number = 14;
        let pharmacoDBImgHeight: number = 14;
        let pharmacoDBImgSrc = require('./images/pharmacoDB-logo.png');

        if (this.props.pharmacoDBStatus == 'error') {
            pharmacoDBContent = errorIcon('Error fetching PharmacoDB data');
        } else if (this.props.pharmacoDBEntry !== undefined) {
            if (
                this.props.pharmacoDBEntry !== null &&
                this.props.pharmacoDBStatus == 'complete'
            ) {
                pharmacoDBContent = (
                    <span className={`${annotationStyles['annotation-item']}`}>
                        <img
                            width={pharmacoDBImgWidth}
                            height={pharmacoDBImgHeight}
                            src={pharmacoDBImgSrc}
                            alt="PharmacoDB Entry"
                        />
                    </span>
                );

                const arrowContent = <div className="rc-tooltip-arrow-inner" />;

                pharmacoDBContent = (
                    <DefaultTooltip
                        overlay={this.cardContent.bind(
                            this,
                            this.props.pharmacoDBEntry
                        )}
                        placement="right"
                        trigger={['hover', 'focus']}
                        arrowContent={arrowContent}
                        onPopupAlign={hideArrow}
                        destroyTooltipOnHide={false}
                    >
                        {pharmacoDBContent}
                    </DefaultTooltip>
                );
            }
        } else {
            // It's still unknown (undefined) if the current gene has a pharmacoDB entry or not.
            pharmacoDBContent = this.loaderIcon();
        }

        return pharmacoDBContent;
    }

    public loaderIcon() {
        return (
            <Circle
                size={18}
                scaleEnd={0.5}
                scaleStart={0.2}
                color="#aaa"
                className="pull-left"
            />
        );
    }

    private cardContent(pharmacoDBEntry: IPharmacoDBView): JSX.Element {
        return <div>This is the card content</div>;
    }
}
