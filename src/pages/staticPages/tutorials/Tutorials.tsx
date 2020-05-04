import * as React from 'react';
import { observer } from 'mobx-react';
import { PageLayout } from '../../../shared/components/PageLayout/PageLayout';
import './styles.scss';
import Helmet from 'react-helmet';
import { getNCBIlink } from 'cbioportal-frontend-commons';
import AppConfig from 'appConfig';

@observer
export default class Tutorials extends React.Component<{}, {}> {
    public render() {
        return (
            <PageLayout className={'whiteBackground staticPage'}>
                <Helmet>
                    <title>
                        {
                            'cBioPortal for Cancer Genomics::Tutorials and Webinars'
                        }
                    </title>
                </Helmet>
                <h1>Tutorials and Webinars</h1>
                View tutorial and webinar slides below or download from{' '}
                <a href="https://drive.google.com/drive/u/0/folders/0B9KTQJAGhFhhRi1qaTdUWmpLQTA">
                    Google Drive
                </a>{' '}
                or{' '}
                <a
                    href={`${AppConfig.serverConfig
                        .skin_documentation_baseurl!.replace(
                            'raw.githubusercontent.com',
                            'www.github.com'
                        )
                        .replace('/master/', '/tree/master/')}tutorials`}
                >
                    GitHub
                </a>
                .<h1 id={'webinars'}>Webinars</h1>
                Join our webinar series{' '}
                <strong>every Thursday 11am-12pm EDT</strong>, register{' '}
                <a
                    target="_blank"
                    href="https://dfci.zoom.us/webinar/register/7315875611981/WN_An_3l0XYQHCoinWvclUrlw"
                >
                    here
                </a>
                .
                <h2 id={'webinar-1'}>Webinar #1: Introduction to cBioPortal</h2>
                <iframe
                    src="https://www.youtube.com/embed/fPIAxH--cSo"
                    frameBorder="0"
                    width="720"
                    height="434"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen={true}
                ></iframe>
                <div>
                    <span style={{ fontSize: 'large' }}>Watch on </span>
                    <h4 style={{ display: 'inline' }}>
                        <a
                            target="_blank"
                            href="https://www.youtube.com/embed/fPIAxH--cSo"
                        >
                            YouTube.com
                        </a>
                    </h4>
                    <span style={{ fontSize: 'large' }}> or </span>
                    <h4 style={{ display: 'inline' }}>
                        <a
                            target="_blank"
                            href="https://www.bilibili.com/video/bv1tf4y1m7lp"
                        >
                            bilibili.com
                        </a>
                    </h4>
                    <span style={{ color: '#eee' }}> | </span>
                    <h4 style={{ display: 'inline' }}>
                        <a
                            href={`${AppConfig.serverConfig
                                .skin_documentation_baseurl!}tutorials/cBioPortal Webinar 1 Introduction to cBioPortal.pdf`}
                        >
                            Download slides
                        </a>
                    </h4>
                </div>
                <hr />
                <h1 id={'tutorials'}>Tutorials</h1>
                <h2 id={'single-study-exploration'}>
                    Tutorial #1: Single Study Exploration
                </h2>
                <iframe
                    src="https://docs.google.com/presentation/d/1_OGK69lO4Z62WaxHHkNYmWvY0LQN2v0slfaLyY1_IQ0/embed?start=false&loop=false&delayms=60000"
                    frameBorder="0"
                    width="720"
                    height="434"
                    allowFullScreen={true}
                ></iframe>
                <h4>
                    <a
                        href={`${AppConfig.serverConfig
                            .skin_documentation_baseurl!}tutorials/cBioPortal Tutorial 1 Single Study Exploration.pdf`}
                    >
                        Download tutorial
                    </a>
                </h4>
                <hr />
                <h2 id={'single-study-query'}>
                    Tutorial #2: Single Study Query
                </h2>
                <iframe
                    src="https://docs.google.com/presentation/d/1y9UTIr5vHmsNVWqtGTVGgiuYX9wkK_a_RPNYiR8kYD8/embed?start=false&loop=false&delayms=60000"
                    frameBorder="0"
                    width="720"
                    height="434"
                    allowFullScreen={true}
                ></iframe>
                <h4>
                    <a
                        href={`${AppConfig.serverConfig
                            .skin_documentation_baseurl!}tutorials/cBioPortal Tutorial 2 Single Study Query.pdf`}
                    >
                        Download tutorial
                    </a>
                </h4>
                <hr />
                <h2 id={'patient-view'}>Tutorial #3: Patient View</h2>
                <iframe
                    src="https://docs.google.com/presentation/d/1Jr_2yEfgjKBn4DBiXRk4kmhIbtsRp6gd0iD3k1fIUUk/embed?start=false&loop=false&delayms=60000"
                    frameBorder="0"
                    width="720"
                    height="434"
                    allowFullScreen={true}
                ></iframe>
                <h4>
                    <a
                        href={`${AppConfig.serverConfig
                            .skin_documentation_baseurl!}tutorials/cBioPortal Tutorial 3 Patient View.pdf`}
                    >
                        Download tutorial
                    </a>
                </h4>
                <hr />
                <h2 id={'virtual-studies'}>Tutorial #4: Virtual Studies</h2>
                <iframe
                    src="https://docs.google.com/presentation/d/1rQE5rbFNdmup-rAtySHFxlLp3i4qa8SBA7MiQpMdn1I/embed?start=false&loop=false&delayms=60000"
                    frameBorder="0"
                    width="720"
                    height="434"
                    allowFullScreen={true}
                ></iframe>
                <h4>
                    <a
                        href={`${AppConfig.serverConfig
                            .skin_documentation_baseurl!}tutorials/cBioPortal Tutorial 4 Virtual Studies.pdf`}
                    >
                        Download tutorial
                    </a>
                </h4>
                <hr />
                <h2 id={'oql'}>Tutorial #5: Onco Query Language (OQL)</h2>
                <iframe
                    src="https://docs.google.com/presentation/d/1U39xgVujtBodwW20qIfcGu4E5n2zzaKkl2KmzzHqj4A/embed?startfalse&loop=false&delayms=60000"
                    frameBorder="0"
                    width="720"
                    height="434"
                    allowFullScreen={true}
                ></iframe>
                <h4>
                    <a
                        href={`${AppConfig.serverConfig
                            .skin_documentation_baseurl!}tutorials/cBioPortal Tutorial 5 Onco Query Language.pdf`}
                    >
                        Download tutorial
                    </a>
                </h4>
                <hr />
                <h2 id={'group-comparison'}>Tutorial #6: Group Comparison</h2>
                <iframe
                    src="https://docs.google.com/presentation/d/1P2boDph8IfpvjxoxDj_496CLHGtshzJnbbZhszPsmf4/embed?startfalse&loop=false&delayms=60000"
                    frameBorder="0"
                    width="720"
                    height="434"
                    allowFullScreen={true}
                ></iframe>
                <h4>
                    <a
                        href={`${AppConfig.serverConfig
                            .skin_documentation_baseurl!}tutorials/cBioPortal Tutorial 6 Group Comparison.pdf`}
                    >
                        Download tutorial
                    </a>
                </h4>
                <hr />
                <h2 id={'pathways'}>Tutorial #7: Pathways</h2>
                <iframe
                    src="https://docs.google.com/presentation/d/1O5WGucz0lrfdY25b5QS6zaID_26i434EYXBluqZfT2g/embed?startfalse&loop=false&delayms=60000"
                    frameBorder="0"
                    width="720"
                    height="434"
                    allowFullScreen={true}
                ></iframe>
                <h4>
                    <a
                        href={`${AppConfig.serverConfig
                            .skin_documentation_baseurl!}tutorials/cBioPortal Tutorial 7 Pathways.pdf`}
                    >
                        Download tutorial
                    </a>
                </h4>
                <hr />
                <h2>Step-by-step Guide to cBioPortal: a Protocol Paper</h2>
                <p>
                    Gao, Aksoy, Dogrusoz, Dresdner, Gross, Sumer, Sun, Jacobsen,
                    Sinha, Larsson, Cerami, Sander, Schultz. <br />
                    <b>
                        Integrative analysis of complex cancer genomics and
                        clinical profiles using the cBioPortal.
                    </b>{' '}
                    <br />
                    <i>Sci. Signal.</i> 6, pl1 (2013). [
                    <a href={getNCBIlink('/pubmed/23550210')}>Reprint</a>].
                </p>
            </PageLayout>
        );
    }
}
