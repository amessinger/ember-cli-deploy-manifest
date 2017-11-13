/*eslint-env node*/
'use strict';

var RSVP      = require('rsvp');
var fs        = require('fs');
var path      = require('path');
var minimatch = require('minimatch');
var jsonfile  = require('jsonfile');

var DeployPluginBase = require('ember-cli-deploy-plugin');

// removes the md5 hash from the filename
function getOriginalFilename(filename) {
  return filename.replace(/(-[a-f0-9]{32})(\..+)$/g, '$2');;
}

module.exports = {
  name: 'ember-cli-deploy-manifest',

  createDeployPlugin: function(options) {
    var DeployPlugin = DeployPluginBase.extend({
      name: options.name,
      defaultConfig: {
        filePattern: '**/*.{js,css,png,gif,ico,jpg,map,xml,txt,svg,swf,eot,ttf,woff,woff2}',
        fileIgnorePattern: null,
        manifestPath: 'manifest.json',
        distDir: function(context) {
          return context.distDir;
        },
        distFiles: function(context) {
          return context.distFiles || [];
        }
      },

      willUpload: function(/* context */) {
        var filePattern       = this.readConfig('filePattern');
        var distDir           = this.readConfig('distDir');
        var distFiles         = this.readConfig('distFiles');
        var manifestPath      = this.readConfig('manifestPath');
        var fileIgnorePattern = this.readConfig('fileIgnorePattern');

        this.log('generating manifest at `' + manifestPath + '`', { verbose: true });
        try {
          var filesToInclude = distFiles.filter(minimatch.filter(filePattern, { matchBase: true }));
          if (fileIgnorePattern != null) {
            filesToInclude = filesToInclude.filter(function(path) {
              return !minimatch(path, fileIgnorePattern, { matchBase: true });
            });
          }
          filesToInclude.sort();
          var mappedFilesToInclude = {};
          filesToInclude.forEach((filename)=> {
            mappedFilesToInclude[getOriginalFilename(filename)] = filename;
          });
          var outputPath = path.join(distDir, manifestPath);
          jsonfile.writeFileSync(outputPath, mappedFilesToInclude, {spaces: 2});
          this.log('generated manifest including ' + filesToInclude.length + ' files ok', { verbose: true });
          return { manifestPath: manifestPath };
        } catch (error) {
          this.log(error, { color: 'red' });
          return RSVP.reject(error);
        }
      }
    });
    return new DeployPlugin();
  }
};
