import { DefaultTooltip } from 'cbioportal-frontend-commons';
import * as React from 'react';
import TourContext from '../WebTour';
import './webTourButton.scss';

export default class WebTourButton extends React.Component<{}, {}> {
    static contextType?: React.Context<any> | undefined = TourContext;
    render() {
        return (
            <div data-tut="reactour__start" className="webButton_container">
                <DefaultTooltip
                    overlay={<span>{'New Here? Take a look around'}</span>}
                    placement="top"
                    trigger={['hover', 'focus']}
                    destroyTooltipOnHide={true}
                >
                    <button
                        onClick={this.context.openTour}
                        className="webButton_button"
                    >
                        <i className="fa fa-solid fa-binoculars" />
                    </button>
                </DefaultTooltip>
            </div>
        );
    }
}
