<?php
/**
 * Weave365 Live Stock Sync for WooCommerce - Uninstall Script
 *
 * Cleans up options and transients when plugin is uninstalled via WordPress Admin.
 *
 * @package Weave365_WooCommerce_Sync
 */

// If uninstall not called from WordPress, exit
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// Delete options
delete_option('weave365_api_key');
delete_option('weave365_last_sync_time');
delete_option('weave365_last_sync_status');

// Delete transient lock
delete_transient('weave365_sync_lock');

// Clear any remaining scheduled cron events
wp_clear_scheduled_hook('weave365_cron_stock_sync');
