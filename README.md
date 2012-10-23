# Percolator
[![Build
Status](https://secure.travis-ci.org/cainus/percolator.png?branch=master)](http://travis-ci.org/cainus/percolator)

Percolator is a new kind of web application framework (for node.js) for fun and fast development of quality APIs.  

It's great for:
* quality, public-facing APIs
* single page apps
* mobile apps

Is this project ready to use?  Kind-of-sort-of-almost.  Not in Production though.

## Hello World: ##
[Here's a Hello World Example](https://github.com/cainus/percolator/wiki/Hello-World) so you can see what your 
application code would look like. 

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
