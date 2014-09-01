var grunt = require('grunt');
var _ = require('lodash');
var fs = require('fs.extra');

function Combinator(baseurl, params, options) {
  this.combine = function() {

    var keys = _.keys(params);
    var data = _.values(params);

    // Set a default filter, in case none has been
    // set in the config.
    var filter = options.filter || function() {
      return true;
    };

    var permutations = this.permutations(data);
    var permutatedParams = this.parametrize(keys, permutations);
    var filteredParams = _.filter(permutatedParams, filter);

    var it = this;

    return _.map(filteredParams, function(params) {
      return it.generateUrl(baseurl, params);
    });
  };


  this.parametrize = function(keys, permutations) {
    var result = [];
    _.each(permutations, function(permutation) {
      var current = {};
      _.each(permutation, function(value, index) {
        current[keys[index]] = value;
      });
      result.push(current);
    });
    return result;
  };

  this.generateUrl = function(url, params) {
    _.each(params, function(value, key) {
      url = url.replace('%' + key + '%', value);
    });

    return url;
  };

  this.permutations = function(args) {
    var result = [];
    var max = args.length - 1;

    function recurse(array, argsIndex) {
      var index = args[argsIndex].length;

      while (--index > -1) {
        var clone = array.slice(0); // clone arr
        clone.push(args[argsIndex][index]);
        if (argsIndex < max) {
          recurse(clone, argsIndex + 1);
        } else {
          result.push(clone);
        }
      }
    }
    recurse([], 0);
    return result;
  };
}


module.exports = function(grunt) {

  grunt.registerMultiTask('combinations', 'Calculate url combinations from url params', function() {
    var config = this.data;

    console.log(config.dest);

    grunt.verbose.writeln('[log] Scraping data from: ' + config.src + '');
    grunt.verbose.writeln('[log] Scraping data to: ' + config.dest);

    var combinator = new Combinator(config.baseurl, config.params, config);
    var urls = combinator.combine();

    var urlsJson = JSON.stringify(urls);

    var hasFilename = config.dest.match(/\.([^.]+)$/) !== null;

    var filename = hasFilename ? config.dest.match(/\/([^\/]+)$/)[1] : this.target;
    var path = hasFilename ? config.dest.replace(/^(.*\/)[^\/]+$/, '$1') : config.dest;

    var filepath = path + filename;

    fs.mkdirRecursiveSync(path);
    fs.writeFileSync(filename, urlsJson);
  });
};