<?php

namespace Tests\Feature;

use App\Models\PortfolioProject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Illuminate\Console\Command;
use Tests\TestCase;

class AdminPanelTest extends TestCase
{
    use RefreshDatabase;

    private string $root;

    private string $exportPath;

    protected function setUp(): void
    {
        parent::setUp();

        $this->root = sys_get_temp_dir().'/portfolio-test-'.uniqid();
        $this->exportPath = $this->root.'/frontend/public/data/projects.json';
        File::ensureDirectoryExists(dirname($this->exportPath));
        config(['portfolio.export_path' => $this->exportPath]);
        config(['portfolio.repo_root' => $this->root]);
        config(['portfolio.publish_branch' => 'main']);
        config(['portfolio.allow_remote_admin' => false]);
        Cache::flush();
        Process::preventStrayProcesses();

        Http::fake([
            'api.github.com/*' => Http::response([
                ['name' => 'A', 'html_url' => 'https://github.com/ayberkaarda/A'],
                ['name' => 'Brand-New-Repo', 'description' => 'Just created', 'language' => 'PHP',
                    'pushed_at' => '2026-10-09T10:00:00Z', 'html_url' => 'https://github.com/ayberkaarda/Brand-New-Repo', 'fork' => false],
            ]),
        ]);
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->root);
        parent::tearDown();
    }

    private function texts(string $name): array
    {
        return collect(config('portfolio.languages'))->mapWithKeys(fn ($l) => [$l => [
            'name' => $name, 'summary' => "$name summary", 'description' => "$name description", 'highlights' => "one\ntwo",
        ]])->all();
    }

    /** Texts as stored in the database (highlights already an array). */
    private function storedTexts(string $name): array
    {
        return collect($this->texts($name))->map(fn ($t) => [...$t, 'highlights' => ['one', 'two']])->all();
    }

    private function exported(): array
    {
        return json_decode(File::get($this->exportPath), true)['projects'];
    }

    public function test_guests_are_sent_to_login(): void
    {
        $this->get('/admin')->assertRedirect('/admin/login');
        $this->post('/admin/export')->assertRedirect('/admin/login');
    }

    public function test_a_newly_added_repo_stays_hidden_until_made_visible(): void
    {
        $this->actingAs(User::factory()->create());

        $this->post('/admin/projects', ['repo' => 'Brand-New-Repo'])->assertSessionHas('ok');
        $project = PortfolioProject::where('repo', 'Brand-New-Repo')->firstOrFail();
        $this->assertFalse($project->visible);

        $this->post('/admin/export');
        $this->assertSame([], $this->exported());

        $this->put("/admin/projects/{$project->id}", [
            'visible' => '1', 'sort' => 1, 'year' => 2026, 'stack' => 'PHP, Laravel',
            'texts' => $this->texts('Brand New'),
        ])->assertSessionHasNoErrors();

        $this->post('/admin/export');
        $out = $this->exported();
        $this->assertCount(1, $out);
        $this->assertSame('brand-new-repo', $out[0]['slug']);
        $this->assertSame(['PHP', 'Laravel'], $out[0]['stack']);
        $this->assertSame(['one', 'two'], $out[0]['texts']['de']['highlights']);
        $this->assertSame('https://github.com/ayberkaarda/Brand-New-Repo', $out[0]['repoUrl']);
    }

    public function test_hidden_projects_are_not_exported(): void
    {
        $this->actingAs(User::factory()->create());
        PortfolioProject::create(['slug' => 'a', 'repo' => 'A', 'visible' => true, 'sort' => 1, 'texts' => $this->storedTexts('A')]);
        PortfolioProject::create(['slug' => 'b', 'repo' => 'B', 'visible' => false, 'sort' => 2, 'texts' => $this->storedTexts('B')]);

        $this->post('/admin/export');

        $this->assertSame(['a'], array_column($this->exported(), 'slug'));
    }

    public function test_repos_missing_from_the_public_list_cannot_be_added(): void
    {
        $this->actingAs(User::factory()->create());

        $this->post('/admin/projects', ['repo' => 'Some-Private-Repo'])->assertStatus(422);
        $this->assertDatabaseMissing('portfolio_projects', ['repo' => 'Some-Private-Repo']);
    }

    public function test_export_skips_missing_and_case_mismatched_repos_and_extra_repos(): void
    {
        PortfolioProject::create(['slug' => 'public', 'repo' => 'A', 'visible' => true, 'extra_repos' => ['Brand-New-Repo', 'Private', 'a']]);
        PortfolioProject::create(['slug' => 'private', 'repo' => 'Private', 'visible' => true]);
        PortfolioProject::create(['slug' => 'wrong-case', 'repo' => 'a', 'visible' => true]);
        $this->artisan('portfolio:export')
            ->expectsOutput('Skipped project private: Private is not public.')
            ->expectsOutput('Skipped project wrong-case: a is not public.')
            ->expectsOutput('Skipped extra repository Private: not public.')
            ->expectsOutput('Skipped extra repository a: not public.')
            ->assertExitCode(Command::SUCCESS);
        $this->assertSame(['public'], array_column($this->exported(), 'slug'));
        $this->assertSame(['https://github.com/ayberkaarda/Brand-New-Repo'], $this->exported()[0]['extraRepoUrls']);
    }

    public function test_empty_public_list_preserves_existing_export(): void
    {
        Http::swap(new \Illuminate\Http\Client\Factory);
        Http::fake(['api.github.com/*' => Http::response([], 500)]);
        File::ensureDirectoryExists(dirname($this->exportPath));
        File::put($this->exportPath, 'existing');
        $this->artisan('portfolio:export')->assertExitCode(Command::FAILURE);
        $this->assertSame('existing', File::get($this->exportPath));
        $this->actingAs(User::factory()->create())->post('/admin/export')->assertSessionHas('error')->assertSessionMissing('ok');
        $this->assertSame('existing', File::get($this->exportPath));
    }

    public function test_offline_option_bypasses_verification(): void
    {
        Http::swap(new \Illuminate\Http\Client\Factory);
        Http::fake(['api.github.com/*' => Http::response([], 500)]);
        PortfolioProject::create(['slug' => 'offline', 'repo' => 'Offline', 'visible' => true]);
        $this->artisan('portfolio:export', ['--allow-unverified' => true])->assertExitCode(Command::SUCCESS);
        $this->assertSame(['offline'], array_column($this->exported(), 'slug'));
        Http::assertNothingSent();
    }

    public function test_publish_rejects_unpushed_commits(): void
    {
        config(['portfolio.publish_enabled' => true]);
        Process::fake(fn ($process) => Process::result(
            output: $process->command === ['git', 'rev-list', '--count', 'refs/remotes/origin/main..HEAD'] ? "1\n" : '',
        ));
        $this->actingAs(User::factory()->create())->post('/admin/publish')->assertSessionHas('error', 'İtilmemiş yerel commit olduğu için yayınlama reddedildi.');
        Process::assertRanTimes(fn ($process) => true, 3);
        $this->assertFileDoesNotExist($this->exportPath);
    }

    public function test_publish_compares_against_the_push_target_not_the_upstream(): void
    {
        config(['portfolio.publish_enabled' => true, 'portfolio.publish_branch' => 'release']);
        // The upstream would report 0, the push target reports 2: publish must refuse.
        Process::fake(fn ($process) => Process::result(output: match ($process->command) {
            ['git', 'rev-list', '--count', '@{u}..HEAD'] => "0\n",
            ['git', 'rev-list', '--count', 'refs/remotes/origin/release..HEAD'] => "2\n",
            default => '',
        }));
        $this->actingAs(User::factory()->create())->post('/admin/publish')->assertSessionHas('error', 'İtilmemiş yerel commit olduğu için yayınlama reddedildi.');
        Process::assertRan(fn ($process) => $process->command === ['git', 'rev-parse', '--verify', '--quiet', 'refs/remotes/origin/release']);
        Process::assertDidntRun(fn ($process) => in_array('@{u}..HEAD', $process->command, true));
        Process::assertDidntRun(fn ($process) => ($process->command[1] ?? null) === 'push');
        $this->assertFileDoesNotExist($this->exportPath);
    }

    public function test_publish_rejects_missing_remote_branch(): void
    {
        config(['portfolio.publish_enabled' => true]);
        Process::fake(fn ($process) => ($process->command[1] ?? null) === 'rev-parse'
            ? Process::result(exitCode: 1)
            : Process::result());
        $this->actingAs(User::factory()->create())->post('/admin/publish')->assertSessionHas('error', 'Uzak dal origin/main bulunamadığı için yayınlama reddedildi.');
        Process::assertDidntRun(fn ($process) => ($process->command[1] ?? null) === 'rev-list');
        $this->assertFileDoesNotExist($this->exportPath);
    }

    public function test_publish_pushes_to_the_same_branch_it_checked(): void
    {
        config(['portfolio.publish_enabled' => true, 'portfolio.publish_branch' => 'release']);
        Process::fake(fn ($process) => match ($process->command[1] ?? null) {
            'rev-list' => Process::result(output: "0\n"),
            'diff' => Process::result(exitCode: 1),
            default => Process::result(),
        });
        $this->actingAs(User::factory()->create())->post('/admin/publish')->assertSessionHas('ok');
        Process::assertRan(fn ($process) => $process->command === ['git', 'rev-parse', '--verify', '--quiet', 'refs/remotes/origin/release']);
        Process::assertRan(fn ($process) => $process->command === ['git', 'rev-list', '--count', 'refs/remotes/origin/release..HEAD']);
        Process::assertRan(fn ($process) => $process->command === ['git', 'push', 'origin', 'HEAD:refs/heads/release']);
        $this->assertFileExists($this->exportPath);
    }

    public function test_publish_rejects_invalid_branch_name(): void
    {
        config(['portfolio.publish_enabled' => true]);
        Process::fake();
        $user = User::factory()->create();
        foreach (['--force', "main\n", 'a//b', 'refs/heads/main', 'a.lock', 'a.', 'a b', 'feature/x', 'ä', '', '-x'] as $branch) {
            config(['portfolio.publish_branch' => $branch]);
            $this->actingAs($user)->post('/admin/publish')->assertSessionHas('error', 'Yayın dalı adı geçersiz olduğu için yayınlama reddedildi.');
        }
        Process::assertNothingRan();
        Http::assertNothingSent();
    }

    public function test_publish_accepts_plain_branch_names(): void
    {
        config(['portfolio.publish_enabled' => true]);
        Process::fake(fn ($process) => Process::result(output: ($process->command[1] ?? null) === 'rev-list' ? "0\n" : ''));
        $user = User::factory()->create();
        foreach (['main', 'release_2026', 'gh-pages'] as $branch) {
            config(['portfolio.publish_branch' => $branch]);
            $this->actingAs($user)->post('/admin/publish')->assertSessionHas('ok', 'Yayınlanacak değişiklik yok.');
            Process::assertRan(fn ($process) => $process->command === ['git', 'rev-list', '--count', "refs/remotes/origin/$branch..HEAD"]);
        }
    }

    public function test_connection_exception_fails_export_and_publish_and_drops_stale_cache(): void
    {
        config(['portfolio.publish_enabled' => true]);
        Cache::put('github.repos.ayberkaarda', [['name' => 'A']], 600);
        PortfolioProject::create(['slug' => 'a', 'repo' => 'A', 'visible' => true]);
        Http::swap(new \Illuminate\Http\Client\Factory);
        Http::fake(fn () => throw new \Illuminate\Http\Client\ConnectionException('cURL error 6: Could not resolve host'));
        Process::fake();
        File::put($this->exportPath, 'existing');

        $this->artisan('portfolio:export')
            ->expectsOutput('Public repository list unavailable; export cancelled.')
            ->assertExitCode(Command::FAILURE);
        $this->assertNull(Cache::get('github.repos.ayberkaarda'));

        Cache::put('github.repos.ayberkaarda', [['name' => 'A']], 600);
        $user = User::factory()->create();
        $this->actingAs($user)->post('/admin/export')->assertSessionHas('error', 'Dışa aktarım doğrulanamadı.');
        $this->actingAs($user)->post('/admin/publish')->assertSessionHas('error', 'Depolar doğrulanamadığı için yayınlama reddedildi.');
        $this->assertNull(Cache::get('github.repos.ayberkaarda'));
        $this->assertSame('existing', File::get($this->exportPath));
        Process::assertNothingRan();
    }

    /** Replaces $link with a link to $target; returns false when the platform refuses. */
    private function makeDirectoryLink(string $target, string $link): bool
    {
        if (@symlink($target, $link)) {
            return true;
        }
        if (PHP_OS_FAMILY === 'Windows') {
            exec('cmd /c mklink /J "'.str_replace('/', '\\', $link).'" "'.str_replace('/', '\\', $target).'" 2>NUL', $out, $code);

            return $code === 0 && is_dir($link);
        }

        return false;
    }

    private function removeDirectoryLink(string $link): void
    {
        if (PHP_OS_FAMILY === 'Windows') {
            @rmdir($link);
        } else {
            @unlink($link);
        }
    }

    public function test_export_and_publish_refuse_a_linked_data_directory(): void
    {
        $outside = sys_get_temp_dir().'/portfolio-outside-'.uniqid();
        File::ensureDirectoryExists($outside);
        $data = dirname($this->exportPath);
        File::deleteDirectory($data);
        if (! $this->makeDirectoryLink($outside, $data)) {
            File::deleteDirectory($outside);
            $this->markTestSkipped('Neither a symlink nor a junction could be created in the temp directory.');
        }

        try {
            config(['portfolio.publish_enabled' => true]);
            Process::fake();
            PortfolioProject::create(['slug' => 'a', 'repo' => 'A', 'visible' => true]);

            $this->artisan('portfolio:export')
                ->expectsOutput('Export path is a link or resolves outside the repository; export cancelled.')
                ->assertExitCode(Command::FAILURE);
            $this->actingAs(User::factory()->create())->post('/admin/publish')
                ->assertSessionHas('error', 'Dışa aktarım yolu yayın dosyasıyla eşleşmediği için yayınlama reddedildi.');

            $this->assertFileDoesNotExist($outside.'/projects.json');
            Process::assertNothingRan();
        } finally {
            $this->removeDirectoryLink($data);
            File::deleteDirectory($outside);
        }
    }

    public function test_export_and_publish_refuse_a_linked_parent_directory(): void
    {
        // frontend/public -> outside/public, so frontend/public/data resolves outside the root.
        $outside = sys_get_temp_dir().'/portfolio-outside-'.uniqid();
        File::ensureDirectoryExists($outside.'/public/data');
        $public = $this->root.'/frontend/public';
        File::deleteDirectory($public);
        if (! $this->makeDirectoryLink($outside.'/public', $public)) {
            File::deleteDirectory($outside);
            $this->markTestSkipped('Neither a symlink nor a junction could be created in the temp directory.');
        }

        try {
            config(['portfolio.publish_enabled' => true]);
            Process::fake();
            $this->artisan('portfolio:export')->assertExitCode(Command::FAILURE);
            $this->actingAs(User::factory()->create())->post('/admin/publish')
                ->assertSessionHas('error', 'Dışa aktarım yolu yayın dosyasıyla eşleşmediği için yayınlama reddedildi.');
            $this->assertFileDoesNotExist($outside.'/public/data/projects.json');
            Process::assertNothingRan();
        } finally {
            $this->removeDirectoryLink($public);
            File::deleteDirectory($outside);
        }
    }

    public function test_export_and_publish_refuse_a_linked_export_file(): void
    {
        $outside = sys_get_temp_dir().'/portfolio-outside-'.uniqid().'.json';
        File::put($outside, 'outside');
        if (! @symlink($outside, $this->exportPath)) {
            File::delete($outside);
            $this->markTestSkipped('File symlinks need Developer Mode or administrator rights on Windows; this platform refused symlink().');
        }

        try {
            config(['portfolio.publish_enabled' => true]);
            Process::fake();
            $this->artisan('portfolio:export')->assertExitCode(Command::FAILURE);
            $this->actingAs(User::factory()->create())->post('/admin/publish')
                ->assertSessionHas('error', 'Dışa aktarım yolu yayın dosyasıyla eşleşmediği için yayınlama reddedildi.');
            $this->assertSame('outside', File::get($outside));
            Process::assertNothingRan();
        } finally {
            @unlink($this->exportPath);
            File::delete($outside);
        }
    }

    public function test_export_refuses_a_path_outside_the_repository_root(): void
    {
        $outside = sys_get_temp_dir().'/portfolio-outside-'.uniqid();
        File::ensureDirectoryExists($outside);
        config(['portfolio.export_path' => $outside.'/projects.json']);
        try {
            $this->artisan('portfolio:export')->assertExitCode(Command::FAILURE);
            $this->assertFileDoesNotExist($outside.'/projects.json');
            config(['portfolio.export_path' => $this->root.'/frontend/../../'.basename($outside).'/new/projects.json']);
            $this->artisan('portfolio:export')->assertExitCode(Command::FAILURE);
            $this->assertDirectoryDoesNotExist($outside.'/new');
        } finally {
            File::deleteDirectory($outside);
        }
    }

    public function test_publish_rejects_export_path_outside_the_published_file(): void
    {
        config(['portfolio.publish_enabled' => true]);
        $elsewhere = $this->root.'/other/projects.json';
        File::ensureDirectoryExists(dirname($elsewhere));
        Process::fake();
        $user = User::factory()->create();

        foreach ([$elsewhere, $this->root.'/frontend/public/data/../data2/projects.json', '', $this->root.'/missing-dir/projects.json'] as $path) {
            config(['portfolio.export_path' => $path]);
            $this->actingAs($user)->post('/admin/publish')->assertSessionHas('error', 'Dışa aktarım yolu yayın dosyasıyla eşleşmediği için yayınlama reddedildi.');
        }
        Process::assertNothingRan();
        $this->assertFileDoesNotExist($elsewhere);
    }

    public function test_publish_accepts_an_equivalent_non_normalized_export_path(): void
    {
        config(['portfolio.publish_enabled' => true]);
        config(['portfolio.export_path' => $this->root.'/frontend/public/../public/data/projects.json']);
        Process::fake(fn ($process) => Process::result(output: ($process->command[1] ?? null) === 'rev-list' ? "0\n" : ''));
        $this->actingAs(User::factory()->create())->post('/admin/publish')->assertSessionHas('ok', 'Yayınlanacak değişiklik yok.');
    }

    public function test_publish_process_exception_returns_generic_error_and_masks_credentials(): void
    {
        config(['portfolio.publish_enabled' => true]);
        Log::spy();
        Process::fake(function ($process) {
            if (($process->command[1] ?? null) === 'status') {
                throw new \RuntimeException('timed out: https://bob:s3cret-token@github.com/ayberkaarda/Portfolio.git');
            }

            return Process::result();
        });

        $this->actingAs(User::factory()->create())->post('/admin/publish')
            ->assertRedirect()
            ->assertSessionHas('error', 'Yayınlama başarısız oldu. Ayrıntılar uygulama günlüğüne kaydedildi.');

        Log::shouldHaveReceived('warning')->once()->withArgs(function ($message, $context) {
            $logged = json_encode($context);

            return $context['operation'] === 'exception'
                && ! str_contains($logged, 's3cret-token')
                && ! str_contains($logged, 'bob:')
                && str_contains($context['exception'], 'https://***@github.com/ayberkaarda/Portfolio.git');
        });
        $this->assertFileDoesNotExist($this->exportPath);
    }

    public function test_failed_process_output_is_masked_in_the_log(): void
    {
        config(['portfolio.publish_enabled' => true]);
        Log::spy();
        Process::fake(fn ($process) => match ($process->command[1] ?? null) {
            'rev-list' => Process::result(output: "0\n"),
            'diff' => Process::result(exitCode: 1),
            'push' => Process::result(errorOutput: 'fatal: unable to access https://user:pass@github.com/x.git', exitCode: 128),
            default => Process::result(),
        });
        $this->actingAs(User::factory()->create())->post('/admin/publish')->assertSessionHas('error', 'Yayınlama başarısız oldu. Ayrıntılar uygulama günlüğüne kaydedildi.');
        Log::shouldHaveReceived('warning')->once()->withArgs(fn ($message, $context) => $context['operation'] === 'push'
            && $context['exit_code'] === 128
            && $context['summary'] === 'fatal: unable to access https://***@github.com/x.git'
            && ! array_key_exists('stdout', $context)
            && ! array_key_exists('stderr', $context));
    }

    public function test_log_summary_masks_headers_query_tokens_and_multiple_at_signs_and_is_bounded(): void
    {
        config(['portfolio.publish_enabled' => true]);
        Log::spy();
        $secrets = ['bearer-SECRET-1', 'YmFzaWMtU0VDUkVULTI=', 'qs-SECRET-3', 'qs-SECRET-4', 'pw-SECRET-5', 'u-SECRET-6', 'p@ss-SECRET-7', 'ghp_SECRET8abcdefghijklmnop'];
        $stderr = implode("\n", [
            'Authorization: Bearer bearer-SECRET-1',
            'authorization: Basic YmFzaWMtU0VDUkVULTI=',
            'GET https://api.example.com/x?access_token=qs-SECRET-3&page=2',
            'retry https://example.com/y?a=1&token=qs-SECRET-4',
            'login?user=bob&password=pw-SECRET-5',
            'fatal: https://u-SECRET-6:p@ss-SECRET-7@github.com/ayberkaarda/Portfolio.git',
            'token ghp_SECRET8abcdefghijklmnop',
        ]);
        $stdout = str_repeat('x', 2000);
        Process::fake(fn ($process) => match ($process->command[1] ?? null) {
            'rev-list' => Process::result(output: "0\n"),
            'diff' => Process::result(exitCode: 1),
            'push' => Process::result(output: $stdout, errorOutput: $stderr, exitCode: 128),
            default => Process::result(),
        });

        $this->actingAs(User::factory()->create())->post('/admin/publish')->assertSessionHas('error', 'Yayınlama başarısız oldu. Ayrıntılar uygulama günlüğüne kaydedildi.');

        Log::shouldHaveReceived('warning')->once()->withArgs(function ($message, $context) use ($secrets) {
            $logged = json_encode($context, JSON_UNESCAPED_SLASHES);
            foreach ($secrets as $secret) {
                if (str_contains($logged, $secret)) {
                    return false;
                }
            }

            return mb_strlen($context['summary']) <= 500
                && str_contains($context['summary'], 'Authorization: Bearer ***')
                && str_contains($context['summary'], 'access_token=***&page=2')
                && str_contains($context['summary'], 'password=***')
                && str_contains($context['summary'], 'https://***@github.com/ayberkaarda/Portfolio.git')
                && ! str_contains($logged, str_repeat('x', 501));
        });
    }

    public function test_export_uses_a_fresh_repo_list_not_the_cached_one(): void
    {
        $this->actingAs(User::factory()->create());
        PortfolioProject::create(['slug' => 'a', 'repo' => 'A', 'visible' => true, 'sort' => 1, 'texts' => $this->storedTexts('A')]);

        // The panel caches a list in which A is public.
        $this->get('/admin')->assertOk();
        $this->assertContains('A', array_column(Cache::get('github.repos.ayberkaarda'), 'name'));

        // A becomes private on GitHub.
        Http::swap(new \Illuminate\Http\Client\Factory);
        Http::fake(['api.github.com/*' => Http::response([
            ['name' => 'Brand-New-Repo', 'html_url' => 'https://github.com/ayberkaarda/Brand-New-Repo'],
        ])]);

        $this->artisan('portfolio:export')
            ->expectsOutput('Skipped project a: A is not public.')
            ->assertExitCode(Command::SUCCESS);
        Http::assertSentCount(1);
        $this->assertSame([], $this->exported());
        // The refreshed list replaces the stale cache entry.
        $this->assertSame(['Brand-New-Repo'], array_column(Cache::get('github.repos.ayberkaarda'), 'name'));
    }

    public function test_publish_uses_a_fresh_repo_list_not_the_cached_one(): void
    {
        config(['portfolio.publish_enabled' => true]);
        $this->actingAs(User::factory()->create());
        PortfolioProject::create(['slug' => 'a', 'repo' => 'A', 'visible' => true, 'sort' => 1, 'texts' => $this->storedTexts('A')]);
        $this->get('/admin')->assertOk();

        Http::swap(new \Illuminate\Http\Client\Factory);
        Http::fake(['api.github.com/*' => Http::response([
            ['name' => 'Brand-New-Repo', 'html_url' => 'https://github.com/ayberkaarda/Brand-New-Repo'],
        ])]);
        Process::fake();

        $this->post('/admin/publish')->assertSessionHas('error', 'Depolar doğrulanamadığı için yayınlama reddedildi.');
        Http::assertSentCount(1);
        Process::assertNothingRan();
    }

    public function test_panel_keeps_using_the_cached_list(): void
    {
        $this->actingAs(User::factory()->create());
        $this->get('/admin')->assertOk();
        $this->get('/admin')->assertOk();
        Http::assertSentCount(1);
    }

    public function test_publish_rejects_other_changed_or_staged_files(): void
    {
        config(['portfolio.publish_enabled' => true]);
        foreach ([" M other.txt\n", "M  other.txt\n", "?? other.txt\n", "R  other.txt -> frontend/public/data/projects.json\n"] as $index => $status) {
            Process::fake(fn ($process) => Process::result(output: $status));
            $this->actingAs(User::factory()->create())->post('/admin/publish')->assertSessionHas('error', 'Başka dosyalarda değişiklik olduğu için yayınlama reddedildi.');
            Process::assertRanTimes(fn ($process) => true, $index + 1);
        }
        $this->assertFileDoesNotExist($this->exportPath);
    }

    public function test_publish_rejects_private_or_missing_primary_and_extra_repos(): void
    {
        config(['portfolio.publish_enabled' => true]);
        Process::fake();
        $project = PortfolioProject::create(['slug' => 'private', 'repo' => 'Private', 'visible' => true]);
        $this->actingAs(User::factory()->create())->post('/admin/publish')->assertSessionHas('error');
        $project->update(['repo' => 'A', 'extra_repos' => ['Private']]);
        $this->post('/admin/publish')->assertSessionHas('error');
        Process::assertNothingRan();
        $this->assertFileDoesNotExist($this->exportPath);
    }

    public function test_admin_is_local_only_unless_explicitly_enabled(): void
    {
        $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.10'])->get('/admin/login')->assertForbidden();
        $this->post('/admin/export')->assertForbidden();
        config(['portfolio.allow_remote_admin' => true]);
        $this->get('/admin/login')->assertOk();
        config(['portfolio.allow_remote_admin' => false]);
        $this->withServerVariables(['REMOTE_ADDR' => '::1'])->get('/admin/login')->assertOk();
    }

    public function test_web_responses_have_security_headers(): void
    {
        $response = $this->get('/admin/login');
        $response->assertOk()
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('Referrer-Policy', 'no-referrer')
            ->assertHeader('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
        $response->assertHeaderMissing('X-Powered-By');
    }
}
