<?php
/**
 * Klyra Panzer - Advanced Page Duplication System
 * 
 * Cloned from Grove Panzer - Specialized duplication method for Elementor pages
 * Adapted for Klyra bulk operations using proven techniques from WordPress.org
 * This class implements the proven methodology from the "Duplicate Page" plugin
 */

if (!defined('ABSPATH')) {
    exit;
}

class Klyra_Panzer {
    
    public function __construct() {
        // Add AJAX handlers for bulk operations
        add_action('wp_ajax_klyra_panzer_bulk_action', array($this, 'ajax_panzer_bulk_action'));
    }
    
    /**
     * Main Panzer duplication function - PanzerDuplicatePage
     * Implements the proven methodology from the "Duplicate Page" WordPress plugin
     * 
     * @param int $source_page_id The ID of the page to duplicate
     * @param array $args Optional arguments for customization
     * @return int|false The ID of the duplicated page or false on failure
     */
    public function PanzerDuplicatePage($source_page_id, $args = array()) {
        global $wpdb;
        
        // Default arguments
        $defaults = array(
            'post_title_suffix' => ' - Copy',
            'post_status' => 'draft',
            'post_author' => get_current_user_id(),
            'log_history' => false
        );
        
        $args = wp_parse_args($args, $defaults);
        
        // Get the original post
        $post = get_post($source_page_id);
        
        if (!$post || is_wp_error($post)) {
            return false;
        }
        
        // Prepare new post data using the proven method
        $new_post_args = array(
            'comment_status' => $post->comment_status,
            'ping_status' => $post->ping_status,
            'post_author' => $args['post_author'],
            'post_content' => wp_slash($post->post_content), // Use wp_slash for Gutenberg/Elementor compatibility
            'post_excerpt' => $post->post_excerpt,
            'post_parent' => $post->post_parent,
            'post_password' => $post->post_password,
            'post_status' => $args['post_status'],
            'post_title' => $post->post_title . $args['post_title_suffix'],
            'post_type' => $post->post_type,
            'to_ping' => $post->to_ping,
            'menu_order' => $post->menu_order,
        );
        
        // Insert the new post
        $new_post_id = wp_insert_post($new_post_args);
        
        if (is_wp_error($new_post_id) || !$new_post_id) {
            return false;
        }
        
        // Duplicate taxonomies (categories, tags, custom taxonomies)
        $this->duplicate_panzer_taxonomies($source_page_id, $new_post_id);
        
        // Duplicate post meta using the proven method
        $this->duplicate_panzer_post_meta($source_page_id, $new_post_id);
        
        // Handle Elementor-specific processing
        $this->handle_panzer_elementor_processing($source_page_id, $new_post_id);
        
        // Log to history if requested
        if ($args['log_history']) {
            $this->log_panzer_history($source_page_id, $new_post_id, $args);
        }
        
        return $new_post_id;
    }
    
    /**
     * Duplicate taxonomies using the proven method from Duplicate Page plugin
     * 
     * @param int $source_id Source post ID
     * @param int $target_id Target post ID
     */
    private function duplicate_panzer_taxonomies($source_id, $target_id) {
        $post = get_post($source_id);
        $taxonomies = array_map('sanitize_text_field', get_object_taxonomies($post->post_type));
        
        if (!empty($taxonomies) && is_array($taxonomies)) {
            foreach ($taxonomies as $taxonomy) {
                $post_terms = wp_get_object_terms($source_id, $taxonomy, array('fields' => 'slugs'));
                wp_set_object_terms($target_id, $post_terms, $taxonomy, false);
            }
        }
    }
    
    /**
     * Duplicate post meta using the proven method from Duplicate Page plugin
     * This method captures ALL meta fields including Elementor data
     * 
     * @param int $source_id Source post ID
     * @param int $target_id Target post ID
     */
    private function duplicate_panzer_post_meta($source_id, $target_id) {
        // Use get_post_custom_keys to get ALL meta keys (including underscore fields)
        $post_meta_keys = get_post_custom_keys($source_id);
        
        if (!empty($post_meta_keys)) {
            foreach ($post_meta_keys as $meta_key) {
                $meta_values = get_post_custom_values($meta_key, $source_id);
                foreach ($meta_values as $meta_value) {
                    $meta_value = maybe_unserialize($meta_value);
                    update_post_meta($target_id, $meta_key, wp_slash($meta_value));
                }
            }
        }
    }
    
