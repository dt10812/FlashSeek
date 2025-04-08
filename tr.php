<?php
// Define tracking cookie name
$cookieName = "tr-ckie_flsk";

// Check if the cookie already exists
if (!isset($_COOKIE[$cookieName])) {
    // Generate a unique tracking ID for the user
    $trackingId = uniqid('user_', true);
    setcookie($cookieName, $trackingId, time() + (86400 * 30), "/"); // 30-day expiry
} else {
    $trackingId = $_COOKIE[$cookieName];
}

// Define the log file path
$logFile = 'tracking.log';

// Gather tracking details
$data = date('Y-m-d H:i:s') . " | Tracking ID: " . $trackingId . 
        " | IP: " . $_SERVER['REMOTE_ADDR'] . 
        " | User Agent: " . $_SERVER['HTTP_USER_AGENT'] . 
        " | Referrer: " . ($_SERVER['HTTP_REFERER'] ?? 'Direct Visit') . "\n";

// Write data to the log file
file_put_contents($logFile, $data, FILE_APPEND | LOCK_EX);

// Serve a transparent pixel
header("Content-Type: image/png");
readfile("pixel.png"); // Ensure pixel.png exists
?>
