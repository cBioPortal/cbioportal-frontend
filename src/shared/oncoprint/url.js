
var changeURLParam = function (param, new_value, url) {
    var index = url.indexOf(param + '=');
    var before_url, after_url;
    if (index === -1) {
        before_url = url;
        var indexOfQuestionMark = url.indexOf('?');
        if (indexOfQuestionMark === -1) {
            before_url += "?";
        } else if (before_url[before_url.length - 1] !== "&") {
            before_url += "&";
        }
        after_url = "";
        index = url.length;
    } else {
        before_url = url.substring(0, index);
        var next_amp = url.indexOf("&", index);
        if (next_amp === -1) {
            next_amp = url.length;
        }
        after_url = url.substring(next_amp);
    }
    return before_url
        + (new_value.length > 0 ? (param + '=' + new_value) : "")
        + after_url;
};
var currURL = function () {
    return window.location.href;
};
var getParamValue = function (param) {
    var url = currURL();
    var param_index = url.indexOf(param + "=");
    if (param_index > -1) {
        var param_start = param_index + (param + "=").length;
        var param_end = url.indexOf("&", param_index);
        if (param_end === -1) {
            param_end = url.length;
        }
        return url.substring(param_start, param_end);
    } else {
        return null;
    }
};

var init_show_samples = getParamValue("show_samples");
var init_clinical_attrs = getParamValue("clinicallist");
var CLINICAL_ATTRS_PARAM = "clinicallist";
var SAMPLE_DATA_PARAM = "show_samples";

const exp = {
    'update': function (State) {
        var new_url = currURL();
        new_url = changeURLParam(CLINICAL_ATTRS_PARAM,
            State.used_clinical_attributes
                .map(function (attr) {
                    return encodeURIComponent(attr.attr_id);
                })
                .join(","),
            new_url);
        new_url = changeURLParam(SAMPLE_DATA_PARAM,
            State.using_sample_data + '',
            new_url);
        window.history.pushState({"html": window.location.html, "pageTitle": window.location.pageTitle}, "", new_url);
    },
    'getInitDataType': function () {
        if (init_show_samples === null) {
            return null;
        } else {
            return (init_show_samples === 'true' ? 'sample' : 'patient');
        }
    },
    'getInitUsedClinicalAttrs': function () {
        if (init_clinical_attrs === null) {
            return null;
        } else {
            return init_clinical_attrs.trim().split(",").map(decodeURIComponent);
        }
    },
    'getDataType': function () {
        var using_sample_data = getParamValue(SAMPLE_DATA_PARAM);
        if (using_sample_data === null) {
            return null;
        } else {
            return (using_sample_data ? 'sample' : 'patient');
        }
    },
    'getUsedClinicalAttrs': function () {
        var clinical_attr_id_list = getParamValue(CLINICAL_ATTRS_PARAM);
        if (clinical_attr_id_list === null) {
            return null;
        } else {
            return clinical_attr_id_list.trim().split(",").map(decodeURIComponent);
        }
    }
};


export default exp;