<?php
/*
Plugin Name: Submenu Rows
Plugin URI:  http://github.com/anly2/wp-submenu-rows
Description: A plugin that allows submenus of navigation menus to be displayed as rows which span (usually) the whole width of a page. Each sub level becomes its own row and DOM structure is preserved.
Version:     0.1.1
Author:      Anko Anchev
Author URI:  http://github.com/anly2
License:     GPL2
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Domain Path: /languages
Text Domain: submenu-rows
*/


/*
enqueue jquery plugin js
enqueue jquery plugin css

add wp template_tag
add wp administration menu
    options:
        [check]  automatically run script
        [text]   menu selector (jQuery selector)
        [text]   submenu selector (added to the menu selector)
        [radio]  event type : [hover] | click* | both | none
        [number] hover-out delay : [0] | # in ms
        "Or use the template_tag" instruction message

if options:"automatically run script" [on by default]
    enqueue dynamically generated js

add inline documentation
add wp plugin readme 
*/


if (defined('ABSPATH'))
    $wpSubmenuRows = new WPSubmenuRows();

/**
 * 
 */
class WPSubmenuRows {
    protected $plugin_name = "submenu-rows";
    protected $text_domain = "submenu-rows";
    protected $settings_page = "submenu-rows-settings";
    protected $settings_group = "smr_settings";
    protected $settings_default = array(
        "usage_mode" => "no_script",
        "menu_selector" => "nav ul:topmost",
        "submenu_selector" => "ul",
        "event_type" => "both"
    ); //the rest are empty
    
    protected $dir;
    protected $options;

    public function __construct() {
        $this->dir = plugin_dir_url( __FILE__ );
        $this->options = get_option($this->settings_group, $this->settings_default);

        load_plugin_textdomain($this->text_domain, false, basename(dirname(__FILE__)).'/languages');

        if (is_admin() && (!defined('DOING_AJAX') || !DOING_AJAX ))
            $this->admin_init();
        else
            $this->frontend_init();
    }


    /* Internalization */

    public function __($text) {
        return __($text, $this->text_domain);
    }
    public function _e($text) {
        echo $this->__($text);
    }



    /* Backend / Settings / Administration */

    private function admin_init() {

        // Add a link to the WP menu -> Settings
        add_action('admin_menu', function() {
            add_options_page(
                $this->__("Submenu-Rows Settings"),
                $this->__("Submenu-Rows"),
                'manage_options',
                $this->settings_page,
                array($this, 'settings_page_output')
            );
        });

        add_action('admin_init', array($this, 'settings_registration'));


        // Add a link to the Plugins list page
        add_filter("plugin_action_links_".plugin_basename(__FILE__),
            function($links) {
                $settings_url = "options-general.php?page=".$this->settings_page;
                $link_html = "<a href=\"$settings_url\">".$this->__("Settings")."</a>";

                array_unshift($links, $link_html);
                return $links;
            }
        );
    }

