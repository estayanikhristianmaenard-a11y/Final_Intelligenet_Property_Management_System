<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $t) {
            $t->enum('role', ['admin', 'manager', 'tenant'])->default('tenant');
        });
        Schema::create('properties', function (Blueprint $t) {
            $t->id(); $t->foreignId('manager_id')->constrained('users');
            $t->string('name'); $t->string('address'); $t->timestamps();
        });
        Schema::create('units', function (Blueprint $t) {
            $t->id(); $t->foreignId('property_id')->constrained();
            $t->string('code'); $t->unsignedInteger('capacity'); $t->timestamps();
            $t->unique(['property_id', 'code']);
        });
        Schema::create('tenants', function (Blueprint $t) {
            $t->id(); $t->foreignId('manager_id')->constrained('users');
            $t->foreignId('user_id')->unique()->constrained();
            $t->string('phone')->nullable(); $t->timestamps();
        });
        Schema::create('leases', function (Blueprint $t) {
            $t->id(); $t->foreignId('unit_id')->constrained();
            $t->date('start_date'); $t->date('end_date');
            $t->unsignedBigInteger('monthly_rent_centavos');
            $t->enum('arrangement', ['individual', 'shared_occupancy']); $t->timestamps();
        });
        Schema::create('occupancy_assignments', function (Blueprint $t) {
            $t->id(); $t->foreignId('lease_id')->constrained();
            $t->foreignId('tenant_id')->constrained();
            $t->date('start_date'); $t->date('end_date'); $t->timestamps();
            $t->index(['tenant_id', 'start_date', 'end_date']);
        });
    }
    public function down(): void
    {
        foreach (['occupancy_assignments', 'leases', 'tenants', 'units', 'properties'] as $name) Schema::dropIfExists($name);
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn('role'));
    }
};
