(function() {
  var otpIntervalId = null;
  var timeBarIntervalId = null;
  var currentlySelectedSecret = null;

  /**
   *  Object that holds a current random data piece
   *  @private
   */
  var data = {
    name: null,
    rawData: null,
    next: function() {
      this.name = "";
      this.rawData = "";
      return this;
    },
  };

  /**
   *  Displays error message in the popup
   *  @private
   *  @param {string} message - Error message to display in the popup
   */
  function displayErrorPopup(message) {
    document
      .getElementById("error-popup")
      .querySelector(".ui-popup-content").innerText = message;
    tau.openPopup("error-popup");
  }

  /**
   *  Gets list of aliases of the saved data
   *  @private
   */
  function getDataAliases() {
    return tizen.keymanager.getDataAliasList();
  }

  /**
   *  Gets raw data by the alias given
   *  @private
   *  @param {Object} alias - Alias of the data piece to get
   */
  function getRawData(alias) {
    var data;
    try {
      data = tizen.keymanager.getData(alias);
    } catch (e) {
      if (e.name === "NotFoundError") {
        data = "Data inaccessible";
      }
    }
    return data;
  }

  /**
   *  Saves current random data and returns to the main page
   *  @private
   */
  function saveDataPiece() {
    var name = $(".data.name > input").val(),
      rawData = $(".data.raw-data > input").val();

    // document.querySelector(".data.raw-data").onclick = function() {};
    console.log("saving");

    tizen.keymanager.saveData(
      name,
      rawData,
      null,
      function() {
        console.log("done; saved");
        tau.changePage("page-main");
        data.next();
        console.log(data);
      },
      function(e) {
        displayErrorPopup("Cannot save the data: " + e.message);
      }
    );
  }

  /**
   *  Removes data given with the alias and returns to the main page
   *  @private
   *  @param {Object} alias - Alias of the data piece to remove
   */
  function removeDataPiece(alias) {
    // tau.openPopup("delete-confirmation-popup");

    // document.getElementById("btn-confirm-delete").onclick = function() {
    //   tau.closePopup("delete-confirmation-popup");
    //   try {
    //     tizen.keymanager.removeData(alias);
    //     tau.back();
    //   } catch (e) {
    //     displayErrorPopup("Cannot remove the data: " + e.message);
    //   }
    // };

    // document.getElementById("btn-cancel-delete").onclick = function() {
    //   tau.closePopup("delete-confirmation-popup");
    // };

    try {
      tizen.keymanager.removeData(alias);
      tau.back();
    } catch (e) {
      displayErrorPopup("Cannot remove the data: " + e.message);
    }
  }

  /**
   *  Displays data in the other page given with the alias
   *  @private
   *  @param {Object} alias - Alias of the data piece to display
   */
  function displayDataPiece(alias) {
    var name = alias.name,
      rawData = getRawData(alias);

    currentlySelectedSecret = rawData;

    $(".ui-title.data.name").html(name);

    document.querySelector("#btn-remove-data").onclick = removeDataPiece.bind(
      this,
      alias
    );

    tau.changePage("page-display-data");

    clearInterval(otpIntervalId);
    otpIntervalId = setInterval(timer, 1000);
    clearInterval(timeBarIntervalId);
    timeBarIntervalId = setInterval(updateTimeBar, 50);
    updateOtp();
  }

  /**
   *  Populates list view with data retrieved from Key Manager
   *  @private
   */
  function listDataPieces() {
    var aliases = getDataAliases(),
      displayDataPage = document.getElementById("page-display-data"),
      dataList = document.getElementById("data-list");

    // Cleans up the list
    while (dataList.firstChild) {
      dataList.removeChild(dataList.firstChild);
    }

    if (aliases.length > 0) {
      // For each alias a list item is created
      for (var i = 0; i < aliases.length; ++i) {
        var li = document.createElement("li"),
          a = document.createElement("a"),
          text = document.createTextNode(aliases[i].name);

        a.appendChild(text);
        a.href = "#";
        a.onclick = displayDataPiece.bind(displayDataPage, aliases[i]);
        li.appendChild(a);
        dataList.appendChild(li);
      }
    } else {
      // Else the list is populated with one non-interactive item "No data"
      var li = document.createElement("li"),
        i = document.createElement("i"),
        text = document.createTextNode("Nothing to display");

      i.appendChild(text);
      li.appendChild(i);
      dataList.appendChild(li);
    }
  }

  // Page selectors
  var mainPage = document.getElementById("page-main"),
    addDataPage = document.getElementById("page-add-data"),
    cirleInputPage = document.getElementById("circle-input-page"),
    errorPopupPage = document.getElementById("error-popup");

  // Configures animations
  tau.defaults.pageTransition = "slideup";
  tau.defaults.popupTransition = "slideup";

  window.addEventListener("tizenhwkey", function(ev) {
    if (ev.keyName === "back") {
      var page = document.getElementsByClassName("ui-page-active")[0],
        pageid = page ? page.id : "";
      clearInterval(otpIntervalId);
      clearInterval(timeBarIntervalId);
      if (pageid === "page-main") {
        try {
          tizen.application.getCurrentApplication().exit();
        } catch (ignore) {}
      } else if (pageid === "page-add-data") {
        data.next();
        tau.changePage("page-main");
      } else if (pageid === "page-display-data") {
        data.next();
        tau.changePage("page-main");
      } else {
        window.history.back();
      }
    }
  });

  /**
   *  Registers a listener for the main page
   */
  mainPage.addEventListener("pagebeforecreate", function() {
    // Initializes random data
    data.next();
  });

  /**
   *  Registers a listener for the main page
   */
  mainPage.addEventListener("pagebeforeshow", function() {
    var dataListContainer = this.querySelector(".ui-content"),
      dataPopup = document.getElementById("popup-data");

    data.next();

    // Registers rotary event
    var SCROLL_STEP = 30;
    document.addEventListener(
      "rotarydetent",
      function(e) {
        if (e.detail.direction === "CW") {
          dataListContainer.scrollTop += SCROLL_STEP;
        } else if (e.detail.direction === "CCW") {
          dataListContainer.scrollTop -= SCROLL_STEP;
        }
      },
      false
    );

    // Initializes list of saved pieces
    listDataPieces.apply(this);
  });

  // Changes page on click
  document.querySelector("#btn-add-data").onclick = function() {
    data.next();
    tau.changePage("page-add-data");
  };

  /**
   *  Registers a listener for the main page
   */
  mainPage.addEventListener("pagebeforehide", function() {
    document.removeEventListener("rotarydetent");
  });

  /**
   *  Registers a listener for the add data page
   */
  addDataPage.addEventListener("pagebeforeshow", function() {
    // Displays current random data
    $(".data.name > input").val(data.name);
    $(".data.raw-data > input").val(data.rawData);

    document.querySelector("#btn-save-data").onclick = saveDataPiece.bind(this);

    // Hide elements when typing
    document.querySelector(".data.raw-data > input").onfocus = function() {
      data.name = $(".data.name > input").val();
      tau.changePage("circle-input-page");
    };
  });

  /**
   * Circle Input Page
   */
  var selectedChar = 2;
  var bezel_event_func = function(e) {
    $(`ul#input-circle > li:nth-child(${selectedChar})`).css(
      "background",
      "none"
    );
    if (e.detail.direction === "CW") {
      selectedChar += 1;
    } else if (e.detail.direction === "CCW") {
      selectedChar -= 1;
    }

    selectedChar = (selectedChar + 32) % 33 + 1;

    var currentlySelectedElement = $(
      `ul#input-circle > li:nth-child(${selectedChar})`
    );

    currentlySelectedElement.css("background-color", "red");

    var currentlySelectedChar = currentlySelectedElement
      .text()
      .replace("↶", "undo");

    if (data.rawData.length >= 16) {
      $("#currently-selected-letter").text("✓");
    } else {
      $("#currently-selected-letter").text(currentlySelectedChar);
    }
  };

  cirleInputPage.addEventListener("pagebeforeshow", function() {
    $("#recent-chars").text("...");

    selectedChar = 2;

    var currentlySelectedElement = $(
      `ul#input-circle > li:nth-child(${selectedChar})`
    );
    currentlySelectedElement.css("background-color", "red");
    var currentlySelectedChar = currentlySelectedElement
      .text()
      .replace("↶", "undo");
    $("#currently-selected-letter").text(currentlySelectedChar);

    if (data.rawData.length >= 16) {
      $("#currently-selected-letter").text("✓");
    }

    document.addEventListener("rotarydetent", bezel_event_func, false);
  });

  function cleanupCircleInputPage() {
    document.removeEventListener("rotarydetent", bezel_event_func, false);
    $(`ul#input-circle > li:nth-child(${selectedChar})`).css(
      "background",
      "none"
    );
  }

  cirleInputPage.addEventListener(
    "pagebeforehide",
    cleanupCircleInputPage,
    false
  );

  document.querySelector("#center-of-input-circle").onclick = function() {
    var currentlySelectedElement = $(
      `ul#input-circle > li:nth-child(${selectedChar})`
    );
    var currentlySelectedChar = currentlySelectedElement.text();
    if (currentlySelectedChar === "↶") {
      data.rawData = data.rawData.slice(0, -1);
    } else if (data.rawData.length >= 16) {
      cleanupCircleInputPage();
      tau.changePage("page-add-data");
      $("#currently-selected-letter").text("✓");
      return;
    } else {
      data.rawData += currentlySelectedChar;
    }
    $("#recent-chars").text("..." + data.rawData.slice(-4));
  };

  /**
   *  Registers a listener for the error popup page
   */
  errorPopupPage.addEventListener("popupbeforecreate", function() {});

  document.querySelector("#btn-ok").onclick = function() {
    tau.closePopup();
  };

  // from http://jsfiddle.net/russau/ch8PK/
  function updateOtp() {
    var key = base32tohex(currentlySelectedSecret);
    var epoch = Math.round(new Date().getTime() / 1000.0);
    var time = leftpad(dec2hex(Math.floor(epoch / 30)), 16, "0");

    var shaObj = new jsSHA("SHA-1", "HEX");
    shaObj.setHMACKey(key, "HEX");
    shaObj.update(time);
    var hmac = shaObj.getHMAC("HEX");

    var offset = hex2dec(hmac.substring(hmac.length - 1));

    var otp = (hex2dec(hmac.substr(offset * 2, 8)) & hex2dec("7fffffff")) + "";
    otp = otp.substr(otp.length - 6, 6);
    document.querySelectorAll(".data.raw-data")[1].innerText = otp;
  }

  function timer() {
    var epoch = Math.round(new Date().getTime() / 1000.0);
    if (epoch % 30 === 0) {
      updateOtp();
    }
  }

  function updateTimeBar() {
    var epoch = new Date().getTime() / 1000.0;

    if (epoch % 60 > 30) {
      $("#time-left-bar").css("left", "0");
      $("#time-left-bar").css("right", "initial");
      $("#time-left-bar").css("width", `${100 * (epoch % 30) / 30}%`);
    } else {
      $("#time-left-bar").css("right", "0");
      $("#time-left-bar").css("left", "initial");
      $("#time-left-bar").css("width", `${100 - 100 * (epoch % 30) / 30}%`);
    }
  }
})();
