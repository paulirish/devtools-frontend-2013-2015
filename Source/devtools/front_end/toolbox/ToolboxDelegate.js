// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @interface
 */
WebInspector.ToolboxDelegate = function() {}

WebInspector.ToolboxDelegate.prototype = {
    /**
     * @param {!Element} rootElement
     */
    toolboxLoaded: function(rootElement) {},

    /**
     * @return {!InspectorFrontendHostAPI}
     */
    inspectorFrontendHost: function() {}
}
