import * as React from 'react';
import {PageLayout} from "../../shared/components/PageLayout/PageLayout";
import AppConfig from "appConfig";
import StaticContent from "../../shared/components/staticContent/StaticContent";
import Helmet from "react-helmet";

export default class FAQ extends React.Component<{}, {}> {

    get content(){
        if (/^https:\/\/docs.google.com/.test(AppConfig.skinFaqSourceURL!)) {
            return <iframe id="faqIframe" style={{width:"100%", height:11000, border:"1px solid #ddd"}}
                           src={AppConfig.skinFaqSourceURL}>
            </iframe>
        } else {
            return <StaticContent sourceUrl={AppConfig.skinFaqSourceURL!} title={"FAQs"} />
        }
    }

    public render() {



        return <PageLayout className={'whiteBackground'}>

            <Helmet>
                <title>{'cBioPortal for Cancer Genomics::FAQ'}</title>
            </Helmet>

            {this.content}

        </PageLayout>
    }

}




