# Simple Explorer

Only view the directories or files you care about. [VSCode Marketplace Link](https://marketplace.visualstudio.com/items?itemName=songjp.simple-explorer)

![效果图](https://raw.githubusercontent.com/yes1am/PicBed/master/img/%E4%BC%81%E4%B8%9A%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_e9976a32-8093-4e99-88ae-a77a13463b2b.png)

1. add directories or files' full path to the `.vscode/simple-explorer.json`
2. reload the extension
3. the directories or files will be shown in **SIMPLE EXPLORER** activity bar

## Easy to add or remove

<img src="https://raw.githubusercontent.com/yes1am/PicBed/master/img/20200918200613.png" height="400" />

1. you can **right click** on directories or files, to add (*添加到 Simeple Explorer*) or remove (*从 Simple Explorer 移除*) item from list.
2. reload the extension to make it work.

## Log

I added some console.log for debugging purposes, you can click `Help` => `Toggle Developer Tools` in the VSCode. you will see something like this:

![image](https://user-images.githubusercontent.com/25051945/116089635-a6b42200-a6d5-11eb-83c7-5f75f5d2ccbf.png)

the log means, the config is `/Users/songjp/fe/mime/learn-lerna/node_modules/babel-core`,The file that is currently being looped is `/Users/songjp/fe/mime/learn-lerna/package.json`, so `/Users/songjp/fe/mime/learn-lerna/package.json` wont be shown.
