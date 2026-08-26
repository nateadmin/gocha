<?php

return [
    'planned_hostname' => env('GOCHA_PLANNED_HOSTNAME', 'gocha.ai'),

    'auth' => [
        'closed_membership' => env('GOCHA_CLOSED_MEMBERSHIP', false),
        'otp_length' => 6,
        'otp_ttl_minutes' => 10,
        'otp_max_attempts' => 5,
        'otp_resend_cooldown_seconds' => 60,
        'otp_request_message' => 'If your email is registered, a code has been sent.',
    ],

    'resend' => [
        'api_key' => env('RESEND_API_KEY'),
        'from' => env('RESEND_FROM', 'Gotcha <noreply@gocha.ai>'),
        'from_name' => env('RESEND_FROM_NAME', 'Gotcha'),
    ],
];
