# Percolator
Percolator is a framework for quickly and easily building quality web APIs.  
It is intended for developers who want to build great APIs, but don't want to
have to write tedious boiler plate code over-and-over to achieve it.

It aims to be a great tool for building public-quality APIs, as well as being
better suited for apps that perform all of their view logic on the client-side,
like mobile apps and single-page apps.


## Quick Examples:

### Hello World
To create a simple read-only /helloworld resource that responds with "Hello
World!", create a file in the root resources directory called "helloworld.js"
and put this in it:

```javascript
  exports.handler = {
    GET : function(req, res){
      res.send('Hello World!');
    }
  }
```

"req" and "res" are simply express's request and response objects.

### Collections
To create a "/rockband" collection resource based on a "rockband" Mongo collection, 
create a file called "rockband.js" and put this in it:

```javascript
  const MongoResource = require('../lib/resourceTypes/MongoResource').MongoResource;
  exports.handler = new MongoResource('rockbands', {
    'name' : { type: String, match: /[a-zA-z0-9\.]/, required : true },
    'created' : { type: Date, default: Date.now, required : true }
  })
```

You'll automatically get a "rockband" collection that you can GET and POST to
(with validations), that stores in Mongo.  Every rockband that you add via POST
will be available at its own URL afterward, for GETting, updating via PUT and
deleting via DELETE.  Here's how a GET on /rockband looks when it has one rock
band:

```javascript
  {
    items: [
      {
        created: "2012-03-17T19:39:28.200Z",
        name: "The Clash",
        _id: "1234",
        links: {
          parent: {
            href: "/api/artist/"
          },
          self: {
            href: "/api/artist/1234"
          }
        }
      }
    ],
    links: {
      parent: {
        href: "/api"
      },
      self: {
        href: "/api/artist/"
      }
    }
  }
```

Here's how a GET on /rockband/1234 looks:

```javascript
  {
      created: "2012-03-17T19:39:28.200Z",
      name: "The Clash",
      _id: "1234",
      links: {
        parent: {
          href: "/api/artist/"
        },
        self: {
          href: "/api/artist/1234"
        }
      }
    }
```

Here's how a GET on /rockband/4567 (which doesn't exist!) looks (with a 404
status):

```javascript
  {
    error: {
      type: "RecordNotFoundError",
      message: "A record with the given id could not be found.",
      detail: "4567"
    }
  }
```

## Values
### Make the hard stuff simple
* Get the HTTP/REST-Nerd stuff (serialization, authentication, hypermedia, status codes) right so that the developer doesn't have to.  See http://wiki.basho.com/Webmachine-Diagram.html 
to see what a full featured server should be doing on each request.

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
* Other data-store helpers than just mongo, so the user doesn't have to write her own.
* Other representation formats than just "application/json", and a better factoring to 
allow custom media-types (per resource, even) if the user wishes.
* better support for other cross-cutting "aspects" like logging and throttling

## Automated Tests:

### installing mocha:
npm install -g mocha

### running tests:
mocha
