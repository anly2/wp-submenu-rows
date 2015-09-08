
/* More complex example */
(function($) {
    $("nav ul:topmost").extractSubmenus({
        onPrepare: function(container) {
            $(container).appendTo("#header");
            container.id = "header_nav_submenus";

            $("#header").mouseleave(function() {
                $(container).find(".submenu:topmost").slideUp();
                console.log("close");
            });
        },
        onShow: function(event, target) {
            $(target).slideDown();
            return false;
        },
        onHide: function(event, target) {
            if ($(target).is(".submenu .submenu")) {
                console.log("hide");
                $(target).slideUp();
            }
            return false;
        }
    });
}(jQuery));