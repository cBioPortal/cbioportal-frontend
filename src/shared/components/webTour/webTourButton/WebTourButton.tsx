import { useTour } from '@reactour/tour';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import * as React from 'react';
import TourContext from '../WebTour';
import { HomePageTour } from '../webTourSteps/WebTourSteps';
import './webTourButton.scss';

function WebTourButton() {
    const { setIsOpen, setSteps } = useTour();
    return (
        <div data-tut="reactour__start" className="webButton_container">
            <DefaultTooltip
                overlay={<span>{'New Here? Take a look around'}</span>}
                placement="top"
                trigger={['hover', 'focus']}
                destroyTooltipOnHide={true}
            >
                <button
                    onClick={() => {
                        setSteps(HomePageTour);
                        setIsOpen(true);
                    }}
                    className="webButton_button"
                >
                    <i className="fa fa-solid fa-binoculars" />
                </button>
            </DefaultTooltip>
        </div>
    );
}

export default WebTourButton;
