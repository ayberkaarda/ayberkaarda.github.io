<?php

namespace App\Console\Commands;

use App\Models\PortfolioProject;
use App\Services\GitHubRepos;
use App\Support\DetailParser;
use App\Support\ExportTarget;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class PortfolioExport extends Command
{
    protected $signature = 'portfolio:export {--allow-unverified : Skip verification for local/offline use}';

    protected $description = 'Görünür projeleri statik sitenin okuduğu projects.json dosyasına yazar';

    public function handle(GitHubRepos $github): int
    {
        $user = config('portfolio.github_user');
        $verify = ! $this->option('allow-unverified');
        $names = $verify ? array_column($github->publicRepos(fresh: true), 'name') : [];
        if ($verify && $names === []) {
            $this->error('Public repository list unavailable; export cancelled.');
            return self::FAILURE;
        }

        $projects = PortfolioProject::query()
            ->where('visible', true)
            ->orderBy('sort')
            ->get()
            ->filter(function ($project) use ($verify, $names) {
                if ($verify && ! in_array($project->repo, $names, true)) {
                    $this->warn("Skipped project {$project->slug}: {$project->repo} is not public.");
                    return false;
                }
                return true;
            })
            ->map(fn (PortfolioProject $p) => [
                'slug' => $p->slug,
                'featured' => $p->featured,
                'year' => $p->year,
                'wip' => $p->wip,
                'image' => $p->image ? '/projects/'.$p->image : null,
                'stack' => $p->stack ?? [],
                'repoUrl' => "https://github.com/$user/{$p->repo}",
                'extraRepoUrls' => collect($p->extra_repos ?? [])
                    ->filter(function ($repo) use ($verify, $names) {
                        if ($verify && ! in_array($repo, $names, true)) {
                            $this->warn("Skipped extra repository $repo: not public.");
                            return false;
                        }
                        return true;
                    })
                    ->map(fn ($r) => "https://github.com/$user/$r")->values()->all(),
                'texts' => collect($p->texts ?? [])->map(fn ($t) => [
                    'name' => $t['name'] ?? $p->slug,
                    'summary' => $t['summary'] ?? '',
                    'description' => $t['description'] ?? '',
                    'highlights' => array_values($t['highlights'] ?? []),
                    // The raw details text is parsed here and never written itself.
                    'sections' => DetailParser::parse(is_string($t['details'] ?? null) ? $t['details'] : ''),
                ])->all(),
            ])->values()->all();

        $path = (string) config('portfolio.export_path');
        if (! ExportTarget::isWritableInside((string) config('portfolio.repo_root'), $path)) {
            $this->error('Export path is a link or resolves outside the repository; export cancelled.');
            return self::FAILURE;
        }
        File::ensureDirectoryExists(dirname($path));
        if (! ExportTarget::isWritableInside((string) config('portfolio.repo_root'), $path)) {
            $this->error('Export path is a link or resolves outside the repository; export cancelled.');
            return self::FAILURE;
        }
        File::put($path, json_encode(
            ['projects' => $projects],
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR,
        )."\n");

        $this->info(count($projects)." proje yazıldı: $path");

        return self::SUCCESS;
    }
}
