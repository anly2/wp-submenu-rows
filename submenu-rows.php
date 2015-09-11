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
    private $plugin_name = "submenu-rows";
    protected $dir;
    protected $plugin_slug;
    protected $text_domain;
    protected $settings_slug;
    protected $options;

    public function __construct() {
        $this->dir = plugin_dir_url( __FILE__ );
        $this->plugin_slug = plugin_basename(__FILE__);
        $this->text_domain = $this->plugin_name;
        $this->settings_slug = $this->plugin_name.'-settings';

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
                $this->settings_slug,
                array($this, 'settings_page_output')
            );
        });

        add_action('admin_init', array($this, 'settings_registration'));


        // Add a link to the Plugins list page
        add_filter("plugin_action_links_".$this->plugin_slug,
            function($links) {
                $settings_url = "options-general.php?page=".$this->settings_slug;
                $link_html = "<a href=\"$settings_url\">".$this->__("Settings")."</a>";

                array_unshift($links, $link_html);
                return $links;
            }
        );
    }

    public function settings_registration() {
        add_settings_section("section", $this->__("All Settings"), null, $this->settings_slug);
        
        add_settings_field("submenurows_tt0", $this->__("Twitter Profile Url"), function(){
            ?><input type="text" name="submenurows_tt0" id="submenurows_tt0" value="<?php echo get_option('submenurows_tt0'); ?>" /><?php
        }, $this->settings_slug, "section");

        register_setting("section", "submenurows_tt0");
    }

    public function settings_page_output() {
        ?>
        <div class="wrap">
        <h2><?php $this->_e("Submenu Rows"); ?></h2>

        <form method="post" action="options.php">
            <?php settings_fields($this->settings_slug); ?>
            <?php do_settings_sections($this->settings_slug); ?>
            <?php submit_button(); ?>
        </form>
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

        if ($this->options['auto_enqueue_script']) {
            wp_enqueue_script("submenu_rows_dynamic", $this->dir . "js/dynamic-script.php", array("submenu_rows"), false, true );
        }
    }
}
?>