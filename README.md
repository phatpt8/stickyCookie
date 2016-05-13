"# stickyCookie" 

This is a Js snippet for keeping data from clearing browsers' cookies and caches.
The cookie value will be stored on 3 places: LocalStorage, Cookie and Window Name.
A watcher() will watch for change and synchronize our data.

Usage: 
  var keeper = new stickyCookie(/* cookie options object here */);
  keeper.set("keep","this-data!")
