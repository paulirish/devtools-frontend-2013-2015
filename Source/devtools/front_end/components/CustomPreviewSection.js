// Copyright 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @constructor
 * @param {!WebInspector.RemoteObject} object
 */
WebInspector.CustomPreviewSection = function(object)
{
    this._sectionElement = createElementWithClass("span", "custom-expandable-section");
    this._object = object;
    this._expanded = false;
    this._cachedContent = null;
    var customPreview = object.customPreview();

    try {
        var headerJSON = JSON.parse(customPreview.header);
    } catch (e) {
        WebInspector.console.error("Broken formatter: header is invalid json " + e);
        return;
    }
    this._header = this._renderJSONMLTag(headerJSON);
    if (customPreview.hasBody) {
        this._header.classList.add("custom-expandable-section-header");
        this._header.addEventListener("click", this._onClick.bind(this), false);
    }

    this._sectionElement.appendChild(this._header);
}

/**
 * @constructor
 * @param {!WebInspector.RemoteObject} object
 * @return {!Element}
 */
WebInspector.CustomPreviewSection.createInShadow = function(object)
{
    var customPreviewSection = new WebInspector.CustomPreviewSection(object);
    var element = WebInspector.CustomPreviewSection._createComponentRoot();
    var shadowRoot = element.createShadowRoot();
    shadowRoot.appendChild(WebInspector.View.createStyleElement("components/customPreviewSection.css"));
    shadowRoot.appendChild(customPreviewSection.element());
    return element;
}

/**
 * @return {!Element}
 */
WebInspector.CustomPreviewSection._createComponentRoot = function()
{
    var element = createElement("span");
    WebInspector.installComponentRootStyles(element);
    element.classList.add("source-code");
    return element;
}

WebInspector.CustomPreviewSection._tagsWhiteList = new Set(["span", "div", "ol", "li","table", "tr", "td"]);

WebInspector.CustomPreviewSection._attributes = [
    "background-color",
    "color",
    "font-style", "font-weight",
    "list-style-type",
    "margin", "margin-top", "margin-right", "margin-bottom", "margin-left",
    "padding", "padding-top", "padding-right", "padding-bottom", "padding-left",
    "text-align"];

WebInspector.CustomPreviewSection._attributesWhiteList = new Set(WebInspector.CustomPreviewSection._attributes);

