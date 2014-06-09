/*
 * Copyright (C) 2013 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @constructor
 * @param {!WebInspector.LayerTreeModel} model
 * @param {!WebInspector.Layers3DView} layers3DView
 * @extends {WebInspector.SplitView}
 */
WebInspector.PaintProfilerView = function(model, layers3DView)
{
    WebInspector.SplitView.call(this, true, false);
    this.element.classList.add("paint-profiler-view");
    this._logTreeView = new WebInspector.PaintProfilerCommandLogView();
    this._logTreeView.show(this.sidebarElement());
    this.addEventListener(WebInspector.SplitView.Events.SidebarSizeChanged, this.onResize, this);

    this._model = model;
    this._layers3DView = layers3DView;

    this._canvas = this.mainElement().createChild("canvas", "fill");
    this._context = this._canvas.getContext("2d");
    this._selectionWindow = new WebInspector.OverviewGrid.Window(this.mainElement(), this.mainElement());
    this._selectionWindow.addEventListener(WebInspector.OverviewGrid.Events.WindowChanged, this._onWindowChanged, this);

    this._innerBarWidth = 4 * window.devicePixelRatio;
    this._minBarHeight = 4 * window.devicePixelRatio;
    this._barPaddingWidth = 2 * window.devicePixelRatio;
    this._outerBarWidth = this._innerBarWidth + this._barPaddingWidth;

    this._reset();
}

WebInspector.PaintProfilerView.prototype = {
    onResize: function()
    {
        this._update();
    },

    _update: function()
    {
        this._canvas.width = this.mainElement().clientWidth * window.devicePixelRatio;
        this._canvas.height = this.mainElement().clientHeight * window.devicePixelRatio;
        this._samplesPerBar = 0;
        if (!this._profiles || !this._profiles.length)
            return;

        var maxBars = Math.floor((this._canvas.width - 2 * this._barPaddingWidth) / this._outerBarWidth);
        var sampleCount = this._profiles[0].length;
        this._samplesPerBar = Math.ceil(sampleCount / maxBars);
        var barCount = Math.floor(sampleCount / this._samplesPerBar);

        var maxBarTime = 0;
        var barTimes = [];
        for (var i = 0, lastBarIndex = 0, lastBarTime = 0; i < sampleCount;) {
            for (var row = 0; row < this._profiles.length; row++)
                lastBarTime += this._profiles[row][i];
            ++i;
            if (i - lastBarIndex == this._samplesPerBar || i == sampleCount) {
                // Normalize by total number of samples accumulated.
                lastBarTime /= this._profiles.length * (i - lastBarIndex);
                barTimes.push(lastBarTime);
                if (lastBarTime > maxBarTime)
                    maxBarTime = lastBarTime;
                lastBarTime = 0;
                lastBarIndex = i;
            }
        }
        const paddingHeight = 4 * window.devicePixelRatio;
        var scale = (this._canvas.height - paddingHeight - this._minBarHeight) / maxBarTime;
        this._context.fillStyle = "rgba(110, 180, 110, 0.7)";
        for (var i = 0; i < barTimes.length; ++i)
            this._renderBar(i, barTimes[i] * scale + this._minBarHeight);
    },

    /**
     * @param {number} index
     * @param {number} height
     */
    _renderBar: function(index, height)
    {
        var x = this._barPaddingWidth + index * this._outerBarWidth;
        var y = this._canvas.height - height;
        this._context.fillRect(x, y, this._innerBarWidth, height);
    },

    _onWindowChanged: function()
    {
        if (this._updateImageTimer)
            return;
        this._updateImageTimer = setTimeout(this._updateImage.bind(this), 100);
    },

    _updateImage: function()
    {
        delete this._updateImageTimer;
        if (!this._profiles || !this._profiles.length)
            return;

        var screenLeft = this._selectionWindow.windowLeft * this._canvas.width;
        var screenRight = this._selectionWindow.windowRight * this._canvas.width;

        var barLeft = Math.floor((screenLeft - this._barPaddingWidth) / this._outerBarWidth);
        var barRight = Math.floor((screenRight - this._barPaddingWidth + this._innerBarWidth)/ this._outerBarWidth);

        var stepLeft = Math.max(0, barLeft * this._samplesPerBar);
        var stepRight = Math.min(barRight * this._samplesPerBar, this._profiles[0].length);
        this._snapshot.requestImage(stepLeft, stepRight, this._layers3DView.showImageForLayer.bind(this._layers3DView, this._layer));
        this._logTreeView.updateLog(stepLeft, stepRight);
    },

    _reset: function()
    {
        this._snapshot = null;
        this._profiles = null;
        this._selectionWindow.reset();
    },

    /**
     * @param {!WebInspector.Layer} layer
     */
    profile: function(layer)
    {
        this._reset();
        this._layer = layer;
        this._layer.requestSnapshot(onSnapshotDone.bind(this));

        /**
         * @param {!WebInspector.PaintProfilerSnapshot=} snapshot
         * @this {WebInspector.PaintProfilerView}
         */
        function onSnapshotDone(snapshot)
        {
            this._snapshot = snapshot;
            if (!snapshot) {
                this._profiles = null;
                this._update();
                return;
            }
            snapshot.requestImage(null, null, this._layers3DView.showImageForLayer.bind(this._layers3DView, this._layer));
            var barrier = new CallbackBarrier();
            snapshot.profile(barrier.createCallback(onProfileDone.bind(this)));
            snapshot.commandLog(barrier.createCallback(onCommandLogDone.bind(this)));
            barrier.callWhenDone(this._update.bind(this));
        }

        /**
         * @param {!Array.<!LayerTreeAgent.PaintProfile>=} profiles
         * @this {WebInspector.PaintProfilerView}
         */
        function onProfileDone(profiles)
        {
            this._profiles = profiles;
        }

        /**
         * @param {!Array.<!Object>=} log
         * @this {WebInspector.PaintProfilerView}
         */
        function onCommandLogDone(log)
        {
            this._logTreeView.setLog(log);
            this._logTreeView.updateLog();
        }
    },

    __proto__: WebInspector.SplitView.prototype
};

