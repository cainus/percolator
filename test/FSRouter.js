var should = require('should');
var hottap = require('hottap').hottap;
var _ = require('underscore');
var detour = require('detour').detour;

var percolator = require('../');
var FSRouter = percolator.FSRouter;

describe('FSRouter', function(){
	beforeEach(function(){
    this.d = new detour();
    this.dir = __dirname + '/test_fixtures/resources'
    this.router = new FSRouter(this.d, this.dir);
	})
	afterEach(function(){
	})

  /*
  it ("returns an error when the resource directory doesn't exist", function(done){
    var router = new FSRouter()
    router.walk('NOEXISTtest_fixtures', function(err, paths){
      console.log(paths);
    });
    should.fail("not implemented");
  });
*/
  it ("complains if there's no /_index.js", function(done){
    // fake out require
    this.router.requirer.require = function(cb){
      this.paths = {};
      cb();
    }
    var that = this;
    this.router.route(function(err){
      console.log(that.router.paths);
      err.type.should.equal("MissingIndexResource")
      err.message.should.equal("There was no _index.js at the given path.  This is the first necessary resource file.")
      err.detail.should.equal(that.dir)
      done();
    });
  });

  it ("sets / if there's a /_index.js", function(done){
    // fake out require
    this.router.requirer.require = function(cb){
      this.paths = {'/_index.js' : 
                    {'module' : {GET : 
                        function(req, res){
                            res.end('hi')
                        }
                    },
                    'type' : 'file'}
                  } ;
      cb();
    }
    var that = this;
    this.router.route(function(err){
      console.log(that.router.paths);
      should.not.exist(err);
      that.d.getUrl('root').should.equal('/')
      done();
    });
  });
  
  it ("routes root-dir files", function(done){
    this.router.requirer.require = function(cb){
      this.paths = {'/_index.js' : 
                      {'module' : 
                        {GET : function(req, res){res.end('hi')}},
                       'type' : 'file'
                      },
                    '/song.js' :
                      {'module' : 
                        {GET : function(req, res){res.end('hi song')}},
                        'type' : 'file'
                      },
                    '/band.js' :
                      {'module' : 
                        {POST : function(req, res){res.end('hi band')}},
                        'type' : 'file'
                      }
                  };
      cb();
    }
    var that = this;
    this.router.route(function(err){
      console.log(that.router.paths);
      should.not.exist(err);
      that.d.getUrl('root').should.equal('/')
      that.d.getUrl('song').should.equal('/song')
      that.d.getUrl('band').should.equal('/band')
      done();
    });
  });
 

  it ("returns an error if there's a dir with no module for it", function(done){
    this.router.requirer.require = function(cb){
      this.paths = {'/_index.js' :
                    {'module' : 
                      {GET : function(req, res){res.end('hi')}},
                     'type' : 'file'
                    },
                    '/song' : {'type' : 'dir'}
                  };
      cb();
    }
    var that = this;
    this.router.route(function(err){
      console.log(err);
      err.type.should.equal("MissingDirectoryResource")
      err.message.should.equal("There was no directory resource for one of the directories.  All directories to be routed must have a directory resource.")
      err.detail.should.equal('Found /song, but no "song.js" next to it.');
      done();
    });
  });

  it ("routes directory resources", function(done){
    this.router.requirer.require = function(cb){
      this.paths = {'/_index.js' :
                    {'module' : 
                      {GET : function(req, res){res.end('hi')}},
                     'type' : 'file'
                    },
                    '/song.js' :
                      {module : 
                        {GET : function(req, res){res.end('song')}},
                       type : 'file',
                       fullpath : '/asdf/song.js'
                      },
                    '/song' : {'type' : 'dir', fullpath : '/asdf/song'}
                  };
      cb();
    }
    var that = this;
    this.router.route(function(err){
      console.log(err);
      should.not.exist(err);
      that.d.getUrl('root').should.equal('/')
      that.d.getUrl('song').should.equal('/song')
      done();
    });
  });

  it ("routes resources in sub-directories", function(done){
    this.router.requirer.require = function(cb){
      this.paths = {'/_index.js' :
                    {'module' : 
                      {GET : function(req, res){res.end('hi')}},
                     'type' : 'file'
                    },
                    '/song.js' :
                      {module : 
                        {GET : function(req, res){res.end('song')}},
                       type : 'file',
                       fullpath : '/asdf/song.js'
                      },
                    '/song' : {'type' : 'dir', fullpath : '/asdf/song'},
                    '/song/artist.js' :
                      {'module' :
                        {GET : function(req, res){
                                  res.end('hi artist')
                               }
                        },
                        type : 'file'
                      }
                  };
      cb();
    }
    var that = this;
    this.router.route(function(err){
      console.log(err);
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
  /*
   *  TODO pending test to make pass...
  it ("returns an error if a dir with a collection has siblings", function(done){

    this.router.requirer.require = function(cb){
      this.paths = {'/_index.js' :
                    {'module' : 
                      {GET : function(req, res){res.end('hi')}},
                     'type' : 'file'
                    },
                    '/song.js' :
                      {module : 
                        {GET : function(req, res){res.end('song')}},
                       type : 'file',
                       fullpath : '/asdf/song.js'
                      },
                    '/song' : {'type' : 'dir', fullpath : '/asdf/song'},
                    '/song/_song.js' :
                      {'module' :
                        {GET : function(req, res){
                                  res.end('hi artist')
                               }
                        },
                        type : 'file'
                    },
                    '/song/artist.js' :
                      {'module' :
                        {GET : function(req, res){
                                  res.end('hi artist')
                               }
                        },
                        type : 'file'
                      }
                  };
      cb();
    }
    var that = this;
    this.router.route(function(err){
      console.log(err);
      should.exist(err);
      err.type.should.equal("CollectionMemberWithSiblings")
      err.message.should.equal("If you have a dynamic path, you can't have other paths in the same directory.")
      err.detail.should.equal('_song.js is a dynamic path and so cannot share a directory with artist.js.');
      done();
    });
  });
  */


  /*
  - drop down a dir, and look for a js file by the name of that dir to
      route as a collection/member pair.  Routing as a pair requires 
      the module to export a 'handler' and a 'member' object
  - it should fail if a collection module has non-dir siblings or a 
      dir sibling by any name other than the name of the collection
      prefixed with an underscore.
  - non-collection modules should be routed appropriately
  */


});
