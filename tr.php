<?php
// Log user details
$logFile = 'tr.log';
$data = date('Y-m-d H:i:s') . " | IP: " . $_SERVER['REMOTE_ADDR'] . " | User Agent: " . $_SERVER['HTTP_USER_AGENT'] . " | Referrer: " . $_SERVER['HTTP_REFERER'] . "\n";
file_put_contents($logFile, $data, FILE_APPEND);

// Set header to serve an image
header("Content-Type: image/png");
readfile("pixel.png"); // Ensure pixel.png is a transparent 1x1 image
?>
