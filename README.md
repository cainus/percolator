# Percolator
[![Build
Status](https://secure.travis-ci.org/cainus/percolator.png?branch=master)](http://travis-ci.org/cainus/percolator)

Percolator is a framework for quickly and easily building quality http APIs with node.js.  

It is intended for developers who want to build great APIs, but don't want to
have to write tedious boiler plate code over-and-over to achieve it.

It aims to be a great tool for building public-quality APIs, as well as being
better suited for apps that perform all of their view logic on the client-side,
like mobile apps and single-page apps.


## Quick Examples:

### Hello World
To create a simple read-only /helloworld resource that responds with "Hello
World!", create a file in the root 'resources' directory called "helloworld.js"
and put this in it:

```javascript
  exports.handler = {
    GET : function(req, res){
      res.send('Hello World!');
    }
  }
```

"req" and "res" are simply express's request and response objects.

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
