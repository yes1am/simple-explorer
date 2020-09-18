const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const config = require('../simple-explorer-config.js');

const {
	normalizeNFC,
  readDir,
  stat,
  readFile,
  writeFile,
  exists,
  rmrf,
  mkdir,
	unLink,
	vscodeLog
} = require('./util');

const {
	FileStat
} = require('./fileStat');

const isExistInConfigFiles = (configFiles, path) => {
  return configFiles.find(item => item.startsWith(path) || path.startsWith(item));
};

class FileSystemProvider {
	constructor(projectName, projectRootPath, project) {
		this.projectName = projectName;
		this.projectRootPath = projectRootPath;
		this.project = project;
		this._onDidChangeFile = new vscode.EventEmitter();

		const configFilePath = path.join(this.projectRootPath, config.configFolder, config.configFile);
		if(fs.existsSync(configFilePath)) {
			this.configFiles = (require(configFilePath) || {}).files || [];
		}
		if(!this.configFiles || !this.configFiles.length) {
			vscodeLog('暂无配置，不显示任何文件');
			this.configFiles = [];
		}
	}

	get onDidChangeFile() {
		return this._onDidChangeFile.event;
	}

	watch(uri, options) {
		const watcher = fs.watch(uri.fsPath, { recursive: options.recursive }, async (event, filename) => {
			const filepath = path.join(uri.fsPath, normalizeNFC(filename.toString()));
			// TODO support excludes (using minimatch library?)
			this._onDidChangeFile.fire([{
				type: event === 'change' ? vscode.FileChangeType.Changed : await exists(filepath) ? vscode.FileChangeType.Created : vscode.FileChangeType.Deleted,
				uri: uri.with({ path: filepath })
			}]);
		});

		return { dispose: () => watcher.close() };
	}

	async stat(path) {
		return new FileStat(await stat(path));
	}

	async readDirectory(uri) {
    // 得到所有(文件/目录)的名称，如 node_modules, package.json
		const children = await readDir(uri.fsPath);

		const result = [];
		for (let i = 0; i < children.length; i++) {
			const child = children[i];
			const stat = await this.stat(path.join(uri.fsPath, child));
			result.push([child, stat.type]);
		}

		return Promise.resolve(result);
	}

	createDirectory(uri) {
		return mkdir(uri.fsPath);
	}

	readFile(uri) {
		return readFile(uri.fsPath);
	}

	async writeFile(uri, content, options) {
		const exists = await exists(uri.fsPath);
		if (!exists) {
			if (!options.create) {
				throw vscode.FileSystemError.FileNotFound();
			}

			await mkdir(path.dirname(uri.fsPath));
		} else {
			if (!options.overwrite) {
				throw vscode.FileSystemError.FileExists();
			}
		}

		return writeFile(uri.fsPath, content);
	}

	delete(uri, options) {
		if (options.recursive) {
			return rmrf(uri.fsPath);
		}

		return unLink(uri.fsPath);
	}

  // tree data provider, 当点击一个目录时会执行
  // 第一次执行时 element 为 undefined，因为没有点击
	async getChildren(element) {
		if (element) {
			const children = await this.readDirectory(element.uri);
			return children.map(([name, type]) => ({ uri: vscode.Uri.file(path.join(element.uri.fsPath, name)), type }));
		}

		if (this.project) {
      // 得到文件名称，和文件类型(文件、目录，还是软链接)
			const children = await this.readDirectory(this.project.uri);

      // 对文件类型，和文件名进行排序
			children.sort((a, b) => {
				if (a[1] === b[1]) {
					return a[0].localeCompare(b[0]);
				}
				return a[1] === vscode.FileType.Directory ? -1 : 1;
      });
      
      // 再重新创建文件
			return children.map(([name, type]) => ({
				uri: vscode.Uri.file(path.join(this.project.uri.fsPath, name)),
				type
			}));
		}

		return [];
	}

  // element 为所打开项目的每一项，不管是文件还是目录，每一项渲染时会执行该函数
	getTreeItem(element) {
    const path = element.uri.path;
    if(!isExistInConfigFiles(this.configFiles, path)) {
      return null;
    }

    const treeItem = new vscode.TreeItem(element.uri, element.type === vscode.FileType.Directory ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
    if (element.type === vscode.FileType.File) {
			treeItem.command = { command: 'simpleExplorer.openFile', title: "Open File", arguments: [element.uri], };
			treeItem.contextValue = 'file';
		}
    return treeItem;
	}
}

class SimpleExplorer {
	constructor(context, projectName, projectRootPath, project) {
		this.projectRootPath = projectRootPath;

		const treeDataProvider = new FileSystemProvider(projectName, projectRootPath, project);
		this.simpleExplorer = vscode.window.createTreeView('simpleExplorer', { treeDataProvider });
		vscode.commands.registerCommand('simpleExplorer.openFile', (resource) => this.openResource(resource));
		vscode.commands.registerCommand('simpleExplorer.addToSimpleExplorer', (resource) => this.addToSimpleExplorer(resource));
		vscode.commands.registerCommand('simpleExplorer.removeFromSimpleExplorer', (resource) => this.removeFromSimpleExplorer(resource));
	}

	openResource(resource) {
		vscode.window.showTextDocument(resource);
	}

	async addToSimpleExplorer(resource) {
		const { path: filePath } = resource;
		const configFilePath = path.join(this.projectRootPath, config.configFolder, config.configFile);
		const configContent = await readFile(configFilePath, 'utf8');
		try {
			const configFile = JSON.parse(configContent);
			if(Array.isArray(configFile.files)) {
				if(configFile.files.includes(filePath)) {
					vscodeLog(`${filePath} 已存在`);
				} else {
					configFile.files.push(filePath);
					await writeFile(configFilePath, JSON.stringify(configFile, null, 2));
					vscodeLog(`${filePath} 添加成功`);
				}
			}
		} catch (error) {
			vscodeLog(`${config.configFile} 不是 JSON 格式`);
		}
	}

	async removeFromSimpleExplorer(resource) {
		const { path: filePath } = resource;
		const configFilePath = path.join(this.projectRootPath, config.configFolder, config.configFile);
		const configContent = await readFile(configFilePath, 'utf8');
		try {
			const configFile = JSON.parse(configContent);
			if(Array.isArray(configFile.files)) {
				if(configFile.files.includes(filePath)) {
					const fileIndex = configFile.files.indexOf(filePath);
					configFile.files.splice(fileIndex, 1);
					await writeFile(configFilePath, JSON.stringify(configFile, null, 2));
					vscodeLog(`${filePath} 移除成功`);
				} else {
					vscodeLog(`${filePath} 不存在`);
				}
			}
		} catch (error) {
			vscodeLog(`${config.configFile} 不是 JSON 格式`);
		}
	}
}

module.exports = SimpleExplorer;