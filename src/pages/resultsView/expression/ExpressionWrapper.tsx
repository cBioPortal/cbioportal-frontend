import * as React from 'react';
import { init, update } from './expressionLib.js';
import {ResultsViewPageStore} from "../ResultsViewPageStore";
import {observer} from "mobx-react";
import './styles.scss';

export default class ExpressionWrapper extends React.Component<{ studyIds:string[], genes:string[] }, {}> {

    constructor() {
        super();
    }

    componentDidMount(){
        this.renderExpression();
    }

    componentDidUpdate(){
        this.renderExpression();
    }

    renderExpression(){
        init(this.props.studyIds, this.props.genes);
    }

    updateExpression(){
        console.log("update");
        update();
    }

    render(){
        return (

            <div id="cc-plots">
                <table>
                    <tr>
                        <div>
                            <form className="form-inline expression-controls">
                                <div className="form-group">
                                    <h5>Gene:</h5>
                                    <select className="form-control input-sm" disabled id="cc_plots_gene_list" onChange={()=>this.renderExpression()} title="Select gene"></select>
                                </div>
                                <div className="form-group">
                                    <h5>Profile:</h5>
                                    <select className="form-control input-sm" id="cc_plots_profile_list" onChange={()=>this.renderExpression()} title="Select profile"></select>
                                </div>

                                <div className="form-group">
                                    <h5>Sort By:</h5>
                                    <label className="radio-inline">
                                        <input type="radio" name="cc_plots_study_order_opt" onChange={()=>this.updateExpression()} value="alphabetic" title="Sort by cancer study" defaultChecked={true}/> Cancer Study
                                    </label>

                                    <label className="radio-inline">
                                        <input type="radio" name="cc_plots_study_order_opt" onChange={()=>this.updateExpression()} value="median" title="Sort by median" defaultChecked={false}/> Median
                                    </label>
                                </div>

                                <div className="form-group">
                                    <label className="checkbox-inline">
                                        <input type="checkbox" id="cc_plots_log_scale" onChange={()=>this.updateExpression()} title="Log scale" defaultChecked={true}/>
                                        Log scale
                                    </label>
                                    <label className="checkbox-inline">
                                        <input type="checkbox" id="cc_plots_show_mutations" onChange={()=>this.updateExpression()} title="Show mutations" defaultChecked={true}/>
                                        Show mutations
                                    </label>
                                </div>

                                <div className="form-group">
                                    <div className="btn-group" role="group">
                                        <button className="btn btn-default btn-xs" type="button" id="cc_plots_pdf_download">
                                            <i className="fa fa-cloud-download" aria-hidden="true"></i> PDF</button>
                                        <button className="btn btn-default btn-xs" type="button" id="cc_plots_svg_download">
                                            <i className="fa fa-cloud-download" aria-hidden="true"></i> SVG</button>
                                        <button className="btn btn-default btn-xs" type="button" id="cc_plots_data_download">
                                            <i className="fa fa-cloud-download" aria-hidden="true"></i> Data</button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <button className="btn btn-default btn-xs disabled" type="button" data-target="#cc_plots_select_study_collapse"
                                            aria-expanded="false" aria-controls="collapseExample" id="cc_plots_study_selection_btn">
                                        <span className="glyphicon glyphicon-menu-hamburger" aria-hidden="false"></span> &nbsp;Select Studies
                                    </button>
                                </div>


                            </form>

                            <div className="collapse" id="cc_plots_select_study_collapse">
                                <div className="well" id="cc_plots_select_study_box"></div>
                            </div>
                        </div>
                    </tr>
                    <tr>
                        <div id="cc_plots_box"><img src='images/ajax-loader.gif' alt='loading' /></div>
                    </tr>
                </table>

            </div>
            
            
        );
    }

}