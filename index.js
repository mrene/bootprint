var customize = require('customize-watch')
var Q = require('q')
var write = require('customize-write-files')
var _ = require('lodash')
var refParser = require('json-schema-ref-parser')

// preconfigured Customize instance.
module.exports = customize()
  .registerEngine('handlebars', require('customize-engine-handlebars'))
  .registerEngine('less', require('customize-engine-less'))

// Customize type for adding methods
var Customize = customize.Customize

Customize.prototype.build = function (jsonFile, targetDir) {
  var withData = this.merge({
    handlebars: {
      data: loadFromFileOrHttp(jsonFile)
    }
  })
  return new Bootprint(withData, targetDir)
}

/**
 * The old Bootprint interface
 * @constructor
 */
function Bootprint (withData, targetDir) {
  /**
   * Run Bootprint and write the result to the specified target directory
   * @param options {object} options passed to Customize#run()
   * @returns {Promise} a promise for the completion of the build
   */
  this.generate = function generate (options) {
    return withData.run(options).then(write(targetDir))
  }

  /**
   * Run the file watcher to watch all files loaded into the
   * current Bootprint-configuration.
   * The watcher run Bootprint every time one the the input files, templates or helpers changes.
   * @returns {EventEmitter} an EventEmitter that sends an `update`-event after each
   *   build, but before the files are written to disc.
   */
  this.watch = function () {
    return withData.watch().on('update', write(targetDir))
  }
}

/**
 * Helper method for loading the bootprint-data
 * @param fileOrUrlOrData
 * @returns {*}
 * @private
 */
function loadFromFileOrHttp (fileOrUrlOrData) {
  // If this is not a string,
  // it is probably already the raw data.
  if (!_.isString(fileOrUrlOrData)) {
    return Q(fileOrUrlOrData)
  }

  return Q(refParser.dereference(fileOrUrlOrData))
}
