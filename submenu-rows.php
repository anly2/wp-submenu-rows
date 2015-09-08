<?php
/*
Plugin Name: Submenu Rows
Plugin URI:  http://github.com/anly2/submenu-rows
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

class WPSubmenuRows {
	protected $dir;
    public function __construct() {
    	$this->dir = plugin_dir_url( __FILE__ );

    	wp_deregister_script("jquery");
    	wp_enqueue_script("jquery", $this->dir . "js/jquery-1.7.1.min.js", array(), "1.7.1");
    	wp_enqueue_script("submenu_rows", $this->dir . "js/jquery.submenu-rows.js", array("jquery"), false, true);
    	wp_enqueue_style("submenu_rows", $this->dir . "css/style.css");
    }
}


if (defined('ABSPATH'))
	$wpSubmenuRows = new WPSubmenuRows();
?>