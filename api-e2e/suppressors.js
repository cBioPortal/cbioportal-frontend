const suppressors = [
    function(report) {
        return (
            report.clDataSorted[0].counts.find(m => m.value == 'not_mutated')
                .count ===
            report.legacyDataSorted[0].counts.find(
                m => m.value == 'not_profiled'
            ).count
        );
    },
    function(report) {
        return (
            report.test.data.studyViewFilter.clinicalDataFilters[0].values
                .length > 10
        );
    },
    function(report) {
        return report.test.data.clinicalDataFilters[0].values.length > 10;
    },
    function(report) {
        return (
            report.test.data.customDataFilters ||
            report.test.data.studyViewFilter.customDataFilters
        );
    },

    function(report) {
        return report.test.data.studyIds.includes('genie_private');
    },
];

module.exports = suppressors;
