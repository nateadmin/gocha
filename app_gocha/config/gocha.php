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
        'otp_signin_request_message' => 'A sign-in code has been sent to your email.',
        'otp_signup_request_message' => 'A verification code has been sent to your email.',
    ],

    'resend' => [
        'api_key' => env('RESEND_API_KEY'),
        'from' => env('RESEND_FROM', 'Gocha <noreply@gocha.ai>'),
        'from_name' => env('RESEND_FROM_NAME', 'Gocha'),
    ],

    'google_places_api_key' => env('GOOGLE_PLACES_API_KEY'),
];
