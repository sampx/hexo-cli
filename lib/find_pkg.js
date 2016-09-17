'use strict';

var pathFn = require('path');
var fs = require('hexo-fs');

function findPkg(cwd, args) {
  args = args || {};

  if (args.cwd) {
    cwd = pathFn.resolve(cwd, args.cwd); //相对路径转换为绝对路径
  }

  return checkPkg(cwd); //从当前目录一直向上级目录查找package.json,直到找到含有此文件的目录路径后返回
}

function checkPkg(path) {
  var pkgPath = pathFn.join(path, 'package.json');

  var filePromise = fs.readFile(pkgPath);

  var res = filePromise.then(function(content) {
    console.log('reading filePromise');
    console.log("filePromise="+JSON.stringify(filePromise));
    var json = JSON.parse(content);
    if (typeof json.hexo === 'object') {
      console.log("found it......");
      return path;
    }
  },function(err) {
    console.log('error in checkPkg');
    if (err && err.cause.code === 'ENOENT') {
      var parent = pathFn.dirname(path);

      if (parent === path) return;
      return checkPkg(parent);
    }
    throw err;
  });

  return res;
}

module.exports = findPkg;
