// we have to shim both exports and imports for this library
// so better to do so in once place and then export
let clinicalTimelineExports = require(
    "imports-loader?$=jquery&d3=d3&_=underscore!exports-loader?clinicalTimeline=clinicalTimeline&trimClinicalTimeline=trimClinicalTimeline&clinicalTimelineParser=clinicalTimelineParser!clinical-timeline"
);

export default clinicalTimelineExports;