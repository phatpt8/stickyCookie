var StickyCookie = function( options ) {
    // avoid set new instance
    if( typeof StickyCookie.instance == 'object' ){ return StickyCookie.instance; }
// oke pe de
this.sangtv3 = false;
    this.stored = [];
    this.shouldClear = false;
    this.options = options || {
        defaults: {
            path: '/',
            expires: 10 * 24 * 3600 * 1000,
            domain: typeof hostDomain !== 'undefined' ? hostDomain : document.domain
        }
    };
    var _self = this;
    var delay = 100;
    var localStorage = window.localStorage;

    this.get = function( key ) {
        return core( key )
    };

    this.set = function( key, value ) {
        if ( !getFromStored( key ) ) {
            core( key, value );
        } else {
            _self.update( key, value )
        }

        return this
    };

    this.update = function( key, value ) {
        getFromStored( key, function( index, item ) {
            _self.stored.splice( index, 1 );
        } );
        saveToStored( key, value );

        return this
    };

    this.trace = function( keys ) {
        if ( typeof keys == "string" ) { keys = keys.split(" "); }

        for ( var i= 0, arrLen = keys.length, key = keys[i]; i < arrLen; key = keys[++i] ) {
            var value = _self._storeWinName( key ) || _self._storeLS( key ) || _self._storeCookie( key );
            if (value) {
                _self.update( key, value )
            }
        }

    };

    this.stopItv = function() {
        this.shouldClear = true;
    };

    function watcher( fn ) {
        for ( var i= 0, storedLen = _self.stored.length, item = _self.stored[i]; i < storedLen; item = _self.stored[++i] ) {
            fn && fn.call( _self, item.key, item.value, i )
        }
    }

    function solveDiff( key, value ) {
        var storedLS = _self._storeLS( key );
        var storedCookie = _self._storeCookie( key );
        var storedWN = _self._storeWinName( key );

        if ( storedLS !== value ) {
            _self._storeLS( key, value );
        }

        if ( storedCookie !== value ) {
            _self._storeCookie( key, value );
        }

        if ( storedWN !== value ) {
            _self._storeWinName( key, value );
        }

        return value == storedLS && storedLS == storedCookie && storedCookie == storedWN
    }

    function core( key, value ) {
        if ( arguments.length < 2 ) {
            var val = _self._storeWinName( key ) || _self._storeLS( key ) || _self._storeCookie( key );
            if (val) {
                _self.update( key, val );
                _self.stored.push({key: key, val: val})
            }
            return getFromStored( arguments[0] )
        }

        saveToStored( key, value );
        _self._storeLS( key, value );
        _self._storeCookie( key, value );
        _self._storeWinName( key, value );
    }

    function getFromStored( key , callback ) {
        for ( var i= 0, storedLen = _self.stored.length, item = _self.stored[i]; i < storedLen; item = _self.stored[++i] ) {
            if ( item.key == key ) {
                if ( callback ) return callback.call( _self, i, item );
                return item;
            }
        }
    }

    function saveToStored( key, value ) {
        var obj = {
            key: key,
            value: value || ""
        };
        _self.stored.push( obj );

        var worker = function() {
            clearTimeout( itv );
            if ( _self.shouldClear == true || delay == Infinity ) {
                return;
            }

            watcher( function( k, v ) {
                solveDiff( k, v )
            } );

            delay += 3000;
            itv = setTimeout( worker, delay );
        };
        var itv = setTimeout( worker, delay );

        return obj;
    }

    function setCookie( cname, cvalue, opt ) {
        var d = new Date();
        d.setTime( d.getTime() + ( opt.expires || 24*60*60*1000 ) );
        var expires = ";expires="+ d.toUTCString();
        var cookieString = cname + "=" + cvalue;
        cookieString += opt.path ? ';path=' + opt.path : '';
        cookieString += opt.domain ? ';domain=' + opt.domain : '';
        cookieString += expires;
        cookieString += opt.secure ? ';secure' : '';
        document.cookie = cookieString;
    }

    this._storeLS = function( key, value ) { // Store in Local Storage
        if ( localStorage ) {
            try {
                if ( value !== undefined ) {
                    localStorage.setItem( key, value );
                } else {
                    return localStorage.getItem( key )
                }
            } catch ( e ) {}
        }
    };

    this._storeCookie = function( key, value ) {
        if ( value !== undefined ) {
            var opt = this.options[key] || this.options.defaults || {};
            setCookie( key, value, opt )
        } else {
            return getFromString( key, document.cookie );
        }
    };

    this._storeWinName = function( key, value ) {
        if ( value !== undefined ) {
            window.name = _replace( window.name, key, value );
        } else {
            return getFromString( key, window.name );
        }
    };

    function getFromString( name, text ) {
        if ( typeof text !== "string" ) {
            return;
        }
        var nameEQ = name + "=",
            ca = text.split( /[;&]/ ),
            i, c;
        for ( i = 0; i < ca.length; i++ ) {
            c = ca[i];
            while ( c.charAt( 0 ) === " " ) {
                c = c.substring( 1, c.length );
            }
            if ( c.indexOf( nameEQ ) === 0 ) {
                return c.substring( nameEQ.length, c.length );
            }
        }
    }

    function _replace( str, key, value ) {
        if ( str.indexOf( "&" + key + "=" ) > -1 || str.indexOf( key + "=" ) === 0 ) {
            // find start
            var idx = str.indexOf( "&" + key + "=" ),
                end, newstr;
            if ( idx === -1 ) {
                idx = str.indexOf( key + "=" );
            }
            // find end
            end = str.indexOf( "&", idx + 1 );
            if ( end !== -1 ) {
                newstr = str.substr( 0, idx ) + str.substr( end + ( idx ? 0 : 1 ) ) + "&" + key + "=" + value;
            } else {
                newstr = str.substr( 0, idx ) + "&" + key + "=" + value;
            }
            return newstr;
        } else {
            return str + "&" + key + "=" + value;
        }
    }

    // store instance
    StickyCookie.instance = this;
    window.StickyCookie = StickyCookie;
};
