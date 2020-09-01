var toml = require("toml");
var S = require("string");
var yaml = require('yamljs');
const regex = /[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~/?:\r\n|\r|\n]/g;
var CONTENT_PATH_PREFIX = "content/post";

module.exports = function(grunt) {

    grunt.registerTask("lunr-index", function() {

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
};
