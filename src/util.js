const vscode = require('vscode');
const fs = require('fs');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');

// 处理错误
function handleError(error) {
  if (error.code === 'ENOENT') {
    return vscode.FileSystemError.FileNotFound();
  }

  if (error.code === 'EISDIR') {
    return vscode.FileSystemError.FileIsADirectory();
  }

  if (error.code === 'EEXIST') {
    return vscode.FileSystemError.FileExists();
  }

  if (error.code === 'EPERM' || error.code === 'EACCESS') {
    return vscode.FileSystemError.NoPermissions();
  }

  return error;
}

// 处理文件名
function normalizeNFC(items) {
  // darwin: mac 系统
  if (process.platform !== 'darwin') {
    return items;
  }

  if (Array.isArray(items)) {
    return items.map(item => item.normalize('NFC'));
  }

  return items.normalize('NFC');
}

function handleResult(resolve, reject, error, result) {
  if (error) {
    reject(handleError(error));
  } else {
    resolve(result);
  }
}

function readDir(path) {
  return new Promise((resolve, reject) => {
    fs.readdir(path, (error, children) => {
      return handleResult(resolve, reject, error, normalizeNFC(children));
    });
  });
}

function stat(path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (error, stat) => handleResult(resolve, reject, error, stat));
  });
}

function readFile(path, options) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, options, (error, buffer) => handleResult(resolve, reject, error, buffer));
  });
}

function writeFile(path, content) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, content, error => handleResult(resolve, reject, error, void 0));
  });
}

function exists(path) {
  return new Promise((resolve, reject) => {
    fs.exists(path, exists => handleResult(resolve, reject, null, exists));
  });
}

function rmrf(path) {
  return new Promise((resolve, reject) => {
    rimraf(path, error => handleResult(resolve, reject, error, void 0));
  });
}

function mkdir(path) {
  return new Promise((resolve, reject) => {
    mkdirp(path, error => handleResult(resolve, reject, error, void 0));
  });
}

function reName(oldPath, newPath) {
  return new Promise((resolve, reject) => {
    fs.rename(oldPath, newPath, error => handleResult(resolve, reject, error, void 0));
  });
}

function unLink(path) {
  return new Promise((resolve, reject) => {
    fs.unlink(path, error => handleResult(resolve, reject, error, void 0));
  });
}

function vscodeLog(message) {
  vscode.window.showInformationMessage(message);
}

module.exports = {
  handleError,
  normalizeNFC,
  readDir,
  stat,
  readFile,
  writeFile,
  exists,
  rmrf,
  mkdir,
  reName,
  unLink,
  vscodeLog
};