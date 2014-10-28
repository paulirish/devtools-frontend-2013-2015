// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @interface
 */
WebInspector.ToolboxHost = function() {}

WebInspector.ToolboxHost.prototype = {
    /**
     * @param {!Document} document
     */
    toolboxLoaded: function(document) {}
}