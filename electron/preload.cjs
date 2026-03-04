const { contextBridge, ipcRenderer } = require('electron');

const SELECT_DIRECTORY_CHANNEL = 'adj:select-directory';

contextBridge.exposeInMainWorld('adjDesktop', {
  selectDirectory: () => ipcRenderer.invoke(SELECT_DIRECTORY_CHANNEL)
});
