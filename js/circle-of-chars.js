// based on https://jsfiddle.net/skwidbreth/q59s90oy/
var list = $("#input-circle");

var updateLayout = function(listItems) {
  for (var i = 0; i < listItems.length; i++) {
    var offsetAngle = 360 / listItems.length;
    var rotateAngle = offsetAngle * i;
    $(listItems[i]).css(
      "transform",
      "rotate(" +
        rotateAngle +
        "deg) translate(0, -150px) rotate(-" +
        rotateAngle +
        "deg)"
    );
  }
};

"↶ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".split("").forEach(function(char) {
  var listItem = $("<li class='list-item'>" + char + "</li>"); // FIXME
  list.append(listItem);
  var listItems = $(".list-item");
  updateLayout(listItems);
});
