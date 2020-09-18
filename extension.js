const vscode = require('vscode');
const path = require('path');
const SimpleExplorer = require('./src/simpleExplorer.js');
const config = require('./simple-explorer-config.js');

const {
  writeFile,
  exists,
	mkdir,
	vscodeLog
} = require('./src/util');

// 默认的配置内容
const defaultConfigContent = JSON.stringify({
	"files": []
}, null, 2);

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	if(!vscode.workspace.workspaceFolders) {
		console.log('获取 workspaceFolder 失败');
		vscodeLog('获取 workspaceFolder 失败');
		return;
	}
	const workspaceFolder = vscode.workspace.workspaceFolders.filter(folder => folder.uri.scheme === 'file')[0];
	if(!workspaceFolder) {
		console.log('获取 workspaceFolder 失败');
		vscodeLog('获取 workspaceFolder 失败');
		return;
	}
	// projectName: 项目目录名称，如 automator
	// projectRootPath: 项目目录，如 /Users/jianpingsong/songjp/mine/automator
	// project： workspaceFolders 对象, 包含 { name, index, uri }
	const { name: projectName, uri } = workspaceFolder;
	const { path: projectRootPath } = uri;

	const configFolderPath = path.join(projectRootPath, config.configFolder);
	const configFilePath = path.join(projectRootPath, config.configFolder, config.configFile);

	const isExistVscode = await exists(configFolderPath);
	const isExistConfig = await exists(configFilePath);
	if(!isExistConfig) {
		if(!isExistVscode) {
			await mkdir(path.join(projectRootPath, '.vscode'));
		}
		await writeFile(configFilePath, defaultConfigContent);
	} else {
		let configFiles = {};
		try {
			configFiles = require(configFilePath);
		} catch (e) {
			console.log('require 配置文件出错', e);
		}
		if(!configFiles || !Array.isArray(configFiles.files)) {
			await writeFile(configFilePath, defaultConfigContent);
		}
	}

	new SimpleExplorer(context, projectName, projectRootPath, workspaceFolder);
}
exports.activate = activate;

// 插件关闭时执行
function deactivate() {}

module.exports = {
	activate,
	deactivate
};
