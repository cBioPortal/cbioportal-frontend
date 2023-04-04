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
    steps: StepItem[];
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
        this.setState({ tourIsOpen: false });
    };

    startTour = () => {
        this.setState({ tourIsOpen: true });
    };

    render() {
        const {
            steps,
            className,
            buttonID,
            rounded = 10,
            mainContent = '',
            buttonContent = 'start',
        } = this.props;
        const { tourIsOpen } = this.state;

        return (
            <div className={className}>
                {mainContent}
                <button id={buttonID} onClick={this.startTour}>
                    {buttonContent}
                </button>
                <Tour
                    rounded={rounded}
                    steps={steps}
                    isOpen={tourIsOpen}
                    onRequestClose={this.endTour}
                />
            </div>
        );
    }
}
