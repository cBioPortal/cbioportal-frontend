import { DefaultTooltip } from 'cbioportal-frontend-commons';
import * as React from 'react';
import { levelIconClassNames } from '../../../util/OncoKbUtils';
import OncoKbHelper from '../OncoKbHelper';

const levelTooltipContent = (level: string) => {
    return (
        <div style={{ maxWidth: '200px' }}>
            {OncoKbHelper.LEVEL_DESC[level]}
        </div>
    );
};

const LevelIcon: React.FunctionComponent<{
    level: string;
    showDescription?: boolean;
}> = props => {
    return (
        <DefaultTooltip
            overlay={levelTooltipContent(props.level)}
            placement="left"
            disabled={!props.showDescription}
            trigger={['hover', 'focus']}
            destroyTooltipOnHide={true}
        >
            <i className={levelIconClassNames(props.level)} />
        </DefaultTooltip>
    );
};

export default LevelIcon;
