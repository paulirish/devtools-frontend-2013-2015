#
# Copyright (C) 2013 Google Inc. All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are
# met:
#
#         * Redistributions of source code must retain the above copyright
# notice, this list of conditions and the following disclaimer.
#         * Redistributions in binary form must reproduce the above
# copyright notice, this list of conditions and the following disclaimer
# in the documentation and/or other materials provided with the
# distribution.
#         * Neither the name of Google Inc. nor the names of its
# contributors may be used to endorse or promote products derived from
# this software without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
# "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
# LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
# A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
# OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
# SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
# LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
# DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
# THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
# OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
#

{
    'variables': {
        # If debug_devtools is set to 1, JavaScript files for DevTools are
        # stored as is. Otherwise, a concatenated file is stored.
        'debug_devtools%': 0,
        'devtools_files': [
            'front_end/inspector.html',
            'front_end/AdvancedSearchController.js',
            'front_end/ApplicationCacheModel.js',
            'front_end/BreakpointManager.js',
            'front_end/Checkbox.js',
            'front_end/Color.js',
            'front_end/CompilerScriptMapping.js',
            'front_end/CompletionDictionary.js',
            'front_end/ConsoleMessage.js',
            'front_end/ConsoleModel.js',
            'front_end/ConsolePanel.js',
            'front_end/ConsoleView.js',
            'front_end/ContentProvider.js',
            'front_end/ContentProviderBasedProjectDelegate.js',
            'front_end/ContentProviders.js',
            'front_end/ContextMenu.js',
            'front_end/CookieItemsView.js',
            'front_end/CookieParser.js',
            'front_end/CookiesTable.js',
            'front_end/CountersGraph.js',
            'front_end/CSSFormatter.js',
            'front_end/CSSMetadata.js',
            'front_end/CSSStyleModel.js',
            'front_end/CSSStyleSheetMapping.js',
            'front_end/Database.js',
            'front_end/DataGrid.js',
            'front_end/DebuggerModel.js',
            'front_end/DebuggerScriptMapping.js',
            'front_end/DevToolsExtensionAPI.js',
            'front_end/Tests.js',
            'front_end/Dialog.js',
            'front_end/DOMAgent.js',
            'front_end/DOMBreakpointsSidebarPane.js',
            'front_end/DOMExtension.js',
            'front_end/DOMPresentationUtils.js',
            'front_end/DOMStorage.js',
            'front_end/DOMSyntaxHighlighter.js',
            'front_end/DefaultScriptMapping.js',
            'front_end/DockController.js',
            'front_end/Drawer.js',
            'front_end/EditFileSystemDialog.js',
            'front_end/ElementsPanelDescriptor.js',
            'front_end/ElementsTreeOutline.js',
            'front_end/EmptyView.js',
            'front_end/ExtensionAPI.js',
            'front_end/ExtensionAuditCategory.js',
            'front_end/ExtensionPanel.js',
            'front_end/ExtensionRegistryStub.js',
            'front_end/ExtensionServer.js',
            'front_end/ExtensionView.js',
            'front_end/FileManager.js',
            'front_end/FileSystemMapping.js',
            'front_end/FileSystemModel.js',
            'front_end/FileSystemProjectDelegate.js',
            'front_end/FileUtils.js',
            'front_end/FilterBar.js',
            'front_end/FlameChart.js',
            'front_end/FontView.js',
            'front_end/Geometry.js',
            'front_end/GoToLineDialog.js',
            'front_end/HAREntry.js',
            'front_end/HandlerRegistry.js',
            'front_end/HeapSnapshotWorker.js',
            'front_end/HelpScreen.js',
            'front_end/ImageView.js',
            'front_end/IndexedDBModel.js',
            'front_end/InspectorBackend.js',
            'front_end/InspectorFrontendAPI.js',
            'front_end/InspectorFrontendHostStub.js',
            'front_end/InspectorView.js',
            'front_end/inspector.js',
            'front_end/IsolatedFileSystem.js',
            'front_end/IsolatedFileSystemManager.js',
            'front_end/JavaScriptFormatter.js',
            'front_end/jsdifflib.js',
            'front_end/KeyboardShortcut.js',
            'front_end/LayersPanelDescriptor.js',
            'front_end/Linkifier.js',
            'front_end/LiveEditSupport.js',
            'front_end/NativeBreakpointsSidebarPane.js',
            'front_end/NetworkManager.js',
            'front_end/NetworkLog.js',
            'front_end/NetworkPanelDescriptor.js',
            'front_end/NetworkRequest.js',
            'front_end/NetworkUISourceCodeProvider.js',
            'front_end/InspectElementModeController.js',
            'front_end/Object.js',
            'front_end/ObjectPopoverHelper.js',
            'front_end/ObjectPropertiesSection.js',
            'front_end/OverridesSupport.js',
            'front_end/OverviewGrid.js',
            'front_end/PaintProfiler.js',
            'front_end/Panel.js',
            'front_end/ParsedURL.js',
            'front_end/Placard.js',
            'front_end/Platform.js',
            'front_end/Popover.js',
            'front_end/PresentationConsoleMessageHelper.js',
            'front_end/ProfilesPanelDescriptor.js',
            'front_end/Progress.js',
            'front_end/ProgressIndicator.js',
            'front_end/PropertiesSection.js',
            'front_end/RemoteObject.js',
            'front_end/Resource.js',
            'front_end/ResourceScriptMapping.js',
            'front_end/ResourceTreeModel.js',
            'front_end/ResourceType.js',
            'front_end/ResourceUtils.js',
            'front_end/ResourceView.js',
            'front_end/RuntimeModel.js',
            'front_end/SASSSourceMapping.js',
            'front_end/ScreencastView.js',
            'front_end/Script.js',
            'front_end/ScriptFormatter.js',
            'front_end/ScriptFormatterWorker.js',
            'front_end/ScriptSnippetModel.js',
            'front_end/SearchableView.js',
            'front_end/SettingsScreen.js',
            'front_end/Section.js',
            'front_end/Settings.js',
            'front_end/ShortcutsScreen.js',
            'front_end/ShowMoreDataGridNode.js',
            'front_end/SidebarOverlay.js',
            'front_end/SidebarPane.js',
            'front_end/SidebarView.js',
            'front_end/SidebarTreeElement.js',
            'front_end/SimpleWorkspaceProvider.js',
            'front_end/SnippetStorage.js',
            'front_end/SoftContextMenu.js',
            'front_end/SourceFrame.js',
            'front_end/SourceMap.js',
            'front_end/SourceMapping.js',
            'front_end/SourcesPanelDescriptor.js',
            'front_end/Spectrum.js',
            'front_end/SplitView.js',
            'front_end/StackView.js',
            'front_end/StatusBarButton.js',
            'front_end/StylesSourceMapping.js',
            'front_end/SuggestBox.js',
            'front_end/TabbedPane.js',
            'front_end/TempFile.js',
            'front_end/TestController.js',
            'front_end/TextEditor.js',
            'front_end/TextRange.js',
            'front_end/TextPrompt.js',
            'front_end/TextUtils.js',
            'front_end/TimelineGrid.js',
            'front_end/TimelineManager.js',
            'front_end/TimelinePanelDescriptor.js',
            'front_end/TracingAgent.js',
            'front_end/treeoutline.js',
            'front_end/UISourceCode.js',
            'front_end/UIString.js',
            'front_end/UIUtils.js',
            'front_end/UserMetrics.js',
            'front_end/utilities.js',
            'front_end/View.js',
            'front_end/ViewportControl.js',
            'front_end/WorkerManager.js',
            'front_end/Workspace.js',
            'front_end/WorkspaceController.js',
            'front_end/dialog.css',
            'front_end/inspector.css',
            'front_end/tabbedPane.css',
            'front_end/inspectorSyntaxHighlight.css',
            'front_end/popover.css',
            '<@(devtools_modules_js_files)',
            '<@(devtools_standalone_files)',
        ],
        'devtools_standalone_files': [
            'front_end/accelerometer.css',
            'front_end/auditsPanel.css',
            'front_end/breadcrumbList.css',
            'front_end/breakpointsList.css',
            'front_end/buildSystemOnly.js',
            'front_end/cm/cmdevtools.css',
            'front_end/cm/codemirror.css',
            'front_end/cssNamedFlows.css',
            'front_end/dataGrid.css',
            'front_end/elementsPanel.css',
            'front_end/filter.css',
            'front_end/filteredItemSelectionDialog.css',
            'front_end/flameChart.css',
            'front_end/heapProfiler.css',
            'front_end/helpScreen.css',
            'front_end/indexedDBViews.css',
            'front_end/inspectorCommon.css',
            'front_end/navigatorView.css',
            'front_end/networkLogView.css',
            'front_end/networkPanel.css',
            'front_end/overrides.css',
            'front_end/panelEnablerView.css',
            'front_end/profilesPanel.css',
            'front_end/resourceView.css',
            'front_end/resourcesPanel.css',
            'front_end/revisionHistory.css',
            'front_end/screencastView.css',
            'front_end/sidebarPane.css',
            'front_end/sourcesPanel.css',
            'front_end/sourcesView.css',
            'front_end/spectrum.css',
            'front_end/splitView.css',
            'front_end/textPrompt.css',
            'front_end/timelinePanel.css',
            'front_end/canvasProfiler.css',
            'front_end/layersPanel.css',
        ],
        'devtools_elements_js_files': [
            'front_end/CSSNamedFlowCollectionsView.js',
            'front_end/CSSNamedFlowView.js',
            'front_end/ElementsPanel.js',
            'front_end/EventListenersSidebarPane.js',
            'front_end/MetricsSidebarPane.js',
            'front_end/OverridesView.js',
            'front_end/PlatformFontsSidebarPane.js',
            'front_end/PropertiesSidebarPane.js',
            'front_end/RenderingOptionsView.js',
            'front_end/StylesSidebarPane.js',
        ],
        'devtools_resources_js_files': [
            'front_end/ApplicationCacheItemsView.js',
            'front_end/DOMStorageItemsView.js',
            'front_end/DatabaseQueryView.js',
            'front_end/DatabaseTableView.js',
            'front_end/DirectoryContentView.js',
            'front_end/FileContentView.js',
            'front_end/FileSystemView.js',
            'front_end/IndexedDBViews.js',
            'front_end/ResourcesPanel.js',
        ],
        'devtools_network_js_files': [
            'front_end/NetworkItemView.js',
            'front_end/RequestCookiesView.js',
            'front_end/RequestHeadersView.js',
            'front_end/RequestHTMLView.js',
            'front_end/RequestJSONView.js',
            'front_end/RequestPreviewView.js',
            'front_end/RequestResponseView.js',
            'front_end/RequestTimingView.js',
            'front_end/RequestView.js',
            'front_end/ResourceWebSocketFrameView.js',
            'front_end/NetworkPanel.js',
        ],
        'devtools_scripts_js_files': [
            'front_end/BreakpointsSidebarPane.js',
            'front_end/CSSSourceFrame.js',
            'front_end/CallStackSidebarPane.js',
            'front_end/FilePathScoreFunction.js',
            'front_end/FilteredItemSelectionDialog.js',
            'front_end/JavaScriptSourceFrame.js',
            'front_end/NavigatorOverlayController.js',
            'front_end/NavigatorView.js',
            'front_end/RevisionHistoryView.js',
            'front_end/ScopeChainSidebarPane.js',
            'front_end/SourcesNavigator.js',
            'front_end/SourcesPanel.js',
            'front_end/SourcesSearchScope.js',
            'front_end/StyleSheetOutlineDialog.js',
            'front_end/TabbedEditorContainer.js',
            'front_end/UISourceCodeFrame.js',
            'front_end/WatchExpressionsSidebarPane.js',
            'front_end/WorkersSidebarPane.js',
        ],
        'devtools_timeline_js_files': [
            'front_end/MemoryStatistics.js',
            'front_end/PieChart.js',
            'front_end/TimelineFrameController.js',
            'front_end/TimelineModel.js',
            'front_end/TimelinePresentationModel.js',
            'front_end/TimelineOverviewPane.js',
            'front_end/TimelineEventOverview.js',
            'front_end/TimelineFrameOverview.js',
            'front_end/TimelineMemoryOverview.js',
            'front_end/TimelineView.js',
            'front_end/TimelinePanel.js',
        ],
        'devtools_profiles_js_files': [
            'front_end/AllocationProfile.js',
            'front_end/BottomUpProfileDataGridTree.js',
            'front_end/CPUProfileView.js',
            'front_end/HeapSnapshot.js',
            'front_end/HeapSnapshotDataGrids.js',
            'front_end/HeapSnapshotGridNodes.js',
            'front_end/HeapSnapshotLoader.js',
            'front_end/HeapSnapshotProxy.js',
            'front_end/HeapSnapshotView.js',
            'front_end/HeapSnapshotWorkerDispatcher.js',
            'front_end/JSHeapSnapshot.js',
            'front_end/ProfileDataGridTree.js',
            'front_end/ProfilesPanel.js',
            'front_end/ProfileLauncherView.js',
            'front_end/TopDownProfileDataGridTree.js',
            'front_end/CanvasProfileView.js',
            'front_end/CanvasReplayStateView.js',
        ],
        'devtools_audits_js_files': [
            'front_end/AuditCategories.js',
            'front_end/AuditController.js',
            'front_end/AuditFormatters.js',
            'front_end/AuditLauncherView.js',
            'front_end/AuditResultView.js',
            'front_end/AuditRules.js',
            'front_end/AuditsPanel.js',
            'front_end/AuditsPanelDescriptor.js',
        ],
        'devtools_codemirror_js_files': [
            'front_end/CodeMirrorTextEditor.js',
            'front_end/CodeMirrorUtils.js',
        ],
        'devtools_cm_files': [
            'front_end/cm/clike.js',
            'front_end/cm/closebrackets.js',
            'front_end/cm/codemirror.js',
            'front_end/cm/coffeescript.js',
            'front_end/cm/comment.js',
            'front_end/cm/css.js',
            'front_end/cm/headlesscodemirror.js',
            'front_end/cm/htmlembedded.js',
            'front_end/cm/htmlmixed.js',
            'front_end/cm/javascript.js',
            'front_end/cm/markselection.js',
            'front_end/cm/matchbrackets.js',
            'front_end/cm/overlay.js',
            'front_end/cm/php.js',
            'front_end/cm/python.js',
            'front_end/cm/shell.js',
            'front_end/cm/xml.js',
        ],
        'devtools_modules_js_files': [
            '<@(devtools_elements_js_files)',
            '<@(devtools_resources_js_files)',
            '<@(devtools_network_js_files)',
            '<@(devtools_scripts_js_files)',
            '<@(devtools_timeline_js_files)',
            '<@(devtools_profiles_js_files)',
            '<@(devtools_audits_js_files)',
            '<@(devtools_layers_js_files)',
            '<@(devtools_codemirror_js_files)',
        ],
        'devtools_uglify_files': [
            'front_end/UglifyJS/parse-js.js',
        ],
        'devtools_image_files': [
            'front_end/Images/addIcon.png',
            'front_end/Images/applicationCache.png',
            'front_end/Images/back.png',
            'front_end/Images/breakpointBorder.png',
            'front_end/Images/breakpoint2.png',
            'front_end/Images/breakpoint2_2x.png',
            'front_end/Images/breakpointConditional2.png',
            'front_end/Images/breakpointConditional2_2x.png',
            'front_end/Images/breakpointConditionalBorder.png',
            'front_end/Images/breakpointConditionalCounterBorder.png',
            'front_end/Images/breakpointCounterBorder.png',
            'front_end/Images/checker.png',
            'front_end/Images/cookie.png',
            'front_end/Images/namedFlowOverflow.png',
            'front_end/Images/database.png',
            'front_end/Images/databaseTable.png',
            'front_end/Images/deleteIcon.png',
            'front_end/Images/domain.png',
            'front_end/Images/forward.png',
            'front_end/Images/fileSystem.png',
            'front_end/Images/frame.png',
            'front_end/Images/glossyHeader.png',
            'front_end/Images/glossyHeaderPressed.png',
            'front_end/Images/glossyHeaderSelected.png',
            'front_end/Images/glossyHeaderSelectedPressed.png',
            'front_end/Images/graphLabelCalloutLeft.png',
            'front_end/Images/graphLabelCalloutRight.png',
            'front_end/Images/indexedDB.png',
            'front_end/Images/indexedDBObjectStore.png',
            'front_end/Images/indexedDBIndex.png',
            'front_end/Images/localStorage.png',
            'front_end/Images/navigationControls.png',
            'front_end/Images/navigationControls_2x.png',
            'front_end/Images/paneAddButtons.png',
            'front_end/Images/paneElementStateButtons.png',
            'front_end/Images/paneFilterButtons.png',
            'front_end/Images/paneRefreshButtons.png',
            'front_end/Images/paneSettingsButtons.png',
            'front_end/Images/popoverArrows.png',
            'front_end/Images/popoverBackground.png',
            'front_end/Images/profileGroupIcon.png',
            'front_end/Images/profileIcon.png',
            'front_end/Images/profileSmallIcon.png',
            'front_end/Images/programCounterBorder.png',
            'front_end/Images/radioDot.png',
            'front_end/Images/regionEmpty.png',
            'front_end/Images/regionFit.png',
            'front_end/Images/regionOverset.png',
            'front_end/Images/resourceCSSIcon.png',
            'front_end/Images/resourceDocumentIcon.png',
            'front_end/Images/resourceDocumentIconSmall.png',
            'front_end/Images/resourceJSIcon.png',
            'front_end/Images/resourcePlainIcon.png',
            'front_end/Images/resourcePlainIconSmall.png',
            'front_end/Images/resourcesTimeGraphIcon.png',
            'front_end/Images/searchNext.png',
            'front_end/Images/searchPrev.png',
            'front_end/Images/sessionStorage.png',
            'front_end/Images/settingsListRemove.png',
            'front_end/Images/settingsListRemove_2x.png',
            'front_end/Images/spinner.gif',
            'front_end/Images/spinnerActive.gif',
            'front_end/Images/spinnerActiveSelected.gif',
            'front_end/Images/spinnerInactive.gif',
            'front_end/Images/spinnerInactiveSelected.gif',
            'front_end/Images/statusbarButtonGlyphs.png',
            'front_end/Images/statusbarButtonGlyphs2x.png',
            'front_end/Images/statusbarResizerHorizontal.png',
            'front_end/Images/statusbarResizerVertical.png',
            'front_end/Images/thumbActiveHoriz.png',
            'front_end/Images/thumbActiveVert.png',
            'front_end/Images/thumbHoriz.png',
            'front_end/Images/thumbVert.png',
            'front_end/Images/thumbHoverHoriz.png',
            'front_end/Images/thumbHoverVert.png',
            'front_end/Images/toolbarItemSelected.png',
            'front_end/Images/trackHoriz.png',
            'front_end/Images/trackVert.png',
        ],
        'devtools_layers_js_files': [
            'front_end/LayersPanel.js',
            'front_end/LayerTreeModel.js',
            'front_end/LayerTree.js',
            'front_end/Layers3DView.js',
            'front_end/LayerDetailsView.js',
            'front_end/PaintProfilerView.js',
        ],
        'devtools_extension_api_files': [
            'front_end/ExtensionAPI.js',
            'front_end/DevToolsExtensionAPI.js'
        ],
        'devtools_temp_storage_shared_worker_js_files': [
            'front_end/TempStorageSharedWorker.js',
        ],
    },
}
