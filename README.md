# Percolator
[![Build
Status](https://secure.travis-ci.org/cainus/percolator.png?branch=master)](http://travis-ci.org/cainus/percolator)

Percolator is a framework for quickly and easily building quality http APIs with node.js.  

It is intended for developers who want to build great APIs, but don't want to
have to write tedious boiler plate code over-and-over to achieve it.

It aims to be a great tool for building public-quality APIs, as well as being
better suited for apps that perform all of their view logic on the client-side,
like mobile apps and single-page apps.

Is this project ready to use?  Kind-of-sort-of.  Not in Production though.

## Hello World Quick Start:
*  `npm install Percolator`
*  Create a `server.js` in your project directory, and copy this code below into it:

```javascript
var Percolator = require('Percolator');

var server = new Percolator();
server.router.route('/', {  GET : function(req, res){
                              res.end("Hello World!");
                            }});
server.listen(function(err){
  console.log('server is listening on port ', server.port);
});

```

*  Run the server:
```
  node server.js
```

*  See your "Hello World" output at http://localhost:3000/ and be completely floored by the greatest 
API of all time.  Or not.

## Hello World Refactored:

While this is pretty simple, it's also not super-interesting.  One of the interesting features of 
Percolator is that it lets you load your route-handling code from external files instead:

* Move your "Hello World" handler into a file at the path `./resources/_index.js` by first creating the 
`resources` directory and then the `_index.js` file in it and then copying the handler logic into `_index.js`
like so:

```javascript
  exports.handler = {
    GET : function(req, res){
      res.end('Hello World!');
    }
  }
```
We'll call files like that "resources" from now on.


* Change your server.js to call `routeDirectory()` instead of `server.router.route()` like so:

```javascript
var Percolator = require('Percolator');

var server = new Percolator();
server.routeDirectory(__dirname + '/resources', function(err){
  if (!!err) {console.log(err);}
  server.listen(function(err){
    console.log('server is listening on port ', server.port);
  });
});

```

*  Run the server:
```
  node server.js
```

*  See your "Hello World" output at http://localhost:3000/ .

## What's a "resource"?
Resources are where you put your code for handling http requests (and their responses).  

A single resource handles all the HTTP methods for a single URL path.  Any object that provides the HTTP methods 
can be used and just has to be exported as a javascript module.  Our "Hello World" example is just providing the 
GET method, so when your users use other methods like POST and DELETE on it will just respond with 405 errors.  
You can easily implement any other HTTP method that you want, by just defining the function by that name (use all 
caps!).

Resources are just node modules that Percolator automaticaly require()s.  You have to export them as "handler" 
like in the "Hello World" example above."

Any particular method that you implement takes request and response parameters, in that order (The "Hello World"
example just calls them 'req' and 'res' respectively)).  These are the [request]( http://nodejs.org/api/http.html#http_class_http_serverrequest )
and [response]( http://nodejs.org/api/http.html#http_class_http_serverresponse ) objects from node itself.


## How routing works
Your resource directory and the files and subdirectories in it are routed to URLs, so that the organization on 
the filesystem dictates your urls.  This means:
* you don't have to maintain a list of routes anywhere
* you know exactly where to find everything 
* you have a simple convention for code organization.

### The base path
The base path is the URI path under which all of your resources will be served. It's called `resourcePath` in 
your application config (see the quick start for an example of setting it to '/').  It doesn't need to be set 
to '/', for instance -- you could set it to /api, and then the quick start example would serve from /api instead.

### The _index.js file.
The server won't start without an _index.js file.  It's the resource that handles requests to your base path.

### Adding other routes to a path
Just add more files to the directory!  Adding ./resources/newone.js will make the handler in that file available 
at the /newone url . 

## About the 'app' parameter.
When you create an instance of Percolator, you need to pass it a config object that will later be available in all
resource methods as `this.app`.  Required parameters for this config object are:  

  **protocol** - 'http' or 'https'  
  **resourceDir** - the filesystem directory where the resources can be found (use an absolute path!)  
  **resourcePath** - the url path that all the resource will be routed from (eg. Setting it to '/' will serve the 
  resources from http://yourdomain.com/ while setting it to '/api' will serve the resources from 
  http://yourdomain.com/api .  
  **staticDir** - The directory on the filesystem from which you will serve static content (use an absolute path!).  
  **port** - the http port.  A low port like 80 will not work unless you run the app with root privileges.  
  
It's also important to note that you can add your own parameters as well.  It's a great way to instantiate shared 
resources (like a database connection) in the main application and pass it to all resources.

You're obviously going to want to limit the number of `app` variables that you add beyond the necessary ones, but
certain types of objects might make sense in that shared space.

## The "uri" API
Each method you define has access to a 'uri' module that understands the context of each particular request 
that it's used in.  The module makes a number of convenient methods available for dealing with uri's and 
generally making the parsing of uri's simpler and the creation of new uri's simple.  Here are example usages:

### General Usage:

```javascript
  exports.handler = {
    GET : function(req, res){
      res.send(this.uri.self());   // this will return the current url
    }
  }
```

### Api specifics:

```javascript
this.uri.absolute(path)
```
Takes a relative path and returns an absolute path.

```javascript
this.uri.help()
```
returns an object containing a bunch of method names from this module and their values.  Useful for debugging.


```javascript
this.uri.self()
```
returns the current uri (as an absolute uri).

```javascript
this.uri.params()
```
returns an object containing the name/value pairs of variables extracted from the uri's "path" (NOT 
including querystring).  An optional uri may be passed in, but the default is to use the current 
request's uri. 

```javascript
this.uri.param("someparam");
```
Retrieves the specified param value by the input param name from the object returned by this.uri.params() 
(see above).  

```javascript
this.uri.urlEncode(somestr);
```
take a string and return a url-encoded version of it

```javascript
this.uri.urlDecode(someEncodedStr)
```
take a url-encoded string and return a decoded version of it.


```javascript
this.uri.query();
```
Get the querystring data off the current url as an object with the name/value pairs in the querystring.  An 
alternative url can optionally be passed in.

```javascript
this.uri.queryString({somevar : "somevalue"}});
```
Take an input object and create a querystring of the name/value pairs in the object.

```javascript
this.uri.pathJoin("asdf", ["qwer", "tyui"], "1234");
```
Takes a list of strings and arrays of strings and returns a forward-slash-delimited path of all the pieces
in the order that they appear (without a trailing slash).


```javascript
this.uri.links();
```
Returns a dictionary of links that the router knows about for this resource, usually including parent and self
links and possibly child urls.

```javascript
this.uri.parent();
```
Get the parent URI of the current URI.  An optional URI may be passed in to get its' parent's URI instead.


```javascript
this.uri.namedKids();
```
Get a dictionary of all the child urls with their names.


```javascript
this.uri.kids();
```
Get a dictionary of all the child urls with their names if the have names.


```javascript
this.uri.parse();
```
Returns the result of node's url.parse ( http://nodejs.org/docs/v0.9.0/api/url.html#url_url_parse_urlstr_parsequerystring_slashesdenotehost ) 
for the current URI.  An optional URI can be passed to use that one instead.  



```javascript
this.url.get(); = function(nameOrPath, varDict){
```
Gets a url by name, or path.  An optional dictionary may be passed of variables to fille in necessary path variables.


## Values
### Make the hard stuff simple
* Get the HTTP/REST-Nerd stuff (serialization, authentication, hypermedia, status codes) right so 
that the developer doesn't have to.  See http://wiki.basho.com/Webmachine-Diagram.html to see what 
a full featured server should be doing on each request.

### Make the tedious stuff less tedious
* Implicit / Automatic Routing.  Each resource is in its own file (which is just a node.js module) and is routed 
automatically without you having to route explicitly.
* Automatic resource linking where possible, if desired.
* Make creating collections (especially based on databases) as easy as possible.

### Keep the simple stuff simple
* HTTP is simple.  If you know HTTP, you know the names of the methods of a Percolator resource.
* Can't do what you want within the framework?  Percolator is built on express.js, so you can 
drop back to using that framework directly anytime you need to.
* Continue to allow full control of request handling and response generation.
* No magic, and no code generators.

## Current State:
* Percolator is in an experimental stage, but it's built on express.js, so you 
can always fall back to express if something doesn't work for you.  I'd 
love to hear of other people using it and giving feedback/bug reports so I can 
iron out all the wrinkles.  

## Some glaring limitations being worked on:
* Built-in (stateless) authentication methods so the user doesn't have to write her own.
* Other representation formats than just "application/json", and a better factoring to 
allow custom media-types (per resource, even) if the user wishes.

## Automated Tests:
npm test
