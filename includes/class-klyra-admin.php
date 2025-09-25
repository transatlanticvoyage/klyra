<?php

if (!defined('ABSPATH')) {
    exit;
}

class Klyra_Admin {
    
    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
    }
    
    public function add_admin_menu() {
        add_menu_page(
            'Klyra',
            'Klyra',
            'manage_options',
            'klyra',
            array($this, 'main_page'),
            'dashicons-database',
            30
        );
        
        add_submenu_page(
            'klyra',
            'klyrabeamraymar',
            'klyrabeamraymar',
            'manage_options',
            'klyrabeamraymar',
            array($this, 'klyrabeamraymar_page')
        );
    }
    
    public function main_page() {
        echo '<div class="wrap">';
        echo '<h1>Klyra - Zen Data Management</h1>';
        echo '<p>Welcome to Klyra plugin.</p>';
        echo '</div>';
    }
    
    public function klyrabeamraymar_page() {
        require_once KLYRA_PLUGIN_PATH . 'includes/pages/klyrabeamraymar-page.php';
        klyra_beamraymar_render_page();
    }
    
    public function suppress_all_admin_notices() {
        remove_all_actions('admin_notices');
        remove_all_actions('all_admin_notices');
        remove_all_actions('network_admin_notices');
        
        add_action('admin_head', function() {
            echo '<style type="text/css">
                .notice, .notice-warning, .notice-error, .notice-success, .notice-info,
                .updated, .error, .update-nag, .admin-notice,
                .wrap > .notice, .wrap > .error, .wrap > .updated {
                    display: none !important;
                }
            </style>';
        });
    }
}