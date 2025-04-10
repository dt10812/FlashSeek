<?php
/**
 * Analytics Pixel Handler
 * 
 * This script generates a 1x1 transparent GIF and logs basic analytics data
 * for users with JavaScript disabled.
 */

// Configuration
$config = [
    'log_dir' => __DIR__ . '/../logs',
    'anonymize_ip' => true,
    'respect_dnt' => true,
];

// Create logs directory if it doesn't exist
if (!file_exists($config['log_dir'])) {
    mkdir($config['log_dir'], 0755, true);
}

// Check for Do Not Track header
function checkDoNotTrack() {
    return isset($_SERVER['HTTP_DNT']) && $_SERVER['HTTP_DNT'] === '1';
}

// Anonymize IP by removing last octet
function anonymizeIP($ip) {
    if (empty($ip)) return 'unknown';
    
    // Handle IPv4
    if (strpos($ip, '.') !== false) {
        $parts = explode('.', $ip);
        if (count($parts) === 4) {
            return $parts[0] . '.' . $parts[1] . '.' . $parts[2] . '.0';
        }
    }
    
    // Handle IPv6
    if (strpos($ip, ':') !== false) {
        $parts = explode(':', $ip);
        if (count($parts) >= 4) {
            return implode(':', array_slice($parts, 0, 4)) . ':0000:0000:0000:0000';
        }
    }
    
    return 'unknown';
}

// Log analytics data
function logAnalyticsData($data) {
    global $config;
    
    $date = date('Y-m-d');
    $logFile = $config['log_dir'] . '/analytics-' . $date . '.log';
    
    // Add timestamp
    $data['timestamp'] = date('c');
    
    // Write to log file
    file_put_contents(
        $logFile, 
        json_encode($data) . "\n", 
        FILE_APPEND | LOCK_EX
    );
}

// Main execution
if ($config['respect_dnt'] && checkDoNotTrack()) {
    // Respect Do Not Track, but still send the pixel
} else {
    // Collect data
    $clientIP = $_SERVER['REMOTE_ADDR'];
    if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $clientIP = $_SERVER['HTTP_X_FORWARDED_FOR'];
    }
    
    $analyticsData = [
        'type' => 'pageview',
        'page' => isset($_GET['page']) ? $_GET['page'] : 'unknown',
        'referrer' => isset($_GET['ref']) ? $_GET['ref'] : 
                     (isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : 'direct'),
        'nojs' => isset($_GET['nojs']) && $_GET['nojs'] === 'true',
        'ip' => $config['anonymize_ip'] ? anonymizeIP($clientIP) : $clientIP,
        'user_agent' => isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : 'unknown',
    ];
    
    // Log the data
    logAnalyticsData($analyticsData);
}

// Send a 1x1 transparent GIF
header('Content-Type: image/gif');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
echo base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
