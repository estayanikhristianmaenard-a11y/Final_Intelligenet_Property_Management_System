<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PortalTest extends TestCase
{
    use RefreshDatabase;

    public function test_portal_uses_existing_frontend_and_same_origin_live_configuration(): void
    {
        $this->get('/portal')->assertOk()
            ->assertSee('window.PROPERTYPRO_CONFIG={MODE:"live",BASE_URL:"/api/v1"}',false)
            ->assertSee('name="csrf-token"',false)
            ->assertSee('/portal-assets/app/app.js',false);
        $this->get('/portal-assets/app/app.js')->assertOk()->assertHeader('Content-Type','text/javascript; charset=utf-8');
        $this->get('/portal-assets/styles/pages/foundation.css')->assertOk();
    }

    public function test_asset_route_cannot_expose_backend_secrets_or_non_assets(): void
    {
        $this->get('/portal-assets/../../backend/.env')->assertNotFound();
        $this->get('/portal-assets/missing.js')->assertNotFound();
        $this->get('/portal-assets/../README.md')->assertNotFound();
    }
}
