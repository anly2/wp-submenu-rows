/*
[DOM]
#smr_wrapper
    #container_submenus_1 .container-submenus .smr_submenus
        [.submenu] .smr_submenu .level{d>0}
    #container_submenus_{n}
*/



/*
- container id, class, advanced:jquery-creation-code
menu selector : #nav.main_navigation

submenu sub-selector : .sub-menu [ul]
event type : onhover | onclick | (|both|) | none
[hover-out delay] : 1000 (ms)

--
aa_init_menu($(%%menu_selector), (|".sub-menu"|), (|both|), 1000ms)
*/

/*
options:
    submenu selector : string
    event type : enum(hover|click|both|none)
    hover delay : int
    add depth classes : bool
    complete : function(container)

options:
    ^ inherit above options
    containerCreationCode : jquery string
*/

(function($) {

    /* Defaults */
    var COLLECT_DEFAULT_OPTIONS = {
        submenuSelector: "ul",
        submenuClass: "",
        shownClass: "",
        eventType: "both",
        hoverOutDelay: 0,
        deepSubmenusHoverOutDelay: 0,
        addDepthClasses: true,
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
    var SUBMENU_CLONE_CONTAINER_CLASS = "smr_submenus"; //ends with an "s"
    var SUBMENU_CLONE_CLASS = "smr_submenu"; // singular
    var SHOWN_CLASS = "smr_shown";
    var CLICK_SHOWN_CLASS = "smr_shown_by_click";

    /* Helpers */
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

    var _addDepthClasses = function($collection, submenuSelector) {
        $collection.addClass('depth-1');
        $collection.find(submenuSelector).each(function() {
            var $this = $(this);
            var depth = 1 + $this.parents(submenuSelector).length;
            $this.addClass('depth-'+depth);
        });
    };

    //:topmost pseudo selector
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


    var showSubmenu = function(node, shownClass) {
        $(node).addClass(SHOWN_CLASS).addClass(shownClass);
    };
    var hideSubmenu = function(node, shownClass) {
        $(node).removeClass(SHOWN_CLASS).removeClass(shownClass);
    };

    var setClickShown = function(node, flag) {
        if (flag) {
            $(node).removeClass(CLICK_SHOWN_CLASS);
        } else {
            $(node).addClass(CLICK_SHOWN_CLASS);
        }
    }
    var isClickShown = function(node) {
        return $(node).hasClass(CLICK_SHOWN_CLASS);
    }

    var _attachEvents = function($triggers, target, settings, hoverOutDelay) {
        if (typeof hoverOutDelay == "undefined")
            hoverOutDelay = settings.hoverOutDelay;

        // hover
        if (settings.eventType == "hover" || settings.eventType == "both") {
            var hoverTimeout = -1;

            var hoverIn = function(event) {
                clearTimeout(hoverTimeout);
                hoverTimeout = -1;

                if (settings.onShow(event, target) === false)
                    return;

                showSubmenu(target, settings.shownClass);
            };
            var hoverOut = function(event) {
                var doHide = function() {
                    if (isClickShown(target))
                        return; //don't actually hide

                    if (settings.onHide(event, target) === false)
                        return;

                    hideSubmenu(target, settings.shownClass);
                };

                hoverTimeout = setTimeout(doHide, hoverOutDelay);
            };

            $triggers.hover(hoverIn, hoverOut);
            $(target).hover(hoverIn, hoverOut);
        }

        // click
        if (settings.eventType == "click" || settings.eventType == "both") {
            $triggers.click(function(event) {
                if (isClickShown(target)) {
                    setClickShown(target, false);

                    if (settings.onHide(event, target) === false)
                        return;

                    hideSubmenu(target);
                } else {
                    setClickShown(target, true);

                    if (settings.onHide(event, target) === false)
                        return;

                    showSubmenu(target);
                }
            });
        }
    };


    /* Actual functionality */

    $.fn.collectSubmenus = function(sourceNodes, options) {
        if (this.length === 0)
            return this;

        //defaults
        var settings = $.extend(COLLECT_DEFAULT_OPTIONS, options);

        //shorthands
        var submenuSelector = settings.submenuSelector;


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
                _attachEvents($(element).parent(), target, settings);
            });
            
            // Attach events on deeper submenus
            $deepSubmenus = $submenusClone.find(submenuSelector);

            $deepSubmenus.each(function(index, element) {
                _attachEvents($(element).parent(), element, settings, settings.deepSubmenusHoverOutDelay);
            });


            // Mark with classes
            $submenusOriginal.addClass(SUBMENU_ORIGINAL_CLASS);
            $submenusClone.addClass(SUBMENU_CLONE_CLASS).addClass(settings.submenuClass);
            $deepSubmenus.addClass(SUBMENU_CLONE_CLASS).addClass(settings.submenuClass);

            if (settings.addDepthClasses) {
                _addDepthClasses($submenusClone, submenuSelector);
            }


            // Call "onPrepare" user callback function
            settings.onPrepare($container.get(0), $source.get(0));

            // Advance i (cap at $containers.length)
            i = Math.min(i+1, $containers.length-1);
        });
    };
 
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

            //create
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