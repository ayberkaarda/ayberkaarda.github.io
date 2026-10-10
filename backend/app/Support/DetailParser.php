<?php

namespace App\Support;

/**
 * Parses the "markdown-lite" project details text into sections.
 *
 * Grammar:
 *  - a line starting with "## " starts a new section with that heading;
 *  - consecutive lines starting with "- " form one bullet list;
 *  - other non-empty lines form paragraphs, separated by blank lines
 *    (lines of one paragraph are joined with a single space);
 *  - nothing else is interpreted: inline HTML or markdown stays plain text.
 *
 * Text before the first heading is collected in a section with heading ''.
 *
 * @phpstan-type Block array{type: 'p', text: string}|array{type: 'ul', items: list<string>}
 * @phpstan-type Section array{heading: string, blocks: list<Block>}
 */
final class DetailParser
{
    public const MAX_LENGTH = 6000;

    /** @return list<Section> */
    public static function parse(?string $text): array
    {
        $text = self::normalize($text);
        if ($text === '') {
            return [];
        }

        $sections = [];
        $current = null;      // section being filled
        $paragraph = [];      // lines of the open paragraph
        $list = [];           // items of the open list

        $flush = function () use (&$current, &$paragraph, &$list): void {
            if ($paragraph !== []) {
                $current ??= ['heading' => '', 'blocks' => []];
                $current['blocks'][] = ['type' => 'p', 'text' => implode(' ', $paragraph)];
                $paragraph = [];
            }
            if ($list !== []) {
                $current ??= ['heading' => '', 'blocks' => []];
                $current['blocks'][] = ['type' => 'ul', 'items' => $list];
                $list = [];
            }
        };

        foreach (explode("\n", $text) as $raw) {
            $line = trim($raw);

            if (preg_match('/^##\s+(.*)$/u', $line, $m)) {
                $flush();
                if ($current !== null) {
                    $sections[] = $current;
                }
                $current = ['heading' => trim($m[1]), 'blocks' => []];
                continue;
            }

            if ($line === '') {
                $flush();
                continue;
            }

            if ($line === '-' || str_starts_with($line, '- ')) {
                if ($paragraph !== []) {
                    $flush();
                }
                $item = trim(substr($line, 2));
                if ($item !== '') {
                    $list[] = $item;
                }
                continue;
            }

            if ($list !== []) {
                $flush();
            }
            $paragraph[] = $line;
        }

        $flush();
        if ($current !== null) {
            $sections[] = $current;
        }

        // A heading with no content is still kept; a section with neither is dropped.
        return array_values(array_filter(
            $sections,
            fn (array $s) => $s['heading'] !== '' || $s['blocks'] !== [],
        ));
    }

    /** CRLF/CR to LF, trailing whitespace trimmed. */
    public static function normalize(?string $text): string
    {
        return trim(str_replace(["\r\n", "\r"], "\n", (string) $text));
    }
}
