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

(function($) {

    /* Constants */
    var SUBMENU_ORIGINAL_CLASS = "smr_submenu_original";
    var SUBMENU_CLONE_CLASS = "smr_submenu"

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
        alert("SubmenuRows: Depth Classes are not implemented yet!"); //TODO
    };

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

    $.fn.collectSubmenus = function(sourceNodes, options) {
        if (this.length === 0)
            return this;

        //defaults
        var settings = $.extend({
            submenuSelector: "ul",
            addDepthClasses: false
        }, options );

        //shorthands
        var submenuSelector = settings.submenuSelector;


        //work
        var i = 0; //not same as $obj.each(f(index)) !!!
        var $containers = this;

        $(sourceNodes).each(function() {
            var $source = $(this);
            var $container = $containers.eq(i);

            // Get the submenus
            var $submenusOriginal = $source.find(submenuSelector+":topmost");

            // Create clone
            var $submenusClone = $submenusOriginal.clone();
            $container.append($submenusClone);

            // Link Original and Clone
            $submenusOriginal.each(function(index, element){
                element.smr_target = $submenusClone[index]
                $submenusClone[index].smr_original = element;
            });

            // Mark with classes
            $submenusOriginal.addClass(SUBMENU_ORIGINAL_CLASS);
            $submenusClone.addClass(SUBMENU_CLONE_CLASS);
            $submenusClone.find(submenuSelector).addClass(SUBMENU_CLONE_CLASS);
            if (settings._addDepthClasses)
                _addDepthClasses($submenusClone, submenuSelector);

            // Advance i (cap at $containers.length)
            i = Math.min(i+1, $containers.length-1);
        });
    };
 
    $.fn.extractSubmenus = function(options) {
        var $root = getSMRWrapper();
        var extracted = [];

        this.each(function(index) {
            var $container = $("<div id='container_submenus_"+index+"' class='smr_submenus container-submenus' />");

            $root.append($container);
            extracted = extracted.concat($container.get());
        });

        return $(extracted).collectSubmenus(this, options);
    };
 
}(jQuery));


// (function($) {
//     $("nav ul:topmost").extractSubmenus();
// }(jQuery));