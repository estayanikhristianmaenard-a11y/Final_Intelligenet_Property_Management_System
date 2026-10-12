<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PrototypeDataController extends Controller
{
    public function read(Request $request, string $path)
    {
        $foundation = new FoundationController;
        if ($request->user()->role === 'tenant') {
            $own = $foundation->tenantHome($request)->getData(true);
            $tenant = $own['tenant'];
            abort_unless($tenant && $path === 'tenants/'.$tenant['id'], 404);
            $assignment = collect($own['assignments'])->first(fn($a) => $a['start_date'] <= now('Asia/Manila')->toDateString() && $a['end_date'] >= now('Asia/Manila')->toDateString());
            return response()->json($this->withBills($request,$this->tenant($tenant + $request->user()->only(['name','email']), $assignment, null, null)));
        }
        abort_unless($request->user()->role === 'manager',403);
        $data = $foundation->records($request)->getData(true);
        $today = now('Asia/Manila')->toDateString();
        $leases = collect($data['leases'])->keyBy('id');
        $assignments = collect($data['assignments'])->filter(fn($a)=>$a['start_date'] <= $today && $a['end_date'] >= $today);
        $properties = collect($data['properties'])->keyBy('id');
        $units = collect($data['units'])->map(function($u) use ($leases,$assignments,$properties,$data,$today) {
            $lease = $leases->first(fn($l)=>$l['unit_id']==$u['id'] && $l['start_date'] <= $today && $l['end_date'] >= $today);
            $occupants = $lease ? $assignments->where('lease_id',$lease['id'])->values() : collect();
            $first = $occupants->first();
            $tenant = $first ? collect($data['tenants'])->firstWhere('id',$first['tenant_id']) : null;
            return $u + ['propertyId'=>(string)$u['property_id'],'letter'=>$properties[$u['property_id']]['name'],'floor'=>'Floor not recorded','floorNumber'=>0,'type'=>'residential','arrangement'=>$lease['arrangement']??null,'monthlyRent'=>($lease['monthly_rent_centavos']??0)/100,'status'=>$occupants->isEmpty()?'vacant':'occupied','tenantId'=>$tenant ? (string)$tenant['id'] : null,'tenantName'=>$tenant['name']??null,'occupants'=>$occupants->count()];
        });
        $portfolio = $properties->values()->map(function($p) use($units) {
            $group=$units->where('property_id',$p['id']); $occupied=$group->where('status','occupied')->count();
            return array_merge($p,['id'=>(string)$p['id'],'letter'=>(string)$p['id'],'city'=>'','type'=>'residential','accent'=>['#4f46e5','#312e81'],'totalUnits'=>$group->count(),'occupiedUnits'=>$occupied,'vacantUnits'=>$group->count()-$occupied,'occupancyRate'=>$group->isEmpty()?0:round(100*$occupied/$group->count()),'monthlyRevenue'=>$group->sum('monthlyRent')]);
        });
        $tenants = collect($data['tenants'])->map(function($t) use($assignments,$leases,$units,$properties) {
            $a=$assignments->firstWhere('tenant_id',$t['id']); $l=$a ? $leases->get($a['lease_id']) : null;
            $u=$l ? $units->firstWhere('id',$l['unit_id']) : null; $p=$u ? $properties->get($u['property_id']) : null;
            return $this->tenant($t,$a,$l,$u ? $u + ['property_name'=>$p['name']] : null);
        });
        $result=match(true) {
            $path==='properties'=>$portfolio->values(),
            $path==='units'=>$units->filter(fn($u)=>(!$request->propertyId || $u['propertyId']==$request->propertyId) && (!$request->status || $u['status']==$request->status))->values(),
            $path==='tenants'=>$tenants->filter(fn($t)=>(!$request->propertyId || $t['propertyId']==$request->propertyId) && (!$request->q || str_contains(strtolower($t['fullName'].' '.$t['email'].' '.$t['unitCode']),strtolower($request->q))))->values(),
            str_starts_with($path,'tenants/')=>$tenants->firstWhere('id',substr($path,8)) ?? abort(404),
            $path==='dashboard/stats'=>['totalUnits'=>['value'=>$units->count(),'delta'=>null],'totalTenants'=>['value'=>$tenants->count(),'delta'=>null],'incomingBills'=>['value'=>'—','delta'=>null],'exceptionQueue'=>['value'=>'—','delta'=>null],'openExceptions'=>0,'outstanding'=>0,'occupancy'=>$units->isEmpty()?0:round(100*$units->where('status','occupied')->count()/$units->count())],
            $path==='dashboard/activity'=>[],
            default=>abort(404),
        };
        if(is_array($result) && isset($result['fullName'])) $result=$this->withBills($request,$result);
        return response()->json($result);
    }

    private function withBills(Request $r,array $tenant): array {
        $tenant['bills']=(new RentController)->bills($r,(int)$tenant['id'])->getData(true);
        $tenant['summary']['currentDue']=array_sum(array_column($tenant['bills'],'totalDue'));
        $tenant['summary']['outstanding']=$tenant['summary']['currentDue'];
        return $tenant;
    }

    private function tenant(array $t, ?array $a, ?array $lease, ?array $unit): array
    {
        return ['id'=>(string)$t['id'],'fullName'=>$t['name'],'email'=>$t['email'],'phone'=>$t['phone']??null,'propertyId'=>$unit ? (string)$unit['property_id'] : null,'propertyName'=>$unit['property_name']??$a['property_name']??'No active assignment','unitCode'=>$unit['code']??$a['code']??'Unassigned','floor'=>'Floor not recorded','arrangement'=>$lease['arrangement']??$a['arrangement']??null,'monthlyRent'=>($lease['monthly_rent_centavos']??$a['monthly_rent_centavos']??0)/100,'moveInDate'=>$a['start_date']??null,'leaseStart'=>$lease['start_date']??$a['start_date']??null,'leaseAnniversary'=>$lease ? (int)substr($lease['start_date'],8,2) : null,'occupancy'=>$unit['occupants']??null,'bills'=>[],'payments'=>[],'documents'=>[],'summary'=>['currentDue'=>0,'outstanding'=>0]];
    }
}
