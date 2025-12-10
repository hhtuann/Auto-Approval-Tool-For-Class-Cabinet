(function () {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("page.js");
    script.type = "text/javascript";
    script.onload = function () {
        this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
})();
