function getURLParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

var img1 = getURLParameterByName("img1");
var img2 = getURLParameterByName("img2");
var label1 = getURLParameterByName("label1");
var label2 = getURLParameterByName("label2");
var screenshotName = getURLParameterByName("screenshot_name");
var diffImage = getURLParameterByName("diff_img");

if (img1 !== "" && img2 !== "") {
    $("#img1").attr("src", img1);
    $("#img2").attr("src", img2);
    $("#img2-url").html(img2);

    if (screenshotName !== "") {
        $(".screenshot-name").html(screenshotName);
    }
    if (diffImage !== "") {
        $("#diff").attr("src", diffImage);
    }
} else {
    $("#help-text").text("Set images to compare in URL e.g. ?img1=http://image1.com&img2=http://image2.com&label1=before&label2=after&screenshot_name=test_screenshot");
}
