<?php

namespace Tests\Unit;

use App\Support\DetailParser;
use PHPUnit\Framework\TestCase;

class DetailParserTest extends TestCase
{
    public function test_empty_or_missing_text_gives_no_sections(): void
    {
        $this->assertSame([], DetailParser::parse(null));
        $this->assertSame([], DetailParser::parse(''));
        $this->assertSame([], DetailParser::parse("  \n\n \r\n"));
    }

    public function test_headings_paragraphs_and_lists(): void
    {
        $text = "## Overview\nFirst paragraph\ncontinues here.\n\nSecond paragraph.\n\n## Architecture\n- one\n- two\n\nAfter the list.";

        $this->assertSame([
            ['heading' => 'Overview', 'blocks' => [
                ['type' => 'p', 'text' => 'First paragraph continues here.'],
                ['type' => 'p', 'text' => 'Second paragraph.'],
            ]],
            ['heading' => 'Architecture', 'blocks' => [
                ['type' => 'ul', 'items' => ['one', 'two']],
                ['type' => 'p', 'text' => 'After the list.'],
            ]],
        ], DetailParser::parse($text));
    }

    public function test_text_before_the_first_heading_goes_into_an_untitled_section(): void
    {
        $this->assertSame([
            ['heading' => '', 'blocks' => [
                ['type' => 'p', 'text' => 'Intro one.'],
                ['type' => 'p', 'text' => 'Intro two.'],
            ]],
            ['heading' => 'Next', 'blocks' => [['type' => 'p', 'text' => 'Body.']]],
        ], DetailParser::parse("Intro one.\n\nIntro two.\n## Next\nBody."));
    }

    public function test_multiple_blank_lines_are_one_separator(): void
    {
        $this->assertSame([
            ['heading' => 'H', 'blocks' => [
                ['type' => 'p', 'text' => 'a'],
                ['type' => 'p', 'text' => 'b'],
            ]],
        ], DetailParser::parse("\n\n## H\n\n\n\na\n   \n\n\nb\n\n"));
    }

    public function test_consecutive_lists_and_list_paragraph_boundaries(): void
    {
        $this->assertSame([
            ['heading' => 'L', 'blocks' => [
                ['type' => 'ul', 'items' => ['a', 'b']],
                ['type' => 'ul', 'items' => ['c']],
                ['type' => 'p', 'text' => 'text'],
                ['type' => 'ul', 'items' => ['d']],
            ]],
        ], DetailParser::parse("## L\n- a\n- b\n\n- c\ntext\n- d"));
    }

    public function test_html_and_markdown_stay_plain_text(): void
    {
        $sections = DetailParser::parse("## <b>Bold</b>\n<script>alert(1)</script> **x** [l](http://e)\n- <img src=x onerror=y>\n### Not a heading\n#No space");

        $this->assertSame([
            ['heading' => '<b>Bold</b>', 'blocks' => [
                ['type' => 'p', 'text' => '<script>alert(1)</script> **x** [l](http://e)'],
                ['type' => 'ul', 'items' => ['<img src=x onerror=y>']],
                ['type' => 'p', 'text' => '### Not a heading #No space'],
            ]],
        ], $sections);
    }

    public function test_crlf_and_cr_line_endings(): void
    {
        $expected = [
            ['heading' => 'A', 'blocks' => [
                ['type' => 'p', 'text' => 'x y'],
                ['type' => 'ul', 'items' => ['1', '2']],
            ]],
        ];
        $this->assertSame($expected, DetailParser::parse("## A\r\nx\r\ny\r\n\r\n- 1\r\n- 2\r\n"));
        $this->assertSame($expected, DetailParser::parse("## A\rx\ry\r\r- 1\r- 2"));
        $this->assertSame("a\nb\n\nc", DetailParser::normalize("  a\r\nb\r\n\r\nc\r\n"));
    }

    public function test_heading_without_content_is_kept_and_empty_items_are_dropped(): void
    {
        $this->assertSame([
            ['heading' => 'Empty', 'blocks' => []],
            ['heading' => 'Second', 'blocks' => [['type' => 'ul', 'items' => ['ok']]]],
        ], DetailParser::parse("## Empty\n## Second\n- ok\n-  "));
    }

    public function test_unicode_text_is_preserved(): void
    {
        $this->assertSame([
            ['heading' => 'Genel bakış', 'blocks' => [['type' => 'p', 'text' => 'Çalışma şekli: ölçülü, güvenli.']]],
        ], DetailParser::parse("## Genel bakış\nÇalışma şekli: ölçülü, güvenli."));
    }
}
