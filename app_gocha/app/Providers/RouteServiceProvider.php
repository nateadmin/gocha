<?php

namespace App\Providers;

use App\Services\Auth\OtpResendCooldown;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * The path to your application's "home" route.
     *
     * Typically, users are redirected here after authentication.
     *
     * @var string
     */
    public const HOME = '/home';

    /**
     * Define your route model bindings, pattern filters, and other route configuration.
     */
    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('otp-request', function (Request $request) {
            $channel = strtolower((string) $request->input('channel', 'email'));
            $identifier = strtolower((string) $request->input('identifier', $request->input('email', '')));
            $cooldown = app(OtpResendCooldown::class);

            if ($identifier !== '' && $cooldown->isActive($channel, $identifier)) {
                return [];
            }

            $limits = [];
            if ($identifier !== '') {
                $limits[] = Limit::perMinute((int) config('gocha.auth.otp_request_per_email_per_minute', 10))
                    ->by($channel.':'.$identifier);
            }

            $limits[] = Limit::perMinute((int) config('gocha.auth.otp_request_per_ip_per_minute', 40))
                ->by($request->ip());

            return $limits;
        });

        RateLimiter::for('otp-verify', function (Request $request) {
            return Limit::perMinute(30)->by($request->ip());
        });

        $this->routes(function () {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api.php'));

            Route::middleware('web')
                ->group(base_path('routes/web.php'));
        });
    }
}
