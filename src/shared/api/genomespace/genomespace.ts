import {gsUploadByGet} from "./gsuploadwindow";
import {GeneticProfile, CancerStudy} from "../generated/CBioPortalAPI";
import {getSubmitQueryUrl} from "../urls";

/** Copyright (c) 2007 Memorial Sloan-Kettering Cancer Center.
 **
 ** Code written by: Ethan Cerami, Benjamin Gross
 ** Authors: Ethan Cerami, Gary Bader, Chris Sander, Benjamin Gross
 ** Modified by Jim Robinson for use with IGV
 **
 ** This library is free software; you can redistribute it and/or modify it
 ** under the terms of the GNU Lesser General Public License as published
 ** by the Free Software Foundation; either version 2.1 of the License, or
 ** any later version.
 **
 ** This library is distributed in the hope that it will be useful, but
 ** WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF
 ** MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  The software and
 ** documentation provided hereunder is on an "as is" basis, and
 ** Memorial Sloan-Kettering Cancer Center
 ** has no obligations to provide maintenance, support,
 ** updates, enhancements or modifications.  In no event shall
 ** Memorial Sloan-Kettering Cancer Center
 ** be liable to any party for direct, indirect, special,
 ** incidental or consequential damages, including lost profits, arising
 ** out of the use of this software and its documentation, even if
 ** Memorial Sloan-Kettering Cancer Center
 ** has been advised of the possibility of such damage.  See
 ** the GNU Lesser General Public License for more details.
 **
 ** You should have received a copy of the GNU Lesser General Public License
 ** along with this library; if not, write to the Free Software Foundation,
 ** Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA.
 **/

function uploadUrlByGetToGS(dataURL:string, filename:string)
{
    let dest = "";
    let onComplete = function(savePath:string){
        alert('outer Saved to GenomeSpace as ' + savePath);
    };
    let onError = function(savePath:string){
        alert('outer ERROR saving to GenomeSpace as ' + savePath);
    };
    gsUploadByGet({
        url: dataURL,
        filename: filename,
        successCallback: onComplete,
        errorCallback: onError
    });
    return false;
};
