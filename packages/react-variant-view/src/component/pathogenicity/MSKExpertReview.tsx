import _ from 'lodash';
import * as React from 'react';

import { observer } from 'mobx-react';
import featureTableStyle from '../featureTable/FeatureTable.module.scss';
import { computed } from 'mobx';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import { Button } from 'react-bootstrap';

interface IMSKExpertReviewProps {}

@observer
class MSKExpertReview extends React.Component<IMSKExpertReviewProps> {
    @computed get mskExpertReviewContent() {
        return (
            <div className={featureTableStyle['feature-table-layout']}>
                <div className={featureTableStyle['data-source']}>
                    {this.mskExpertReviewTooltip()}
                </div>
                <div className={featureTableStyle['data-with-link']}>
                    <div>N/A</div>
                </div>
            </div>
        );
    }

    private mskExpertReviewTooltip() {
        return (
            <DefaultTooltip
                placement="top"
                overlay={<span>MSK Expert Review</span>}
            >
                <Button bsStyle="link" className="btn-sm p-0">
                    MSK Expert Review
                </Button>
            </DefaultTooltip>
        );
    }

    public render() {
        return this.mskExpertReviewContent;
    }
}

export default MSKExpertReview;
