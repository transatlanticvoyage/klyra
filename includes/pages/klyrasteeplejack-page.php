<?php

if (!defined('ABSPATH')) {
    exit;
}

function klyra_steeplejack_render_page() {
    global $wpdb;
    
    $admin = new Klyra_Admin();
    $admin->suppress_all_admin_notices();
    
    ?>
    <div class="wrap">
        <h1 style="font-weight: bold;">Klyra - Elementor Steeplejack System</h1>
        
        <div style="margin-top: 20px;">
            <button type="button" id="klyra-refresh-steeplejack-btn" class="button button-primary">
                refresh steeplejack data and update db column "__"
            </button>
        </div>
    </div>
    <?php
}