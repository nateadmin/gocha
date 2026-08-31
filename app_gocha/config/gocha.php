<?php

return [
    'planned_hostname' => env('GOCHA_PLANNED_HOSTNAME', 'gocha.ai'),

    'auth' => [
        'closed_membership' => env('GOCHA_CLOSED_MEMBERSHIP', false),
        'otp_length' => 6,
        'otp_ttl_minutes' => 10,
        'otp_max_attempts' => 5,
        'otp_resend_cooldown_seconds' => 60,
        'otp_request_per_email_per_minute' => 10,
        'otp_request_per_ip_per_minute' => 40,
        'otp_request_message' => 'If your email is registered, a code has been sent.',
        'otp_signin_request_message' => 'A sign-in code has been sent to your email.',
        'otp_signup_request_message' => 'A verification code has been sent to your email.',
    ],

    'resend' => [
        'api_key' => env('RESEND_API_KEY'),
        'from' => env('RESEND_FROM', 'Gocha <noreply@gocha.ai>'),
        'from_name' => env('RESEND_FROM_NAME', 'Gocha'),
    ],

    'google_places_api_key' => env('GOOGLE_PLACES_API_KEY'),

    'openai' => [
        // Infisical stores this as OPEN_AI_API_KEY; accept either name.
        'api_key' => env('OPENAI_API_KEY', env('OPEN_AI_API_KEY')),
        'model' => env('OPENAI_CATCH_UP_MODEL', 'gpt-4o-mini'),
        'base_url' => 'https://api.openai.com/v1',
        'connect_timeout' => 5,
        'timeout' => 20,
        'max_tokens' => 400,
        'hourly_baseline' => 40,
        'hourly_budget' => 80,
    ],

    'catch_up' => [
        'schedule_minutes' => 5,
        'max_run_seconds' => 240,
        'lock_domain' => 'catch-up-generate',
        'lock_seconds' => 240,
        'max_messages_per_conversation' => 20,
        'max_calls_per_run' => 40,
        'heartbeat_stale_minutes' => 20,
        'watchdog_skip_threshold' => 3,
        'client_poll_seconds' => 60,
    ],

    'alerts' => [
        'to' => env('GOCHA_ALERT_EMAIL', 'nate@wefoundd.com'),
    ],

    'ai' => [
        'forbidden_characters' => ['—', '–'],
        'style_rules' => [
            'Do not use em dashes or en dashes as punctuation.',
            'Use commas, periods, or colons instead.',
        ],
    ],
];
