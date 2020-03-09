import * as React from 'react';
import { observer, inject, Observer } from 'mobx-react';
import { observable } from 'mobx';
import Tour from 'reactour';
import './tour.scss';

@observer
export default class HomePageTour extends React.Component<{}, {}> {
    @observable tourIsOpen = false;

    constructor({}) {
        super({});
        this.endTour = this.endTour.bind(this);
        this.startTour = this.startTour.bind(this);
    }

    steps = [
        {
            selector: '#startTourButton',
            content: () => (
                <div className="step">
                    Welcome to the <b>cBioPortal Guided Tour</b>!
                    <p />
                    Lets get you oriented.
                    <p />
                    To follow along, click the next buttons below.
                </div>
            ),
        },
        {
            selector: '#main-nav',
            content: () => (
                <div className="step">
                    This is the main <b>navigation bar</b>.
                    <p />
                    For beginners, the most useful tabs are <b>
                        Tutorials
                    </b> and <b>FAQ</b>.
                    <p />
                    We provide quick-paced tutorials to get you started, and
                    also try to answer your most Frequently Asked Questions.
                </div>
            ),
        },
        {
            selector: '#cancerTypeListContainer',
            content: () => (
                <div className="step">
                    To get started, you can select a cancer type from the{' '}
                    <b>left navigation pane</b>.
                    <p />
                    For example, if you are interested in Glioblastoma, click
                    CNS/Brain.
                </div>
            ),
        },
        {
            selector: '#mainSearchBox',
            content: () => (
                <div className="step">
                    Or you can enter a string in the <b>search box</b>.
                    <p />
                    For example, try entering "glioma" or "tcga".
                </div>
            ),
        },
        {
            selector: '#cancerStudyListContainer',
            content: () => (
                <div className="step">
                    You can then select one of more cancer studies.
                    <br />
                    <br />
                    For beginners, we suggest you select just one cancer study
                    to start.
                </div>
            ),
        },
        {
            selector: '#queryByGene',
            content: () => (
                <div className="step">
                    Now, you have two options:
                    <p />
                    You can either:
                    <p />
                    <b>Query by Gene</b>: in this mode, you will be prompted to
                    enter one of more genes.
                    <p />
                    You can then analyze these genes within the selected study.
                </div>
            ),
        },
        {
            selector: '#exploreSelectedStudies',
            content: () => (
                <div className="step">
                    Or, you can:
                    <p />
                    <b>Explore Selected Studies</b>: in this mode, you will jump
                    directly to our study view page.
                    <p />
                    You can then get a bird's eye view of all genomic and
                    clinical data within the selected study.
                </div>
            ),
        },
        {
            selector: '.rightBarSection',
            content: () => (
                <div className="step">
                    Thanks for taking our guided tour!
                    <br />
                    <br />
                    For updates, please check out our <b>twitter feed!</b>
                </div>
            ),
        },
    ];

    private endTour() {
        console.log('Ending tour!');
        this.tourIsOpen = false;
    }

    private startTour() {
        console.log('Starting tour!');
        this.tourIsOpen = true;
    }

    public render() {
        let buttonStyle = {
            margin: 10,
        };
        let tourStyle = {
            marginLeft: 20,
        };
        console.log('Tour is open:  ' + this.tourIsOpen);
        return (
            <div style={tourStyle}>
                New to cBioPortal? Try our guided tour.{' '}
                <button
                    id="startTourButton"
                    style={buttonStyle}
                    onClick={this.startTour}
                >
                    Start Tour!
                </button>
                <Tour
                    rounded={10}
                    steps={this.steps}
                    isOpen={this.tourIsOpen}
                    onRequestClose={this.endTour}
                />
            </div>
        );
    }
}
