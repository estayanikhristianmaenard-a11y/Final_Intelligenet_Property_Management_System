<?php
namespace App\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RentGenerator
{
    public function generate(int $leaseId, CarbonImmutable $date): ?int
    {
        return DB::transaction(function() use($leaseId,$date){
            $lease=DB::table('leases')->where('id',$leaseId)->lockForUpdate()->firstOrFail();
            $day=$date->toDateString();
            $anniversary=(int)substr($lease->start_date,8,2);
            if($day<$lease->start_date || $day>$lease->end_date || $date->day!==min($anniversary,$date->daysInMonth)) return null;
            $existing=DB::table('rent_cycles')->where('lease_id',$leaseId)->where('due_date',$day)->value('id');
            if($existing) return $existing;
            // Serialize membership changes and snapshot the generation-date occupants.
            $unit=DB::table('units')->where('id',$lease->unit_id)->lockForUpdate()->first();
            $members=DB::table('occupancy_assignments')->where('lease_id',$leaseId)->where('start_date','<=',$day)->where('end_date','>=',$day)->orderBy('tenant_id')->pluck('tenant_id')->all();
            $count=count($members);
            if(!$count || ($lease->arrangement==='individual' && $count!==1) || $count>$unit->capacity) {
                throw ValidationException::withMessages(['occupancy'=>'Rent is blocked: configure eligible occupants within the lease and capacity first.']);
            }
            $rent=(int)$lease->monthly_rent_centavos;
            $advance=$day===$lease->start_date?$rent:0;
            $cycle=DB::table('rent_cycles')->insertGetId(['lease_id'=>$leaseId,'due_date'=>$day,'rent_centavos'=>$rent,'advance_centavos'=>$advance,'membership_snapshot'=>json_encode($members),'created_at'=>now(),'updated_at'=>now()]);
            foreach($members as $index=>$tenant) {
                DB::table('rent_bills')->insert(['rent_cycle_id'=>$cycle,'tenant_id'=>$tenant,'rent_centavos'=>intdiv($rent,$count)+($index<$rent%$count?1:0),'advance_centavos'=>intdiv($advance,$count)+($index<$advance%$count?1:0),'payment_status'=>'unpaid','created_at'=>now(),'updated_at'=>now()]);
            }
            return $cycle;
        });
    }
}
