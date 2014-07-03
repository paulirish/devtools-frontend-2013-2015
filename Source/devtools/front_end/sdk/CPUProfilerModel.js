/*
 * Copyright (C) 2014 Google Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 * 1. Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY GOOGLE INC. AND ITS CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL GOOGLE INC.
 * OR ITS CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @constructor
 * @extends {WebInspector.SDKObject}
 * @param {!WebInspector.Target} target
 * @implements {ProfilerAgent.Dispatcher}
 */
WebInspector.CPUProfilerModel = function(target)
{
    WebInspector.SDKObject.call(this, target);
    this._isRecording = false;
    target.registerProfilerDispatcher(this);
    target.profilerAgent().enable();
}

WebInspector.CPUProfilerModel.EventTypes = {
    ProfileStarted: "ProfileStarted",
    ProfileStopped: "ProfileStopped",
    ConsoleProfileStarted: "ConsoleProfileStarted",
    ConsoleProfileFinished: "ConsoleProfileFinished"
};

WebInspector.CPUProfilerModel.prototype = {
    /**
     * @param {string} id
     * @param {!DebuggerAgent.Location} scriptLocation
     * @param {!ProfilerAgent.CPUProfile} cpuProfile
     * @param {string=} title
     */
    consoleProfileFinished: function(id, scriptLocation, cpuProfile, title)
    {
        // Make sure ProfilesPanel is initialized and CPUProfileType is created.
        WebInspector.moduleManager.loadModule("profiler");
        var debuggerLocation = WebInspector.DebuggerModel.Location.fromPayload(this.target(), scriptLocation);
        this.dispatchEventToListeners(WebInspector.CPUProfilerModel.EventTypes.ConsoleProfileFinished, {protocolId: id, scriptLocation: debuggerLocation, cpuProfile: cpuProfile, title: title});
    },

    /**
     * @param {string} id
     * @param {!DebuggerAgent.Location} scriptLocation
     * @param {string=} title
     */
    consoleProfileStarted: function(id, scriptLocation, title)
    {
        // Make sure ProfilesPanel is initialized and CPUProfileType is created.
        WebInspector.moduleManager.loadModule("profiler");
        var debuggerLocation = WebInspector.DebuggerModel.Location.fromPayload(this.target(), scriptLocation)
        this.dispatchEventToListeners(WebInspector.CPUProfilerModel.EventTypes.ConsoleProfileStarted, {protocolId: id, scriptLocation: debuggerLocation, title: title});
    },

    /**
      * @return {boolean}
      */
    isRecordingProfile: function()
    {
        return this._isRecording;
    },

    startRecording: function()
    {
        this._isRecording = true;
        this.target().profilerAgent().start();
        this.dispatchEventToListeners(WebInspector.CPUProfilerModel.EventTypes.ProfileStarted);
        WebInspector.userMetrics.ProfilesCPUProfileTaken.record();
    },

    /**
     * @param {!function(?string,?ProfilerAgent.CPUProfile)} callback
     */
    stopRecording: function(callback)
    {
        this._isRecording = false;
        this.target().profilerAgent().stop(callback);
        this.dispatchEventToListeners(WebInspector.CPUProfilerModel.EventTypes.ProfileStopped);
    },

    __proto__: WebInspector.SDKObject.prototype
}

/**
 * @type {!WebInspector.CPUProfilerModel}
 */
WebInspector.cpuProfilerModel;
