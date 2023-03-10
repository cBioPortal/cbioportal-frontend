import React, { useState } from 'react';
import { observer } from 'mobx-react';
import Tour from 'reactour';
import './tour.scss';

const HomePageTour = observer(() => {
    const [tourIsOpen, setTourIsOpen] = useState(false);

    const steps = [
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
    ];

    const endTour = () => {
        console.log('Ending tour!');
        setTourIsOpen(false);
    };

    const startTour = () => {
        console.log('Starting tour!');
        setTourIsOpen(true);
    };

    let buttonStyle = {
        margin: 10,
    };
    let tourStyle = {
        marginLeft: 20,
    };
    console.log('Tour is open:  ' + tourIsOpen);
    return (
        <div style={tourStyle}>
            New to cBioPortal? Try our guided tour.{' '}
            <button
                id="startTourButton"
                style={buttonStyle}
                onClick={startTour}
            >
                Start Tour!
            </button>
            <Tour
                rounded={10}
                steps={steps}
                isOpen={tourIsOpen}
                onRequestClose={endTour}
            />
        </div>
    );
});

export default HomePageTour;
