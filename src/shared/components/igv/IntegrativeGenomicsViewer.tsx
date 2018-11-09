import * as React from "react";
import $ from "jquery";
import igv from 'igv/dist/igv.esm.js';
import autobind from "autobind-decorator";

type IGVProps = {
    genome?: string;
    tracks?: any[]; // TODO add typedef for tracks?
    width?: number;
    locus?: string|string[];
    disableSearch?: boolean;
    onRenderingStart? : () => void;
    onRenderingComplete?: () => void;
};

export default class IntegrativeGenomicsViewer extends React.Component<IGVProps, {}> {

    public static defaultProps = {
        genome: "hg19",
        locus: "all",
        disableSearch: false
    };

    private igvDiv: HTMLDivElement|undefined;
    private igvBrowser: any;

    constructor(props: IGVProps) {
        super(props);
    }

    public render() {
        return (
            <div>
                <div ref={this.igvDivRefHandler} className="igvContainer" />
            </div>
        );
    }

    componentDidMount() {
        if (this.props.onRenderingStart) {
            this.props.onRenderingStart();
        }

        igv.createBrowser(this.igvDiv, this.props).then((browser: any) => {
            this.igvBrowser = browser;

            if (this.igvDiv && this.props.disableSearch) {
                $(this.igvDiv).find(".igv-search-container input").attr(
                    "disabled", "true");
                $(this.igvDiv).find(".igv-chromosome-select-widget-container select").attr(
                    "disabled", "true");
            }

            if (this.props.onRenderingComplete) {
                this.props.onRenderingComplete();
            }
        });
    }

    componentDidUpdate() {
        if (this.igvBrowser && this.props.locus) {
            this.igvBrowser.search(this.props.locus);
        }
    }

    @autobind
    private igvDivRefHandler(div:HTMLDivElement) {
        this.igvDiv = div;
    }
}
