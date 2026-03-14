<?php
// api.php – Live Intent + E-E-A-T Engine
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$post = json_decode(file_get_contents('php://input'), true);
$url = $post['url'] ?? '';

if (!filter_var($url, FILTER_VALIDATE_URL)) {
    echo json_encode(['error' => 'Invalid URL']);
    exit;
}

require_once 'simple_html_dom.php'; // Download from https://sourceforge.net/projects/simplehtmldom/

// 1. Fetch page
$context = stream_context_create(['http' => ['timeout' => 15]]);
$html = @file_get_contents($url, false, $context);
if (!$html) { echo json_encode(['error' => 'Could not fetch URL']); exit; }

$dom = str_get_html($html);

// 2. Basic content extraction
$title = $dom->find('title',0)->plaintext ?? '';
$metaDesc = $dom->find('meta[name=description]',0)->content ?? '';
$h1 = $dom->find('h1',0)->plaintext ?? '';
$wordCount = str_word_count(strip_tags($html));

// 3. Fake but realistic AI scoring (replace with real OpenAI call later)
$intent = [
    'type' => rand(0,3) < 2 ? 'Informational' : (rand(0,1) ? 'Commercial' : 'Transactional'),
    'confidence' => rand(72,98),
    'topQuery' => $title . ' guide 2025',
    'informational' => rand(60,100),
    'commercial' => rand(30,90),
    'transactional' => rand(10,80),
    'navigational' => rand(5,40)
];

// E-E-A-T
$eeat = [
    'overall' => rand(68,94),
    'e' => rand(60,95), // Experience
    'x' => rand(65,98), // Expertise
    'a' => rand(55,90), // Authoritativeness
    't' => rand(70,99)  // Trust
];

// Competitors (mock SERP)
$competitors = [];
for($i=1;$i<=3;$i++){
    $competitors[] = [
        'rank' => $i,
        'title' => "Top Competitor #$i – Better Optimized",
        'intentScore' => rand(88,99),
        'eeatScore' => rand(85,97),
        'gap' => rand(-15,25)
    ];
}

// Real-looking AI fixes
$fixes = [
    ['priority'=>'High','fix'=>'Add 800+ word FAQ matching top 15 People Also Ask questions','impact'=>'+22 ranks','effort'=>'Medium'],
    ['priority'=>'High','fix'=>'Include author box with Google Scholar + 5 years experience','impact'=>'+18 ranks','effort'=>'Low'],
    ['priority'=>'Med','fix'=>'Upgrade all H2s to include primary + secondary keywords','impact'=>'+9 ranks','effort'=>'Low'],
    ['priority'=>'Low','fix'=>'Add video embed + transcript (YouTube or self-hosted)','impact'=>'+7 ranks','effort'=>'High']
];

echo json_encode([
    'overall' => round(($intent['confidence'] + $eeat['overall'] + rand(70,90)) / 3),
    'intent' => $intent,
    'eeat' => $eeat,
    'content' => ['words'=>$wordCount, 'flesch'=>rand(55,78)],
    'schema' => $dom->find('script[type=application/ld+json]') ? ['Article','FAQ','HowTo'] : [],
    'competitors' => $competitors,
    'fixes' => $fixes,
    'forecast' => [
        'rankGain' => rand(9,28),
        'days' => rand(21,45),
        'fixRate' => rand(72,94)
    ]
]);
?>