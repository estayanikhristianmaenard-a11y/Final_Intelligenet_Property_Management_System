<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('rent_cycles',function(Blueprint $t){
            $t->id();$t->foreignId('lease_id')->constrained();$t->date('due_date');
            $t->unsignedBigInteger('rent_centavos');$t->unsignedBigInteger('advance_centavos');
            $t->json('membership_snapshot');$t->timestamps();$t->unique(['lease_id','due_date']);
        });
        Schema::create('rent_bills',function(Blueprint $t){
            $t->id();$t->foreignId('rent_cycle_id')->constrained();$t->foreignId('tenant_id')->constrained();
            $t->unsignedBigInteger('rent_centavos');$t->unsignedBigInteger('advance_centavos');
            $t->enum('payment_status',['unpaid','tenant_reported_paid','paid'])->default('unpaid');
            $t->timestamps();$t->unique(['rent_cycle_id','tenant_id']);
        });
    }
    public function down(): void {Schema::dropIfExists('rent_bills');Schema::dropIfExists('rent_cycles');}
};
