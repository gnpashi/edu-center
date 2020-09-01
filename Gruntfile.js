var toml = require("toml");
var S = require("string");
var yaml = require('yamljs');
const regex = /[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~/?:\r\n|\r|\n]/g;
var CONTENT_PATH_PREFIX = "content/post";

module.exports = function(grunt) {
	(function() {
	  var plugin, _i, _len, _ref;

	  grunt.initConfig({
	    pkg: grunt.file.readJSON('package.json'),
			connect: {
    		server: {
      		options: {
						hostname: '127.0.0.1',
            port: 8080,
            protocol: 'http',
            base: 'public/dev',
            livereload: true,
						directory: "public/dev"
      		}
    		}
  		},
			watch:{
				options: {
					atBegin: true,
					livereload: true,
					hugo:{
						files: ['site/**'],
						tasks: 'hugo:dev'
					},
						all: {
							files: ['Gruntfile.js'],
							tasks: 'dev'
						}
				}
			}
	  });

	  _ref = ['grunt-contrib-watch', 'grunt-contrib-connect'];
	  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
	    plugin = _ref[_i];
	    grunt.loadNpmTasks(plugin);
	  }

	  grunt.registerTask('dev', ['hugo:dev','connect', 'watch']);

	  grunt.registerTask('default', ['hugo:dist']);

	  grunt.registerTask('edit', ['connect', 'watch']);

	}).call(this);

	(function() {
  grunt.registerTask('hugo', function(target) {
    var args, done, e, hugo, _i, _len, _ref, _results;
    done = this.async();
    args = ['--source=site', "--destination=../public" + target];
    if (target === 'dev') {
      args.push('--baseUrl=http://127.0.0.1:8080');
      args.push('--buildDrafts=true');
      args.push('--buildFuture=true');
    }
    hugo = require('child_process').spawn('hugo', args, {
      stdio: 'inherit'
    });
    _ref = ['exit', 'error'];
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      e = _ref[_i];
      _results.push(hugo.on(e, function() {
        return done(true);
      }));
    }
    return _results;
  });



    grunt.registerTask("create-index", function() {

        grunt.log.writeln("Build pages index");

        var indexPages = function() {
            var pagesIndex = [];
            grunt.file.recurse(CONTENT_PATH_PREFIX, function(abspath, rootdir, subdir, filename) {
                grunt.verbose.writeln("Parse file:",abspath);
								if (filename != "search.html") {
									pagesIndex.push(processFile(abspath, filename));
								}
            });
            return pagesIndex;
        };

        var processFile = function(abspath, filename) {
            var pageIndex;

            if (S(filename).endsWith(".html")) {
                pageIndex = processHTMLFile(abspath, filename);
            } else {
                pageIndex = processMDFile(abspath, filename);
            }

            return pageIndex;
        };

        var processHTMLFile = function(abspath, filename) {
            var content = grunt.file.read(abspath);
            var pageName = S(filename).chompRight(".html").s;
            var href = S(abspath)
                .chompLeft(CONTENT_PATH_PREFIX).s;
            return {
                title: pageName,
                href: href,
                content: S(content).trim().stripTags().replace(regex, '').s
                // content: S(content).trim().stripTags().stripPunctuation().s  //original
            };
        };

        var processMDFile = function(abspath, filename) {
            var content = grunt.file.read(abspath);
            var pageIndex;
            // First separate the Front Matter from the content and parse it
						// console.log(content);
            content = content.split("---");
            var frontMatter;
            try {
                frontMatter = yaml.parse(content[1].trim());
            } catch (e) {
							console.log("fail");
							console.log(content);
                console.log(e.message);
            }

            var href = S(abspath).chompLeft(CONTENT_PATH_PREFIX).chompRight(".md").s;
            // href for index.md files stops at the folder name
            if (filename === "index.md") {
                href = S(abspath).chompLeft(CONTENT_PATH_PREFIX).chompRight(filename).s;
            }
						if (filename === "peula1.md") {
							// const result = WANTED_STRING.replace(regex, '');
							console.log(S(content[2]).trim().stripTags().replace(regex, ' ').s);

						}
            // Build Lunr index for this page
            pageIndex = {
                title: frontMatter.title,

                tags: frontMatter.tags,
                categories: frontMatter.categories,
                href: href,
                content: S(content[2]).trim().stripTags().replace(regex, ' ').toLowerCase().s
                // content: S(content[2]).trim().stripTags().stripPunctuation().s   //original
            };

            return pageIndex;
        };

        grunt.file.write("content/search/PagesIndex.json", JSON.stringify(indexPages()));
        grunt.log.ok("Index built");
    });
}).call(this);
}
