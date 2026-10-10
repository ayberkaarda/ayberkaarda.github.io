<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('portfolio_projects', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('repo');
            $table->json('extra_repos')->nullable();
            // Allowlist: nothing is published unless visible = true.
            $table->boolean('visible')->default(false);
            $table->boolean('featured')->default(false);
            $table->unsignedInteger('sort')->default(0);
            $table->string('image')->nullable();
            $table->unsignedSmallInteger('year')->nullable();
            $table->boolean('wip')->default(false);
            $table->json('stack')->nullable();
            $table->json('texts')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('portfolio_projects');
    }
};
