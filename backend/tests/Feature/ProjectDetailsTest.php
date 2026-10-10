<?php

namespace Tests\Feature;

use App\Models\PortfolioProject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ProjectDetailsTest extends TestCase
{
    use RefreshDatabase;

    private string $root;

    private string $exportPath;

    protected function setUp(): void
    {
        parent::setUp();

        $this->root = sys_get_temp_dir().'/portfolio-details-'.uniqid();
        $this->exportPath = $this->root.'/frontend/public/data/projects.json';
        File::ensureDirectoryExists(dirname($this->exportPath));
        config([
            'portfolio.export_path' => $this->exportPath,
            'portfolio.repo_root' => $this->root,
            'portfolio.allow_remote_admin' => false,
        ]);
        Cache::flush();
        Http::fake(['api.github.com/*' => Http::response([
            ['name' => 'A', 'html_url' => 'https://github.com/ayberkaarda/A'],
        ])]);
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->root);
        parent::tearDown();
    }

    private function form(array $details): array
    {
        return [
            'visible' => '1', 'sort' => 1, 'year' => 2026, 'stack' => 'PHP',
            'texts' => collect(config('portfolio.languages'))->mapWithKeys(fn ($l) => [$l => [
                'name' => "Name $l", 'summary' => 'Summary', 'description' => 'Description', 'highlights' => "one\ntwo",
                'details' => $details[$l] ?? '',
            ]])->all(),
        ];
    }

    private function exported(): array
    {
        return json_decode(File::get($this->exportPath), true)['projects'];
    }

    public function test_details_are_saved_normalized_and_exported_as_sections(): void
    {
        $project = PortfolioProject::create(['slug' => 'a', 'repo' => 'A', 'visible' => true, 'sort' => 1]);
        $this->actingAs(User::factory()->create());

        $this->put("/admin/projects/{$project->id}", $this->form([
            'en' => "Intro.\r\n\r\n## Overview\r\nText <script>x</script>\r\n\r\n- a\r\n- b\r\n",
        ]))->assertSessionHasNoErrors();

        $project->refresh();
        $this->assertSame("Intro.\n\n## Overview\nText <script>x</script>\n\n- a\n- b", $project->texts['en']['details']);
        $this->assertSame('', $project->texts['tr']['details']);
        $this->assertSame(['one', 'two'], $project->texts['en']['highlights']);

        $this->post('/admin/export')->assertSessionHas('ok');
        $texts = $this->exported()[0]['texts'];

        $this->assertSame([
            ['heading' => '', 'blocks' => [['type' => 'p', 'text' => 'Intro.']]],
            ['heading' => 'Overview', 'blocks' => [
                ['type' => 'p', 'text' => 'Text <script>x</script>'],
                ['type' => 'ul', 'items' => ['a', 'b']],
            ]],
        ], $texts['en']['sections']);
        foreach (['tr', 'fr', 'de'] as $lang) {
            $this->assertSame([], $texts[$lang]['sections']);
        }
        foreach ($texts as $t) {
            $this->assertArrayNotHasKey('details', $t);
            $this->assertSame(['name', 'summary', 'description', 'highlights', 'sections'], array_keys($t));
        }
        $this->assertStringNotContainsString('"details"', File::get($this->exportPath));
    }

    public function test_projects_without_details_export_empty_sections(): void
    {
        PortfolioProject::create(['slug' => 'a', 'repo' => 'A', 'visible' => true, 'texts' => [
            'en' => ['name' => 'A', 'summary' => 's', 'description' => 'd', 'highlights' => []],
            'de' => ['name' => 'A', 'summary' => 's', 'description' => 'd', 'highlights' => [], 'details' => ['not', 'a string']],
        ]]);

        $this->artisan('portfolio:export')->assertExitCode(0);

        $texts = $this->exported()[0]['texts'];
        $this->assertSame([], $texts['en']['sections']);
        $this->assertSame([], $texts['de']['sections']);
    }

    public function test_details_longer_than_6000_characters_are_rejected(): void
    {
        $project = PortfolioProject::create(['slug' => 'a', 'repo' => 'A', 'visible' => true, 'sort' => 1, 'texts' => []]);
        $this->actingAs(User::factory()->create());

        $this->put("/admin/projects/{$project->id}", $this->form(['fr' => str_repeat('é', 6001)]))
            ->assertSessionHasErrors('texts.fr.details');
        $this->assertSame([], $project->refresh()->texts);

        // 6000 characters after CRLF normalization are accepted even though the raw input is longer.
        $value = str_repeat("abcd\r\n", 1199).'abcde';
        $this->assertSame(7199, mb_strlen($value));
        $this->put("/admin/projects/{$project->id}", $this->form(['fr' => $value]))->assertSessionHasNoErrors();
        $this->assertSame(6000, mb_strlen($project->refresh()->texts['fr']['details']));
    }

    public function test_panel_shows_a_details_field_per_language(): void
    {
        PortfolioProject::create(['slug' => 'a', 'repo' => 'A', 'visible' => true, 'texts' => [
            'en' => ['name' => 'A', 'summary' => 's', 'description' => 'd', 'highlights' => [], 'details' => "## Saved <b>heading</b>"],
        ]]);
        $this->actingAs(User::factory()->create());

        $response = $this->get('/admin')->assertOk();
        foreach (config('portfolio.languages') as $lang) {
            $response->assertSee('name="texts['.$lang.'][details]"', false);
        }
        $response->assertSee('## Saved &lt;b&gt;heading&lt;/b&gt;', false);
    }
}
