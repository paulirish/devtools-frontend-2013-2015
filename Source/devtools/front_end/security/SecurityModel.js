// Copyright 2015 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @constructor
 * @extends {WebInspector.SDKModel}
 * @param {!WebInspector.Target} target
 */
WebInspector.SecurityModel = function(target)
{
    WebInspector.SDKModel.call(this, WebInspector.SecurityModel, target);
    this._dispatcher = new WebInspector.SecurityDispatcher(this);
    this._securityAgent = target.securityAgent();
    target.registerSecurityDispatcher(this._dispatcher);
    this._securityAgent.enable();

    this._securityState = SecurityAgent.SecurityState.Unknown;
}

WebInspector.SecurityModel.EventTypes = {
    SecurityStateChanged: "SecurityStateChanged"
}

WebInspector.SecurityModel.prototype = {
    /**
     * @return {!SecurityAgent.SecurityState} securityState
     */
    securityState: function()
    {
        return /** @type {!SecurityAgent.SecurityState} */ (this._securityState);
    },

    __proto__: WebInspector.SDKModel.prototype
}

/**
 * @param {!WebInspector.Target} target
 * @return {?WebInspector.SecurityModel}
 */
WebInspector.SecurityModel.fromTarget = function(target)
{
    var model = /** @type {?WebInspector.SecurityModel} */ (target.model(WebInspector.SecurityModel));
    if (!model)
        model = new WebInspector.SecurityModel(target);
    return model;
}

/**
 * @constructor
 * @implements {SecurityAgent.Dispatcher}
 */
WebInspector.SecurityDispatcher = function(model)
{
    this._model = model;
}

WebInspector.SecurityDispatcher.prototype = {
    /**
     * @override
     * @param {!SecurityAgent.SecurityState} securityState
     * @param {!Array<!SecurityAgent.SecurityStateExplanation>=} explanations
     * @param {!SecurityAgent.MixedContentStatus=} mixedContentStatus
     * @param {boolean=} schemeIsCryptographic
     */
    securityStateChanged: function(securityState, explanations, mixedContentStatus, schemeIsCryptographic)
    {
        var data = {"securityState": securityState, "explanations": explanations || []};
        if (schemeIsCryptographic && mixedContentStatus) {
            if (mixedContentStatus.ranInsecureContent) {
                explanations.push({
                    "securityState": mixedContentStatus.ranInsecureContentStyle,
                    "summary": WebInspector.UIString("Active Mixed Content"),
                    "description": WebInspector.UIString("You have recently allowed insecure content (such as scripts or iframes) to run on this site.")
                });
            } else if (mixedContentStatus.displayedInsecureContent) {
                explanations.push({
                    "securityState": mixedContentStatus.displayedInsecureContentStyle,
                    "summary": WebInspector.UIString("Mixed Content"),
                    "description": WebInspector.UIString("The site includes HTTP resources.")
                });
            }
        }
        this._model.dispatchEventToListeners(WebInspector.SecurityModel.EventTypes.SecurityStateChanged, data);
    }
}