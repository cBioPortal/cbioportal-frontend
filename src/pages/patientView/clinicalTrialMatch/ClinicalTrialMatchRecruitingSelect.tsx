import React from 'react';
import Select, { components } from 'react-select';
import styles from './style/clinicalTrialMatch.module.scss';
import {
    DefaultTooltip,
    placeArrowBottomLeft,
} from 'cbioportal-frontend-commons';
import {
    RecruitingStatus,
    recruitingStatusLabel,
    recruitingStatusOptions,
} from 'shared/enums/ClinicalTrialsGovRecruitingStatus';

export interface RecruitingStatusOption {
    label: string;
    value: RecruitingStatus;
}

interface RecruitingSelectProps {
    selected: RecruitingStatus[];
    options?: RecruitingStatusOption[];
    onChange: (statuses: RecruitingStatus[]) => void;
    isMulti?: boolean;
    name?: string;
    className?: string;
    classNamePrefix?: string;
    placeholder?: string;
}

const recruitingOption = (props: any) => {
    const status: RecruitingStatus = props.data.value;
    const label: string = props.label;
    return (
        <div>
            <components.Option {...props}>
                <span style={{ marginRight: 5 }}>{label}</span>
                <DefaultTooltip
                    placement="bottomLeft"
                    trigger={['hover', 'focus']}
                    overlay={getTooltipRecruitingContent(status, label)}
                    destroyTooltipOnHide={false}
                    onPopupAlign={placeArrowBottomLeft}
                >
                    <i className={'fa fa-info-circle ' + styles.icon}></i>
                </DefaultTooltip>
            </components.Option>
        </div>
    );
};

const tooltipContentByStatus: Partial<Record<RecruitingStatus, JSX.Element>> = {
    [RecruitingStatus.NotYetRecruiting]: (
        <span>The study has not started recruiting participants.</span>
    ),
    [RecruitingStatus.Recruiting]: (
        <span>The study is currently recruiting participants.</span>
    ),
    [RecruitingStatus.EnrollingByInvitation]: (
        <span>
            The study selects participants from a predefined population. Only
            invited people who satisfy the criteria may participate.
        </span>
    ),
    [RecruitingStatus.ActiveNotRecruiting]: (
        <span>
            The study is ongoing, but no new participants are currently being
            enrolled.
        </span>
    ),
    [RecruitingStatus.Suspended]: (
        <span>The study has stopped early but may start again.</span>
    ),
    [RecruitingStatus.Terminated]: (
        <span>
            The study has stopped early and will not start again. Participants
            are no longer being examined or treated.
        </span>
    ),
    [RecruitingStatus.Completed]: (
        <span>
            The study has ended normally and participants are no longer being
            examined or treated.
        </span>
    ),
    [RecruitingStatus.Withdrawn]: (
        <span>The study stopped before enrolling its first participant.</span>
    ),
    [RecruitingStatus.UnknownStatus]: (
        <span>
            Status has not been verified in over two years and may be outdated.
        </span>
    ),
    [RecruitingStatus.Available]: (
        <span>
            Expanded-access treatment is currently available for eligible
            patients.
        </span>
    ),
    [RecruitingStatus.NoLongerAvailable]: (
        <span>Expanded-access treatment is no longer available.</span>
    ),
    [RecruitingStatus.TemporarilyNotAvailable]: (
        <span>Expanded-access treatment is temporarily unavailable.</span>
    ),
    [RecruitingStatus.Invalid]: (
        <span>Status reported is not valid for ClinicalTrials.gov.</span>
    ),
};

const getTooltipRecruitingContent = (
    status: RecruitingStatus,
    fallbackLabel: string
) => {
    return (
        <div className={styles.tooltip} style={{ width: '300px' }}>
            {tooltipContentByStatus[status] || <span>{fallbackLabel}</span>}
        </div>
    );
};

const toOption = (
    value: RecruitingStatus,
    options: RecruitingStatusOption[]
): RecruitingStatusOption => {
    const existing = options.find(option => option.value === value);
    return (
        existing ?? {
            value,
            label: recruitingStatusLabel(value),
        }
    );
};

const ClinicalTrialMatchRecruitingSelect: React.FC<RecruitingSelectProps> = ({
    selected,
    options = recruitingStatusOptions,
    onChange,
    isMulti = true,
    name,
    className,
    classNamePrefix,
    placeholder,
}) => {
    const selectedOptions = selected.map(value => toOption(value, options));

    const handleChange = (
        newValue: readonly RecruitingStatusOption[] | null
    ) => {
        if (!newValue) {
            onChange([]);
            return;
        }

        const uniqueValues = Array.from(
            new Set(newValue.map(option => option.value))
        );

        onChange(uniqueValues);
    };

    return (
        <Select
            name={name}
            className={className}
            classNamePrefix={classNamePrefix}
            value={selectedOptions}
            onChange={handleChange}
            components={{ Option: recruitingOption }}
            options={options}
            tabSelectsOption={true}
            placeholder={placeholder}
            backspaceRemovesValue={false}
            isMulti={isMulti}
        />
    );
};

export default ClinicalTrialMatchRecruitingSelect;
