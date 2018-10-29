import * as React from 'react';
import {PageLayout} from "../../../shared/components/PageLayout/PageLayout";
import Helmet from "react-helmet";
import StaticContent from "shared/components/staticContent/StaticContent";

export default class CGDS extends React.Component<{}, {}> {
//
    public render() {

        return <PageLayout className={'whiteBackground staticPage'}>
            <Helmet>
                <title>{'cBioPortal for Cancer Genomics::R/MATLAB'}</title>
            </Helmet>
            <StaticContent sourceUrl={"RMatlab.md"} title={"R/Matlab"} />
        </PageLayout>;
    }

}




