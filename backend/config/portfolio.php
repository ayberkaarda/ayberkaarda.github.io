<?php

return [
    'github_user' => env('PORTFOLIO_GITHUB_USER', 'ayberkaarda'),
    'languages' => ['tr', 'en', 'fr', 'de'],

    // Statik site tarafından okunan dosya.
    'export_path' => env('PORTFOLIO_EXPORT_PATH', base_path('../frontend/public/data/projects.json')),

    // "Yayınla" düğmesi git add/commit/push çalıştırır. Yalnızca yerelde açın.
    'publish_enabled' => (bool) env('PORTFOLIO_PUBLISH_ENABLED', false),
    'repo_root' => env('PORTFOLIO_REPO_ROOT', base_path('..')),
    'publish_branch' => env('PORTFOLIO_PUBLISH_BRANCH', 'main'),
    'allow_remote_admin' => (bool) env('PORTFOLIO_ALLOW_REMOTE_ADMIN', false),
];