    /**
     * Handle Elementor-specific processing using the proven method from Duplicate Page plugin
     * 
     * @param int $source_id Source post ID
     * @param int $target_id Target post ID
     */
    private function handle_panzer_elementor_processing($source_id, $target_id) {
        // Check if Elementor is active (same check as the working plugin)
        if (is_plugin_active('elementor/elementor.php')) {
            // Use the exact same method as the working plugin
            $css = \Elementor\Core\Files\CSS\Post::create($target_id);
            $css->update();
        }
    }
    
    /**
     * AJAX: Klyra Panzer bulk action handler
     */
    public function ajax_panzer_bulk_action() {
        // Check nonce
        if (!wp_verify_nonce($_POST['nonce'], 'klyra_beamray_nonce')) {
            wp_send_json_error('Invalid nonce');
            return;
        }
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Insufficient permissions');
            return;
        }
        
        $action = sanitize_text_field($_POST['bulk_action']);
        $post_ids = array_map('intval', $_POST['post_ids']);
        
        if (empty($post_ids)) {
            wp_send_json_error('No posts selected');
            return;
        }
        
        $results = array();
        $success_count = 0;
        $error_count = 0;
        
        foreach ($post_ids as $post_id) {
            $result = $this->execute_bulk_action($action, $post_id);
            $results[] = $result;
            
            if ($result['success']) {
                $success_count++;
            } else {
                $error_count++;
            }
        }
        
        $total_count = count($post_ids);
        $message = "Bulk action completed: {$success_count} successful, {$error_count} failed out of {$total_count} total.";
        
        wp_send_json_success(array(
            'message' => $message,
            'results' => $results,
            'success_count' => $success_count,
            'error_count' => $error_count,
            'total_count' => $total_count
        ));
    }
    
    /**
     * Execute individual bulk action on a post
     * 
     * @param string $action The action to perform
     * @param int $post_id The post ID
     * @return array Result array with success status and message
     */
    private function execute_bulk_action($action, $post_id) {
        $post = get_post($post_id);
        if (!$post) {
            return array(
                'success' => false,
                'post_id' => $post_id,
                'message' => 'Post not found'
            );
        }
        
        switch ($action) {
            case 'publish':
                $result = wp_update_post(array(
                    'ID' => $post_id,
                    'post_status' => 'publish'
                ));
                break;
                
            case 'draft':
                $result = wp_update_post(array(
                    'ID' => $post_id,
                    'post_status' => 'draft'
                ));
                break;
                
            case 'trash':
                $result = wp_trash_post($post_id);
                break;
                
            case 'duplicate':
                $duplicate_args = array(
                    'post_title_suffix' => ' - Klyra Copy',
                    'post_status' => 'draft',
                    'log_history' => true
                );
                $result = $this->PanzerDuplicatePage($post_id, $duplicate_args);
                break;
                
            default:
                return array(
                    'success' => false,
                    'post_id' => $post_id,
                    'message' => 'Unknown action'
                );
        }
        
        if ($result && !is_wp_error($result)) {
            $action_message = $this->get_action_message($action, $post, $result);
            return array(
                'success' => true,
                'post_id' => $post_id,
                'message' => $action_message,
                'new_id' => ($action === 'duplicate') ? $result : null
            );
        } else {
            return array(
                'success' => false,
                'post_id' => $post_id,
                'message' => 'Action failed'
            );
        }
    }
    
    /**
     * Get user-friendly message for completed action
     * 
     * @param string $action The action performed
     * @param WP_Post $post The original post
     * @param mixed $result The action result
     * @return string User-friendly message
     */
    private function get_action_message($action, $post, $result) {
        switch ($action) {
            case 'publish':
                return "Published: {$post->post_title}";
            case 'draft':
                return "Moved to draft: {$post->post_title}";
            case 'trash':
                return "Moved to trash: {$post->post_title}";
            case 'duplicate':
                $new_post = get_post($result);
                return "Duplicated: {$post->post_title} → {$new_post->post_title} (ID: {$result})";
            default:
                return "Completed: {$post->post_title}";
        }
    }
    
    /**
     * Log Panzer duplication to history (basic logging for klyra)
     * 
     * @param int $source_id Source page ID
     * @param int $target_id Target page ID
     * @param array $args Duplication arguments
     */
    private function log_panzer_history($source_id, $target_id, $args) {
        // Basic logging - can be expanded if klyra needs detailed history
        error_log("Klyra Panzer: Duplicated post {$source_id} to {$target_id} using Panzer method");
    }
}