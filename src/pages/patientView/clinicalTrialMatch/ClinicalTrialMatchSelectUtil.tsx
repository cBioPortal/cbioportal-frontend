import React, { useState } from 'react';
import { CreatableSelect, Select } from 'react-select';
import styles from './style/clinicalTrialMatch.module.scss';
import { components } from 'react-select';
import {
    DefaultTooltip,
    placeArrowBottomLeft,
} from 'cbioportal-frontend-commons';

interface Dict<T> {
    [key: string]: T;
}

interface Option {
    label: string;
    value: string;
}

const recruitingOption = (props: any) => {
    return (
        <div>
            <components.Option {...props}>
                <span style={{ marginRight: 5 }}>{props.label}</span>
                <DefaultTooltip
                    placement="bottomLeft"
                    trigger={['hover', 'focus']}
                    overlay={getTooltipRecruitingContent(props.label)}
                    destroyTooltipOnHide={false}
                    onPopupAlign={placeArrowBottomLeft}
                >
                    <i className={'fa fa-info-circle ' + styles.icon}></i>
                </DefaultTooltip>
            </components.Option>
        </div>
    );
};

const getTooltipRecruitingContent = (recruitingStatus: string) => {
    const statusMap: { [status: string]: JSX.Element } = {
        'Not yet recruiting': (
            <span>The study has not started recruiting participants.</span>
        ),
        Recruiting: (
            <span>The study is currently recruiting participants.</span>
        ),
        'Enrolling by invitation': (
            <span>
                The study is selecting its participants from a population, or
                group of people, decided on by the researchers in advance. These
                studies are not open to everyone who meets the eligibility
                criteria but only to people in that particular population, who
                are specifically invited to participate.
            </span>
        ),
        'Active, not recruiting': (
            <span>
                The study is ongoing, and participants are receiving an
                intervention or being examined, but potential participants are
                not currently being recruited or enrolled.
            </span>
        ),
        Suspended: (
            <span>The study has stopped early but may start again.</span>
        ),
        Terminated: (
            <span>
                The study has stopped early and will not start again.
                Participants are no longer being examined or treated.
            </span>
        ),
        Completed: (
            <span>
                The study has ended normally, and participants are no longer
                being examined or treated (that is, the last participant's last
                visit has occurred).
            </span>
        ),
        Withdrawn: (
            <span>
                The study stopped early, before enrolling its first participant.
            </span>
        ),
        'Unknown status': (
            <span>
                A study on ClinicalTrials.gov whose last known status was
                recruiting; not yet recruiting; or active, not recruiting but
                that has passed its completion date, and the status has not been
                last verified within the past 2 years.
            </span>
        ),
    };
    return (
        <div className={styles.tooltip} style={{ width: '300px' }}>
            {statusMap[recruitingStatus]}
        </div>
    );
};

export { getTooltipRecruitingContent, recruitingOption, Dict };
