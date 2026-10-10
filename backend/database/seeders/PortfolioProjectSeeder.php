<?php

namespace Database\Seeders;

use App\Models\PortfolioProject;
use Illuminate\Database\Seeder;

class PortfolioProjectSeeder extends Seeder
{
    public function run(): void
    {
        $items = json_decode(file_get_contents(__DIR__.'/data/projects.json'), true, flags: JSON_THROW_ON_ERROR);

        foreach ($items as $item) {
            // Mevcut kayıtlar (panelden yapılan düzenlemeler) ezilmez.
            PortfolioProject::firstOrCreate(
                ['slug' => $item['slug']],
                [
                    'repo' => $item['repo'],
                    'extra_repos' => $item['extraRepos'] ?? [],
                    'visible' => $item['visible'],
                    'featured' => $item['featured'],
                    'sort' => $item['sort'],
                    'image' => $item['image'],
                    'year' => $item['year'],
                    'wip' => $item['wip'],
                    'stack' => $item['stack'],
                    'texts' => $item['texts'],
                ],
            );
        }
    }
}
