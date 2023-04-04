import * as React from 'react';
import Tour from 'reactour';
import './styles.scss';

type StepItem = {
    selector: string;
    content: () => JSX.Element;
};

type Props = {
    rounded?: number;
    mainContent?: string;
    buttonContent?: string;
    className?: string;
    buttonID?: string;
    showStartButton?: Boolean;
    steps: StepItem[];
    startTour?: () => void;
    endTour?: () => void;
};

type State = {
    tourIsOpen: Boolean;
};

export default class InteractiveTour extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            tourIsOpen: false,
        };
    }

    endTour = () => {
        this.props.endTour && this.props.endTour();
        this.setState({ tourIsOpen: false });
    };

    startTour = () => {
        this.props.startTour && this.props.startTour();
        this.setState({ tourIsOpen: true });
    };

    render() {
        const {
            steps,
            className,
            buttonID,
            mainContent = '',
            buttonContent = 'start',
            showStartButton = true,
        } = this.props;
        const { tourIsOpen } = this.state;

        return (
            <>
                {showStartButton && (
                    <div className={className}>
                        {mainContent}
                        <button id={buttonID} onClick={this.startTour}>
                            {buttonContent}
                        </button>
                    </div>
                )}
                <Tour
                    showNavigation={false}
                    steps={steps}
                    isOpen={tourIsOpen}
                    onRequestClose={this.endTour}
                />
            </>
        );
    }
}
