import * as React from 'react';
import CSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';
import {observable, action} from "mobx";
import {observer} from "mobx-react";

import styles from './testimonials.module.scss';

export interface ITestimonial {
    cite: string;
    quote: string;
}

export class TestimonialStore {

    @observable public testimonialIndex: number;
    @observable public testimonials: ITestimonial[];

    @action incrementIndex() {
        this.testimonialIndex = (this.testimonialIndex + 1) % this.testimonials.length;
    }

    constructor() {
        this.testimonialIndex = 0;
        this.testimonials = [
            {
                cite: 'Clinical pathologist, Karolinska University Hospital',
                quote: `You did a great service to the cancer research community and by that to the patients that donated the samples!.`
            },
            {
                cite: 'Postdoctoral Fellow, Oregon Health & Science University',
                quote: `Whenever bench scientists ask me how they can look at TCGA data, I've never
                        had a good answer for them. Now I do. The cBio Portal meets a critical need--it is the
                        interface that the cancer research community needs to access the wealth of TCGA. Even as a
                        computational biologist, I use it to follow-up on genes of interest. It makes querying
                        the data much less painful.`
            },
            {
                cite: `Postdoctoral Fellow, Johns Hopkins University School of Medicine,
                       Dept Radiation Oncology and Molecular Radiation Sciences`,
                quote: `Thank you for your incredible resource that has helped greatly in accessing the TCGA
                        genomics data.`
            },
            {
                cite: 'Sr. Research Associate at Knight Cancer Institute/OHSU',
                quote: `As a bench biologist with primary aim of determining gene aberrations in GBM, I found
                        your site absolutely fantastic! Thank you! I have to reiterate how awesome and user-friendly
                        your group has made this site - finally accomplishing the goal of having data easily accessible
                        and meaningful.`
            },
            {
                cite: 'Research Fellow at Massachusetts General Hospital',
                quote: `I would like to congratulate you and the team of the cBio portal.
                        It's just an amazing tool to work with, and we at Mass General really appreciate it.`
            },
            {
                cite: 'Sr. Software Engineer, Institute for Systems Biology',
                quote: `I have been enjoying the ease with which TCGA data can be extracted in R using your CGDS package.
                        Very nice work!`
            },
            {
                cite: 'Research Fellow, Memorial Sloan-Kettering Cancer Center',
                quote: `Thank you for generating such an excellent software. It is very useful for our research.`
            },
            {
                cite: 'Scientist, Discovery Bioinformatics, Biotechnology Company',
                quote: `Thank you very much for providing and maintaining this great resource.`
            },
            {
                cite: 'Postdoctoral Fellow, Harvard Medical School, Children\'s Hospital Boston',
                quote: `I want to thank you for the nice, useful and user-friendly interface you have generated
                        and shared with the community.`
            },
            {
                cite: 'Associate Professor, University of Virginia',
                quote: `This portal is truly the greatest thing since sliced bread. I am making discoveries with it
                        not only in glioblastoma, my primary focus, but in other cancers as well -- it's all so easy
                        with this fantastic tool. And I am enjoying showing it to my colleagues, whose jaws also drop.
                        Thank you a thousand times over for this beautiful public resource. I am looking forward to
                        citing this soon in an upcoming paper...`
            },
        ];
        setInterval(() => this.incrementIndex(), 15000);
    }

}

@observer
export default class Testimonials extends React.Component <{}, {}> {

    private store:TestimonialStore;

    constructor() {
        super();

        this.store = new TestimonialStore();
    }


    public render() {
        const { testimonials, testimonialIndex } = this.store;
        const activeTestimonial = testimonials[testimonialIndex];
        return (
            <div className={styles.testimonial}>
                <CSSTransitionGroup transitionName="test-trans" transitionEnterTimeout={2000} transitionLeaveTimeout={2000}>
                    <div className='testimonial-blockquote' key={testimonialIndex}>
                        <p>"{activeTestimonial.quote}"</p>
                        <cite>--{activeTestimonial.cite}</cite>
                        <div className="testimonial-links">
                            <a href="what_people_are_saying.jsp" >View All</a>
                            <a href="mailto:cbioportal@cbio.mskcc.org?subject=cBioPortal Testimonial&body=Job Title:%0D%0APlace of Employment:%0D%0ATestimonial:%0D%0A%0D%0AThank you for taking the time to submit your opinion.">
                                Tell Us What You Think
                            </a>
                        </div>
                    </div>
                </CSSTransitionGroup>
            </div>
        );
    }
}
