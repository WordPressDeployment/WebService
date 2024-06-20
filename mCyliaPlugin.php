<?php
/**
 * Plugin name: mCylia Plugin
 * Description: Plugin for transferring Data and viewing real-time data
 * Version: 1.0.0
 * Text Domain: data_plugin
 * Author: CC dev
 */

// Portal class to handle plugin functionality
class Portal {
    
    // Constructor to initialize plugin features
    public function __construct() {
        add_action('wp_enqueue_scripts', array($this, 'enqueue_custom_scripts'));
        add_shortcode('ws_iframe', array($this, 'ws_iframe_shortcode'));
    }

    // Enqueue necessary scripts and styles
    public function enqueue_custom_scripts() {
        wp_enqueue_style('bootstrap-css', 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css');
        wp_enqueue_script('jquery');
        // Add more scripts as needed for your functionality
    }

    // Shortcode to generate iframe with dynamic URL and headers
    public function ws_iframe_shortcode($atts) {
        $atts = shortcode_atts(
            array(
                'auth_head' => '',   // AUTH_HEAD value
                'auth_value' => '',  // AUTH_VALUE value
                'box_id' => '',      // mcylia-box ID
            ),
            $atts,
            'ws_iframe'
        );

   
        $auth_head = sanitize_text_field($atts['auth_head']);
        $auth_value = sanitize_text_field($atts['auth_value']);
        $box_id = sanitize_text_field($atts['box_id']);

   
        $trusted_entity_header = "TrustedEntity--({[$auth_head]:$auth_value, 'mcylia-box':$box_id})-->WebService";

      
        $token = $this->fetch_token_from_webservice();
        $web_service_url = "https://kid-patient-naturally.ngrok-free.app/$token";

        // Prepare headers for iframe
        $headers = array(
            'TrustedEntity' => $trusted_entity_header
        );

        // Prepare iframe HTML
        $iframe_html = '<iframe src="' . esc_url($web_service_url) . '"';

        // Append headers to iframe
        if (!empty($headers)) {
            $iframe_html .= ' headers=\'{"headers":' . json_encode($headers) . '}\'';
        }

        $iframe_html .= '></iframe>';

        return $iframe_html;
    }

  
    private function fetch_token_from_webservice() {
       
        $endpoint = 'https://kid-patient-naturally.ngrok-free.app';  
        $response = wp_remote_get($endpoint);

        if (is_wp_error($response)) {
            return ''; // Handle error case
        }

        $token = wp_remote_retrieve_body($response);

       return sanitize_text_field(trim($token));
    }
}

// Instantiate the Portal class to initialize the plugin
$portal = new Portal();
