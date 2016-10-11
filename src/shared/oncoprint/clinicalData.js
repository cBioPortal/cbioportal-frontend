const ClinicalData = (function() {
    var sample_clinical_data = {};// attr_id -> list of data
    var patient_clinical_data = {};// attr_id -> list of data

    var fetchData = function(attr) {
        var def = new $.Deferred();
        $.when(QuerySession.getSampleClinicalData([attr.attr_id]), QuerySession.getPatientClinicalData([attr.attr_id]))
            .then(function (sample_data, patient_data) {
                sample_clinical_data[attr.attr_id] = sample_data;
                patient_clinical_data[attr.attr_id] = patient_data;
                def.resolve();
            }).fail(function () {
            def.reject();
        });
        return def.promise();
    };
    return {
        getSampleData: function(attrs) {
            attrs = [].concat(attrs);
            var def = new $.Deferred();
            var ret = {};
            if (attrs.length === 0) {
                def.resolve({});
            }
            for (var i = 0; i < attrs.length; i++) {
                var attr = attrs[i];
                if (sample_clinical_data.hasOwnProperty(attr.attr_id)) {
                    ret[attr.attr_id] = sample_clinical_data[attr.attr_id];
                    if (Object.keys(ret).length === attrs.length) {
                        def.resolve(ret);
                    }
                } else {
                    fetchData(attr).then((function(_attr) {
                        return function () {
                            ret[_attr.attr_id] = sample_clinical_data[_attr.attr_id];
                            if (Object.keys(ret).length === attrs.length) {
                                def.resolve(ret);
                            }
                        };
                    })(attr)).fail(function () {
                        def.reject();
                    });
                }
            }
            return def.promise();
        },
        getPatientData: function (attrs) {
            attrs = [].concat(attrs);
            var def = new $.Deferred();
            var ret = {};
            if (attrs.length === 0) {
                def.resolve({});
            }
            for (var i = 0; i < attrs.length; i++) {
                var attr = attrs[i];
                if (patient_clinical_data.hasOwnProperty(attr.attr_id)) {
                    ret[attr.attr_id] = patient_clinical_data[attr.attr_id];
                    if (Object.keys(ret).length === attrs.length) {
                        def.resolve(ret);
                    }
                } else {
                    fetchData(attr).then((function(_attr) {
                        return function () {
                            ret[_attr.attr_id] = patient_clinical_data[_attr.attr_id];
                            if (Object.keys(ret).length === attrs.length) {
                                def.resolve(ret);
                            }
                        };
                    })(attr)).fail(function () {
                        def.reject();
                    });
                }
            }
            return def.promise();
        },
    };
})();

export default ClinicalData;
