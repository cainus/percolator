var should = require('should');
var hottap = require('hottap').hottap;
var _ = require('underscore');
var detour = require('detour').detour;

var percolator = require('../');
var FSRouter = percolator.FSRouter;

var getSimpleModule = function(fullpath){
  return { module : { handler : {GET : function(req, res){res.end(fullpath)} } },
           fullpath: fullpath,
           type : 'file'
         }
};



describe('FSRouter', function(){
	beforeEach(function(){
    this.d = new detour();
    this.dir = __dirname + '/test_fixtures/resources'
    this.router = new FSRouter(this.d, this.dir);
	});
	afterEach(function(){
	})


  describe("#autoName", function(){
    it ("names a root path properly", function(){
      this.router.autoName('/_index.js').should.equal('root')
    });
    it ("names a root child path properly", function(){
      this.router.autoName('/artist.js').should.equal('artist')
    });
    it ("names a double star path properly", function(){
      this.router.autoName('/artist/_artist/song/_song.js').should.equal('artist*song*')
    });
  });


  describe("#route", function(){

    it ("returns an error when GREGG the resource directory doesn't exist", function(done){
      var router = new FSRouter(this.d, 'NOEXISTtest_fixtures');
      router.route(function(err){
        should.exist(err);
        err.type.should.equal('InvalidDirectory')
        done();
      });
    });

    it ("complains if there's no /_index.js", function(done){
      // fake out require
      this.router.requirer.require = function(cb){
        this.paths = {};
        cb();
      }
      var that = this;
      this.router.route(function(err){
        err.type.should.equal("MissingIndexResource")
        err.message.should.equal("There was no _index.js at the given path.  This is the first necessary resource file.")
        err.detail.should.equal(that.dir)
        done();
      });
    });

    it ("sets / if there's a /_index.js", function(done){
      // fake out require
      this.router.requirer.require = function(cb){
        this.paths = {'/_index.js' : getSimpleModule('/asdf/_index.js') };
        cb();
      }
      var that = this;
      this.router.route(function(err){
        should.not.exist(err);
        that.d.getUrl('root').should.equal('/')
        done();
      });
    });
    
    it ("routes root-dir files", function(done){
      this.router.requirer.require = function(cb){
        this.paths = {'/_index.js' : getSimpleModule('/asdf/_index.js'),
                      '/song.js' : getSimpleModule('/asdf/song.js'),
                      '/band.js' : getSimpleModule('/asdf/band.js'),
                    };
        cb();
      }
      var that = this;
      this.router.route(function(err){
        should.not.exist(err);
        that.d.getUrl('root').should.equal('/')
        that.d.getUrl('song').should.equal('/song')
        that.d.getUrl('band').should.equal('/band')
        done();
      });
    });
   

    it ("returns an error if there's a dir with no module for it", function(done){
      this.router.requirer.require = function(cb){
        this.paths = {
                      '/_index.js' : getSimpleModule('/asdf/_index.js'),
                      '/song' : {'type' : 'dir'}
                    };
        cb();
      }
      var that = this;
      this.router.route(function(err){
        err.type.should.equal("MissingDirectoryResource")
        err.message.should.equal("There was no directory resource for one of the directories.  All directories to be routed must have a directory resource.")
        err.detail.should.equal('Found /song, but no "song.js" next to it.');
        done();
      });
    });

    it ("routes directory resources", function(done){
      this.router.requirer.require = function(cb){
        this.paths = {
                      '/_index.js' : getSimpleModule('/asdf/_index.js'),
                      '/song' : {'type' : 'dir', fullpath : '/asdf/song'},
                      '/song.js' : getSimpleModule('/asdf/song.js')
                    };
        cb();
      }
      var that = this;
      this.router.route(function(err){
        should.not.exist(err);
        that.d.getUrl('root').should.equal('/')
        that.d.getUrl('song').should.equal('/song')
        done();
      });
    });

    it ("routes resources in sub-directories", function(done){
      this.router.requirer.require = function(cb){
        this.paths = {
                      '/_index.js' : getSimpleModule('/asdf/_index.js'),
                      '/song.js' : getSimpleModule('/asdf/song.js'),
                      '/song' : {'type' : 'dir', fullpath : '/asdf/song'},
                      '/song/artist.js' : getSimpleModule('/asdf/song/artist.js')
                    };
        cb();
      }
      var that = this;
      this.router.route(function(err){
        should.not.exist(err);
        that.d.getUrl('root').should.equal('/')
        that.d.getUrl('song').should.equal('/song')
        that.d.getUrl('songArtist').should.equal('/song/artist')
        that.d.getUrl('/song/artist').should.equal('/song/artist')
        done();
      });
    });

    /*
          A collection module is a js file starting with an underscore that is
          meant to be routed to a dynamic path.

          This test ensures that when a collection module exists, it does not
          have any siblings.  This is because a collection module matches everything,
          and siblings would not be route-able.
    */
    it ("returns an error if a dir with a collection has siblings", function(done){

      this.router.requirer.require = function(cb){
        this.paths = {
                      '/_index.js' : getSimpleModule('/asdf/_index.js'),
                      '/song.js' : getSimpleModule('/asdf/song.js'),
                      '/song' : {'type' : 'dir', fullpath : '/asdf/song'},
                      '/song/_song.js' : getSimpleModule('/asdf/song.js'),
                      '/song/artist.js' : getSimpleModule('/asdf/song/artist.js')
                    };
        cb();
      }
      var that = this;
      this.router.route(function(err){
        should.exist(err);
        err.type.should.equal("DynamicRouteWithSiblings")
        err.message.should.equal("If you have a dynamic path, you can't have other paths in the same directory.")
        err.detail.should.equal('/song/_song.js is a dynamic path and so cannot share a directory with /song/artist.js.');
        done();
      });
    });

    it ("can route dynamic routes", function(done){

      this.router.requirer.require = function(cb){
        this.paths = {
                      '/_index.js' : getSimpleModule('/asdf/_index.js'),
                      '/song.js' : getSimpleModule('/asdf/song.js'),
                      '/song' : {'type' : 'dir', fullpath : '/asdf/song'},
                      '/song/_song.js' : getSimpleModule('/asdf/song.js')
                    };
        cb();
      }
      var that = this;
      this.router.route(function(err){
        should.not.exist(err);
        that.d.getUrl('root').should.equal('/')
        that.d.getUrl('song').should.equal('/song')
        that.d.getUrl('/song/*song', {song : 1234}).should.equal('/song/1234')
        that.d.getUrl('song*', {song : 1234}).should.equal('/song/1234')
        done();
      });
    });

    it ("can route double dynamic routes", function(done){

      this.router.requirer.require = function(cb){
        this.paths = {
                      '/_index.js' : getSimpleModule('/asdf/_index.js'),
                      '/artist.js' : getSimpleModule('/asdf/artist.js'),
                      '/artist' : {'type' : 'dir', fullpath : '/asdf/artist'},
                      '/artist/_artist.js' :
                                     getSimpleModule('/asdf/artist/_artist.js'),
                      '/artist/_artist' : { type : 'dir', 
                                            fullpath : '/asdf/artist/_artist'},
                      '/artist/_artist/song.js' : 
                                     getSimpleModule('/asdf/artist/_artist/song.js'),
                      '/artist/_artist/song' : { type : 'dir', 
                                            fullpath : '/asdf/artist/_artist/song'},
                      '/artist/_artist/song/_song.js' : 
                                     getSimpleModule('/asdf/artist/_artist/song/_song.js')
                    };
        cb();
      }
      var that = this;
      this.router.route(function(err){
        should.not.exist(err);
        that.d.getUrl('root').should.equal('/')
        that.d.getUrl('artist').should.equal('/artist')
        that.d.getUrl('/artist/*artist', {artist : 1234}).should.equal('/artist/1234')
        that.d.getUrl('artist*', {artist : 1234}).should.equal('/artist/1234')
        that.d.getUrl('/artist/*artist/song', {artist : 1234})
                            .should.equal('/artist/1234/song')
        that.d.getUrl('artist*song', {artist : 1234})
                            .should.equal('/artist/1234/song')
        that.d.getUrl('/artist/*artist/song/*song', {artist : 1234, song : 5678})
                            .should.equal('/artist/1234/song/5678')
        that.d.getUrl('artist*song*', {artist : 1234, song : 5678})
                            .should.equal('/artist/1234/song/5678')
        done();
      });
    });


    it ("can route collection modules into two routes", function(done){

      this.router.requirer.require = function(cb){
        this.paths = {
                      '/_index.js' : getSimpleModule('/asdf/_index.js'),
                      '/song.js' :
                        {module : { 
                            handler : 
                                {GET : function(req, res){
                                          res.end('collection')
                                       }
                                },
                            member :
                                {GET : function(req, res){
                                          res.end('member')
                                       }
                                },
                          },
                          type : 'file',
                          fullpath : '/asdf/song.js'
                      }
                    };
        cb();
      }
      var that = this;
      this.router.route(function(err){
        should.not.exist(err);
        that.d.getUrl('root').should.equal('/')
        that.d.getUrl('song').should.equal('/song')
        that.d.getUrl('/song/*song', {song : 1234}).should.equal('/song/1234')
        that.d.getUrl('song*', {song : 1234}).should.equal('/song/1234')
        done();
      });
    });

    it ("can nest collection modules", function(done){

      this.router.requirer.require = function(cb){
        this.paths = {
                      '/_index.js' : getSimpleModule('/asdf/_index.js'),
                      '/artist.js' :
                        {module : { 
                            handler : 
                                {GET : function(req, res){
                                          res.end('collection')
                                       }
                                },
                            member :
                                {GET : function(req, res){
                                          res.end('member')
                                       }
                                },
                          },
                          type : 'file',
                          fullpath : '/asdf/artist.js'
                      },
                      '/artist/*artist/song.js' :
                        {module : { 
                            handler : 
                                {GET : function(req, res){
                                          res.end('collection')
                                       }
                                },
                            member :
                                {GET : function(req, res){
                                          res.end('member')
                                       }
                                },
                          },
                          type : 'file',
                          fullpath : '/asdf/artist/_artist/song.js'
                      }
                    };
        cb();
      }
      var that = this;
      this.router.route(function(err){
        should.not.exist(err);
        that.d.getUrl('root').should.equal('/')
        that.d.getUrl('artist').should.equal('/artist')
        that.d.getUrl('/artist/*artist', {artist : 1234}).should.equal('/artist/1234')
        that.d.getUrl('artist*', {artist : 1234}).should.equal('/artist/1234')
        that.d.getUrl('/artist/*artist/song', {artist : 1234})
                            .should.equal('/artist/1234/song')
        that.d.getUrl('artist*song', {artist : 1234})
                            .should.equal('/artist/1234/song')
        that.d.getUrl('/artist/*artist/song/*song', {artist : 1234, song : 5678})
                            .should.equal('/artist/1234/song/5678')
        that.d.getUrl('artist*song*', {artist : 1234, song : 5678})
                            .should.equal('/artist/1234/song/5678')
        done();
      });
    });

  });


});
