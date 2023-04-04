import * as React from 'react';
import Tour from 'reactour';

type Props = {
    showStartButton?: Boolean;
};

type State = {
    isTourOpen: Boolean;
    // currentStep: Number;
};

export const GC_MODE_ID = 'groupcomparison-v1-hintmode';
export const GC_STEP_ID = 'groupcomparison-v1-stepleft';

export default class GroupComparisonTour extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            isTourOpen: false,
            // currentStep: 0,
        };
    }

    componentDidMount(): void {
        const tourStatus = localStorage.getItem(GC_MODE_ID);
        if (tourStatus === 'on') {
            const stepLeft = localStorage.getItem(GC_STEP_ID);
            if (
                stepLeft &&
                stepLeft !== '0' &&
                typeof +stepLeft === 'number' &&
                !isNaN(+stepLeft)
            ) {
                // this.setCurrentStep(+stepLeft);
                this.steps = this.steps.slice(+stepLeft);
                this.startTour();
            }
        }
    }

    steps = [
        {
            selector: '#mainSearchBox input',
            content: () => (
                <div className="step">
                    Start typing tumor type of interest...
                    <p>For example, type in 'glioma'.</p>
                </div>
            ),
            action: (node: Element) => {
                node.setAttribute('value', 'glioma');
                node.dispatchEvent(new Event('input', { bubbles: true }));
            },
        },
        {
            selector:
                '#cancerStudyListContainer > ul > ul:nth-child(2) > ul:nth-child(3) > li:nth-child(8) > label > input[type=checkbox]',
            content: () => (
                <div className="step">
                    Select the checkbox next to the study of interest.
                </div>
            ),
        },
        {
            selector: '#exploreSelectedStudies',
            content: () => (
                <div className="step">Click “Explore Selected Studies”.</div>
            ),
            action: () => {
                localStorage.setItem(GC_STEP_ID, '3');
            },
        },
        {
            selector: '#comparisonGroupManagerContainer > button:nth-child(2)',
            content: () => (
                <div className="step">
                    Do you want to use a chart that is not visible by default?
                    <p>Clink "Chart".</p>
                </div>
            ),
        },
        {
            content: () => (
                <div className="step">
                    Demo tour is over. To be continued during GSoC...
                </div>
            ),
        },
    ];

    endTour = () => {
        localStorage.setItem(GC_MODE_ID, 'off');
        this.setState({ isTourOpen: false });
    };

    startTour = () => {
        localStorage.setItem(GC_MODE_ID, 'on');
        this.setState({ isTourOpen: true });
    };

    // setCurrentStep = (step: Number) => {
    //     this.setState({ currentStep: step });
    // };

    render() {
        const { showStartButton = true } = this.props;
        const { isTourOpen } = this.state;
        return (
            <>
                {showStartButton && (
                    <div className="group-comparison-tour">
                        Try our new feature Group Comparison.
                        <button id="startTourButton" onClick={this.startTour}>
                            Start!
                        </button>
                    </div>
                )}
                <Tour
                    showNavigation={false}
                    // currentStep={currentStep}
                    // setCurrentStep={this.setCurrentStep}
                    steps={this.steps}
                    isOpen={isTourOpen}
                    onRequestClose={this.endTour}
                />
            </>
        );
    }
}