/**
 * @constructor
 * @extends {WebInspector.VBox}
 */
WebInspector.PaintProfilerCommandLogView = function()
{
    WebInspector.VBox.call(this);
    this.setMinimumSize(100, 25);
    this.element.classList.add("outline-disclosure");
    var sidebarTreeElement = this.element.createChild("ol", "sidebar-tree");
    this.sidebarTree = new TreeOutline(sidebarTreeElement);

    this._log = [];
}

WebInspector.PaintProfilerCommandLogView.prototype = {
    setLog: function(log)
    {
        this._log = log;
    },

    /**
     * @param {number=} stepLeft
     * @param {number=} stepRight
     */
    updateLog: function(stepLeft, stepRight)
    {
        var log = this._log;
        stepLeft = stepLeft || 0;
        stepRight = stepRight || log.length - 1;
        this.sidebarTree.removeChildren();
        for (var i = stepLeft; i <= stepRight; ++i) {
            var node = new WebInspector.LogTreeElement(log[i]);
            this.sidebarTree.appendChild(node);
        }
    },

    __proto__: WebInspector.VBox.prototype
};

/**
  * @constructor
  * @param {!Object} logItem
  * @extends {TreeElement}
  */
WebInspector.LogTreeElement = function(logItem)
{
    TreeElement.call(this, "", logItem);
    this._update();
}

WebInspector.LogTreeElement.prototype = {
    /**
      * @param {!Object} param
      * @param {string} name
      * @return {string}
      */
    _paramToString: function(param, name)
    {
        if (typeof param !== "object")
            return typeof param === "string" && param.length > 100 ? name : JSON.stringify(param);
        var str = "";
        var keyCount = 0;
        for (var key in param) {
            if (++keyCount > 4 || typeof param[key] === "object" || (typeof param[key] === "string" && param[key].length > 100))
                return name;
            if (str)
                str += ", ";
            str += param[key];
        }
        return str;
    },

    /**
      * @param {!Object} params
      * @return {string}
      */
    _paramsToString: function(params)
    {
        var str = "";
        for (var key in params) {
            if (str)
                str += ", ";
            str += this._paramToString(params[key], key);
        }
        return str;
    },

    _update: function()
    {
        var logItem = this.representedObject;
        var title = document.createDocumentFragment();
        title.createChild("div", "selection");
        var textContent = logItem.method;
        if (logItem.params)
            textContent += "(" + this._paramsToString(logItem.params) + ")";
        title.appendChild(document.createTextNode(textContent));
        this.title = title;
    },

    /**
     * @param {boolean} hovered
     */
    setHovered: function(hovered)
    {
        this.listItemElement.classList.toggle("hovered", hovered);
    },

    __proto__: TreeElement.prototype
};
