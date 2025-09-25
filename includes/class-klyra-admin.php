<?php

if (!defined('ABSPATH')) {
    exit;
}

class Klyra_Admin {
    
    public function __construct() {
        // Use a higher priority to ensure this runs
        add_action('admin_menu', array($this, 'add_admin_menu'), 9);
    }
    
    public function add_admin_menu() {
        add_menu_page(
            'klyra',
            'klyra',
            'manage_options',
            'klyra',
            array($this, 'main_page'),
            'dashicons-database',
            3
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
        // Remove all admin notices immediately
        add_action('admin_print_styles', function() {
            // Remove all notice actions
            remove_all_actions('admin_notices');
            remove_all_actions('all_admin_notices');
            remove_all_actions('network_admin_notices');
            
            // Remove user admin notices
            global $wp_filter;
            if (isset($wp_filter['user_admin_notices'])) {
                unset($wp_filter['user_admin_notices']);
            }
        }, 0);
        
        // Additional cleanup for persistent notices
        add_action('admin_head', function() {
            // Hide any notices that slip through via CSS
            echo '<style type="text/css">
                .notice, .notice-warning, .notice-error, .notice-success, .notice-info,
                .updated, .error, .update-nag, .admin-notice,
                div.notice, div.updated, div.error, div.update-nag,
                .wrap > .notice, .wrap > .updated, .wrap > .error,
                #adminmenu + .notice, #adminmenu + .updated, #adminmenu + .error,
                .update-php, .php-update-nag,
                .plugin-update-tr, .theme-update-message,
                .update-message, .updating-message,
                #update-nag, #deprecation-warning {
                    display: none !important;
                }
                
                /* Hide WordPress core update notices */
                .update-core-php, .notice-alt {
                    display: none !important;
                }
                
                /* Hide plugin activation/deactivation notices */
                .activated, .deactivated {
                    display: none !important;
                }
                
                /* Hide file permission and other system warnings */
                .notice-warning, .notice-error {
                    display: none !important;
                }
                
                /* Hide any remaining notices in common locations */
                .wrap .notice:first-child,
                .wrap > div.notice,
                .wrap > div.updated,
                .wrap > div.error {
                    display: none !important;
                }
                
                /* Nuclear option - hide anything that looks like a notice */
                [class*="notice"], [class*="updated"], [class*="error"],
                [id*="notice"], [id*="message"] {
                    display: none !important;
                }
                
                /* Restore our legitimate content */
                .klyra-content, .klyra-content * {
                    display: block !important;
                }
            </style>';
        });
        
        // Nuclear option - JavaScript cleanup for dynamic notices
        add_action('admin_footer', function() {
            echo '<script type="text/javascript">
                (function($) {
                    $(document).ready(function() {
                        // Remove any notices that appear after page load
                        $(".notice, .updated, .error, .update-nag, .admin-notice").remove();
                        
                        // Set up mutation observer to catch dynamically added notices
                        if (window.MutationObserver) {
                            var observer = new MutationObserver(function(mutations) {
                                mutations.forEach(function(mutation) {
                                    if (mutation.addedNodes.length > 0) {
                                        $(mutation.addedNodes).find(".notice, .updated, .error, .update-nag").remove();
                                        $(mutation.addedNodes).filter(".notice, .updated, .error, .update-nag").remove();
                                    }
                                });
                            });
                            
                            observer.observe(document.body, {
                                childList: true,
                                subtree: true
                            });
                        }
                        
                        // Periodic cleanup every 500ms
                        setInterval(function() {
                            $(".notice, .updated, .error, .update-nag, .admin-notice").not(".klyra-content, .klyra-content *").remove();
                        }, 500);
                    });
                })(jQuery);
            </script>';
        });
    }
}