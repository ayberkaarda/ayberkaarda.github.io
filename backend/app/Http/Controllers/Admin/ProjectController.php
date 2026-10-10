<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PortfolioProject;
use App\Services\GitHubRepos;
use App\Support\DetailParser;
use App\Support\ExportTarget;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Contracts\Process\ProcessResult;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\View\View;
use Throwable;

class ProjectController extends Controller
{
    private const EXPORT_FILE = 'frontend/public/data/projects.json';

    public function index(GitHubRepos $github): View
    {
        $projects = PortfolioProject::orderBy('sort')->get();
        $repos = collect($github->publicRepos());
        $publicNames = $repos->pluck('name');

        $known = $projects->flatMap(fn ($p) => array_merge([$p->repo], $p->extra_repos ?? []));

        return view('admin.projects', [
            'projects' => $projects,
            'languages' => config('portfolio.languages'),
            // Yeni repolar burada listelenir ama siteye girmez; önce elle eklenmeleri gerekir.
            'available' => $repos->reject(fn ($r) => $known->contains($r['name']))->values(),
            'privateOrMissing' => $repos->isEmpty()
                ? collect()
                : $projects->filter(fn ($p) => collect(array_merge([$p->repo], $p->extra_repos ?? []))->contains(fn ($name) => ! $publicNames->containsStrict($name)))->pluck('slug'),
            'githubOk' => $repos->isNotEmpty(),
            'publishEnabled' => config('portfolio.publish_enabled'),
            'githubUser' => config('portfolio.github_user'),
        ]);
    }

    public function store(Request $request, GitHubRepos $github): RedirectResponse
    {
        $name = $request->validate(['repo' => ['required', 'string', 'max:100']])['repo'];

        $repo = collect($github->publicRepos())->firstWhere('name', $name);
        abort_unless($repo, 422, 'Repo herkese açık değil ya da bulunamadı.');

        $slug = Str::slug($name);
        if (PortfolioProject::where('slug', $slug)->exists()) {
            return back()->with('error', "Bu proje zaten ekli: $slug");
        }

        $text = [
            'name' => $name,
            'summary' => Str::limit($repo['description'] ?? $name, 190, ''),
            'description' => $repo['description'] ?? '',
            'highlights' => [],
        ];

        PortfolioProject::create([
            'slug' => $slug,
            'repo' => $name,
            'visible' => false, // Eklenen proje varsayılan olarak gizli.
            'featured' => false,
            'sort' => (int) PortfolioProject::max('sort') + 1,
            'year' => $repo['pushed_at'] ? (int) substr($repo['pushed_at'], 0, 4) : null,
            'stack' => array_values(array_filter([$repo['language']])),
            'texts' => array_fill_keys(config('portfolio.languages'), $text),
        ]);

        return back()->with('ok', "Eklendi (gizli): $name. Dört dildeki metinleri düzenleyip görünür yapın.");
    }

    public function update(Request $request, PortfolioProject $project): RedirectResponse
    {
        // Browsers submit textarea line breaks as CRLF; the length limit applies to the normalized text.
        $input = $request->input('texts');
        if (is_array($input)) {
            foreach ($input as $lang => $t) {
                if (is_array($t) && is_string($t['details'] ?? null)) {
                    $input[$lang]['details'] = DetailParser::normalize($t['details']);
                }
            }
            $request->merge(['texts' => $input]);
        }

        $rules = [
            'sort' => ['required', 'integer', 'min:0'],
            'year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'stack' => ['nullable', 'string', 'max:300'],
            'texts' => ['required', 'array'],
        ];
        foreach (config('portfolio.languages') as $lang) {
            $rules["texts.$lang.name"] = ['required', 'string', 'max:120'];
            $rules["texts.$lang.summary"] = ['required', 'string', 'max:200'];
            $rules["texts.$lang.description"] = ['required', 'string', 'max:1500'];
            $rules["texts.$lang.highlights"] = ['nullable', 'string', 'max:1500'];
            $rules["texts.$lang.details"] = ['nullable', 'string', 'max:'.DetailParser::MAX_LENGTH];
        }
        $data = $request->validate($rules);

        $texts = collect($data['texts'])->map(fn ($t) => [
            'name' => trim($t['name']),
            'summary' => trim($t['summary']),
            'description' => trim($t['description']),
            'highlights' => collect(preg_split('/\R/', (string) ($t['highlights'] ?? '')))
                ->map(fn ($line) => trim($line))->filter()->values()->all(),
            'details' => DetailParser::normalize($t['details'] ?? ''),
        ])->all();

        $project->update([
            'visible' => $request->boolean('visible'),
            'featured' => $request->boolean('featured'),
            'wip' => $request->boolean('wip'),
            'sort' => $data['sort'],
            'year' => $data['year'] ?? null,
            'stack' => collect(explode(',', (string) ($data['stack'] ?? '')))
                ->map(fn ($item) => trim($item))->filter()->values()->all(),
            'texts' => $texts,
        ]);

        return back()->with('ok', "Kaydedildi: {$project->slug}");
    }

    public function export(): RedirectResponse
    {
        if (Artisan::call('portfolio:export') !== 0) {
            return back()->with('error', 'Dışa aktarım doğrulanamadı.');
        }

        return back()->with('ok', trim(Artisan::output()));
    }

