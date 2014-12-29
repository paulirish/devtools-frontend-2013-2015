// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @constructor
 * @param {!WebInspector.Workspace} workspace
 * @param {!WebInspector.FileSystemMapping} fileSystemMapping
 */
WebInspector.NetworkMapping = function(workspace, fileSystemMapping)
{
    this._workspace = workspace;
    this._fileSystemMapping = fileSystemMapping;
    InspectorFrontendHost.events.addEventListener(InspectorFrontendHostAPI.Events.RevealSourceLine, this._revealSourceLine, this);
}

WebInspector.NetworkMapping.prototype = {
    /**
     * @param {!WebInspector.UISourceCode} uiSourceCode
     * @return {string}
     */
    networkURL: function(uiSourceCode)
    {
        // FIXME: This should use fileSystemMapping to determine url.
        return uiSourceCode.networkURL();
    },

    /**
     * @param {string} url
     * @return {boolean}
     */
    hasMappingForURL: function(url)
    {
        return this._fileSystemMapping.hasMappingForURL(url);
    },

    /**
     * @param {string} url
     * @return {?WebInspector.UISourceCode}
     */
    _networkUISourceCodeForURL: function(url)
    {
        var splitURL = WebInspector.ParsedURL.splitURLIntoPathComponents(url);
        var projectId = splitURL[0];
        var project = this._workspace.project(projectId);
        return project ? project.uiSourceCode(splitURL.slice(1).join("/")) : null;
    },

    /**
     * @param {string} url
     * @return {?WebInspector.UISourceCode}
     */
    _contentScriptUISourceCodeForURL: function(url)
    {
        var splitURL = WebInspector.ParsedURL.splitURLIntoPathComponents(url);
        var projectId = "contentscripts:" + splitURL[0];
        var project = this._workspace.project(projectId);
        return project ? project.uiSourceCode(splitURL.slice(1).join("/")) : null;
    },

    /**
     * @param {string} url
     * @return {?WebInspector.UISourceCode}
     */
    uiSourceCodeForURL: function(url)
    {
        var file = this._fileSystemMapping.fileForURL(url);
        if (!file)
            return this._networkUISourceCodeForURL(url) || this._contentScriptUISourceCodeForURL(url);

        var projectId = WebInspector.FileSystemWorkspaceBinding.projectId(file.fileSystemPath);
        var project = this._workspace.project(projectId);
        return project ? project.uiSourceCode(file.filePath) : null;
    },

    /**
     * @param {string} fileSystemPath
     * @param {string} filePath
     * @return {string}
     */
    urlForPath: function(fileSystemPath, filePath)
    {
        return this._fileSystemMapping.urlForPath(fileSystemPath, filePath);
    },

    /**
     * @param {!WebInspector.UISourceCode} networkUISourceCode
     * @param {!WebInspector.UISourceCode} uiSourceCode
     * @param {!WebInspector.FileSystemWorkspaceBinding} fileSystemWorkspaceBinding
     */
    addMapping: function(networkUISourceCode, uiSourceCode, fileSystemWorkspaceBinding)
    {
        var url = this.networkURL(networkUISourceCode);
        var path = uiSourceCode.path();
        var fileSystemPath = fileSystemWorkspaceBinding.fileSystemPath(uiSourceCode.project().id());
        this._fileSystemMapping.addMappingForResource(url, fileSystemPath, path);
    },

    /**
     * @param {!WebInspector.UISourceCode} uiSourceCode
     */
    removeMapping: function(uiSourceCode)
    {
        var networkURL = this.networkURL(uiSourceCode);
        this._fileSystemMapping.removeMappingForURL(networkURL);
    },

    /**
     * @param {!WebInspector.Event} event
     */
    _revealSourceLine: function(event)
    {
        var url = /** @type {string} */ (event.data["url"]);
        var lineNumber = /** @type {number} */ (event.data["lineNumber"]);
        var columnNumber = /** @type {number} */ (event.data["columnNumber"]);

        var uiSourceCode = this.uiSourceCodeForURL(url);
        if (uiSourceCode) {
            WebInspector.Revealer.reveal(uiSourceCode.uiLocation(lineNumber, columnNumber));
            return;
        }

        /**
         * @param {!WebInspector.Event} event
         * @this {WebInspector.NetworkMapping}
         */
        function listener(event)
        {
            var uiSourceCode = /** @type {!WebInspector.UISourceCode} */ (event.data);
            if (this.networkURL(uiSourceCode) === url) {
                WebInspector.Revealer.reveal(uiSourceCode.uiLocation(lineNumber, columnNumber));
                this._workspace.removeEventListener(WebInspector.Workspace.Events.UISourceCodeAdded, listener, this);
            }
        }

        this._workspace.addEventListener(WebInspector.Workspace.Events.UISourceCodeAdded, listener, this);
    },
}

/**
 * @type {!WebInspector.NetworkMapping}
 */
WebInspector.networkMapping;
