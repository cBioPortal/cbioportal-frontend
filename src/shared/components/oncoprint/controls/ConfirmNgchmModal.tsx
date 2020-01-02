import * as React from 'react';
import { Button, Modal } from 'react-bootstrap';
import {observer} from "mobx-react";
import {observable} from "mobx";

//
// NG-CHM are "Next-Generation Clustered Heat Maps", a highly interactive viewer of
// even very large heat maps, as described here:
// https://bioinformatics.mdanderson.org/public-software/ngchm/
// Source code for the viewer and other tools can be found at
// https://github.com/MD-Anderson-Bioinformatics
//

@observer
export default class ConfirmNgchmModal extends React.Component<{ show:boolean, onHide:()=>void, openNgchmWindow:()=>void }, {}> {

	// CSS properties in img tag below should go in .css file?
	// margin-right:20px; margin-bottom:20px;

    render() {
        return (
            <Modal show={this.props.show} onHide={this.props.onHide} animation={false}>
                <Modal.Header closeButton>
                    <Modal.Title>Open new tab to MD Anderson NG-CHM?</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                	<div className="oncoprint__controls__heatmap_menu mdacc-modal">
                    <p>Continue will open a tab or window to a different site (not cBioPortal).</p>
                    <img src={require("./mdandersonlogo260x85.png")} alt="MD Anderson Cancer Center logo" style={{width:153, height:50, margin:2, 'margin-right':20, 'margin-bottom':20, float:'left'}}/>
                    <p>
                         The University of Texas MD Anderson Cancer Center has created a 
                        Next-Generation Clustered Heatmap compendium
                        based on the same dataset or a very similar dataset containing many of the
                        same TCGA samples.  Continue will display a page of NG-CHM based on 
                        this dataset.
                    </p>
                    <div style={{clear:'left'}}/>
                    Read details on the data processing used for this TCGA compendium <a
                        href="https://bioinformatics.mdanderson.org/public-datasets/about-the-tcga-compendium/"
                        target='_blank'
                        >
                        here
                    </a> (opens in a new tab).
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={()=>{this.props.openNgchmWindow(); this.props.onHide();}}>Continue</Button>
                    <Button onClick={this.props.onHide}>Cancel</Button>
                </Modal.Footer>
            </Modal>
        );
    }
}