WebInspector.CustomPreviewSection.prototype = {

    /**
     * @return {!Element}
     */
    element: function()
    {
        return this._sectionElement;
    },

    /**
     * @param {string} style
     * @return {boolean}
     */
    _validateStyleAttributes: function(style)
    {
        var valueRegEx = /^[\w\s()-,.#]*$/;
        var styleAttributes = style.split(";");
        for (var i = 0; i < styleAttributes.length; ++i) {
            var attribute = styleAttributes[i].trim();
            if (!attribute.length)
                continue;

            var pair = attribute.split(":");
            if (pair.length != 2) {
                WebInspector.console.error("Broken formatter: " + styleAttributes[i]);
                return false;
            }

            var key = pair[0].trim();
            var value = pair[1];
            if (!WebInspector.CustomPreviewSection._attributesWhiteList.has(key)) {
                WebInspector.console.error("Broken formatter: style attribute " + key + " is not allowed!");
                return false;
            }
            if (!value.match(valueRegEx)) {
                WebInspector.console.error("Broken formatter: style attribute value" + value + " is not allowed!");
                return false;
            }

        }
        return true;
    },

    /**
     * @param {*} jsonML
     * @return {!Node}
     */
    _renderJSONMLTag: function(jsonML)
    {
        if (!Array.isArray(jsonML))
            return createTextNode(jsonML + "");

        var array = /** @type {!Array.<*>} */(jsonML);
        if (array[0] === "object")
            return this._layoutObjectTag(array);
        else
            return this._renderElement(array);
    },

    /**
     *
     * @param {!Array.<*>} object
     * @return {!Node}
     */
    _renderElement: function(object)
    {
        var tagName = object.shift();
        if (!WebInspector.CustomPreviewSection._tagsWhiteList.has(tagName)) {
            WebInspector.console.error("Broken formatter: element " + tagName + " is not allowed!");
            return createElement("span");
        }
        var element = createElement(/** @type {string} */ (tagName));
        if ((typeof object[0] == "object") && !Array.isArray(object[0])) {
            var attributes = object.shift();
            for (var key in attributes) {
                var value = attributes[key];
                if ((key !== "style") || (typeof value !== "string") || !this._validateStyleAttributes(value))
                    continue;

                element.setAttribute(key, value);
            }
        }

        this._appendJsonMLTags(element, object);
        return element;
    },

    /**
     * @param {!Array.<*>} objectTag
     * @return {!Node}
     */
    _layoutObjectTag: function(objectTag)
    {
        objectTag.shift();
        var attributes = objectTag.shift();
        var remoteObject = this._object.target().runtimeModel.createRemoteObject(/** @type {!RuntimeAgent.RemoteObject} */ (attributes));
        if (remoteObject.customPreview())
            return (new WebInspector.CustomPreviewSection(remoteObject)).element();

        var header = createElement("span");
        var componentRoot = WebInspector.CustomPreviewSection._createComponentRoot();
        header.appendChild(componentRoot);
        var shadowRoot = componentRoot.createShadowRoot();
        shadowRoot.appendChild(WebInspector.View.createStyleElement("components/objectValue.css"));
        shadowRoot.appendChild(WebInspector.ObjectPropertiesSection.createValueElement(remoteObject, false));
        if (!remoteObject.hasChildren)
            return header;

        var objectPropertiesSection = new WebInspector.ObjectPropertiesSection(remoteObject, header);
        var sectionElement = objectPropertiesSection.element;
        sectionElement.classList.add("custom-expandable-section-standard-section");
        return sectionElement;
    },

    /**
     * @param {!Node} parentElement
     * @param {!Array.<*>} jsonMLTags
     */
    _appendJsonMLTags: function(parentElement, jsonMLTags)
    {
        for (var i = 0; i < jsonMLTags.length; ++i)
            parentElement.appendChild(this._renderJSONMLTag(jsonMLTags[i]));
    },

    _onClick: function()
    {
        if (this._cachedContent)
            this._toggleExpand();
        else
            this._loadBody();
    },

    _toggleExpand: function()
    {
        this._expanded = !this._expanded;
        this._header.classList.toggle("expanded", this._expanded);
        this._cachedContent.classList.toggle("hidden", !this._expanded);
    },

    _loadBody: function()
    {
        /**
         * @suppressReceiverCheck
         * @suppressGlobalPropertiesCheck
         * @suppress {undefinedVars}
         * @this {Object}
         * @param {*=} formatter
         */
        function load(formatter)
        {
            /**
             * @param {*} jsonMLObject
             * @throws {string} error message
             */
            function substituteObjectTagsInCustomPreview(jsonMLObject)
            {
                if (!jsonMLObject || (typeof jsonMLObject !== "object") || (typeof jsonMLObject.splice !== "function"))
                    return;

                var obj = jsonMLObject.length;
                if (!(typeof obj === "number" && obj >>> 0 === obj && (obj > 0 || 1 / obj > 0)))
                    return;

                var startIndex = 1;
                if (jsonMLObject[0] === "object") {
                    var attributes = jsonMLObject[1];
                    var originObject = attributes["object"];
                    if (typeof originObject === "undefined")
                        throw "Illegal format: obligatory attribute \"object\" isn't specified";

                    jsonMLObject[1] = bindRemoteObject(originObject, false, false, null, false);
                    startIndex = 2;
                }
                for (var i = startIndex; i < jsonMLObject.length; ++i)
                    substituteObjectTagsInCustomPreview(jsonMLObject[i]);
            }

            try {
                var body = formatter.body(this);
                substituteObjectTagsInCustomPreview(body);
                return body;
            } catch (e) {
                console.error("Custom Formatter Failed: " + e);
                return null;
            }
        }

        var customPreview = this._object.customPreview();
        this._object.callFunctionJSON(load, [{objectId: customPreview.formatterObjectId}], onBodyLoaded.bind(this));

        /**
         * @param {*} bodyJsonML
         * @this {WebInspector.CustomPreviewSection}
         */
        function onBodyLoaded(bodyJsonML)
        {
            if (!bodyJsonML)
                return;

            this._cachedContent = this._renderJSONMLTag(bodyJsonML);
            this._sectionElement.appendChild(this._cachedContent);
            this._toggleExpand();
        }
    }
}