    public function settings_registration() {
        /* Top level settings group */
        register_setting($this->settings_page, $this->settings_group);

        /* Sections */
        $get_section_cb = function($section_slug) { return function() use ($section_slug) { echo '<a name="section_'.$section_slug.'"></a>'; }; };
        add_settings_section("general", $this->__("General Settings"), $get_section_cb("general"), $this->settings_page);
        add_settings_section("generated_script", $this->__("Generated script Settings"), $get_section_cb("generated_script"), $this->settings_page);
        add_settings_section("custom_script", $this->__("Custom script Settings"), $get_section_cb("custom_script"), $this->settings_page);
        add_settings_section("no_script", $this->__("No script Settings"), $get_section_cb("no_script"), $this->settings_page);
        

        /* Fields */

        //usage mode
        $field_name = "usage_mode";
        add_settings_field(
            $field_name, $this->__("Usage Mode:"),
            function() use ($field_name) { ?> 
                <a name="section_general_usage_mode"></a>
                <label>
                    <input type="radio" name="<?php echo $this->settings_group."[$field_name]"; ?>" value="generated_script" <?php checked($this->options[$field_name], "generated_script"); ?> />
                    <span title="<?php $this->_e("Check to show the options"); ?>"><?php $this->_e("Include generated script"); ?></span>
                </label>
                <label>
                    <input type="radio" name="<?php echo $this->settings_group."[$field_name]"; ?>" value="custom_script" <?php checked($this->options[$field_name], "custom_script"); ?> />
                    <span title="<?php $this->_e("Check to show a textarea input"); ?>"><?php $this->_e("Include custom script"); ?></span>
                </label>
                <label>
                    <input type="radio" name="<?php echo $this->settings_group."[$field_name]"; ?>" value="no_script" <?php checked($this->options[$field_name], "no_script"); ?> />
                    <?php $this->_e("Do not include a script"); ?>
                </label>
            <?php },
            $this->settings_page, "general");

        //generated_script?  menu selector
        $field_name = "menu_selector";
        add_settings_field(
            $field_name, $this->__("Menu Selector"),
            function() use ($field_name) { ?>
                <input type="text" name="<?php echo $this->settings_group."[$field_name]"; ?>" id="smr_field_<?php echo $field_name; ?>" value="<?php echo $this->options[$field_name]; ?>" />
                <div class="instruction">jQuery Selector for the affected menus (top level)</div>
                <div class="instruction">You can use the pseudo selector <code>:topmost</code> here</div>
            <?php },
            $this->settings_page, "generated_script");
        
        //generated_script?  submenu selector
        $field_name = "submenu_selector";
        add_settings_field(
            $field_name, $this->__("Submenu Selector"),
            function() use ($field_name) { ?>
                <input type="text" name="<?php echo $this->settings_group."[$field_name]"; ?>" id="smr_field_<?php echo $field_name; ?>" value="<?php echo $this->options[$field_name]; ?>" />
                <div class="instruction">jQuery Selector for the submenus (<code>ul</code> should be enough)</div>
            <?php },
            $this->settings_page, "generated_script");
        
        //generated_script?  event type
        $field_name = "event_type";
        add_settings_field(
            $field_name, $this->__("Event Type"),
            function() use ($field_name) {
                $event_types = array("hover", "click", "both", "none");
                foreach ($event_types as $event_type): ?>
                    <label>
                        <input type="radio" name="<?php echo $this->settings_group."[$field_name]"; ?>" value="<?php echo $event_type; ?>" <?php checked($this->options[$field_name], $event_type); ?> />
                        <?php $this->_e(ucfirst($event_type)); ?>
                    </label>
                <?php endforeach; ?>
                <div class="instruction">Select the events that should reveal (show) the correspoding submenu.</div>
                <div class="instruction">If <code>both</code> is selected, a click event will "lock" the submenu so that subsequent hover-out events will not hide it (until another click event hides it)</div>
                <div class="instruction">If <code>none</code> is selected, no event listeners will be added and you will have to do that manually. It is very likely that you will be better off using a custom script. (See "<a href="#section_general_usage_mode">Usage Mode</a>")</div>
            <?php },
            $this->settings_page, "generated_script");
        
        //custom_script?   custom script
        $field_name = "custom_script";
        add_settings_field(
            $field_name, $this->__("Custom Script"),
            function() use ($field_name) { ?>
                <textarea name="<?php echo $this->settings_group."[$field_name]"; ?>" id="smr_field_<?php echo $field_name; ?>" style="width: 40em; height: 15em; "><?php echo $this->options[$field_name]; ?></textarea>
                <div class="instruction">This will be wrapped in a &lt;script&gt; tag for you, so do not write it here.</div>
                <div class="instruction">Remember that you can use the pseudo selector <code>$(":topmost")</code> (in jQuery selectors).</div>
            <?php },
            $this->settings_page, "custom_script");
        
        //no_script?   usage explanation
        $field_name = "usage_explanation";
        add_settings_field(
            $field_name, $this->__("Usage Explanation"),
            function() use ($field_name) {
                ?>
                <div id="smr_field_<?php echo $field_name; ?>" class="info"><?php /*eat whitespaces*/ ?>
                    <b>No javascript will be called by the plugin!</b>
                    <p>
                    You are free to manually call the plugin on the client side (using javascript).
                    Everything the plugin does is done there. The back-end things are just for convenience.
                    </p>
                    <p>
                    <?php $jsfile = $this->dir."js/jquery.submenu-rows.js"; ?>
                    Make sure the file <a href="<?php echo $jsfile; ?>" target="_BLANK">"submenu-rows/js/jquery.submenu-rows.js"</a> is included. (It should be already)
                    Then call either <code>$(menu).extractSubmenus({options})</code> or <code>$(dest).collectSubmenus(menu, {options})</code> - whichever is more appropriate.
                    </p>
                    <p>
                    You can check the documentation for the two functions and the options they accept in the jsdoc comments in <a href="<?php echo $jsfile; ?>" target="_BLANK">the above-mentioned file</a>.
                    </p>
                </div>
                <?php
            },
            $this->settings_page, "no_script");
    }

    public function settings_page_output() {
        ?>
        <div class="wrap">
            <h2><?php $this->_e("Submenu Rows"); ?></h2>

            <style>
            form#smr_settings label { margin-right: 3em; }
            form#smr_settings .info { max-width: 50em; }
            form#smr_settings .info p { white-space: pre-line; }
            form#smr_settings .instruction { margin-top: 10px; }
            form#smr_settings .instruction+.instruction { margin-top: 5px; }
            form#smr_settings .instruction+:not(.instruction),
            form#smr_settings .instruction:last-child { margin-bottom: 10px; }
            </style>

            <form id="smr_settings" method="post" action="options.php">
                <?php settings_fields($this->settings_page); ?>
                <?php do_settings_sections($this->settings_page); ?>
                <?php submit_button(); ?>
            </form>

            <script type="text/javascript">
            (function($) {
                var $shown = 
                $('form#smr_settings [name="<?php echo $this->settings_group; ?>[usage_mode]"]').each(function(index, element) {
                    var $sectionAnchor = $('form#smr_settings [name="section_'+element.value+'"]');
                    var $section = $().add($sectionAnchor.prev("h3")).add($sectionAnchor).add($sectionAnchor.next("table"));

                    if (element.checked) {
                        $shownSection = $section;
                    } else {
                        $section.css('display', 'none');
                    }

                    $(element).change(function() {
                        if (element.checked) {
                            $shownSection.css("display", "none");
                            $section.fadeIn();
                            $shownSection = $section;
                        } else
                            $section.fadeOut();
                    });
                });
            }(jQuery));
            </script>
        </div>
        <?php
    }


    /* Frontend / Usage */

    private function frontend_init() {
        // $this->options = get_option('');

        wp_deregister_script("jquery");
        wp_enqueue_script("jquery", $this->dir . "js/jquery-1.7.1.min.js", array(), "1.7.1");
        wp_enqueue_script("submenu_rows", $this->dir . "js/jquery.submenu-rows.js", array("jquery"), false, true);
        wp_enqueue_style("submenu_rows", $this->dir . "css/style.css");

        if ($this->options['usage_mode'] != 'no_script') {
            add_action('wp_footer', array($this, 'dynamic_script'));
        }
    }

    public function dynamic_script() {
        switch($this->options["usage_mode"]) {
            case "generated_script": ?>
                <script type="text/javascript">
                (function($) {
                    $("<?php echo $this->options['menu_selector']; ?>").extractSubmenus({
                        submenuSelector: "<?php echo $this->options['menu_selector']; ?>",
                        eventType: "<?php echo $this->options['submenu_selector']; ?>"
                    })
                }(jQuery));
                </script>
                <?php break;

            case "custom_script": ?>
                <script type="text/javascript">
                <?php echo $this->options["custom_script"]; ?>
                </script>
                <?php break;

            case "no_script":
                return;
            default:
                return;
        }
    }
}
?>