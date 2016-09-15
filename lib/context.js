'use strict';

var logger = require('hexo-log');
var chalk = require('chalk');
var EventEmitter = require('events').EventEmitter;
var Promise = require('bluebird');
var ConsoleExtend = require('./extend/console');

function Context(base, args) {
  base = base || process.cwd();
  args = args || {};

  EventEmitter.call(this); //此处是copy EventEmitter的属性，类似于定义继承后执行super()

  this.base_dir = base;
  this.log = logger(args);

  this.extend = {
    console: new ConsoleExtend()
  };
}

require('util').inherits(Context, EventEmitter); //定义继承自EventEmitter

Context.prototype.init = function() {
  // Do nothing
};

Context.prototype.call = function(name, args, callback) {
  if (!callback && typeof args === 'function') {
    callback = args;
    args = {};
  }

  var self = this;

  return new Promise(function(resolve, reject) {
    var c = self.extend.console.get(name);

    if (c) {
      c.call(self, args).then(resolve, reject);
    } else {
      reject(new Error('Console `' + name + '` has not been registered yet!'));
    }
  }).asCallback(callback);
};

Context.prototype.exit = function(err) {
  if (err) {
    this.log.fatal(
      {err: err},
      'Something\'s wrong. Maybe you can find the solution here: %s',
      chalk.underline('http://hexo.io/docs/troubleshooting.html')
    );
  }
};

Context.prototype.unwatch = function() {
  // Do nothing
};

module.exports = Context;
