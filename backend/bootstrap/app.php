<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Outermost global middleware: every response, including 403/404/405/
        // 419/429/500 rendered from exceptions, passes through it.
        $middleware->prepend(\App\Http\Middleware\SecurityHeaders::class);

        // No trusted proxies. See TrustNoProxies for why trustProxies() is not used.
        $middleware->replace(\Illuminate\Http\Middleware\TrustProxies::class, \App\Http\Middleware\TrustNoProxies::class);

        $middleware->prependToPriorityList(\Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests::class, \App\Http\Middleware\LocalOnly::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
