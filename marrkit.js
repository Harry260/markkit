const linkHelper = {
    rel_to_abs: function(url, base) {

        if (/^(https?|file|ftps?|mailto|javascript|data:image\/[^;]{2,9};):/i.test(url))
            return url;

        var location = new URL(base)
        var base_url = location.href.match(/^(.+)\/?(?:#.+)?$/)[0] + "/";

        if (url.substring(0, 2) == "//")
            return location.protocol + url;
        else if (url.charAt(0) == "/")
            return location.protocol + "//" + location.host + url;
        else if (url.substring(0, 2) == "./")
            url = "." + url;
        else if (/^\s*$/.test(url))
            return "";
        else url = "../" + url;

        url = base_url + url;
        var i = 0
        while (/\/\.\.\//.test(url = url.replace(/[^\/]+\/+\.\.\//g, "")));

        url = url.replace(/\.$/, "").replace(/\/\./g, "").replace(/"/g, "%22")
            .replace(/'/g, "%27").replace(/</g, "%3C").replace(/>/g, "%3E");
        return url;
    },

    replace_all_rel_by_abs: function(html, base) {

        var rel_to_abs = this.rel_to_abs;
        var att = "[^-a-z0-9:._]";

        var entityEnd = "(?:;|(?!\\d))";
        var ents = {
            " ": "(?:\\s|&nbsp;?|&#0*32" + entityEnd + "|&#x0*20" + entityEnd + ")",
            "(": "(?:\\(|&#0*40" + entityEnd + "|&#x0*28" + entityEnd + ")",
            ")": "(?:\\)|&#0*41" + entityEnd + "|&#x0*29" + entityEnd + ")",
            ".": "(?:\\.|&#0*46" + entityEnd + "|&#x0*2e" + entityEnd + ")"
        };

        var charMap = {};
        var s = ents[" "] + "*";
        var any = "(?:[^>\"']*(?:\"[^\"]*\"|'[^']*'))*?[^>]*";

        function ae(string) {
            var all_chars_lowercase = string.toLowerCase();
            if (ents[string]) return ents[string];
            var all_chars_uppercase = string.toUpperCase();
            var RE_res = "";
            for (var i = 0; i < string.length; i++) {
                var char_lowercase = all_chars_lowercase.charAt(i);
                if (charMap[char_lowercase]) {
                    RE_res += charMap[char_lowercase];
                    continue;
                }
                var char_uppercase = all_chars_uppercase.charAt(i);
                var RE_sub = [char_lowercase];
                RE_sub.push("&#0*" + char_lowercase.charCodeAt(0) + entityEnd);
                RE_sub.push("&#x0*" + char_lowercase.charCodeAt(0).toString(16) + entityEnd);
                if (char_lowercase != char_uppercase) {
                    /* Note: RE ignorecase flag has already been activated */
                    RE_sub.push("&#0*" + char_uppercase.charCodeAt(0) + entityEnd);
                    RE_sub.push("&#x0*" + char_uppercase.charCodeAt(0).toString(16) + entityEnd);
                }
                RE_sub = "(?:" + RE_sub.join("|") + ")";
                RE_res += (charMap[char_lowercase] = RE_sub);
            }
            return (ents[string] = RE_res);
        }

        function by(match, group1, group2, group3) {
            return group1 + rel_to_abs(group2, base) + group3;
        }

        var slashRE = new RegExp(ae("/"), 'g');
        var dotRE = new RegExp(ae("."), 'g');
        function by2(match, group1, group2, group3) {

            group2 = group2.replace(slashRE, "/").replace(dotRE, ".");
            return group1 + rel_to_abs(group2, base) + group3;
        }

        function cr(selector, attribute, marker, delimiter, end) {
            if (typeof selector == "string") selector = new RegExp(selector, "gi");
            attribute = att + attribute;
            marker = typeof marker == "string" ? marker : "\\s*=\\s*";
            delimiter = typeof delimiter == "string" ? delimiter : "";
            end = typeof end == "string" ? "?)(" + end : ")(";
            var re1 = new RegExp('(' + attribute + marker + '")([^"' + delimiter + ']+' + end + ')', 'gi');
            var re2 = new RegExp("(" + attribute + marker + "')([^'" + delimiter + "]+" + end + ")", 'gi');
            var re3 = new RegExp('(' + attribute + marker + ')([^"\'][^\\s>' + delimiter + ']*' + end + ')', 'gi');
            html = html.replace(selector, function (match) {
                return match.replace(re1, by).replace(re2, by).replace(re3, by);
            });
        }

        function cri(selector, attribute, front, flags, delimiter, end) {
            if (typeof selector == "string") selector = new RegExp(selector, "gi");
            attribute = att + attribute;
            flags = typeof flags == "string" ? flags : "gi";
            var re1 = new RegExp('(' + attribute + '\\s*=\\s*")([^"]*)', 'gi');
            var re2 = new RegExp("(" + attribute + "\\s*=\\s*')([^']+)", 'gi');
            var at1 = new RegExp('(' + front + ')([^"]+)(")', flags);
            var at2 = new RegExp("(" + front + ")([^']+)(')", flags);
            if (typeof delimiter == "string") {
                end = typeof end == "string" ? end : "";
                var at3 = new RegExp("(" + front + ")([^\"'][^" + delimiter + "]*" + (end ? "?)(" + end + ")" : ")()"), flags);
                var handleAttr = function (match, g1, g2) { return g1 + g2.replace(at1, by2).replace(at2, by2).replace(at3, by2) };
            } else {
                var handleAttr = function (match, g1, g2) { return g1 + g2.replace(at1, by2).replace(at2, by2) };
            }
            html = html.replace(selector, function (match) {
                return match.replace(re1, handleAttr).replace(re2, handleAttr);
            });
        }

        /* <meta http-equiv=refresh content="  ; url= " > */
        cri("<meta" + any + att + "http-equiv\\s*=\\s*(?:\"" + ae("refresh") + "\"" + any + ">|'" + ae("refresh") + "'" + any + ">|" + ae("refresh") + "(?:" + ae(" ") + any + ">|>))", "content", ae("url") + s + ae("=") + s, "i");

        cr("<" + any + att + "href\\s*=" + any + ">", "href"); /* Linked elements */
        cr("<" + any + att + "src\\s*=" + any + ">", "src"); /* Embedded elements */

        cr("<object" + any + att + "data\\s*=" + any + ">", "data"); /* <object data= > */
        cr("<applet" + any + att + "codebase\\s*=" + any + ">", "codebase"); /* <applet codebase= > */

        /* <param name=movie value= >*/
        cr("<param" + any + att + "name\\s*=\\s*(?:\"" + ae("movie") + "\"" + any + ">|'" + ae("movie") + "'" + any + ">|" + ae("movie") + "(?:" + ae(" ") + any + ">|>))", "value");

        cr(/<style[^>]*>(?:[^"']*(?:"[^"]*"|'[^']*'))*?[^'"]*(?:<\/style|$)/gi, "url", "\\s*\\(\\s*", "", "\\s*\\)"); /* <style> */
        cri("<" + any + att + "style\\s*=" + any + ">", "style", ae("url") + s + ae("(") + s, 0, s + ae(")"), ae(")")); /*< style=" url(...) " > */

        return html;
    },
    Exists: function(url){

        var http = new XMLHttpRequest();
        http.open('HEAD', url, false);
        http.send();
        return http.status!=404;
    }
}



class Markkit extends HTMLElement {

    constructor(markkitSettings = {}) {
        super();

        var theme = markkitSettings.theme ?? "auto"
        this.setTheme(theme)
    }

    connectedCallback() {
        var tag = this;
        var src = tag.getAttribute('src')
        var theme = tag.getAttribute('theme') ?? "auto"
        var innerText = tag.innerText;

        if(src){
            this.#fetchContent(src, (data) => {

                if(data.status === false){
                    data["data"] = data.data
                }

                this.Render(data.data, (rendered) => {
                    tag.innerHTML = `<div class="markdown-body">${linkHelper.replace_all_rel_by_abs(rendered, src)}</div>`;
                });
            })
        }
        else{
 
            this.Render(innerText, (data) => {
                tag.innerHTML = `<div class="markdown-body">${data}</div>`
            });
        }
       
    }

    setTheme(theme){
        var objtheme = {
            light: "https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.0.0/github-markdown-light.min.css",
            dark: "https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.0.0/github-markdown-dark.min.css",
            auto: "https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.0.0/github-markdown.min.css"
        }
        this.#require(objtheme[theme])
    }


    #fetchContent(url, callback) {

        var status = linkHelper.Exists(url);
        if(!status){
            console.log(status)
            callback({
                status: false,
                data: "# ERROR \n ### Failed to fetch file at `" + url + "`" 
            })
        }
        else{
            fetch(url)
            .then(response => response.text())
            .then(data => {
                callback({
                    data: data,
                    status: true
                });
            })
            .catch(error => {
                callback({
                    status: false,
                    data: "# ERROR \n ### The file at `" + url + "` does not exist. ```"+ error + "```" 
                })
            });
        }
    }

    Render(data, callback) {

        if(typeof marked !== 'undefined'){
            returnData(marked.parse(data));
        }
        else{

            this.#require("https://cdn.jsdelivr.net/npm/marked/marked.min.js", () => {
                returnData(marked.parse(data));
            })
        }

        function returnData(xdata){
            if(typeof callback === 'function'){
                callback(xdata);
            }
        }
    
    }

    #require(url, callback) {
        if (url.endsWith('.css')) {

            var css = document.createElement('style');

            this.#fetchContent(url, (data) => {

                css.innerHTML = data.data;
                css.classList.add('md-frame-css');
                document.body.appendChild(css);
            })


        }
        else if (url.endsWith('.js')) {
            var js = document.createElement("script");
            js.type = "text/javascript";
            js.src = url;
            document.body.appendChild(js);

            var script = js;
            if (script.onreadystatechange)
                script.onreadystatechange = function () {
                    if (script.readyState == "complete" || script.readyState == "loaded") {
                        script.onreadystatechange = false;
                        callback();
                    }
                }
            else {
                script.onload = function () {
                    callback();
                }
            }
        }
    }
}


customElements.define('mark-down', Markkit);

