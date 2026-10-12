<?php
namespace Tests\Feature;

use App\Models\User;
use App\Services\RentGenerator;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class RentGenerationTest extends TestCase
{
    use RefreshDatabase;
    private function setupLease(int $occupants=3): array {
        $manager=User::factory()->create();$manager->role='manager';$manager->save();
        $property=DB::table('properties')->insertGetId(['manager_id'=>$manager->id,'name'=>'House','address'=>'Pasig']);
        $unit=DB::table('units')->insertGetId(['property_id'=>$property,'code'=>'A1','capacity'=>3]);
        $lease=DB::table('leases')->insertGetId(['unit_id'=>$unit,'start_date'=>'2028-01-31','end_date'=>'2028-03-31','monthly_rent_centavos'=>10001,'arrangement'=>$occupants===1?'individual':'shared_occupancy']);
        $tenants=[];$users=[];
        for($i=0;$i<$occupants;$i++) {
            $user=User::factory()->create();$user->role='tenant';$user->save();$users[]=$user;
            $tenant=DB::table('tenants')->insertGetId(['manager_id'=>$manager->id,'user_id'=>$user->id]);$tenants[]=$tenant;
            DB::table('occupancy_assignments')->insert(['lease_id'=>$lease,'tenant_id'=>$tenant,'start_date'=>'2028-01-31','end_date'=>'2028-03-31']);
        }
        return compact('manager','lease','tenants','users');
    }
    public function test_anniversary_leap_month_advance_reconciliation_and_duplicate_protection(): void {
        $fixture=$this->setupLease();$generator=new RentGenerator;
        $first=$generator->generate($fixture['lease'],CarbonImmutable::parse('2028-01-31'));
        $this->assertSame($first,$generator->generate($fixture['lease'],CarbonImmutable::parse('2028-01-31')));
        $bills=DB::table('rent_bills')->where('rent_cycle_id',$first)->orderBy('tenant_id')->get();
        $this->assertSame([3334,3334,3333],$bills->pluck('rent_centavos')->all());
        $this->assertSame(10001,(int)$bills->sum('advance_centavos'));
        $this->assertSame($fixture['tenants'],json_decode(DB::table('rent_cycles')->where('id',$first)->value('membership_snapshot'),true));
        $this->assertNull($generator->generate($fixture['lease'],CarbonImmutable::parse('2028-02-28')));
        $second=$generator->generate($fixture['lease'],CarbonImmutable::parse('2028-02-29'));
        $this->assertSame(0,(int)DB::table('rent_cycles')->where('id',$second)->value('advance_centavos'));
        $this->assertNull($generator->generate($fixture['lease'],CarbonImmutable::parse('2028-03-29')));
        $this->assertNotNull($generator->generate($fixture['lease'],CarbonImmutable::parse('2028-03-31')));
        $this->assertNull($generator->generate($fixture['lease'],CarbonImmutable::parse('2028-04-30')));
        $this->assertDatabaseCount('rent_cycles',3);
        $this->assertDatabaseCount('rent_bills',9);
    }
    public function test_generation_endpoint_uses_today_and_tenant_bills_are_isolated(): void {
        $fixture=$this->setupLease(1);
        $this->travelTo(CarbonImmutable::parse('2028-01-31 12:00:00','Asia/Manila'));
        $this->actingAs($fixture['manager'])->postJson('/api/v1/rent/generate',['date'=>'2028-03-31'])->assertOk()->assertJsonPath('date','2028-01-31');
        $this->getJson('/api/v1/bills')->assertJsonCount(1)->assertJsonPath('0.totalDue',200.02)->assertJsonCount(2,'0.lines')->assertJsonPath('0.paymentStatus','unpaid');
        $this->actingAs($fixture['users'][0])->getJson('/api/v1/tenants/'.$fixture['tenants'][0].'/bills')->assertOk()->assertJsonCount(1);
        $this->postJson('/api/v1/rent/generate')->assertForbidden();
        $outsider=User::factory()->create();$outsider->role='tenant';$outsider->save();$this->actingAs($outsider);
        $this->getJson('/api/v1/tenants/'.$fixture['tenants'][0].'/bills')->assertNotFound();
        $this->travelBack();
    }
    public function test_no_eligible_occupants_blocks_generation_without_partial_records(): void {
        $fixture=$this->setupLease(0);
        try {(new RentGenerator)->generate($fixture['lease'],CarbonImmutable::parse('2028-01-31'));$this->fail('Expected validation failure');}
        catch(\Illuminate\Validation\ValidationException $e) {$this->assertArrayHasKey('occupancy',$e->errors());}
        $this->assertDatabaseCount('rent_cycles',0);$this->assertDatabaseCount('rent_bills',0);
    }
}
