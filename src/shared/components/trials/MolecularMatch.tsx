import * as React from "react";
import {observer} from "mobx-react";
import {Circle} from "better-react-spinkit";
import DefaultTooltip from 'shared/components/defaultTooltip/DefaultTooltip';
import annotationStyles from "./styles/annotation.module.scss";
import molecularMatchIconStyles from "./styles/molecularmatchIcon.module.scss";
import {observable} from "mobx";
import MolecularMatchTooltip from "./MolecularMatchTooltip";
import {Mutation} from "../../api/generated/CBioPortalAPI";

export interface IMolecularMatchProps {
    count?: number | null | undefined
    trials?: any | null | undefined;
    sampleIDtoTumorType?: { [sampleId: string]: string };
    mutationData?: Mutation | undefined;
}

export function hideArrow(tooltipEl: any) {
    const arrowEl = tooltipEl.querySelector('.rc-tooltip-arrow');
    arrowEl.style.display = 'none';
}


@observer
export default class MolecularMatch extends React.Component<IMolecularMatchProps, {}> {
    @observable tooltipDataLoadComplete: boolean = false;

    public static get MOLECULAR_MATCH_ICON_STYLE() {
        return {
            backgroundImage: `url(${require('./images/mm-icons-count.png')})`
        };
    }

    constructor(props: IMolecularMatchProps) {
        super(props);

        this.handleLoadComplete = this.handleLoadComplete.bind(this);
        this.tooltipContent = this.tooltipContent.bind(this);
    }

    public render() {
        let mmContent: JSX.Element = (
            <span className={`${annotationStyles["annotation-item"]}`}/>
        );

        if (this.props.count === null) {
            // null means there is an error...
            mmContent = this.errorIcon();
        }
        else if (this.props.count === undefined) {
            // undefined means still loading...
            mmContent = this.loaderIcon();
        }
        else if (this.props.count == 0) {
            //do not show any mm icon...
        }
        else {
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

        const arrowContent = <div className="rc-tooltip-arrow-inner"/>;

        if (this.tooltipDataLoadComplete || this.props.count !== null) {
            mmContent = (
                <DefaultTooltip
                    overlay={this.tooltipContent}
                    placement="right"
                    trigger={['hover', 'focus']}
                    arrowContent={arrowContent}
                    onPopupAlign={hideArrow}
                    destroyTooltipOnHide={false}
                >
                    {mmContent}
                </DefaultTooltip>
            );
        }

        return mmContent;
    }

    public loaderIcon() {
        return (
            <Circle size={18} scaleEnd={0.5} scaleStart={0.2} color="#aaa" className="pull-left"/>
        );
    }

    public errorIcon() {
        return (
            <DefaultTooltip
                overlay={<span>Error fetching MolecularMatch data</span>}
                placement="right"
                trigger={['hover', 'focus']}
                arrowContent={<div className="rc-tooltip-arrow-inner"/>}
                destroyTooltipOnHide={true}
            >
                <span className={`${annotationStyles["annotation-item-error"]}`}>
                    <i className="fa fa-exclamation-triangle text-danger"/>
                </span>
            </DefaultTooltip>
        );
    }

    private tooltipContent(): JSX.Element {
        return (
            <MolecularMatchTooltip
                count={this.props.count || undefined}
                trials={this.props.trials || undefined}
                sampleIDtoTumorType={this.props.sampleIDtoTumorType}
                mutationData={this.props.mutationData}
                onLoadComplete={this.handleLoadComplete}
            />
        );
    }


    // purpose of this callback is to trigger re-instantiation
    // of the tooltip upon full load of the tooltip data
    private handleLoadComplete(): void {
        // update only once to avoid unnecessary re-rendering
        if (!this.tooltipDataLoadComplete) {
            this.tooltipDataLoadComplete = true;
        }
    }

    private molecularMatchImageClassNames(count: number | any) {

        let className: string;

        if (count != null && count <= 10) {
            className = "count" + count;
        }
        else {
            className = "countexceed-10";
        }

        return molecularMatchIconStyles[className];
    }
}
