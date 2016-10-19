/**
 * Created by jiaojiao on 10/14/16.
 */
import * as _ from 'underscore';
export default function getDatasetsInfo() {



    // Creating a promise
    var promise = new Promise(function (resolve, reject) {

        $.get("http://dashi-dev.cbio.mskcc.org:8080/datasetsAPI/api-legacy/datasets", function (response) {
            const rows = [];
            const studies = [];
            var tempObj = {};
            var suffixes = ["_all", "_sequenced", "_cna", "_rna_seq_v2_mrna", "_microrna", "_mrna", "_methylation_hm27", "_rppa", "_complete"];
            var suffIndex = 0;
            response.forEach((item) => {
                suffIndex = -1;
                if (studies.indexOf(item.cancer_study_identifier) === -1) {
                    studies.push(item.cancer_study_identifier);
                    tempObj = {name: item.name, cancer_study_identifier: item.cancer_study_identifier, citation : _.isNull(item.citation) ? '' : item.citation, pmid: item.pmid };
                    rows.push(tempObj);
                }
                tempObj = rows[studies.indexOf(item.cancer_study_identifier)];
                for(var i = 0;i < suffixes.length;i++){
                    if (item.stable_id.endsWith(suffixes[i])) {
                        suffIndex = i;
                        break;
                    }
                }
                switch (suffIndex) {
                    case 0:
                        tempObj["all"] = item.count;
                        break;
                    case 1:
                        tempObj["sequenced"] = item.count;
                        break;
                    case 2:
                        tempObj["cna"] = item.count;
                        break;
                    case 3:
                        tempObj["rna_seq_v2_mrna"] = item.count;
                        break;
                    case 4:
                        tempObj["microrna"] = item.count;
                        break;
                    case 5:
                        tempObj["mrna"] = item.count;
                        break;
                    case 6:
                        tempObj["methylation_hm27"] = item.count;
                        break;
                    case 7:
                        tempObj["rppa"] = item.count;
                        break;
                    case 8:
                        tempObj["complete"] = item.count;
                        break;
                    default:
                        break;

                }

            });
            resolve(rows);
        })
            .fail(function () {
                reject(this.statusText);
            });
    });

    //return Promise.resolve(mockData.studies);
    return promise;
}