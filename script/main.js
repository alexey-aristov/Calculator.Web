$(document).ready(function () {
    var throttled = _.throttle(onScroll, 200);
    $(document).on("scroll", throttled);
    var inAction = false;

    function onScroll(event) {
        if (inAction)
            return;
        var screenHeight = $(".bearing_height").height();
        var pos = document.body.scrollTop;

        var o = document.body.scrollTop % screenHeight;
        if (o < 200) {
            var newPos = document.body.scrollTop - o;
            document.body.scrollTop = newPos;
            console.log("onScroll: from" + pos + "to:" + newPos);
            return;
        }
        if (screenHeight - o < 200) {
            var newPos = document.body.scrollTop + (screenHeight - o);
            document.body.scrollTop = newPos;
            console.log("onScroll: from" + pos + "to:" + newPos);
            return;
        }
    }

    $('#home').bind('mousewheel', function (event) {
        event.preventDefault();
        if (inAction)
            return;
        var deltaY = event.originalEvent.deltaY;
        var step = $(".bearing_height").height();
        var pos = document.body.scrollTop;
        var nextPos = pos + (step * Math.sign(deltaY));

        if (Math.abs(pos - nextPos) > 3) {
            inAction = true;
            $('html, body').animate({
                scrollTop: nextPos
            }, 300, function () {
                inAction = false;
            });
            console.log("mousewheel: from" + pos + "to:" + nextPos + ", Step: " + step);
        }
    });
});

