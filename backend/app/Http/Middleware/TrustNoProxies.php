<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Replaces the framework TrustProxies middleware: no proxy is ever trusted,
 * so X-Forwarded-* / Forwarded headers never change the client IP, host or
 * scheme. The framework version cannot express this: trustProxies(at: [])
 * is ignored (empty array is falsy), and it trusts every proxy on its own
 * for *.on-forge.com / *.on-vapor.com hosts and on Laravel Cloud.
 */
class TrustNoProxies
{
    public function handle(Request $request, Closure $next): Response
    {
        Request::setTrustedProxies([], Request::HEADER_X_FORWARDED_FOR);

        return $next($request);
    }
}
