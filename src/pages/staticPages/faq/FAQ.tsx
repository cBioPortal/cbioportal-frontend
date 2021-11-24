import * as React from 'react';
import { PageLayout } from '../../../shared/components/PageLayout/PageLayout';
import { getServerConfig } from 'config/config';
import StaticContent from '../../../shared/components/staticContent/StaticContent';
import Helmet from 'react-helmet';
import './styles.scss';

class Heading extends React.Component<{ level: number }, {}> {
    render() {
        const CustomTag = `h${this.props.level}` as any;
        const firstChild: string = (this.props.children as any[])[0] as string;
        const text: string =
            firstChild && typeof firstChild === 'string' ? firstChild : '';

        // this transformation is to match headers to internal anchors (#) produced by markdown renderer
        // unfortunately, we rely on the text of the headers matching the text of urls in the markdown
        // replace spaces with dash, kill all non-word chars (but leave dashes!)
        const id = text
            .toLowerCase()
            .replace(/\s/g, '-')
            .replace(/[\W]/g, c => (/-/.test(c) ? c : ''));
        const topLink =
            this.props.level > 1 ? (
                <a href="#pageTop" title={'Return to top'}>
                    <i className={'fa fa-arrow-circle-up'}></i>
                </a>
            ) : (
                ''
            );

        return (
            <CustomTag id={id}>
                {text} {topLink}
            </CustomTag>
        );
    }
}

const renderers = {
    h2: (props: any) => {
        return <Heading level={2} {...props} />;
    },
    h3: (props: any) => {
        return <Heading level={3} {...props} />;
    },
    h4: (props: any) => {
        return <Heading level={4} {...props} />;
    },
};

export default class FAQ extends React.Component<{}, {}> {
    public render() {
        return (
            <PageLayout className={'whiteBackground staticPage faqPage'}>
                <Helmet>
                    <title>{'cBioPortal for Cancer Genomics::FAQ'}</title>
                </Helmet>

                <a id="pageTop" />
                <StaticContent
                    sourceUrl={getServerConfig().skin_documentation_faq!}
                    title={'FAQs'}
                    renderers={renderers}
                />
            </PageLayout>
        );
    }
}
