import * as React from 'react';

import {observer} from "mobx-react";

import { ITestimonial } from 'shared/components/testimonials/Testimonials';
import { TestimonialStore } from 'shared/components/testimonials/Testimonials';

import styles from './testimonialsPage.module.scss';

@observer
export default class TestimonialsPage extends React.Component<{},{}> {

    private store:TestimonialStore;

    constructor() {
        super();

        this.store = new TestimonialStore();
    }

    renderTestimonials() {
        return this.store.testimonials.map((testimonial:ITestimonial, i:number) => (
            <div className='testimonial-blockquote' key={i}>
                <p>"{testimonial.quote}"</p>
                <cite>--{testimonial.cite}</cite>
            </div>
        ));
    }

    public render() {

        return (
            <div className="markdown">
                <div id="testimonialsPage" className={styles.testimonialsPage}>
                    <h1>What People Are Saying</h1>
                    {this.renderTestimonials()}
                </div>
            </div>
        );

    }

}
