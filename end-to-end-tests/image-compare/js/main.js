function getURLParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

$(document).ready(function(){

    var $list = $("<ul></ul>").prependTo("body");

    errorImages.forEach((item)=>{
        $(`<li><a data-path='${item}' href="javascript:void">${item}</a></li>`).appendTo($list);
    });

    $list.on('click','a',function(){

        $list.find("a").removeClass('active');

        $(this).addClass('active');
        buildDisplay($(this).attr('data-path'),'./');
    });

    $list.find("a").get(0).click();

});

function buildDisplay(ref, rootUrl){

    var screenImagePath = `${rootUrl}/screenshots/` + ref.replace(/^reference\//,'screen/');
    var diffImagePath = `${rootUrl}/screenshots/` + ref.replace(/^reference\//,'diff/');
    var refImagePath = `${rootUrl}/screenshots/${ref}`;

    var template = `
     <h3 class="screenshot-name"></h3>
        <div id="juxta" class="juxtapose">
            
        </div>
        
        <h2>Screenshot Diff</h2>
        <h3 class="screenshot-name"></h3>
        <img id="diff" src="${diffImagePath}" />
        <h2>Help</h2>
        <p id="help-text">
        When the screenshot test fails, it means that the screenshot taken from
        your instance of the portal differs from the screenshot stored in the
        repo.<br />
        <br />
        1. If the change in the screenshot is <b>undesired</b>, i.e. there is
        regression, you should fix your PR.<br />
        <br />
        2. If the change in the screenshot is <b>desired</b>, add the screenshot
        to the repo, commit it and push it to your PR's branch, that is:
        <br />
        <br /> curl <span id="img2-url"></span> > <span class="screenshot-name"></span><br />
        git add <span class="screenshot-name"></span><br />
        <br />
        Then preferably use git commit --amend and change your commit message
        to explain how the commit changed the screenshot. Subsequently force
        push to your <b>own branch</b>.
        </p>
    `;

    $("#display").html(template);

    var slider = new juxtapose.JXSlider('#juxta',
        [
            {
                src: refImagePath,
                label: 'reference'
            },
            {
                src: screenImagePath,
                label: 'screen'
            }
        ],
        {
            animate: true,
            showLabels: true,
            startingPosition: "50%",
            makeResponsive: true
        });

}



function buildPage(){

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

}