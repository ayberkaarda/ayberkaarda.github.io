<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Lists the account's PUBLIC repositories. The call is unauthenticated,
 * so private repositories can never appear here.
 *
 * The panel may use the cached list. Export and publish must pass
 * fresh: true so that a repository made private after it was cached
 * cannot pass verification.
 */
class GitHubRepos
{
    private const TTL = 600;

    /** @return array<int, array{name:string, description:?string, language:?string, pushed_at:?string, url:string, fork:bool}> */
    public function publicRepos(bool $fresh = false): array
    {
        $key = $this->key();

        if (! $fresh) {
            $cached = Cache::get($key);
            if (is_array($cached)) {
                return $cached;
            }
        }

        $repos = $this->fetch();
        if ($repos === null) {
            // Failures are never cached; a fresh failure also drops the stale list.
            if ($fresh) {
                Cache::forget($key);
            }

            return [];
        }

        Cache::put($key, $repos, self::TTL);

        return $repos;
    }

    public function forget(): void
    {
        Cache::forget($this->key());
    }

    private function key(): string
    {
        return 'github.repos.'.config('portfolio.github_user');
    }

    private function fetch(): ?array
    {
        $user = config('portfolio.github_user');

        try {
            $response = Http::withHeaders([
                'Accept' => 'application/vnd.github+json',
                'User-Agent' => 'portfolio-admin',
            ])->get("https://api.github.com/users/$user/repos", [
                'type' => 'owner',
                'per_page' => 100,
                'sort' => 'pushed',
            ]);

            if ($response->failed() || ! is_array($response->json())) {
                return null;
            }

            return collect($response->json())->map(fn ($r) => [
                'name' => $r['name'],
                'description' => $r['description'] ?? null,
                'language' => $r['language'] ?? null,
                'pushed_at' => $r['pushed_at'] ?? null,
                'url' => $r['html_url'],
                'fork' => (bool) ($r['fork'] ?? false),
            ])->all();
        } catch (Throwable $e) {
            // Connection errors and malformed payloads count as "list unavailable".
            Log::warning('GitHub repository list unavailable', ['exception' => get_class($e)]);

            return null;
        }
    }
}
