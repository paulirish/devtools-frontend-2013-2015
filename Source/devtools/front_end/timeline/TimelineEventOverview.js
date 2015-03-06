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
 */
WebInspector.TimelineEventOverview = function(model)
{
    WebInspector.TimelineOverviewBase.call(this, model);
    this.element.id = "timeline-overview-events";

    this._fillStyles = {};
    var categories = WebInspector.TimelineUIUtils.categories();
    for (var category in categories) {
        this._fillStyles[category] = categories[category].fillColorStop1;
        categories[category].addEventListener(WebInspector.TimelineCategory.Events.VisibilityChanged, this._onCategoryVisibilityChanged, this);
    }

    this._disabledCategoryFillStyle = "hsl(0, 0%, 67%)";
}

/** @const */
WebInspector.TimelineEventOverview._stripHeight = 10;
/** @const */
WebInspector.TimelineEventOverview._maxNetworkStripHeight = 32;

WebInspector.TimelineEventOverview.prototype = {
    /**
     * @override
     */
    dispose: function()
    {
        var categories = WebInspector.TimelineUIUtils.categories();
        for (var category in categories)
            categories[category].removeEventListener(WebInspector.TimelineCategory.Events.VisibilityChanged, this._onCategoryVisibilityChanged, this);
    },

    /**
     * @override
     */
    update: function()
    {
        var /** @const */ padding = 2;
        this.resetCanvas();
        var threads = this._model.virtualThreads();
        var mainThreadEvents = this._model.mainThreadEvents();
        var estimatedHeight = padding + 3 * WebInspector.TimelineEventOverview._stripHeight;
        estimatedHeight += padding + WebInspector.TimelineEventOverview._maxNetworkStripHeight;
        this._canvas.height = estimatedHeight * window.devicePixelRatio;
        this._canvas.style.height = estimatedHeight + "px";
        var position = padding;
        if (Runtime.experiments.isEnabled("networkRequestsOnTimeline")) {
            position += this._drawNetwork(mainThreadEvents, position);
            position += padding;
        }
        this._drawEvents(mainThreadEvents, position);
        position += WebInspector.TimelineEventOverview._stripHeight;
        for (var thread of threads.filter(function(thread) { return !thread.isWorker(); }))
            this._drawEvents(thread.events, position);
        position += WebInspector.TimelineEventOverview._stripHeight;
        var workersHeight = 0;
        for (var thread of threads.filter(function(thread) { return thread.isWorker(); }))
            workersHeight = Math.max(workersHeight, this._drawEvents(thread.events, position));
        position += workersHeight;
        this.element.style.flexBasis = position + "px";
    },

    /**
     * @param {!Array.<!WebInspector.TracingModel.Event>} events
     * @param {number} position
     * @return {number}
     */
    _drawNetwork: function(events, position)
    {
        /**
         * @param {!Array.<!WebInspector.TracingModel.Event>} events
         * @return {number}
         */
        function calculateNetworkBandsCount(events)
        {
            var openBands = new Set();
            var maxBands = 0;
            for (var i = 0; i < events.length; ++i) {
                var e = events[i];
                switch (e.name) {
                case WebInspector.TimelineModel.RecordType.ResourceSendRequest:
                case WebInspector.TimelineModel.RecordType.ResourceReceiveResponse:
                case WebInspector.TimelineModel.RecordType.ResourceReceivedData:
                    var reqId = e.args["data"]["requestId"];
                    openBands.add(reqId);
                    maxBands = Math.max(maxBands, openBands.size);
                    break;
                case WebInspector.TimelineModel.RecordType.ResourceFinish:
                    var reqId = e.args["data"]["requestId"];
                    if (!openBands.has(reqId))
                        ++maxBands;
                    else
                        openBands.delete(reqId);
                    break;
                }
            }
            return maxBands;
        }

        var /** @const */ maxBandHeight = 4;
        var bandsCount = calculateNetworkBandsCount(events);
        var bandInterval = Math.min(maxBandHeight, WebInspector.TimelineEventOverview._maxNetworkStripHeight / (bandsCount || 1));
        var bandHeight = Math.ceil(bandInterval);
        var timeOffset = this._model.minimumRecordTime();
        var timeSpan = this._model.maximumRecordTime() - timeOffset;
        var scale = this._canvas.width / timeSpan;
        var loadingCategory = WebInspector.TimelineUIUtils.categories()["loading"];
        var waitingColor = loadingCategory.backgroundColor;
        var processingColor = loadingCategory.fillColorStop1;

        var bandsInUse = new Array(bandsCount);
        var freeBandsCount = bandsCount;
        var requestsInFlight = new Map();
        var lastBand = 0;

        /**
         * @constructor
         * @param {number} band
         * @param {number} lastTime
         * @param {boolean} gotResponse
         */
        function RequestInfo(band, lastTime, gotResponse)
        {
            this.band = band;
            this.lastTime = lastTime;
            this.gotResponse = gotResponse;
        }

        /**
         * @return {number}
         */
        function seizeBand()
        {
            console.assert(freeBandsCount);
            do {
                lastBand = (lastBand + 1) % bandsInUse.length;
            } while (bandsInUse[lastBand]);
            bandsInUse[lastBand] = true;
            --freeBandsCount;
            return lastBand;
        }

        /**
         * @param {number} band
         */
        function releaseBand(band)
        {
            bandsInUse[band] = false;
            ++freeBandsCount;
        }

        /**
         * @param {string} reqId
         * @param {number=} time
         * @return {!RequestInfo}
         */
        function getRequestInfo(reqId, time)
        {
            var reqInfo = requestsInFlight.get(reqId);
            if (!reqInfo) {
                reqInfo = new RequestInfo(seizeBand(), time || timeOffset, false);
                requestsInFlight.set(reqId, reqInfo);
            }
            return reqInfo;
        }

        /**
         * @param {string} reqId
         * @param {!RequestInfo} reqInfo
         * @param {number} time
         * @param {boolean=} finish
         * @this {WebInspector.TimelineEventOverview}
         */
        function advanceRequest(reqId, reqInfo, time, finish)
        {
            var band = reqInfo.band;
            var start = (reqInfo.lastTime - timeOffset) * scale;
            var end = (time - timeOffset) * scale;
            var color = reqInfo.gotResponse ? processingColor : waitingColor;
            if (finish) {
                releaseBand(band);
                requestsInFlight.delete(reqId);
            } else {
                reqInfo.lastTime = time;
                reqInfo.gotResponse = true;
            }
            this._renderBar(Math.floor(start), Math.ceil(end), Math.floor(position + band * bandInterval), bandHeight, color);
        }

        for (var i = 0; i < events.length; ++i) {
            var event = events[i];
            switch (event.name) {
            case WebInspector.TimelineModel.RecordType.ResourceSendRequest:
                var reqId = event.args["data"]["requestId"];
                getRequestInfo(reqId, event.startTime);
                break;
            case WebInspector.TimelineModel.RecordType.ResourceReceivedData:
            case WebInspector.TimelineModel.RecordType.ResourceReceiveResponse:
            case WebInspector.TimelineModel.RecordType.ResourceFinish:
                var reqId = event.args["data"]["requestId"];
                var reqInfo = getRequestInfo(reqId);
                var finish = event.name === WebInspector.TimelineModel.RecordType.ResourceFinish;
                advanceRequest.call(this, reqId, reqInfo, event.startTime, finish);
                break;
            }
        }

        for (var reqId of requestsInFlight.keys())
            advanceRequest.call(this, reqId, requestsInFlight.get(reqId), timeOffset + timeSpan);

        return Math.ceil(bandInterval * bandsCount);
    },

    /**
     * @param {!Array.<!WebInspector.TracingModel.Event>} events
     * @param {number} position
     * @return {number}
     */
    _drawEvents: function(events, position)
    {
        var /** @const */ padding = 1;
        var stripHeight = WebInspector.TimelineEventOverview._stripHeight;
        var visualHeight = stripHeight - padding;
        var timeOffset = this._model.minimumRecordTime();
        var timeSpan = this._model.maximumRecordTime() - timeOffset;
        var scale = this._canvas.width / timeSpan;
        var ditherer = new WebInspector.Dithering();
        var categoryStack = [];
        var lastX = 0;
        var drawn = false;

        /**
         * @param {!WebInspector.TimelineCategory} category
         * @return {string}
         * @this {WebInspector.TimelineEventOverview}
         */
        function categoryColor(category)
        {
            return category.hidden ? this._disabledCategoryFillStyle : this._fillStyles[category.name];
        }

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
                if (bar) {
                    this._renderBar(bar.start, bar.end, position, visualHeight, categoryColor.call(this, category));
                    drawn = true;
                }
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
            if (bar) {
                this._renderBar(bar.start, bar.end, position, visualHeight, categoryColor.call(this, category));
                drawn = true;
            }
            lastX = pos;
        }

        WebInspector.TimelineModel.forEachEvent(events, onEventStart.bind(this), onEventEnd.bind(this));
        return drawn ? stripHeight : 0;
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
