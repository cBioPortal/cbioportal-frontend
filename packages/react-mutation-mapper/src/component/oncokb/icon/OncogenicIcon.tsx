import * as React from 'react';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { oncogenicityIconClassNames } from '../../../util/OncoKbUtils';

const OncogenicIcon: React.FunctionComponent<{
    oncogenicity: string;
    showDescription?: boolean;
}> = props => {
    return (
        <DefaultTooltip
            overlay={<span>{props.oncogenicity}</span>}
            placement="left"
            trigger={['hover', 'focus']}
            destroyTooltipOnHide={true}
        >
            <i className={oncogenicityIconClassNames(props.oncogenicity)} />
        </DefaultTooltip>
    );
};

export default OncogenicIcon;
