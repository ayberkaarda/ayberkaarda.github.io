<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Support\Facades\Route;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class HttpHardeningTest extends TestCase
{
    use RefreshDatabase;

    private const CSP = "default-src 'self'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";

    protected function setUp(): void
    {
        parent::setUp();
        config(['portfolio.allow_remote_admin' => false]);

        Route::get('/__hardening/419', fn () => throw new TokenMismatchException('CSRF token mismatch.'));
        Route::get('/__hardening/500', fn () => throw new \RuntimeException('boom'));
    }

    private function assertSecurityHeaders(TestResponse $response, int $status): void
    {
        $response->assertStatus($status)
            ->assertHeader('X-Frame-Options', 'DENY')
            ->assertHeader('X-Content-Type-Options', 'nosniff')
            ->assertHeader('Referrer-Policy', 'no-referrer')
            ->assertHeader('Content-Security-Policy', self::CSP)
            ->assertHeaderMissing('X-Powered-By');
    }

    public function test_security_headers_on_403(): void
    {
        $this->assertSecurityHeaders($this->withServerVariables(['REMOTE_ADDR' => '203.0.113.10'])->get('/admin/login'), 403);
    }

    public function test_security_headers_on_404(): void
    {
        $this->assertSecurityHeaders($this->get('/no-such-page'), 404);
    }

    public function test_security_headers_on_405(): void
    {
        $this->assertSecurityHeaders($this->get('/admin/export'), 405);
    }

    public function test_security_headers_on_419(): void
    {
        $this->assertSecurityHeaders($this->get('/__hardening/419'), 419);
    }

    public function test_security_headers_on_429(): void
    {
        for ($i = 0; $i < 6; $i++) {
            $this->post('/admin/login', ['email' => 'x@example.com', 'password' => 'wrong']);
        }
        $this->assertSecurityHeaders($this->post('/admin/login', ['email' => 'x@example.com', 'password' => 'wrong']), 429);
    }

    public function test_security_headers_on_500(): void
    {
        $this->assertSecurityHeaders($this->get('/__hardening/500'), 500);
    }

    public function test_forwarded_headers_cannot_make_a_remote_client_look_local(): void
    {
        $remote = ['REMOTE_ADDR' => '203.0.113.10'];

        $this->withServerVariables($remote)->withHeaders(['X-Forwarded-For' => '127.0.0.1'])
            ->get('/admin/login')->assertForbidden();
        $this->withServerVariables($remote)->withHeaders(['X-Forwarded-For' => '::1'])
            ->get('/admin/login')->assertForbidden();
        $this->withServerVariables($remote)->withHeaders(['Forwarded' => 'for=127.0.0.1'])
            ->get('/admin/login')->assertForbidden();
    }

    public function test_forwarded_headers_are_ignored_even_for_hosts_the_framework_auto_trusts(): void
    {
        // The framework TrustProxies trusts every proxy for *.on-forge.com hosts.
        $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.10', 'HTTP_HOST' => 'panel.on-forge.com'])
            ->withHeaders(['X-Forwarded-For' => '127.0.0.1'])
            ->get('http://panel.on-forge.com/admin/login')->assertForbidden();
    }

    public function test_forwarded_headers_are_ignored_even_if_trusted_proxy_config_is_set(): void
    {
        config(['trustedproxy.proxies' => '*']);
        $this->withServerVariables(['REMOTE_ADDR' => '203.0.113.10'])
            ->withHeaders(['X-Forwarded-For' => '127.0.0.1'])
            ->get('/admin/login')->assertForbidden();
    }

    public function test_loopback_client_is_still_allowed_regardless_of_forwarded_header(): void
    {
        $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
            ->withHeaders(['X-Forwarded-For' => '203.0.113.10'])
            ->get('/admin/login')->assertOk();
        $this->withServerVariables(['REMOTE_ADDR' => '::1'])->get('/admin/login')->assertOk();
    }
}
