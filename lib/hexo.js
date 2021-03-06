'use strict';

var chalk = require('chalk');   //一个在控制台以不同颜色风格打印字符串的包-比较流行
var tildify = require('tildify'); //一个将用户主目录转换成波浪线的包
var pathFn = require('path');
var Promise = require('bluebird'); //一个全功能的promise库，异步编程的同步写法
var Context = require('./context');
var findPkg = require('./find_pkg');
var goodbye = require('./goodbye');
var minimist = require('minimist');//解析命令行参数和选项工具包
var camelCaseKeys = require('hexo-util/lib/camel_case_keys');//驼峰名名工具

function entry(cwd, args) {
  cwd = cwd || process.cwd();
  args = camelCaseKeys(args || minimist(process.argv.slice(2)));

  console.log("cwd="+ cwd);
  console.log("args="+ JSON.stringify(args));

  var hexo = new Context(cwd, args);
  var log = hexo.log;

  // Change the title in console
  process.title = 'hexo';

  function handleError(err) {
    log.fatal(err);
    process.exit(2);
  }

  var pkg = findPkg(cwd, args);

  return pkg.then(function(path) {
    console.log("1: path="+ path);
    console.log("pkg="+JSON.stringify(pkg));
    if (!path) return;

    hexo.base_dir = path;

    return loadModule(path, args).catch(function() {
      log.error('Local hexo not found in %s', chalk.magenta(tildify(path)));
      log.error('Try running: \'npm install hexo --save\'');
      process.exit(2);
    });
  }).then(function(mod) {
    console.log("2: mod="+JSON.stringify(mod));
    if (mod) hexo = mod;
    log = hexo.log;

    require('./console')(hexo);

    return hexo.init();
  }).then(function() {
    console.log("3....");
    var cmd = '';

    if (!args.h && !args.help) {
      cmd = args._.shift();

      if (cmd) {
        var c = hexo.extend.console.get(cmd);
        if (!c) cmd = 'help';
      } else {
        cmd = 'help';
      }
    } else {
      cmd = 'help';
    }

    watchSignal(hexo);

    return hexo.call(cmd, args).then(function() {
      return hexo.exit();
    }).catch(function(err) {
      return hexo.exit(err).then(function() {
        handleError(err);
      });
    });
  }).catch(handleError);
}

entry.console = {
  init: require('./console/init'),
  help: require('./console/help'),
  version: require('./console/version')
};

entry.version = require('../package.json').version;

function loadModule(path, args) {
  return Promise.try(function() {
    var modulePath = pathFn.join(path, 'node_modules', 'hexo');
    var Hexo = require(modulePath);

    return new Hexo(path, args);
  });
}

function watchSignal(hexo) {
  process.on('SIGINT', function() {
    hexo.log.info(goodbye());
    hexo.unwatch();

    hexo.exit().then(function() {
      process.exit();
    });
  });
}

module.exports = entry;
