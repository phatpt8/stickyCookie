var stickyCookie = function(options) {
    var localStorage = window.localStorage;
    // avoid set new instance
    if(typeof stickyCookie.instance == 'object'){ return stickyCookie.instance; }

    this.stored = [];
    this.shouldClear = false;
    this.options = options || {
        default: {
            path: '/',
            expires: 10 * 24 * 3600,
            domain: hostDomain
        }
    };
    var _self = this;
    var delay = 100;

    this.get = function ( key ) {
        return core(key)
    };

    this.set = function( key, value ) {
        if (!getFromStored(key)) {
            core(key, value);
        }

        return this
    };

    this.update = function( key, value ) {
        getFromStored(key, function(item, index) {
            _self.stored.splice(index, 1);
        });
        saveToStored(key, value)
    };

    this.stopItv = function() {
        this.shouldClear = true;
    };

    function watcher( fn ) {
        for (var i= 0, storedLen = _self.stored.length, item = _self.stored[i]; i < storedLen; item = _self.stored[++i]) {
            fn && fn.call(_self, item.key, item.value, i)
        }
    }

    function solveDiff( key, value ) {
        var storedLS = _self._storeLS(key);
        var storedCookie = _self._storeCookie(key);
        var storedWN = _self._storeWinName(key);

        if (storedLS !== value) {
            _self._storeLS(key, value);
        }

        if (storedCookie !== value) {
            _self._storeCookie(key, value);
        }

        if (storedWN !== value) {
            _self._storeWinName(key, value);
        }

        return value == storedLS && storedLS == storedCookie && storedCookie == storedWN
    }

    function core( key, value ) {
        if (arguments.length < 2) {
            return getFromStored(arguments[0])
        }

        saveToStored(key, value);
        _self._storeLS(key, value);
        _self._storeCookie(key, value);
        _self._storeWinName(key, value);
    }

    function getFromStored( key , callback) {
        for (var i= 0, storedLen = _self.stored.length, item = _self.stored[i]; i < storedLen; item = _self.stored[++i]) {
            if (item.key == key) {
                if (callback) return callback.call(_self, item, i);
                return item;
            }
        }
    }

    function saveToStored( key, value ) {
        var obj = {
            key: key,
            value: value || ""
        };
        _self.stored.push(obj);

        var worker = function() {
            clearTimeout( itv );
            if (_self.shouldClear == true || delay == Infinity) {
                return;
            }

            watcher(function (k, v) {
                solveDiff(k, v)
            });

            delay += 5000;
            itv = setTimeout(worker, delay);
        };
        var itv = setTimeout(worker, delay);

        return obj;
    }

    function setCookie(cname, cvalue, opt) {
        var d = new Date();
        d.setTime(d.getTime() + ( opt.expires || 24*60*60*1000 ));
        var expires = "expires="+ d.toUTCString();
        var cookieString = cname + "=" + cvalue;
        cookieString += opt.path ? ';path=' + opt.path : '';
        cookieString += opt.domain ? ';domain=' + opt.domain : '';
        cookieString += expires;
        cookieString += opt.secure ? ';secure' : '';
        document.cookie = cookieString;
    }

    this._storeLS = function( key, value ) { // Store in Local Storage
        if (localStorage) {
            if (value !== undefined) {
                localStorage.setItem(key, value);
            } else {
                return localStorage.getItem(key)
            }
        }
    };

    this._storeCookie = function( key, value ) {
        if (value !== undefined) {
            var opt = this.options[key] || this.options.default || {};
            if (typeof cookies != 'undefined') {
                cookies(key, value, opt)
            } else if (typeof _ != 'undefined' && typeof _.cookies != 'undefined') {
                _.cookies(key, value, opt)
            } else {
                setCookie(key, value, opt)
            }
        } else {
            return getFromString(key, document.cookie);
        }
    };

    this._storeWinName = function ( key, value ) {
        if (value !== undefined) {
            window.name = _replace(window.name, key, value);
        } else {
            return getFromString(key, window.name);
        }
    };

    function getFromString( name, text ) {
        if (typeof text !== "string") {
            return;
        }
        var nameEQ = name + "=",
            ca = text.split(/[;&]/),
            i, c;
        for (i = 0; i < ca.length; i++) {
            c = ca[i];
            while (c.charAt(0) === " ") {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEQ) === 0) {
                return c.substring(nameEQ.length, c.length);
            }
        }
    }

    function _replace( str, key, value ) {
        if (str.indexOf("&" + key + "=") > -1 || str.indexOf(key + "=") === 0) {
            // find start
            var idx = str.indexOf("&" + key + "="),
                end, newstr;
            if (idx === -1) {
                idx = str.indexOf(key + "=");
            }
            // find end
            end = str.indexOf("&", idx + 1);
            if (end !== -1) {
                newstr = str.substr(0, idx) + str.substr(end + (idx ? 0 : 1)) + "&" + key + "=" + value;
            } else {
                newstr = str.substr(0, idx) + "&" + key + "=" + value;
            }
            return newstr;
        } else {
            return str + "&" + key + "=" + value;
        }
    }

    // store instance
    stickyCookie.instance = this;
};

var hostDomain = function(url){
    url = url || document.domain;

    // IF THERE, REMOVE WHITE SPACE FROM BOTH ENDS
    url = url.replace(/^\s+/,""); // START
    url = url.replace(/\s+$/,""); // END

    // IF FOUND, CONVERT BACK SLASHES TO FORWARD SLASHES
    url = url.replace(/\\/g,"/");

    // IF THERE, REMOVES 'http://', 'https://' or 'ftp://' FROM THE START
    url = url.replace(/^http\:\/\/|^https\:\/\/|^ftp\:\/\//i,"");

    // IF THERE, REMOVES 'www.' FROM THE START OF THE STRING
    url = url.replace(/^www\./i,"");

    var origin = [".", url].join("");

    url = url.split(".");

    var candidate = "", temp = [], arr = [];

    for(var i = 1; i <= url.length; i++){
        temp.push([".",url[url.length - i].replace(/[^a-zA-Z0-9]/g,"")].join(""));
    }

    for(var j = temp.length;j > 0;j--){
        candidate = temp[temp.length - j] + candidate;
        arr.push(candidate);
    }

    for(var k = 0; k < arr.length; k++){
        if (!cookies) return;
        var isCookieDomain = _.cookies.set('isCookieDomain', '1', {domain: arr[k]}).get('isCookieDomain') === '1';
        cookies.expire('isCookieDomain', {domain: arr[k]});
        if(isCookieDomain) return arr[k];
    }
    return origin;
}();