    public function publish(GitHubRepos $github): RedirectResponse
    {
        abort_unless(config('portfolio.publish_enabled'), 403, 'Yayınlama kapalı (PORTFOLIO_PUBLISH_ENABLED).');

        $root = (string) config('portfolio.repo_root');
        if (! ExportTarget::isPublishedFile($root, (string) config('portfolio.export_path'))) {
            return back()->with('error', 'Dışa aktarım yolu yayın dosyasıyla eşleşmediği için yayınlama reddedildi.');
        }

        $branch = (string) config('portfolio.publish_branch', 'main');
        // A plain branch name only: no "/", ".", leading "-" or trailing newline.
        if (! preg_match('/\A[A-Za-z0-9_][A-Za-z0-9_-]*\z/', $branch)) {
            return back()->with('error', 'Yayın dalı adı geçersiz olduğu için yayınlama reddedildi.');
        }

        $names = array_column($github->publicRepos(fresh: true), 'name');
        $privateOrMissing = PortfolioProject::all()->filter(fn ($p) =>
            collect(array_merge([$p->repo], $p->extra_repos ?? []))
                ->contains(fn ($name) => ! in_array($name, $names, true))
        );
        if ($names === [] || $privateOrMissing->isNotEmpty()) {
            return back()->with('error', 'Depolar doğrulanamadığı için yayınlama reddedildi.');
        }

        try {
            return $this->runPublish($root, $branch);
        } catch (Throwable $e) {
            return $this->publishFailure('exception', null, $e);
        }
    }

    private function runPublish(string $root, string $branch): RedirectResponse
    {
        $status = Process::path($root)->run(['git', 'status', '--porcelain']);
        if ($status->failed()) {
            return $this->publishFailure('status', $status);
        }
        foreach (preg_split('/\r?\n/', rtrim($status->output(), "\r\n")) as $line) {
            if ($line !== '' && substr($line, 3) !== self::EXPORT_FILE) {
                return back()->with('error', 'Başka dosyalarda değişiklik olduğu için yayınlama reddedildi.');
            }
        }
        // Existence, unpushed-commit count and push all use fully qualified refs of the same branch.
        $remoteRef = "refs/remotes/origin/$branch";
        $remote = Process::path($root)->run(['git', 'rev-parse', '--verify', '--quiet', $remoteRef]);
        if ($remote->failed()) {
            return back()->with('error', "Uzak dal origin/$branch bulunamadığı için yayınlama reddedildi.");
        }
        $ahead = Process::path($root)->run(['git', 'rev-list', '--count', "$remoteRef..HEAD"]);
        if ($ahead->failed()) {
            return $this->publishFailure('rev-list', $ahead);
        }
        if (trim($ahead->output()) !== '0') {
            return back()->with('error', 'İtilmemiş yerel commit olduğu için yayınlama reddedildi.');
        }
        if (Artisan::call('portfolio:export') !== 0) {
            return back()->with('error', 'Dışa aktarım doğrulanamadı.');
        }

        $add = Process::path($root)->run(['git', 'add', '--', self::EXPORT_FILE]);
        if ($add->failed()) {
            return $this->publishFailure('add', $add);
        }

        // Çıkış kodu 0 = indekste değişiklik yok.
        $diff = Process::path($root)->run(['git', 'diff', '--cached', '--quiet', '--', self::EXPORT_FILE]);
        if ($diff->successful()) {
            return back()->with('ok', 'Yayınlanacak değişiklik yok.');
        }

        if ($diff->exitCode() !== 1) {
            return $this->publishFailure('diff', $diff);
        }

        $commit = Process::path($root)->run(
            ['git', 'commit', '-m', 'Update published projects', '--', self::EXPORT_FILE],
        );
        if ($commit->failed()) {
            return $this->publishFailure('commit', $commit);
        }

        $push = Process::path($root)->timeout(60)->run(['git', 'push', 'origin', "HEAD:refs/heads/$branch"]);
        if ($push->failed()) {
            return $this->publishFailure('push', $push);
        }

        return back()->with('ok', 'Yayınlandı. GitHub Actions siteyi 1-2 dakikada günceller.');
    }

    private const LOG_SUMMARY_LIMIT = 500;

    private function publishFailure(string $operation, ?ProcessResult $result, ?Throwable $e = null): RedirectResponse
    {
        // Raw process output is never logged, only a masked and bounded summary.
        $output = $result ? trim($result->errorOutput()."\n".$result->output()) : '';
        Log::warning('Portfolio publish command failed', [
            'operation' => $operation,
            'exit_code' => $result?->exitCode(),
            'summary' => $this->summarize($output),
            'exception' => $e ? $this->summarize(get_class($e).': '.$e->getMessage()) : null,
        ]);

        return back()->with('error', 'Yayınlama başarısız oldu. Ayrıntılar uygulama günlüğüne kaydedildi.');
    }

    private function summarize(string $text): string
    {
        return mb_substr($this->maskCredentials($text), 0, self::LOG_SUMMARY_LIMIT);
    }

    /** Hides credentials in URLs, authorization headers, query strings and token-shaped values. */
    private function maskCredentials(string $text): string
    {
        $patterns = [
            // scheme://anything@host, up to the last "@" (covers "@" inside the secret).
            '#([a-z][a-z0-9+.-]*://)[^\s\'"<>]*@#i' => '$1***@',
            // Authorization: Bearer|Basic|token <value>
            '#(authorization\s*[:=]\s*)(bearer|basic|token)?\s*[^\s\'"]+#i' => '$1$2 ***',
            '#\b(bearer|basic)\s+[A-Za-z0-9._~+/=-]+#i' => '$1 ***',
            // access_token=, token=, password= and similar parameters.
            '#\b(access_token|refresh_token|token|password|passwd|pass|secret|client_secret|api_key|apikey)=[^&\s\'"]*#i' => '$1=***',
            // GitHub token formats.
            '#\b(gh[pousr]_[A-Za-z0-9]{16,}|github_pat_[A-Za-z0-9_]{16,})#' => '***',
        ];

        return preg_replace(array_keys($patterns), array_values($patterns), $text) ?? '';
    }
}
