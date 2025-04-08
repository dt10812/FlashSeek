<?php
// Set the log file
$logFile = 'tracking.log';

// Gather tracking details
$data = date('Y-m-d H:i:s') . " | IP: " . $_SERVER['REMOTE_ADDR'] . 
        " | User Agent: " . $_SERVER['HTTP_USER_AGENT'] . 
        " | Referrer: " . ($_SERVER['HTTP_REFERER'] ?? 'Direct Visit') . "\n";

// Write data to the log file
file_put_contents($logFile, $data, FILE_APPEND | LOCK_EX);

// Serve a transparent pixel
header("Content-Type: image/png");
readfile("pixel.png"); // Make sure `pixel.png` exists and is a 1x1 transparent image
?>
