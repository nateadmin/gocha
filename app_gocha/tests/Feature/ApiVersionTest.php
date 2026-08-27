<?php

namespace Tests\Feature;

use Tests\TestCase;

class ApiVersionTest extends TestCase
{
    public function test_version_returns_build_stamp(): void
    {
        $response = $this->getJson('/api/version');

        $response
            ->assertOk()
            ->assertJsonPath('service', 'gocha-api')
            ->assertJsonStructure(['service', 'version', 'correlationId', 'timestamp']);
    }
}
