/*
 * Copyright (c) 2016 The Hyve B.V.
 * This code is licensed under the GNU Affero General Public License,
 * version 3, or (at your option) any later version.
 */

/*
 * This file is part of cBioPortal.
 *
 * cBioPortal is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {ClusteringMessage, hclusterCases, hclusterGeneticEntities} from "./clustering-utils";

const ctx:Worker = (self as any as Worker);
/**
 * "Routing" logic for this worker, based on given message.
 *
 * @param m : message object with m.dimension (CASES or ENTITIES) and m.casesAndEntitites
 *      which is the input for the clustering method.
 */
ctx.onmessage = function(m:MessageEvent) {
    console.log('Clustering worker received message');
    let result = null;
    if ((m.data as ClusteringMessage).dimension === "CASES") {
        result = hclusterCases((m.data as ClusteringMessage).casesAndEntities);
    } else if ((m.data as ClusteringMessage).dimension === "ENTITIES") {
        result = hclusterGeneticEntities((m.data as ClusteringMessage).casesAndEntities);
    } else {
        throw new Error("Illegal argument given to clustering-worker.js for m.data.dimension: " + m.data.dimension);
    }
    console.log('Posting clustering result back to main script');
    ctx.postMessage(result);
}

// export default null;