<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if (!isset($_GET['url']) || empty($_GET['url'])) {
    echo json_encode(['error' => 'Missing URL']);
    exit;
}

$url = filter_var($_GET['url'], FILTER_VALIDATE_URL);
if (!$url) {
    echo json_encode(['error' => 'Invalid URL']);
    exit;
}

// Use your existing working scraper logic (copy from your old api.php or /vs/api.php)
require_once 'simple_html_dom.php'; // or whatever you use

$html = file_get_contents($url);
if (!$html) {
    echo json_encode(['error' => 'Failed to fetch page']);
    exit;
}

$dom = new simple_html_dom();
$dom->load($html);

$title = trim($dom->find('title', 0)->plaintext ?? '');
$description = '';
$metaDesc = $dom->find('meta[name=description]', 0);
if ($metaDesc) $description = trim($metaDesc->content);

$h1 = '';
$h1tag = $dom->find('h1', 0);
if ($h1tag) $h1 = trim($h1tag->plaintext);

$content = strip_tags($dom->find('article, .post, .content, main', 0)->innertext ?? $dom->plaintext);

$images = [];
foreach ($dom->find('img') as $img) {
    $images[] = [
        'src' => $img->src,
        'alt' => $img->alt ?? '',
        'lazy' => strpos($img->outertext, 'loading="lazy"') !== false || $img->loading === 'lazy'
    ];
}

$links = [];
foreach ($dom->find('a') as $a) {
    if ($a->href && $a->plaintext) {
        $links[] = [
            'href' => $a->href,
            'text' => trim($a->plaintext),
            'isInternal' => strpos($a->href, parse_url($url, PHP_URL_HOST)) !== false
        ];
    }
}

$schema = $dom->find('script[type=application/ld+json]', 0) ? true : false;

echo json_encode([
    'title' => $title,
    'description' => $description,
    'h1' => $h1,
    'content' => $content,
    'images' => $images,
    'links' => $links,
    'url' => $url,
    'schema' => $schema
]);

$dom->clear();
?>