<?php
/**
 * Plugin Name: Klyra
 * Plugin URI: https://github.com/transatlanticvoyage/klyra
 * Description: Klyra - WordPress plugin for zen data management
 * Version: 1.0.0
 * Author: Klyra Team
 * License: GPL v2 or later
 */

if (!defined('ABSPATH')) {
    exit;
}

define('KLYRA_PLUGIN_VERSION', '1.0.0');
define('KLYRA_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('KLYRA_PLUGIN_URL', plugin_dir_url(__FILE__));

require_once KLYRA_PLUGIN_PATH . 'includes/class-klyra-admin.php';
require_once KLYRA_PLUGIN_PATH . 'includes/class-klyra-beamray-handler.php';

class Klyra {
    
    private $admin;
    private $beamray_handler;
    
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_action('admin_menu', array($this, 'setup_admin'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_assets'));
    }
    
    public function init() {
        $this->beamray_handler = new Klyra_Beamray_Handler();
    }
    
    public function setup_admin() {
        $this->admin = new Klyra_Admin();
    }
    
    public function enqueue_assets($hook) {
        if ($hook !== 'toplevel_page_klyra' && strpos($hook, 'klyra') === false) {
            return;
        }
        
        wp_enqueue_style(
            'klyra-beamray-css',
            KLYRA_PLUGIN_URL . 'assets/css/klyra-beamray.css',
            array(),
            KLYRA_PLUGIN_VERSION
        );
        
        wp_enqueue_script(
            'klyra-beamray-js',
            KLYRA_PLUGIN_URL . 'assets/js/klyra-beamray.js',
            array('jquery'),
            KLYRA_PLUGIN_VERSION,
            true
        );
        
        wp_localize_script('klyra-beamray-js', 'klyraBeamray', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('klyra_beamray_nonce')
        ));
    }
}

new Klyra();