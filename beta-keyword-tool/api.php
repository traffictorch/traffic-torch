<?php
ob_clean(); // Kill any stray output
header('Content-Type: application/json');

$url = $_GET['url'] ?? '';
if (!$url || !filter_var($url, FILTER_VALIDATE_URL)) {
    echo '{"error":"Invalid URL"}';
    exit;
}

// Your existing working scraper code (copy the part that actually returns JSON from your old api.php)
$html = @file_get_contents($url);
if (!$html) {
    echo '{"error":"Failed to fetch page"}';
    exit;
}

// Paste your exact working parsing code here — example minimal version:
$title = '';
if (preg_match('/<title[^>]*>(.*?<\/title>/is', $html, $m)) $title = strip_tags($m[0]);

echo json_encode([
    'title' => $title,
    'description' => '',
    'h1' => '',
    'content' => substr(strip_tags($html), 0, 10000),
    'images' => [],
    'links' => [],
    'url' => $url,
    'schema' => false
]);
exit;