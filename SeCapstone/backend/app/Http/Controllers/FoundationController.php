<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class FoundationController extends Controller
{
    public function login(Request $r)
    {
        $data = $r->validate(['email'=>'required|email', 'password'=>'required|string']);
        if (!Auth::attempt($data)) throw ValidationException::withMessages(['email'=>'Invalid email or password.']);
        $r->session()->regenerate();
        return response()->json($this->identity($r));
    }
    public function identity(Request $r): array
    {
        $identity = $r->user()->only(['id', 'name', 'email', 'role']);
        if ($r->user()->role === 'tenant') $identity['tenantId'] = (string) DB::table('tenants')->where('user_id',$r->user()->id)->value('id');
        return $identity;
    }
    public function logout(Request $r)
    {
        Auth::logout(); $r->session()->invalidate(); $r->session()->regenerateToken();
        return response()->json(['message'=>'Signed out']);
    }
    private function manager(Request $r): void { abort_unless($r->user()->role === 'manager', 403); }
    private function owned(Request $r, string $resource, int $id): object
    {
        $q = DB::table($resource);
        if ($resource === 'properties' || $resource === 'tenants') $q->where('manager_id', $r->user()->id);
        if ($resource === 'units') $q->whereIn('property_id', DB::table('properties')->where('manager_id',$r->user()->id)->select('id'));
        if ($resource === 'leases') $q->whereIn('unit_id', DB::table('units')->whereIn('property_id',DB::table('properties')->where('manager_id',$r->user()->id)->select('id'))->select('id'));
        if ($resource === 'occupancy_assignments') $q->whereIn('tenant_id',DB::table('tenants')->where('manager_id',$r->user()->id)->select('id'));
        return $q->where('id',$id)->first() ?? abort(404);
    }
    public function records(Request $r)
    {
        $this->manager($r);
        $properties = DB::table('properties')->where('manager_id',$r->user()->id)->get();
        $units = DB::table('units')->whereIn('property_id',$properties->pluck('id'))->get();
        $tenants = DB::table('tenants')->join('users','users.id','=','tenants.user_id')->where('manager_id',$r->user()->id)->select('tenants.*','users.name','users.email')->get();
        $leases = DB::table('leases')->whereIn('unit_id',$units->pluck('id'))->get();
        $assignments = DB::table('occupancy_assignments')->whereIn('lease_id',$leases->pluck('id'))->get();
        return response()->json(compact('properties','units','tenants','leases','assignments'));
    }
    public function tenantHome(Request $r)
    {
        abort_unless($r->user()->role === 'tenant',403);
        $tenant=DB::table('tenants')->where('user_id',$r->user()->id)->first();
        $assignments=$tenant ? DB::table('occupancy_assignments')->join('leases','leases.id','=','occupancy_assignments.lease_id')->join('units','units.id','=','leases.unit_id')->join('properties','properties.id','=','units.property_id')->where('tenant_id',$tenant->id)->select('occupancy_assignments.*','units.code','properties.name as property_name','leases.monthly_rent_centavos','leases.arrangement')->get() : [];
        return response()->json(['tenant'=>$tenant,'assignments'=>$assignments]);
    }
    public function save(Request $r, string $resource, ?int $id=null)
    {
        $this->manager($r);
        abort_unless(in_array($resource,['properties','units','tenants','leases','occupancy_assignments'],true),404);
        if ($id) $this->owned($r,$resource,$id);
        $rules=match($resource) {
            'properties'=>['name'=>'required|string|max:255','address'=>'required|string|max:255'],
            'units'=>['property_id'=>'required|integer','code'=>['required','string','max:255',Rule::unique('units')->where('property_id',$r->input('property_id'))->ignore($id)],'capacity'=>'required|integer|min:1|max:100'],
            'tenants'=>['name'=>'required|string|max:255','email'=>['required','email','max:255',Rule::unique('users')->ignore($id ? $this->owned($r,'tenants',$id)->user_id : null)],'password'=>($id ? 'nullable' : 'required').'|string|min:12|max:128','phone'=>'nullable|string|max:40'],
            'leases'=>['unit_id'=>'required|integer','start_date'=>'required|date_format:Y-m-d','end_date'=>'required|date_format:Y-m-d|after_or_equal:start_date','monthly_rent_centavos'=>'required|integer|min:1|max:999999999','arrangement'=>['required',Rule::in(['individual','shared_occupancy'])]],
            default=>['lease_id'=>'required|integer','tenant_id'=>'required|integer','start_date'=>'required|date_format:Y-m-d','end_date'=>'required|date_format:Y-m-d|after_or_equal:start_date'],
        };
        $data=$r->validate($rules);
        $result=DB::transaction(function () use ($r,$resource,$id,$data) {
            if ($resource==='units') {
                $this->owned($r,'properties',$data['property_id']);
                if ($id) {
                    $existing = DB::table('units')->where('id',$id)->lockForUpdate()->first();
                    if (($existing->property_id != $data['property_id'] || $existing->capacity != $data['capacity']) && DB::table('leases')->where('unit_id',$id)->exists()) {
                        throw ValidationException::withMessages(['capacity'=>'Property and capacity cannot change while this unit has leases in the foundation stage.']);
                    }
                }
            }
            if ($resource==='leases') {
                $unit=$this->owned($r,'units',$data['unit_id']);
                DB::table('units')->where('id',$unit->id)->lockForUpdate()->first();
                $overlap=DB::table('leases')->where('unit_id',$unit->id)->where('start_date','<=',$data['end_date'])->where('end_date','>=',$data['start_date']);
                if ($id) $overlap->where('id','!=',$id);
                if ($overlap->exists()) throw ValidationException::withMessages(['start_date'=>'An overlapping lease already exists for this unit.']);
                if ($id && DB::table('occupancy_assignments')->where('lease_id',$id)->exists()) throw ValidationException::withMessages(['lease_id'=>'A lease with assignments cannot be changed in this foundation stage.']);
            }
            if ($resource==='occupancy_assignments') {
                $lease=$this->owned($r,'leases',$data['lease_id']);
                $tenant=$this->owned($r,'tenants',$data['tenant_id']);
                DB::table('tenants')->where('id',$tenant->id)->lockForUpdate()->first();
                $unit=DB::table('units')->where('id',$lease->unit_id)->lockForUpdate()->first();
                if ($data['start_date']<$lease->start_date || $data['end_date']>$lease->end_date) throw ValidationException::withMessages(['start_date'=>'Assignment dates must fall within the lease.']);
                $overlap=DB::table('occupancy_assignments')->where('tenant_id',$tenant->id)->where('start_date','<=',$data['end_date'])->where('end_date','>=',$data['start_date']);
                if ($id) $overlap->where('id','!=',$id);
                if ($overlap->exists()) throw ValidationException::withMessages(['tenant_id'=>'Tenant already has an assignment during these dates.']);
                $others=DB::table('occupancy_assignments')->where('lease_id',$lease->id)->where('start_date','<=',$data['end_date'])->where('end_date','>=',$data['start_date']);
                if ($id) $others->where('id','!=',$id);
                $limit=$lease->arrangement==='individual' ? 1 : $unit->capacity;
                // Check peak occupancy, not total distinct occupants over the entire period.
                $rows=$others->get();
                foreach (array_unique(array_merge([$data['start_date']],$rows->pluck('start_date')->all())) as $date) {
                    if ($date<$data['start_date'] || $date>$data['end_date']) continue;
                    if ($rows->filter(fn($v)=>$v->start_date<=$date && $v->end_date>=$date)->count()+1>$limit) throw ValidationException::withMessages(['lease_id'=>'Unit or arrangement occupancy limit would be exceeded.']);
                }
            }
            if ($resource==='tenants') {
                $user=$id ? User::findOrFail($this->owned($r,'tenants',$id)->user_id) : new User;
                $user->name=$data['name'];$user->email=$data['email'];$user->role='tenant';
                if (!empty($data['password'])) $user->password=$data['password'];
                $user->save();$data=['user_id'=>$user->id,'manager_id'=>$r->user()->id,'phone'=>$data['phone']??null];
            }
            if ($resource==='properties') $data['manager_id']=$r->user()->id;
            $data['updated_at']=now();
            if ($id) DB::table($resource)->where('id',$id)->update($data);
            else { $data['created_at']=now();$id=DB::table($resource)->insertGetId($data); }
            return DB::table($resource)->where('id',$id)->first();
        });
        return response()->json($result,$id ? 200 : 201);
    }
}
