# Percolator
[![Build
Status](https://secure.travis-ci.org/cainus/percolator.png?branch=master)](http://travis-ci.org/cainus/percolator)

Percolator is a new kind of web application framework (for node.js) for fun and fast development of quality APIs.  

It's great for:
* quality, public-facing APIs
* single page apps
* mobile apps

Its goal is to help make RESTful APIs in JSON that aren't painful to write and aren't painful to use.

####Features:
* Helps to generate JSON Hypermedia APIs quickly and easily (There will be some links in your json, and it will be awesome).
* Helps to standardize your API with a very lightweight standard to simplify client development.
* Helps to remove a lot of the tedious mind-numbing boilerplate of CRUD APIs
* Correctly handles a lot of error scenarios for you.
* Makes code re-use / componentization simpler/easier
* Focuses on APIs specifically, so it's good for mobile app back-ends, single page apps, or great public-facing APIs.  
* Can be extended easily.
* Can help organize your routes better.
* Has very little magic and absolutely no code generators

####It does NOT:
* Have a way of generating dynamic HTML.  You can certainly add that, but it's not included and probably won't be (Perhaps you'd be better off with [express](http://expressjs.com) if you need that capability).  Percolator can serve static assets (html, js css) though if you want to create a one-page app.
* Have an opinion on how/if you manage persistence.  Add that however you want.  It just helps you with the API/HTTP end of things.
* Use [connect](https://github.com/senchalabs/connect) or [express](http://expressjs.com), so it might not do things that you've come to expect from node frameworks that do.  It doesn't even have a serialized, synchronous middleware framework (though my opinion is that you don't need that).
* Have all the intended features (yet!)
* Have support for non-json media-types, beyond what core node request/response objects provide.
* Have a single production deployment yet (but it will soon).
* Augment node.js's core request/response objects in any way whatsoever.
* Stay unopinionated.

## Hello World! ##

If you have a server.js with the following content...

```javascript
var Percolator = require('Percolator').Percolator;
var server = new Percolator();
server.route('/', function($){
  		$.json({hello : "world!"})
			 .send();
		  });
server.listen(function(err){
	if (err) { throw err; }
	console.log("Percolator is listening on port ", server.port);	
});
```


... you can run it with `node server.js` and it should tell you:

```Percolator is listening on port  3000```

If you hit `http://localhost:3000/` , you will see:

```javascript
{

    "hello": "world!",
    "_links": {
        "self": {
            "href": "http://localhost:3000/"
        }
    }

}
```

###What the hell is that?!?!?###
One of the core features of Percolator is that it helps you make your API "surfable" by helping you add links that allow you and your users to actually surf your API to see all the possible uses and capabilities without you having to write a million pages of documentation, and without asking your users to read it.  (Note: There are other possibly more important benefits as well, but I'll save that more in-depth discussion for another time.  [Building Hypermedia APIs with HTML5 and Node](http://www.amazon.com/Building-Hypermedia-APIs-HTML5-Node/dp/1449306578) is a great book with a lot of great examples).  In my experience, these are the kinds of APIs that users (including the original developers!) actually enjoy using.

If you use Google Chrome, I highly recommend the [JSONView extension](https://chrome.google.com/webstore/detail/jsonview/chklaanhfefbnpoihckbnefhakgolnmc) to make viewing and clicking on links in JSON super-simple.  I believe Firefox comes with this capability right out of the box.  There may be support in other browsers as well.

The interesting parts of this example are probably all in the routing and request handling.  Let's take a second look at that:

```javascript
server.route('/', function($){
			$.json({hello : "world!"})
			 .send();
		  });
```

`server.route()` takes a route, in this case the root route '/', and associates a handler to it for when a request comes in for '/'.  If the handler is just a function, as is the case here, then it will only handle GET requests.  

In general, the only parameter that handler functions need to take is a single 'context' parameter that I just name $ for brevity, but you can name it whatever you want.  The context parameter comes with a number of useful methods and objects, but we just use the json() "context helper" to specify and then send() our object as json.

The context parameter also has the plain node.js request and response objects on it, so you're still free to access those as usual.  They'd be available in the handler function here as $.req and $.res and they are completely unaltered and should act exactly as shown in the node.js documentation.

This just scratches the surface though.  Other examples will show more advanced features.


## Documentation ##
[The wiki](https://github.com/cainus/percolator/wiki) has the most current documentation.

## Values
### Make the hard stuff simple
* Get the HTTP/REST-Nerd stuff (serialization, authentication, hypermedia, status codes) right so 
that the developer doesn't have to.  See http://wiki.basho.com/Webmachine-Diagram.html to start to get an idea of what 
a full featured server should be doing on each request.

### Make the tedious stuff less tedious
* Implicit / Automatic Routing.  Each resource is in its own file (which is just a node.js module) and is routed 
automatically without you having to route explicitly.
* Automatic resource linking where possible, if desired.
* Make creating collections (especially based on databases) as easy as possible.

### Keep the simple stuff simple
* HTTP is simple.  If you know HTTP, you know the names of the methods of a Percolator resource.
* Can't do what you want within the framework?  Percolator can be extended in a couple of different ways, and it exposes the raw, unaltered request and response objects from node.js, so it should be easily extendable.
* Minimal "magic", and no code generators.  Only the the implicit routing (if you choose to use it) smells anything like magic.

### Focus on helping create great APIs
* There are no plans to support server-generated dynamic HTML, though that can be added in your application.  [Express](http://expressjs.com) is already great 
at apps like that though.
* There are no plans to support specific database drivers or ORM.  Of course these can still be added to your app 
quite easily but in this day and age, it would be silly for an API framework to assume what kind of persistence 
you want to use, or even that you require persistence at all.


## Automated Tests:
npm test
