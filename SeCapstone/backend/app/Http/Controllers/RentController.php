<?php
namespace App\Http\Controllers;

use App\Services\RentGenerator;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RentController extends Controller
{
    public function generate(Request $r,RentGenerator $generator) {
        abort_unless($r->user()->role==='manager',403);
        $date=CarbonImmutable::now('Asia/Manila')->startOfDay();
        $leases=DB::table('leases')->join('units','units.id','=','leases.unit_id')->join('properties','properties.id','=','units.property_id')->where('manager_id',$r->user()->id)->pluck('leases.id');
        $cycles=[];$blocked=[];
        foreach($leases as $id) {
            try { $cycle=$generator->generate($id,$date);if($cycle)$cycles[]=$cycle; }
            catch(ValidationException $e){$blocked[]=['lease_id'=>$id,'reason'=>$e->validator->errors()->first()];}
        }
        return response()->json(['date'=>$date->toDateString(),'cycle_ids'=>$cycles,'blocked'=>$blocked]);
    }
    public function bills(Request $r,?int $tenant=null) {
        $q=DB::table('rent_bills')->join('rent_cycles','rent_cycles.id','=','rent_bills.rent_cycle_id')->join('leases','leases.id','=','rent_cycles.lease_id')->join('units','units.id','=','leases.unit_id')->join('properties','properties.id','=','units.property_id')->join('tenants','tenants.id','=','rent_bills.tenant_id')->join('users','users.id','=','tenants.user_id');
        if($r->user()->role==='manager') $q->where('properties.manager_id',$r->user()->id);
        elseif($r->user()->role==='tenant') {
            $own=DB::table('tenants')->where('user_id',$r->user()->id)->value('id');
            abort_unless(!$tenant || $tenant===$own,404);$q->where('rent_bills.tenant_id',$own);
        } else abort(403);
        if($tenant)$q->where('rent_bills.tenant_id',$tenant);
        $rows=$q->select('rent_bills.*','rent_cycles.due_date','properties.id as property_id','properties.name as property_name','units.code','users.name as tenant_name')->orderByDesc('due_date')->get();
        return response()->json($rows->map(fn($b)=>[
            'id'=>(string)$b->id,'tenantId'=>(string)$b->tenant_id,'tenantName'=>$b->tenant_name,'propertyId'=>(string)$b->property_id,'propertyName'=>$b->property_name,'unitCode'=>$b->code,'category'=>'rent','cycle'=>substr($b->due_date,0,7),'dueDate'=>$b->due_date,'generatedAt'=>$b->created_at,'totalDue'=>($b->rent_centavos+$b->advance_centavos)/100,'paymentStatus'=>$b->payment_status,
            'lines'=>array_values(array_filter([['category'=>'rent','label'=>'Current rent','period'=>substr($b->due_date,0,7),'amount'=>$b->rent_centavos/100,'isAdvance'=>false],$b->advance_centavos?['category'=>'rent','label'=>'Advance Rent (1 month)','period'=>substr($b->due_date,0,7),'amount'=>$b->advance_centavos/100,'isAdvance'=>true]:null])),
        ]));
    }
}
