import * as React from "react";
import {Modal} from "react-bootstrap";
import {observer} from "mobx-react";
import {Circle} from "better-react-spinkit";
import DefaultTooltip from "shared/components/DefaultTooltip";
import annotationStyles from "./styles/annotation.module.scss";
import molecularMatchIconStyles from "./styles/molecularmatchIcon.module.scss";
import {observable} from "mobx";

export interface IMolecularMatchProps {
    count?: number | null;
}

export function hideArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.display = 'none';
}


@observer
export default class MolecularMatch extends React.Component<IMolecularMatchProps, {}>
{
    @observable showFeedback:boolean = false;
    @observable tooltipDataLoadComplete:boolean = false;

    public static get MOLECULAR_MATCH_ICON_STYLE()
    {
        return {
            backgroundImage: `url(${require('./images/molecularmatch.png')})`
        };
    }

    constructor(props: IMolecularMatchProps)
    {
        super(props);

        this.handleFeedbackOpen = this.handleFeedbackOpen.bind(this);
        this.handleFeedbackClose = this.handleFeedbackClose.bind(this);
        this.handleLoadComplete = this.handleLoadComplete.bind(this);
       // this.tooltipContent = this.tooltipContent.bind(this);
    }

    public render()
    {
        let mmContent:JSX.Element = (
            <span className={`${annotationStyles["annotation-item"]}`} />
        );

        if (this.props.count === null) {
            // null means there is an error...
            mmContent = this.errorIcon();
        }
        else if (this.props.count === undefined) {
            // undefined means still loading...
            mmContent = this.loaderIcon();
        }
        else
        {
            //need to alter svg dynamically and set icon
            mmContent = (
                <span className={`${annotationStyles["annotation-item"]}`}>
                    <i
                        className={`${molecularMatchIconStyles['molecularmatch-icon-image']} ${this.molecularMatchImageClassNames(this.props.count)}`}
                        style={MolecularMatch.MOLECULAR_MATCH_ICON_STYLE}
                        data-test='molecularmatch-icon-image'
                    />
                </span>
            );
        }

        return mmContent;
    }

    public loaderIcon()
    {
        return (
            <Circle size={18} scaleEnd={0.5} scaleStart={0.2} color="#aaa" className="pull-left"/>
        );
    }

    public errorIcon()
    {
        return (
            <DefaultTooltip
                overlay={<span>Error fetching OncoKB data</span>}
                placement="right"
                trigger={['hover', 'focus']}
                arrowContent={<div className="rc-tooltip-arrow-inner"/>}
                destroyTooltipOnHide={true}
            >
                <span className={`${annotationStyles["annotation-item-error"]}`}>
                    <i className="fa fa-exclamation-triangle text-danger" />
                </span>
            </DefaultTooltip>
        );
    }

    //
    // private tooltipContent(): JSX.Element
    // {
    //     return (
    //         <MolecularMatchTooltip
    //             indicator={this.props.indicator || undefined}
    //             evidenceCache={this.props.evidenceCache}
    //             evidenceQuery={this.props.evidenceQuery}
    //             pubMedCache={this.props.pubMedCache}
    //             handleFeedbackOpen={this.handleFeedbackOpen}
    //             onLoadComplete={this.handleLoadComplete}
    //         />
    //     );
    // }

    // purpose of this callback is to trigger re-instantiation
    // of the tooltip upon full load of the tooltip data
    private handleLoadComplete(): void {
        // update only once to avoid unnecessary re-rendering
        if (!this.tooltipDataLoadComplete) {
            this.tooltipDataLoadComplete = true;
        }
    }

    private handleFeedbackOpen(): void {
        this.showFeedback = true;
    }

    private handleFeedbackClose(): void {
        this.showFeedback = false;
    }

    private molecularMatchImageClassNames(count: number | any) {

        let className: string;

        if(count != null && count <= 10){
            className = "count" + count;
        }
        else{
            className = "countexceed-10";
        }

        return className;
    }
}
