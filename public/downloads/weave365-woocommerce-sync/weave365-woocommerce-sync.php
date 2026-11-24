<?php
/**
 * Plugin Name: Weave365 Live Stock Sync for WooCommerce
 * Plugin URI: https://www.weave365.com/developer-api
 * Description: Automated real-time stock synchronization and inventory feed for WooCommerce stores connected to Weave365 B2B.
 * Version: 1.0.0
 * Author: Weave365
 * Author URI: https://www.weave365.com
 * Requires at least: 5.6
 * Requires PHP: 7.4
 * WC requires at least: 5.0
 * Requires Plugins: woocommerce
 * License: GPL-2.0-or-later
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class Weave365_WooCommerce_Sync {

    const OPTION_API_KEY = 'weave365_api_key';
    const OPTION_LAST_SYNC_TIME = 'weave365_last_sync_time';
    const OPTION_LAST_SYNC_STATUS = 'weave365_last_sync_status';
    const CRON_HOOK = 'weave365_cron_stock_sync';
    const TRANSIENT_LOCK = 'weave365_sync_lock';

    public function __construct() {
        // Admin menu & settings
        add_action('admin_menu', [$this, 'register_admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_init', [$this, 'check_cron_schedule_fallback']);

        // Scheduled cron execution
        add_action(self::CRON_HOOK, [$this, 'execute_stock_sync']);

        // Manual sync Post-Redirect-Get action via admin-post.php
        add_action('admin_post_weave365_manual_sync', [$this, 'handle_manual_sync']);

        // Plugin action links
        add_filter('plugin_action_links_' . plugin_basename(__FILE__), [$this, 'add_plugin_action_links']);
    }

    /**
     * Activation callback: schedule hourly cron.
     */
    public static function plugin_activated() {
        if (!wp_next_scheduled(self::CRON_HOOK)) {
            wp_schedule_event(time(), 'hourly', self::CRON_HOOK);
        }
    }

    /**
     * Deactivation callback: clear cron and release lock.
     */
    public static function plugin_deactivated() {
        wp_clear_scheduled_hook(self::CRON_HOOK);
        delete_transient(self::TRANSIENT_LOCK);
    }

    /**
     * Fallback to ensure cron is scheduled if plugin was updated without re-activation.
     */
    public function check_cron_schedule_fallback() {
        if (!wp_next_scheduled(self::CRON_HOOK)) {
            wp_schedule_event(time(), 'hourly', self::CRON_HOOK);
        }
    }

    /**
     * Admin notice when WooCommerce is inactive.
     */
    public static function woocommerce_missing_notice() {
        if (!current_user_can('activate_plugins')) {
            return;
        }
        ?>
        <div class="notice notice-error is-dismissible">
            <p><strong>Weave365 Live Stock Sync</strong> requires <strong>WooCommerce</strong> to be installed and active. Please activate WooCommerce to enable stock synchronization.</p>
        </div>
        <?php
    }

    public function add_plugin_action_links($links) {
        $settings_link = '<a href="' . esc_url(admin_url('admin.php?page=weave365-sync')) . '">Settings</a>';
        array_unshift($links, $settings_link);
        return $links;
    }

    public function register_admin_menu() {
        add_submenu_page(
            'woocommerce',
            'Weave365 Stock Sync',
            'Weave365 Sync',
            'manage_woocommerce',
            'weave365-sync',
            [$this, 'render_settings_page']
        );
    }

    public function register_settings() {
        register_setting('weave365_settings_group', self::OPTION_API_KEY, [
            'type' => 'string',
            'sanitize_callback' => [$this, 'sanitize_api_key'],
            'default' => '',
            'autoload' => false,
        ]);
    }

    public function sanitize_api_key($value) {
        $value = sanitize_text_field(trim((string)$value));
        if (strpos($value, '...') !== false || strpos($value, '••••') !== false || strpos($value, '***') !== false) {
            add_settings_error(
                'weave365_settings_group',
                'weave365_api_key_invalid',
                'Invalid API Key: Masked or truncated key values cannot be saved. Please paste the complete unmasked key.',
                'error'
            );
            return get_option(self::OPTION_API_KEY, '');
        }
        return $value;
    }

    /**
     * Handle manual sync via admin-post.php (Post-Redirect-Get pattern)
     */
    public function handle_manual_sync() {
        if (!current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('You do not have sufficient permissions to access this page.', 'weave365'));
        }
        check_admin_referer('weave365_manual_sync_action', 'weave365_manual_sync_nonce');

        $result = $this->execute_stock_sync();

        $redirect_url = add_query_arg([
            'page' => 'weave365-sync',
            'sync_result' => !empty($result['success']) ? 'success' : 'error',
            'sync_msg' => rawurlencode(!empty($result['message']) ? $result['message'] : 'Sync executed.'),
        ], admin_url('admin.php'));

        wp_safe_redirect($redirect_url);
        exit;
    }

    public function render_settings_page() {
        if (!current_user_can('manage_woocommerce')) {
            return;
        }

        $api_key = get_option(self::OPTION_API_KEY, '');
        $last_sync_time = get_option(self::OPTION_LAST_SYNC_TIME, 'Never');
        $last_sync_status = get_option(self::OPTION_LAST_SYNC_STATUS, 'Not configured');
        ?>
        <div class="wrap" style="max-width: 860px;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                <h1 style="margin: 0;">Weave365 WooCommerce Live Stock Sync</h1>
                <span style="background: #e0f2fe; color: #0369a1; padding: 3px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600;">v1.0.0</span>
            </div>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">
                Keep your WooCommerce store's Banarasi handloom inventory synced with live artisan looms across Varanasi in real time.
            </p>

            <?php
            settings_errors('weave365_settings_group');

            if (isset($_GET['sync_result'])) {
                $sync_result = sanitize_key($_GET['sync_result']);
                $sync_msg = isset($_GET['sync_msg']) ? sanitize_text_field(wp_unslash($_GET['sync_msg'])) : '';
                if ($sync_result === 'success') {
                    $notice_html = '<div class="notice notice-success is-dismissible"><p><strong>Sync Successful!</strong> ' . esc_html($sync_msg) . '</p></div>';
                } else {
                    $notice_html = '<div class="notice notice-error is-dismissible"><p><strong>Sync Failed:</strong> ' . esc_html($sync_msg) . '</p></div>';
                }
                echo wp_kses_post($notice_html);
            }
            ?>

            <div style="background: #fff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px 24px; margin-top: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <form method="post" action="options.php">
                    <?php settings_fields('weave365_settings_group'); ?>
                    <?php do_settings_sections('weave365_settings_group'); ?>

                    <table class="form-table" role="presentation">
                        <tr>
                            <th scope="row" style="width: 220px;">
                                <label for="weave365_api_key"><strong>Weave365 Live API Key</strong></label>
                            </th>
                            <td>
                                <input
                                    type="password"
                                    id="weave365_api_key"
                                    name="<?php echo esc_attr(self::OPTION_API_KEY); ?>"
                                    value="<?php echo esc_attr($api_key); ?>"
                                    class="regular-text"
                                    placeholder="w365_live_..."
                                    autocomplete="off"
                                    style="width: 100%; max-width: 460px; font-family: monospace;"
                                />
                                <p class="description" style="margin-top: 6px;">
                                    Paste your Live API Key copied from <a href="https://www.weave365.com/account?tab=developer" target="_blank" rel="noopener">Weave365 Developer Dashboard</a>.
                                </p>
                            </td>
                        </tr>
                    </table>

                    <?php submit_button('Save API Key'); ?>
                </form>

                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

                <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 18px;">
                    <div>
                        <div style="font-size: 13px; font-weight: 600; color: #334155;">Automated Background Sync</div>
                        <div style="font-size: 12px; color: #64748b; margin-top: 2px;">
                            Runs automatically <strong>hourly</strong> via WordPress WP-Cron.<br />
                            <strong>Last Sync:</strong> <?php echo esc_html($last_sync_time); ?> &bull; 
                            <strong>Status:</strong> <?php echo esc_html($last_sync_status); ?>
                        </div>
                    </div>
                    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="margin: 0;">
                        <input type="hidden" name="action" value="weave365_manual_sync" />
                        <?php wp_nonce_field('weave365_manual_sync_action', 'weave365_manual_sync_nonce'); ?>
                        <button type="submit" class="button button-secondary" style="height: 36px; padding: 0 16px;">
                            Sync Stock Now
                        </button>
                    </form>
                </div>
            </div>

            <div style="background: #f1f5f9; border-left: 4px solid #0284c7; padding: 16px 20px; border-radius: 4px; margin-top: 24px;">
                <h3 style="margin-top: 0; font-size: 15px; color: #0f172a;">How SKU Matching Works:</h3>
                <ol style="margin-bottom: 0; padding-left: 20px; font-size: 13px; color: #334155; line-height: 1.6;">
                    <li>Ensure your WooCommerce products or variations have their <strong>SKU</strong> field set to the corresponding Weave365 Product ID or Variant SKU (e.g., <code>102001</code> for simple/parent products, or <code>102001-1</code> for variations).</li>
                    <li>If you have not yet imported products into WooCommerce, download the pre-formatted <strong>CSV Catalog</strong> from Weave365 Developer API and use <em>WooCommerce &rarr; Products &rarr; Import</em>.</li>
                    <li>This plugin automatically queries <code>https://www.weave365.com/api/v1/stock-status</code> hourly, matching SKUs and updating product stock to <code>instock</code>, <code>outofstock</code>, or <code>onbackorder</code>.</li>
                </ol>
            </div>
        </div>
        <?php
    }

    public function execute_stock_sync() {
        if (!class_exists('WooCommerce') || !function_exists('wc_get_product_id_by_sku') || !function_exists('wc_get_product')) {
            $msg = 'WooCommerce is not active or required WooCommerce functions are unavailable.';
            update_option(self::OPTION_LAST_SYNC_STATUS, $msg, false);
            return ['success' => false, 'message' => $msg];
        }

        $api_key = get_option(self::OPTION_API_KEY, '');
        if (empty($api_key)) {
            $msg = 'API Key is missing. Please save your Live API Key first.';
            update_option(self::OPTION_LAST_SYNC_STATUS, $msg, false);
            return ['success' => false, 'message' => $msg];
        }

        if (get_transient(self::TRANSIENT_LOCK)) {
            return [
                'success' => false,
                'message' => 'Stock sync is already in progress. Please wait for the current sync to complete.'
            ];
        }

        set_transient(self::TRANSIENT_LOCK, time(), 300);

        try {
            $url = 'https://www.weave365.com/api/v1/stock-status';
            $response = wp_remote_get($url, [
                'headers' => [
                    'X-API-Key' => $api_key,
                    'User-Agent' => 'Weave365-WooCommerce-Plugin/1.0.0 (' . home_url() . ')',
                    'Accept' => 'application/json',
                ],
                'timeout' => 30,
                'sslverify' => true,
            ]);

            if (is_wp_error($response)) {
                $err = $response->get_error_message();
                update_option(self::OPTION_LAST_SYNC_STATUS, 'Error: ' . $err, false);
                return ['success' => false, 'message' => $err];
            }

            $code = wp_remote_retrieve_response_code($response);
            $body_raw = wp_remote_retrieve_body($response);
            $body = json_decode($body_raw, true);

            if (json_last_error() !== JSON_ERROR_NONE || !is_array($body)) {
                $err = 'Invalid JSON response from Weave365 API (' . json_last_error_msg() . ').';
                update_option(self::OPTION_LAST_SYNC_STATUS, 'API Error: ' . $err, false);
                return ['success' => false, 'message' => $err];
            }

            if ($code !== 200) {
                $err = !empty($body['message']) ? $body['message'] : ('HTTP ' . $code);
                update_option(self::OPTION_LAST_SYNC_STATUS, 'API Error: ' . $err, false);
                return ['success' => false, 'message' => $err];
            }

            if (!isset($body['stock_map']) || !is_array($body['stock_map'])) {
                $msg = 'Stock map was missing or invalid in API response.';
                update_option(self::OPTION_LAST_SYNC_STATUS, $msg, false);
                return ['success' => false, 'message' => $msg];
            }

            if (empty($body['stock_map'])) {
                $msg = 'Stock map in API response is empty.';
                update_option(self::OPTION_LAST_SYNC_TIME, current_time('mysql'), false);
                update_option(self::OPTION_LAST_SYNC_STATUS, $msg, false);
                return ['success' => true, 'message' => $msg, 'updated' => 0];
            }

            $matched_count = 0;
            $updated_count = 0;

            foreach ($body['stock_map'] as $sku => $data) {
                $product_id = wc_get_product_id_by_sku((string)$sku);
                if (!$product_id) {
                    continue;
                }

                $product = wc_get_product($product_id);
                if (!$product) {
                    continue;
                }

                // Skip non-inventory product types (external, grouped, trash)
                if ($product->get_status() === 'trash') {
                    continue;
                }
                $product_type = $product->get_type();
                if (in_array($product_type, ['external', 'grouped'], true)) {
                    continue;
                }

                $matched_count++;

                // Safely parse data payload
                if (is_array($data)) {
                    if (isset($data['is_available'])) {
                        $is_available = !empty($data['is_available']);
                    } elseif (isset($data['in_stock'])) {
                        $is_available = !empty($data['in_stock']);
                    } else {
                        $is_available = false;
                    }
                    $status_str = isset($data['status']) ? strtolower(trim((string)$data['status'])) : ($is_available ? 'in_stock' : 'out_of_stock');
                    $raw_qty = isset($data['quantity']) ? $data['quantity'] : 5;
                } elseif (is_bool($data) || is_numeric($data)) {
                    $is_available = !empty($data);
                    $status_str = $is_available ? 'in_stock' : 'out_of_stock';
                    $raw_qty = 5;
                } else {
                    continue;
                }

                // If not available, force quantity to 0 so it doesn't flip back to instock
                $target_qty = $is_available ? max(0, intval($raw_qty)) : 0;

                // Support Variable Products: update child variations gracefully
                if ($product->is_type('variable')) {
                    $children_ids = $product->get_children();
                    if (!empty($children_ids)) {
                        foreach ($children_ids as $child_id) {
                            $child = wc_get_product($child_id);
                            if (!$child || $child->get_status() === 'trash') {
                                continue;
                            }

                            $child_stock_status = 'outofstock';
                            if (in_array($status_str, ['pre-order', 'back-soon', 'onbackorder'], true)) {
                                if (method_exists($child, 'backorders_allowed') && $child->backorders_allowed()) {
                                    $child_stock_status = 'onbackorder';
                                } else {
                                    $child_stock_status = $is_available ? 'instock' : 'outofstock';
                                }
                            } elseif ($is_available) {
                                $child_stock_status = 'instock';
                            }

                            $child_dirty = false;
                            if ($child->get_stock_status() !== $child_stock_status) {
                                $child->set_stock_status($child_stock_status);
                                $child_dirty = true;
                            }

                            if ($child->get_manage_stock()) {
                                if ($child->get_stock_quantity() !== $target_qty) {
                                    $child->set_stock_quantity($target_qty);
                                    $child_dirty = true;
                                }
                            }

                            if ($child_dirty) {
                                $child->save();
                                wc_delete_product_transients($child_id);
                                $updated_count++;
                            }
                        }
                    }

                    // Parent variable product stock status
                    $parent_stock_status = 'outofstock';
                    if (in_array($status_str, ['pre-order', 'back-soon', 'onbackorder'], true)) {
                        if (method_exists($product, 'backorders_allowed') && $product->backorders_allowed()) {
                            $parent_stock_status = 'onbackorder';
                        } else {
                            $parent_stock_status = $is_available ? 'instock' : 'outofstock';
                        }
                    } elseif ($is_available) {
                        $parent_stock_status = 'instock';
                    }

                    $parent_dirty = false;
                    if ($product->get_stock_status() !== $parent_stock_status) {
                        $product->set_stock_status($parent_stock_status);
                        $parent_dirty = true;
                    }

                    if ($product->get_manage_stock()) {
                        if ($product->get_stock_quantity() !== $target_qty) {
                            $product->set_stock_quantity($target_qty);
                            $parent_dirty = true;
                        }
                    }

                    if ($parent_dirty) {
                        $product->save();
                        wc_delete_product_transients($product_id);
                        $updated_count++;
                    }
                } else {
                    // Simple product or variation
                    $stock_status = 'outofstock';
                    if (in_array($status_str, ['pre-order', 'back-soon', 'onbackorder'], true)) {
                        if (method_exists($product, 'backorders_allowed') && $product->backorders_allowed()) {
                            $stock_status = 'onbackorder';
                        } else {
                            $stock_status = $is_available ? 'instock' : 'outofstock';
                        }
                    } elseif ($is_available) {
                        $stock_status = 'instock';
                    }

                    $needs_save = false;
                    if ($product->get_stock_status() !== $stock_status) {
                        $product->set_stock_status($stock_status);
                        $needs_save = true;
                    }

                    if ($product->get_manage_stock()) {
                        if ($product->get_stock_quantity() !== $target_qty) {
                            $product->set_stock_quantity($target_qty);
                            $needs_save = true;
                        }
                    }

                    if ($needs_save) {
                        $product->save();
                        wc_delete_product_transients($product_id);
                        if ($product->is_type('variation')) {
                            $parent_id = $product->get_parent_id();
                            if ($parent_id) {
                                wc_delete_product_transients($parent_id);
                            }
                        }
                        $updated_count++;
                    }
                }
            }

            if ($matched_count === 0) {
                $status_msg = 'Sync completed: 0 matching SKUs found in your WooCommerce store. Please ensure your product or variation SKUs match Weave365 IDs (e.g. 102001 or 102001-1).';
            } else {
                $status_msg = "Successfully synced {$matched_count} matching product(s) ({$updated_count} updated).";
            }

            update_option(self::OPTION_LAST_SYNC_TIME, current_time('mysql'), false);
            update_option(self::OPTION_LAST_SYNC_STATUS, $status_msg, false);

            return [
                'success' => true,
                'message' => $status_msg,
                'matched' => $matched_count,
                'updated' => $updated_count
            ];
        } finally {
            delete_transient(self::TRANSIENT_LOCK);
        }
    }
}

// Lifecycle hooks
register_activation_hook(__FILE__, ['Weave365_WooCommerce_Sync', 'plugin_activated']);
register_deactivation_hook(__FILE__, ['Weave365_WooCommerce_Sync', 'plugin_deactivated']);

// Guard WooCommerce dependency on plugins_loaded
add_action('plugins_loaded', function() {
    if (!class_exists('WooCommerce')) {
        add_action('admin_notices', ['Weave365_WooCommerce_Sync', 'woocommerce_missing_notice']);
        return;
    }

    new Weave365_WooCommerce_Sync();
});
