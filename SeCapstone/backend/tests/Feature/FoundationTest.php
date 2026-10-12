<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FoundationTest extends TestCase
{
    use RefreshDatabase;

    private function account(string $role): User
    {
        $user = User::factory()->create(['password' => 'foundation-test-password']);
        $user->role = $role;
        $user->save();
        return $user;
    }

    public function test_login_logout_and_invalid_credentials(): void
    {
        $user = $this->account('manager');
        $this->postJson('/api/v1/auth/login', ['email'=>$user->email,'password'=>'wrong'])->assertUnprocessable();
        $this->postJson('/api/v1/auth/login', ['email'=>$user->email,'password'=>'foundation-test-password'])->assertOk()->assertJsonPath('role','manager');
        $this->getJson('/api/v1/auth/me')->assertJsonPath('id',$user->id);
        $this->postJson('/api/v1/auth/logout')->assertOk();
        $this->getJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_only_managers_can_manage_records(): void
    {
        foreach (['admin','tenant'] as $role) {
            $this->actingAs($this->account($role));
            $this->getJson('/api/v1/foundation/records')->assertForbidden();
            $this->postJson('/api/v1/foundation/properties',['name'=>'House','address'=>'Pasig'])->assertForbidden();
        }
    }

    public function test_managers_cannot_edit_other_managers_records(): void
    {
        $this->actingAs($this->account('manager'));
        $id=$this->postJson('/api/v1/foundation/properties',['name'=>'House','address'=>'Pasig'])->assertCreated()->json('id');
        $this->actingAs($this->account('manager'));
        $this->patchJson('/api/v1/foundation/properties/'.$id,['name'=>'Changed','address'=>'Pasig'])->assertNotFound();
        $this->getJson('/api/v1/foundation/records')->assertJsonCount(0,'properties');
    }

    public function test_editing_records_preserves_password_and_rejects_foreign_relationships(): void
    {
        $manager=$this->account('manager');
        $this->actingAs($manager);
        $property=$this->postJson('/api/v1/foundation/properties',['name'=>'House','address'=>'Pasig'])->assertCreated()->json('id');
        $this->patchJson('/api/v1/foundation/properties/'.$property,['name'=>'Updated House','address'=>'New address'])->assertOk();
        $unit=$this->postJson('/api/v1/foundation/units',['property_id'=>$property,'code'=>'A1','capacity'=>2])->assertCreated()->json('id');
        $this->postJson('/api/v1/foundation/units',['property_id'=>$property,'code'=>'A1','capacity'=>2])->assertUnprocessable();
        $this->patchJson('/api/v1/foundation/units/'.$unit,['property_id'=>$property,'code'=>'A2','capacity'=>3])->assertOk();
        $tenant=$this->postJson('/api/v1/foundation/tenants',['name'=>'Tenant','email'=>'edit@example.test','password'=>'original-test-password'])->assertCreated()->json();
        $this->patchJson('/api/v1/foundation/tenants/'.$tenant['id'],['name'=>'Updated Tenant','email'=>'updated@example.test','phone'=>'09123456789'])->assertOk();
        $user=User::findOrFail($tenant['user_id']);
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('original-test-password',$user->password));
        $this->assertSame('tenant',$user->role);
        $this->getJson('/api/v1/tenants?q=Updated')->assertJsonCount(1)->assertJsonPath('0.fullName','Updated Tenant');
        $this->actingAs($this->account('manager'));
        $this->postJson('/api/v1/foundation/units',['property_id'=>$property,'code'=>'B1','capacity'=>1])->assertNotFound();
        $this->postJson('/api/v1/foundation/leases',['unit_id'=>$unit,'start_date'=>'2026-10-01','end_date'=>'2027-09-30','monthly_rent_centavos'=>100000,'arrangement'=>'individual'])->assertNotFound();
        $this->patchJson('/api/v1/foundation/tenants/'.$tenant['id'],['name'=>'Stolen','email'=>'stolen@example.test'])->assertNotFound();
    }

    public function test_shared_capacity_dates_and_tenant_isolation(): void
    {
        $this->actingAs($this->account('manager'));
        $property=$this->postJson('/api/v1/foundation/properties',['name'=>'House','address'=>'Pasig'])->assertCreated()->json('id');
        $unit=$this->postJson('/api/v1/foundation/units',['property_id'=>$property,'code'=>'A1','capacity'=>2])->assertCreated()->json('id');
        $leaseData=['unit_id'=>$unit,'start_date'=>'2026-10-01','end_date'=>'2027-09-30','monthly_rent_centavos'=>100000,'arrangement'=>'shared_occupancy'];
        $lease=$this->postJson('/api/v1/foundation/leases',$leaseData)->assertCreated()->json('id');
        $this->postJson('/api/v1/foundation/leases',$leaseData)->assertUnprocessable();
        $tenants=[];
        for ($i=0;$i<3;$i++) {
            $tenants[]=$this->postJson('/api/v1/foundation/tenants',['name'=>'Tenant '.$i,'email'=>'tenant'.$i.'@example.test','password'=>'foundation-test-password'])->assertCreated()->json();
        }
        $assignment=['lease_id'=>$lease,'tenant_id'=>$tenants[0]['id'],'start_date'=>'2026-09-01','end_date'=>'2027-09-30'];
        $this->postJson('/api/v1/foundation/occupancy_assignments',$assignment)->assertUnprocessable();
        $assignment['start_date']='2026-10-01';
        $this->postJson('/api/v1/foundation/occupancy_assignments',$assignment)->assertCreated();
        $this->postJson('/api/v1/foundation/occupancy_assignments',$assignment)->assertUnprocessable();
        $assignment['tenant_id']=$tenants[1]['id'];
        $this->postJson('/api/v1/foundation/occupancy_assignments',$assignment)->assertCreated();
        $assignment['tenant_id']=$tenants[2]['id'];
        $this->postJson('/api/v1/foundation/occupancy_assignments',$assignment)->assertUnprocessable();
        $this->assertDatabaseCount('occupancy_assignments',2);
        $this->patchJson('/api/v1/foundation/units/'.$unit,['property_id'=>$property,'code'=>'A1','capacity'=>1])->assertUnprocessable();
        $firstAssignment=\Illuminate\Support\Facades\DB::table('occupancy_assignments')->where('tenant_id',$tenants[0]['id'])->value('id');
        $this->patchJson('/api/v1/foundation/occupancy_assignments/'.$firstAssignment,['lease_id'=>$lease,'tenant_id'=>$tenants[0]['id'],'start_date'=>'2026-10-01','end_date'=>'2027-08-31'])->assertOk();
        $this->getJson('/api/v1/properties')->assertOk()->assertJsonPath('0.name','House');
        $this->getJson('/api/v1/units')->assertOk()->assertJsonPath('0.status','occupied');
        $this->getJson('/api/v1/dashboard/stats')->assertOk()->assertJsonPath('totalTenants.value',3);
        $this->getJson('/api/v1/tenants/'.$tenants[0]['id'])->assertOk()->assertJsonPath('fullName','Tenant 0');
        $this->actingAs(User::findOrFail($tenants[0]['user_id']));
        $this->getJson('/api/v1/tenants/'.$tenants[1]['id'])->assertNotFound();
        $this->getJson('/api/v1/tenants/'.$tenants[0]['id'])->assertOk()->assertJsonPath('fullName','Tenant 0');
        $this->getJson('/api/v1/tenant/assignment?tenant_id='.$tenants[1]['id'])->assertOk()->assertJsonCount(1,'assignments')->assertJsonPath('assignments.0.tenant_id',$tenants[0]['id']);
    }
}
