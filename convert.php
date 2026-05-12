<?php

$text = file_get_contents(__DIR__ . "/FAQs.txt");

$lines = array_filter(array_map("trim", explode("\n", $text)));

$faqs = [];

$q = null;
$a = [];

foreach ($lines as $line) {
    if (str_ends_with($line, "?")) {
        if ($q !== null) {
            $faqs[] = [
                "q" => $q,
                "a" => implode(" ", $a)
            ];
        }

        $q = $line;
        $a = [];
    } else {
        $a[] = $line;
    }
}

if ($q !== null) {
    $faqs[] = [
        "q" => $q,
        "a" => implode(" ", $a)
    ];
}

file_put_contents(__DIR__ . "/faqs.json", json_encode($faqs, JSON_PRETTY_PRINT));

echo "Converted TXT → JSON\n";
?>
