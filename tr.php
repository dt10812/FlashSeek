<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Define the log file location
$logFile = 'tracking.log';

// Gather visitor details
$data = date('Y-m-d H:i:s') . " | IP: " . $_SERVER['REMOTE_ADDR'] . 
        " | User Agent: " . $_SERVER['HTTP_USER_AGENT'] . 
        " | Referrer: " . ($_SERVER['HTTP_REFERER'] ?? 'Direct Visit') . "\n";

// Append the data to the log file
file_put_contents($logFile, $data, FILE_APPEND | LOCK_EX);

// Serve a transparent pixel image
header("Content-Type: image/png");

// Create a transparent 1x1 PNG pixel dynamically
$im = imagecreatetruecolor(1, 1);
$transparent = imagecolorallocatealpha($im, 0, 0, 0, 127);
imagefill($im, 0, 0, $transparent);
imagesavealpha($im, true);
imagepng($im);
imagedestroy($im);
?>
