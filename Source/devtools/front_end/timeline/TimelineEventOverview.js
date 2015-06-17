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
 * @extends {WebInspector.TimelineOverviewBase}
 * @param {!WebInspector.TimelineModel} model
 * @param {!WebInspector.TimelineFrameModelBase} frameModel
 */
WebInspector.TimelineEventOverview = function(model, frameModel)
{
    WebInspector.TimelineOverviewBase.call(this);
    this.element.id = "timeline-overview-events";
    this._model = model;
    this._frameModel = frameModel;

    this._fillStyles = {};
    var categories = WebInspector.TimelineUIUtils.categories();
    for (var category in categories) {
        this._fillStyles[category] = categories[category].fillColorStop1;
        categories[category].addEventListener(WebInspector.TimelineCategory.Events.VisibilityChanged, this._onCategoryVisibilityChanged, this);
    }

    this._disabledCategoryFillStyle = "hsl(0, 0%, 67%)";
}

/** @const */
WebInspector.TimelineEventOverview._fullStripHeight = 20;
/** @const */
WebInspector.TimelineEventOverview._smallStripHeight = 8;

WebInspector.TimelineEventOverview.prototype = {
    /**
     * @override
     */
    dispose: function()
    {
        WebInspector.TimelineOverviewBase.prototype.dispose.call(this);
        var categories = WebInspector.TimelineUIUtils.categories();
        for (var category in categories)
            categories[category].removeEventListener(WebInspector.TimelineCategory.Events.VisibilityChanged, this._onCategoryVisibilityChanged, this);
    },

    /**
     * @override
     */
    update: function()
    {
        this.resetCanvas();
        var threads = this._model.virtualThreads();
        var mainThreadEvents = this._model.mainThreadEvents();
        var networkHeight = this._canvas.clientHeight
            - 2 * WebInspector.TimelineEventOverview._fullStripHeight
            - 2 * WebInspector.TimelineEventOverview._smallStripHeight;
        var position = 0;
        if (Runtime.experiments.isEnabled("inputEventsOnTimelineOverview")) {
            var inputHeight = this._drawInputEvents(mainThreadEvents, position, WebInspector.TimelineEventOverview._smallStripHeight);
            position += inputHeight;
            networkHeight -= inputHeight;
        }
        position += this._drawNetwork(mainThreadEvents, position, networkHeight);
        position += this._drawStackedUtilizationChart(mainThreadEvents, position, WebInspector.TimelineEventOverview._fullStripHeight);
        for (var thread of threads.filter(function(thread) { return !thread.isWorker(); }))
            this._drawEvents(thread.events, position, WebInspector.TimelineEventOverview._smallStripHeight);
        position += WebInspector.TimelineEventOverview._smallStripHeight;
        for (var thread of threads.filter(function(thread) { return thread.isWorker(); }))
            this._drawEvents(thread.events, position, WebInspector.TimelineEventOverview._smallStripHeight);
        position += WebInspector.TimelineEventOverview._smallStripHeight;
        position += this._drawFrames(position, WebInspector.TimelineEventOverview._fullStripHeight);
        console.assert(position === this._canvas.clientHeight);
    },

    /**
     * @param {!Array.<!WebInspector.TracingModel.Event>} events
     * @param {number} position
     * @param {number} height
     * @return {number}
     */
    _drawInputEvents: function(events, position, height)
    {
        var /** @const */ padding = 1;
        var descriptors = WebInspector.TimelineUIUtils.eventDispatchDesciptors();
        /** @type {!Map.<string,!WebInspector.TimelineUIUtils.EventDispatchTypeDescriptor>} */
        var descriptorsByType = new Map();
        var maxPriority = -1;
        for (var descriptor of descriptors) {
            for (var type of descriptor.eventTypes)
                descriptorsByType.set(type, descriptor);
            maxPriority = Math.max(maxPriority, descriptor.priority);
        }

        var /** @const */ minWidth = 2 * window.devicePixelRatio;
        var stripHeight = height - padding;
        var timeOffset = this._model.minimumRecordTime();
        var timeSpan = this._model.maximumRecordTime() - timeOffset;
        var canvasWidth = this._canvas.width;
        var scale = canvasWidth / timeSpan;

        for (var priority = 0; priority <= maxPriority; ++priority) {
            for (var i = 0; i < events.length; ++i) {
                var event = events[i];
                if (event.name !== WebInspector.TimelineModel.RecordType.EventDispatch)
                    continue;
                var descriptor = descriptorsByType.get(event.args["data"]["type"]);
                if (!descriptor || descriptor.priority !== priority)
                    continue;
                var start = Number.constrain(Math.floor((event.startTime - timeOffset) * scale), 0, canvasWidth);
                var end = Number.constrain(Math.ceil((event.endTime - timeOffset) * scale), 0, canvasWidth);
                var width = Math.max(end - start, minWidth);
                this._renderBar(start, start + width, position + padding, stripHeight, descriptor.color);
            }
        }

        return height;
    },

    /**
     * @param {!Array.<!WebInspector.TracingModel.Event>} events
     * @param {number} position
     * @param {number} height
     * @return {number}
     */
    _drawNetwork: function(events, position, height)
    {
        var /** @const */ padding = 1;
        var /** @const */ maxBandHeight = 4;
        position += padding;
        var bandsCount = WebInspector.TimelineUIUtils.calculateNetworkBandsCount(events);
        var bandInterval = Math.min(maxBandHeight, (height - padding) / (bandsCount || 1));
        var bandHeight = Math.ceil(bandInterval);
        var timeOffset = this._model.minimumRecordTime();
        var timeSpan = this._model.maximumRecordTime() - timeOffset;
        var canvasWidth = this._canvas.width;
        var scale = canvasWidth / timeSpan;
        var loadingCategory = WebInspector.TimelineUIUtils.categories()["loading"];
        var waitingColor = loadingCategory.backgroundColor;
        var processingColor = loadingCategory.fillColorStop1;

        /**
         * @param {number} band
         * @param {number} startTime
         * @param {number} endTime
         * @param {?WebInspector.TracingModel.Event} event
         * @this {WebInspector.TimelineEventOverview}
         */
        function drawBar(band, startTime, endTime, event)
        {
            var start = Number.constrain((startTime - timeOffset) * scale, 0, canvasWidth);
            var end = Number.constrain((endTime - timeOffset) * scale, 0, canvasWidth);
            var color = !event ||
                event.name === WebInspector.TimelineModel.RecordType.ResourceReceiveResponse ||
                event.name === WebInspector.TimelineModel.RecordType.ResourceSendRequest ? waitingColor : processingColor;
            this._renderBar(Math.floor(start), Math.ceil(end), Math.floor(position + band * bandInterval), bandHeight, color);
        }

        WebInspector.TimelineUIUtils.iterateNetworkRequestsInRoundRobin(events, bandsCount, drawBar.bind(this));
        return height;
    },

    /**
     * @param {!Array.<!WebInspector.TracingModel.Event>} events
     * @param {number} position
     * @param {number} height
     * @return {number}
     */
    _drawStackedUtilizationChart: function(events, position, height)
    {
        var /** @const */ quantSizePx = 4 * window.devicePixelRatio;
        var /** @const */ padding = 1;
        var visualHeight = (height - padding) * window.devicePixelRatio;
        var baseLine = (position + height) * window.devicePixelRatio;
        var timeOffset = this._model.minimumRecordTime();
        var timeSpan = this._model.maximumRecordTime() - timeOffset;
        var scale = this._canvas.width / timeSpan;
        var quantTime = quantSizePx / scale;
        var quantizer = new WebInspector.Quantizer(timeOffset, quantTime, drawSample.bind(this));
        var ctx = this._context;
        var x = 0;
        var categories = WebInspector.TimelineUIUtils.categories();
        var categoryOrder = ["idle", "scripting", "rendering", "painting", "loading", "other"];
        var otherIndex = categoryOrder.indexOf("other");
        var idleIndex = 0;
        console.assert(idleIndex === categoryOrder.indexOf("idle"));
        for (var i = idleIndex + 1; i < categoryOrder.length; ++i)
            categories[categoryOrder[i]]._overviewIndex = i;
        var categoryIndexStack = [];

        /**
         * @param {!Array<number>} counters
         * @this {WebInspector.TimelineEventOverview}
         */
        function drawSample(counters)
        {
            var y = baseLine;
            for (var i = idleIndex + 1; i < counters.length; ++i) {
                if (!counters[i])
                    continue;
                var h = counters[i] / quantTime * visualHeight;
                ctx.fillStyle = this._categoryColor(categories[categoryOrder[i]]);
                ctx.fillRect(x, y - h, quantSizePx, h);
                y -= h;
            }
            x += quantSizePx;
        }

        /**
         * @param {!WebInspector.TracingModel.Event} e
         */
        function onEventStart(e)
        {
            var index = categoryIndexStack.length ? categoryIndexStack.peekLast() : idleIndex;
            quantizer.appendInterval(e.startTime, index);
            categoryIndexStack.push(WebInspector.TimelineUIUtils.eventStyle(e).category._overviewIndex || otherIndex);
        }

        /**
         * @param {!WebInspector.TracingModel.Event} e
         */
        function onEventEnd(e)
        {
            quantizer.appendInterval(e.endTime, categoryIndexStack.pop());
        }

        WebInspector.TimelineModel.forEachEvent(events, onEventStart, onEventEnd);
        quantizer.appendInterval(timeOffset + timeSpan + quantTime, idleIndex);  // Kick drawing the last bucket.
        return height;
    },

    /**
     * @param {!Array.<!WebInspector.TracingModel.Event>} events
     * @param {number} position
     * @param {number} stripHeight
     * @return {number}
     */
    _drawEvents: function(events, position, stripHeight)
    {
        var /** @const */ padding = 1;
        var visualHeight = stripHeight - padding;
        var timeOffset = this._model.minimumRecordTime();
        var timeSpan = this._model.maximumRecordTime() - timeOffset;
        var scale = this._canvas.width / timeSpan;
        var ditherer = new WebInspector.Dithering();
        var categoryStack = [];
        var lastX = 0;
        position += padding;

        /**
         * @param {!WebInspector.TracingModel.Event} e
         * @this {WebInspector.TimelineEventOverview}
         */
        function onEventStart(e)
        {
            var pos = (e.startTime - timeOffset) * scale;
            if (categoryStack.length) {
                var category = categoryStack.peekLast();
                var bar = ditherer.appendInterval(category, lastX, pos);
                if (bar)
                    this._renderBar(bar.start, bar.end, position, visualHeight, this._categoryColor(category));
            }
            categoryStack.push(WebInspector.TimelineUIUtils.eventStyle(e).category);
            lastX = pos;
        }

        /**
         * @param {!WebInspector.TracingModel.Event} e
         * @this {WebInspector.TimelineEventOverview}
         */
        function onEventEnd(e)
        {
            var category = categoryStack.pop();
            var pos = (e.endTime - timeOffset) * scale;
            var bar = ditherer.appendInterval(category, lastX, pos);
            if (bar)
                this._renderBar(bar.start, bar.end, position, visualHeight, this._categoryColor(category));
            lastX = pos;
        }

        WebInspector.TimelineModel.forEachEvent(events, onEventStart.bind(this), onEventEnd.bind(this));
        return stripHeight;
    },

    /**
     * @param {!WebInspector.TimelineCategory} category
     * @return {string}
     */
    _categoryColor: function(category)
    {
        return category.hidden ? this._disabledCategoryFillStyle : this._fillStyles[category.name];
    },

    /**
     * @param {number} position
     * @param {number} height
     * @return {number}
     */
    _drawFrames: function(position, height)
    {
        var /** @const */ padding = 2;
        var /** @const */ baseFrameDurationMs = 1e3 / 60;
        var visualHeight = (height - padding) * window.devicePixelRatio;
        var timeOffset = this._model.minimumRecordTime();
        var timeSpan = this._model.maximumRecordTime() - timeOffset;
        var scale = this._canvas.width / timeSpan;
        var frames = this._frameModel.frames();
        var baseY = (position + height) * window.devicePixelRatio;
        var y = baseY + 10;
        var ctx = this._context;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, position * window.devicePixelRatio, this._canvas.width, height * window.devicePixelRatio);
        ctx.clip();
        ctx.beginPath();
        ctx.lineWidth = 1 * window.devicePixelRatio;
        ctx.strokeStyle = "hsl(110, 50%, 60%)";
        ctx.fillStyle = "hsl(110, 50%, 88%)";
        ctx.moveTo(0, y);
        for (var i = 0; i < frames.length; ++i) {
            var frame = frames[i];
            var x = Math.round((frame.startTime - timeOffset) * scale) + 0.5;
            ctx.lineTo(x, y);
            ctx.lineTo(x, y + 1.5);
            y = frame.idle ? baseY + 0.5 : Math.round(baseY - visualHeight * Math.min(baseFrameDurationMs / frame.duration, 1)) - 0.5;
            ctx.lineTo(x, y + 1.5);
            ctx.lineTo(x, y);
        }
        if (frames.length) {
            var lastFrame = frames.peekLast();
            var x = Math.round((lastFrame.startTime + lastFrame.duration - timeOffset) * scale) + 0.5;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(x, baseY + 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        return height;
    },

    _onCategoryVisibilityChanged: function()
    {
        this.update();
    },

    /**
     * @param {number} begin
     * @param {number} end
     * @param {number} position
     * @param {number} height
     * @param {string} color
     */
    _renderBar: function(begin, end, position, height, color)
    {
        var x = begin;
        var y = position * window.devicePixelRatio;
        var width = end - begin;
        this._context.fillStyle = color;
        this._context.fillRect(x, y, width, height * window.devicePixelRatio);
    },

    /**
     * @override
     * @param {number} windowLeft
     * @param {number} windowRight
     * @return {!{startTime: number, endTime: number}}
     */
    windowTimes: function(windowLeft, windowRight)
    {
        var absoluteMin = this._model.minimumRecordTime();
        var timeSpan = this._model.maximumRecordTime() - absoluteMin;
        return {
            startTime: absoluteMin + timeSpan * windowLeft,
            endTime: absoluteMin + timeSpan * windowRight
        };
    },

    /**
     * @override
     * @param {number} startTime
     * @param {number} endTime
     * @return {!{left: number, right: number}}
     */
    windowBoundaries: function(startTime, endTime)
    {
        var absoluteMin = this._model.minimumRecordTime();
        var timeSpan = this._model.maximumRecordTime() - absoluteMin;
        var haveRecords = absoluteMin > 0;
        return {
            left: haveRecords && startTime ? Math.min((startTime - absoluteMin) / timeSpan, 1) : 0,
            right: haveRecords && endTime < Infinity ? (endTime - absoluteMin) / timeSpan : 1
        };
    },

    __proto__: WebInspector.TimelineOverviewBase.prototype
}

/**
 * @constructor
 * @template T
 */
WebInspector.Dithering = function()
{
    /** @type {!Map.<?T,number>} */
    this._groupError = new Map();
    this._position = 0;
    this._lastReportedPosition = 0;
}

WebInspector.Dithering.prototype = {
    /**
     * @param {!T} group
     * @param {number} start
     * @param {number} end
     * @return {?{start: number, end: number}}
     * @template T
     */
    appendInterval: function(group, start, end)
    {
        this._innerAppend(null, start); // Append an empty space before.
        return this._innerAppend(group, end); // Append the interval itself.
    },

    /**
     * @param {?T} group
     * @param {number} position
     * @return {?{start: number, end: number}}
     * @template T
     */
    _innerAppend: function(group, position)
    {
        if (position < this._position)
            return null;
        var result = null;
        var length = position - this._position;
        length += this._groupError.get(group) || 0;
        if (length >= 1) {
            if (!group)
                length -= this._distributeExtraAmount(length - 1);
            var newReportedPosition = this._lastReportedPosition + Math.floor(length);
            result = { start: this._lastReportedPosition, end: newReportedPosition };
            this._lastReportedPosition = newReportedPosition;
            length %= 1;
        }
        this._groupError.set(group, length);
        this._position = position;
        return result;
    },

    /**
     * @param {number} amount
     * @return {number}
     */
    _distributeExtraAmount: function(amount)
    {
        var canConsume = 0;
        for (var g of this._groupError.keys()) {
            if (g)
                canConsume += 1 - this._groupError.get(g);
        }
        var toDistribute = Math.min(amount, canConsume);
        if (toDistribute <= 0)
            return 0;
        var ratio = toDistribute / canConsume;
        for (var g of this._groupError.keys()) {
            if (!g)
                continue;
            var value = this._groupError.get(g);
            value += (1 - value) * ratio;
            this._groupError.set(g, value);
        }
        return toDistribute;
    }
}

/**
 * @constructor
 * @param {number} startTime
 * @param {number} quantDuration
 * @param {function(!Array<number>)} callback
 */
WebInspector.Quantizer = function(startTime, quantDuration, callback)
{
    this._lastTime = startTime;
    this._quantDuration = quantDuration;
    this._callback = callback;
    this._counters = [];
    this._remainder = quantDuration;
}

WebInspector.Quantizer.prototype = {
    /**
     * @param {number} time
     * @param {number} group
     */
    appendInterval: function(time, group)
    {
        var interval = time - this._lastTime;
        if (interval <= this._remainder) {
            this._counters[group] = (this._counters[group] || 0) + interval;
            this._remainder -= interval;
            this._lastTime = time;
            return;
        }
        this._counters[group] = (this._counters[group] || 0) + this._remainder;
        this._callback(this._counters);
        interval -= this._remainder;
        while (interval >= this._quantDuration) {
            var counters = [];
            counters[group] = this._quantDuration;
            this._callback(counters);
            interval -= this._quantDuration;
        }
        this._counters = [];
        this._counters[group] = interval;
        this._lastTime = time;
        this._remainder = this._quantDuration - interval;
    }
}
