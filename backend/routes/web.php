<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\ProjectController;
use Illuminate\Support\Facades\Route;

// Panel yalnızca yerelde çalışır; ana sayfa yok, doğrudan girişe yönlendirir.
Route::redirect('/', '/admin');

Route::prefix('admin')->middleware(\App\Http\Middleware\LocalOnly::class)->group(function () {
    Route::get('login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:6,1');

    Route::middleware('auth')->group(function () {
        Route::post('logout', [AuthController::class, 'logout'])->name('logout');
        Route::get('/', [ProjectController::class, 'index'])->name('admin.projects');
        Route::post('projects', [ProjectController::class, 'store'])->name('admin.projects.store');
        Route::put('projects/{project}', [ProjectController::class, 'update'])->name('admin.projects.update');
        Route::post('export', [ProjectController::class, 'export'])->name('admin.export');
        Route::post('publish', [ProjectController::class, 'publish'])->name('admin.publish');
    });
});
