import React from 'react';
import { observer } from 'mobx-react';
import { PageLayout } from '../../../shared/components/PageLayout/PageLayout';
import styles from './ContactPage.module.scss'; 
import { Helmet } from 'react-helmet';

@observer
export default class ConatctPage extends React.Component<{}, {}> {
    constructor(props: any) {
        super(props);
    }

    public render() {
        return (
            <PageLayout className={'whiteBackground'}>
                <div className={styles.contact}>
                    <Helmet>
                        <title>
                            {'cBioPortal for Cancer Genomics::Contact'}
                        </title>
                    </Helmet>
                    <h1>Need help?</h1>
                    <p>
                        Have a question about the website? Check out our{' '}
                        <a href="https://docs.cbioportal.org/" target="_blank">
                            documentation
                        </a>
                        .
                    </p>
                    <p>
                        Previous questions can be browsed in the{' '}
                        <a
                            href="https://groups.google.com/g/cbioportal"
                            target="_blank"
                        >
                            Google Group
                        </a>
                        .
                    </p>
                    <p>
                        Email us at{' '}
                        <a href="cbioportal@googlegroups.com">
                            cbioportal@googlegroups.com
                        </a>
                        .
                    </p>
                    <p>
                        Or join our public Slack{' '}
                        <a href="https://slack.cbioportal.org" target="_blank">
                            here
                        </a>
                        .
                    </p>
                </div>
            </PageLayout>
        );
    }
}
