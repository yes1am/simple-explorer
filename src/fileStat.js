const vscode = require('vscode');

// 得到文件的状态
class FileStat {
  constructor(fsStat) {
    this.fsStat = fsStat;
  }
	get type() {
		return this.fsStat.isFile() ? vscode.FileType.File : this.fsStat.isDirectory() ? vscode.FileType.Directory : this.fsStat.isSymbolicLink() ? vscode.FileType.SymbolicLink : vscode.FileType.Unknown;
	}

	get isFile() {
		return this.fsStat.isFile();
	}

	get isDirectory() {
		return this.fsStat.isDirectory();
	}

	get isSymbolicLink() {
		return this.fsStat.isSymbolicLink();
	}

	get size() {
		return this.fsStat.size;
	}

	get ctime() {
		return this.fsStat.ctime.getTime();
	}

	get mtime() {
		return this.fsStat.mtime.getTime();
	}
}

module.exports = {
  FileStat  
};