/*
[DOM]
#smr_wrapper
    #container_submenus_1 .container-submenus .smr_submenus
        [.submenu] .smr_submenu .level{d>0}
    #container_submenus_{n}
*/

(function($) {

    /* Defaults */
    var COLLECT_DEFAULT_OPTIONS = {
        submenuSelector: "ul",
        submenuClass: "",
        shownClass: "",
        shownByClickClass: "",
        eventType: "both",
        hoverOutDelay: 0,
        deepSubmenusHoverOutDelay: 0,
        addDepthClasses: false,
        onPrepare: function(cloneContainer, originalNode) { /* do nothing */ },
        onShow: function(event, target) { return true; },
        onHide: function(event, target) { return true; }
    };
    var EXTRACT_DEFAULT_OPTIONS = {
        containerCreationCode: "<div id='container_submenus_%index%' class='container-submenus' />" /* %i or %i(ndex)?%? */
    };
    //$.extend(EXTRACT_DEFAULT_OPTIONS , COLLECT_DEFAULT_OPTIONS); //not necessary


    /* Constants */
    var SUBMENU_ORIGINAL_CLASS = "smr_submenu_original";
    var SUBMENU_CLONE_CONTAINER_CLASS = "smr_submenus"; // plural; ends with an "s"
    var SUBMENU_CLONE_CLASS = "smr_submenu"; // singular
    var SHOWN_CLASS = "smr_shown";
    var SHOWN_BY_CLICK_CLASS = "smr_shown_by_click";


    /* Global Helpers */

    // global instance to wrap clone containers
    var _wrapper = false;
    var getSMRWrapper = function() {
        if (_wrapper)
            return $(_wrapper);

        _wrapper = document.getElementById("smr_wrapper");
        if (_wrapper) {
            _wrapper = $(_wrapper);
            return _wrapper;
        }

        _wrapper = $("<div id='smr_wrapper'/>");
        document.body.insertBefore(_wrapper[0], document.body.firstChild);
        return _wrapper;
    };

    // :topmost pseudo selector
    $.extend(jQuery.expr[':'], {
        topmost: function (element, index, match, alreadyMatched) {
            for (var i = 0; i < alreadyMatched.length; i++) {
                if (alreadyMatched[i] !== false && $(element).parents().index(alreadyMatched[i]) >= 0) {
                    return false;
                }
            }
            return true;
        }
    });


    /* Actual functionality */


    /**
     * collectSubmenus
     * Given a list of nodes, finds descendant nodes that statisfy the submenuSelector, makes clones of each submenu and then handles the clones. 
     * The clones receive special classes. The user can specify classes to attach in addition to plugin-specific classe. Please see the options `submenuClass`, `shownClass` and `shownByClickClass`.
     * Event listeners are attached according to the parameter (option) `eventType`.
     * To gain better control, please use the callbacks options `onPrepare`, `onShow` and `onHide`. They allow to override default plugin behaviour or simply do additional things.
     * 
     * @param {node[]} sourceNodes - the list of nodes in which to look for submenus (elements that match the submenu selector). Can be a jQuery collection - if it is not, it will be turned into one.
     * @param {object} [options] - options to use
     * @param {string} [options.submenuSelector="ul"] - the submenu selector to look for in the given nodes. Defaults to a simple "ul"
     * @param {click|hover|both|none} [eventType="both"] - the type of events to attach show/hide actions to. Use "hover" to show the submenus on hovering over the parent element (and on the submenu itself, but this is not relevant when it has not been shown in the first place). Use "click" to show submenus on clicking on the parent element. Use "both" to add both "hover" and "click" functionality. In this case, "click" events take precedence over "hover" events, meaning that if you click and then trigger "hover out", the submenu will stay open (until you "click" the parent again). Use "none" to not add any functionality. This is usefull if you want to attach your own events. You may want to read about the onShow and onHide callback functions (and "return false" in them). Default value is "both".
     * @param {string} [options.submenuClass=""] - a list of classes (separated by space) which to add to the submenu clones created, in addition to the plugin-specific class. Defaults to "" (no classes added).
     * @param {string} [options.shownClass=""] - a list of classes (separated by space) which to add to the submenu clones when they are shown (made visible), in addition to the plugin-specific class. Defaults to "" (no classes added).
     * @param {string} [options.shownByClickClass=""] - a list of classes (separated by space) which to add to the submenu clones when they are shown (made visible) by clicking (not hover), in addition to the plugin-specific class. Defaults to "" (no classes added).
     * @param {number} [options.hoverOutDelay=0] - an integer (>= 0) indicating how many miliseconds to delay the hoverOut event. Has no effect if options.eventType is not "hover" or "both". Defaults to 0 (zero). Note that the callback onHide is called after this delay, so it is affected.
     * @param {number} [options.deepSubmenusHoverOutDelay=0] - same as `options.hoverOutDelay` but for the deep submenus. `options.hoverOutDelay` affects the events triggered by the actual menu, while this affects the events triggered by submenus of depth>1. Usefull when the submenu clones are next to each other, but the original menu is far from them (in which case, hoverOuts are very annoying).
     * @param {boolean} [options.addDepthClasses=false] - a boolean indicating whether to add depth classes to submenu clones or not. Usefull when you want ot apply fancy styling. Off by default.
     * @param {function(cloneContainer, originalNode)} [options.onPrepare] - a callback function that gets called once the submenu clones have been made, linked, marked, events have been attached, and clone nodes appened to the clone container. Use this if you want to move the submenu clones container elsewhere in the DOM, or simply do some other things, like assigning a custom id to the container.
     * @param {function(event, target)} [onShow] - a callback function that gets called when an event that is supposed to show a submenu is triggered. "click-shown over hover-shown" is taken into account and only then is this callback called. An important feature of this callback is that you can return the value "false" and this will prevent the default "show" action done by the plugin. In other words, if you return "false", the script will NOT add "shown" classes (which is the default behaviour).
     * @param {function(event, target)} [onHide] - a callback function that gets called when an event that is supposed to hide a submenu is triggered. "click-shown over hover-shown" and "hoverOutDelay" are taken into account and only then is this callback called. An important feature of this callback is that you can return the value "false" and this will prevent the default "hide" action done by the plugin. In other words, if you return "false", the script will NOT remove "shown" classes (which is the default behaviour).
     * @return {jQuery collection} - the same collection the method was called on (so to allow chaining).
     */
    $.fn.collectSubmenus = function(sourceNodes, options) {
        if (this.length === 0)
            return this;

        //defaults
        var settings = $.extend(COLLECT_DEFAULT_OPTIONS, options);

        //shorthands
        var submenuSelector = settings.submenuSelector;


        // Helpers (recommended to fold the code)
        var helpers = {
            showSubmenu: function(node) {
                $(node).addClass(SHOWN_CLASS).addClass(settings.shownClass);
            },
            hideSubmenu: function(node) {
                $(node).removeClass(SHOWN_CLASS).removeClass(settings.shownClass);
            },

            setClickShown: function(node, flag) {
                if (flag) {
                    $(node).addClass(SHOWN_BY_CLICK_CLASS).addClass(settings.shownByClickClass);
                } else {
                    $(node).removeClass(SHOWN_BY_CLICK_CLASS).removeClass(settings.shownByClickClass);
                }
            },
            isClickShown: function(node) {
                return $(node).hasClass(SHOWN_BY_CLICK_CLASS);
            },

            _attachEvents: function($triggers, target, hoverOutDelay) {
                // prepare things
                var helpers = this;

                if (typeof hoverOutDelay == "undefined")
                    hoverOutDelay = settings.hoverOutDelay;


                // hover events
                if (settings.eventType == "hover" || settings.eventType == "both") {
                    var hoverTimeout = -1;

                    var hoverIn = function(event) {
                        clearTimeout(hoverTimeout);
                        hoverTimeout = -1;

                        if (settings.onShow(event, target) === false)
                            return;

                        helpers.showSubmenu(target);
                    };
                    var hoverOut = function(event) {
                        hoverTimeout = setTimeout(function() {
                            if (helpers.isClickShown(target))
                                return; //don't actually hide

                            if (settings.onHide(event, target) === false)
                                return;

                            helpers.hideSubmenu(target);
                        }, hoverOutDelay);
                    };

                    $triggers.hover(hoverIn, hoverOut);
                    $(target).hover(hoverIn, hoverOut);
                }

                // click
                if (settings.eventType == "click" || settings.eventType == "both") {
                    $triggers.click(function(event) {
                        if (helpers.isClickShown(target)) {
                            helpers.setClickShown(target, false);

                            if (settings.onHide(event, target) === false)
                                return;

                            helpers.hideSubmenu(target);
                        } else {
                            helpers.setClickShown(target, true);

                            if (settings.onShow(event, target) === false)
                                return;

                            helpers.showSubmenu(target);
                        }
                    });
                }
            },

            _addDepthClasses: function($collection) {
                $collection.addClass('depth-1');
                $collection.find(submenuSelector).each(function() {
                    var $this = $(this);
                    var depth = 1 + $this.parents(submenuSelector).length;
                    $this.addClass('depth-'+depth);
                });
            }
        }; //end of helpers


        //work
        var i = 0; //not same as $obj.each(f(index)) !!!
        var $containers = this;

        $(sourceNodes).each(function() {
            // Variables
            var $source = $(this);
            var $container = $containers.eq(i);

            // Get the submenus
            var $submenusOriginal = $source.find(submenuSelector+":topmost");

            // Create clone
            var $submenusClone = $submenusOriginal.clone();
            $container.append($submenusClone);

            // Link Original and Clone
            $submenusOriginal.each(function(index, element){
                var target = $submenusClone[index];

                // Pointer links
                element.smr_target = target;
                $submenusClone[index].smr_original = element;

                // Attach Event Listeners
                helpers._attachEvents($(element).parent(), target);
            });
            
            // Attach events on deeper submenus
            $deepSubmenus = $submenusClone.find(submenuSelector);

            $deepSubmenus.each(function(index, element) {
                helpers._attachEvents($(element).parent(), element, settings.deepSubmenusHoverOutDelay);
            });


            // Mark with classes
            $submenusOriginal.addClass(SUBMENU_ORIGINAL_CLASS);
            $submenusClone.addClass(SUBMENU_CLONE_CLASS).addClass(settings.submenuClass);
            $deepSubmenus.addClass(SUBMENU_CLONE_CLASS).addClass(settings.submenuClass);

            if (settings.addDepthClasses) {
                helpers._addDepthClasses($submenusClone);
            }


            // Call "onPrepare" user callback function
            settings.onPrepare($container.get(0), $source.get(0));

            // Advance i (cap at $containers.length)
            i = Math.min(i+1, $containers.length-1);
        });
    };
 
    /**
     * Given a jQuery collection, for each element, find all the elements that match the `submenuSelector`, make a clone of them and append the clone to a newly created container element.
     * For details on the "cloning" part, please see $.fn.collectSubmenus .
     * This function only creates containers for the clones and calls $.fn.collectSubmenus to do the actual work.
     * A clone container will be created for each element in the jQuery collection.
     *
     * Please see $.fn.collectSubmenus !!!
     * 
     * @param  {object} [options] - Options to use. The object is passed to $.fn.collectSubmenus . So include all options you want to use there.
     * @param  {jquery string} [options.containerCreationCode] - the jQuery string to use when creation the container for submenu clones
     * @return {jquery object} - a jQuery collection of the created containers with submenu clones appended
     */
    $.fn.extractSubmenus = function(options) {
        //defaults
        var settings = $.extend(EXTRACT_DEFAULT_OPTIONS, options);

        //vars
        var $root = getSMRWrapper();
        var extracted = [];

        //create containers
        this.each(function(index) {
            //handle creation code
            var creationCode = settings.containerCreationCode;
            creationCode = creationCode.replace(/%i(ndex)?%?/ig, index);

            //create container
            var $container = $(creationCode);
            $container.addClass(SUBMENU_CLONE_CONTAINER_CLASS);

            //append n register
            $root.append($container);
            extracted = extracted.concat($container.get());
        });

        //do the actual work
        return $(extracted).collectSubmenus(this, options);
    };
 
}(jQuery));