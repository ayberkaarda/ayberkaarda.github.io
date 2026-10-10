<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LocalOnly
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless(config('portfolio.allow_remote_admin') || in_array($request->ip(), ['127.0.0.1', '::1'], true), 403);
        return $next($request);
    }
}
