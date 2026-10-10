<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PortfolioProject extends Model
{
    protected $fillable = [
        'slug', 'repo', 'extra_repos', 'visible', 'featured', 'sort',
        'image', 'year', 'wip', 'stack', 'texts',
    ];

    protected function casts(): array
    {
        return [
            'extra_repos' => 'array',
            'stack' => 'array',
            'texts' => 'array',
            'visible' => 'boolean',
            'featured' => 'boolean',
            'wip' => 'boolean',
        ];
    }
}
