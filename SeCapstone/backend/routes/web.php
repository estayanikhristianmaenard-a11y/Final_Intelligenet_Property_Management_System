<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FoundationController;
use App\Http\Controllers\PortalController;
use App\Http\Controllers\PrototypeDataController;
use App\Http\Controllers\RentController;

Route::get('/', function () {
    return redirect('/portal');
});
Route::get('/portal', [PortalController::class,'index']);
Route::get('/portal-assets/{path}', [PortalController::class,'asset'])->where('path','.*');
Route::redirect('/foundation', '/portal');
Route::post('/api/v1/auth/login', [FoundationController::class,'login'])->middleware('throttle:6,1');
Route::middleware('auth')->prefix('api/v1')->group(function () {
    Route::get('/auth/me',[FoundationController::class,'identity']);
    Route::post('/auth/logout',[FoundationController::class,'logout']);
    Route::get('/foundation/records',[FoundationController::class,'records']);
    Route::get('/tenant/assignment',[FoundationController::class,'tenantHome']);
    Route::post('/rent/generate',[RentController::class,'generate']);
    Route::get('/bills',[RentController::class,'bills']);
    Route::get('/tenants/{tenant}/bills',[RentController::class,'bills'])->whereNumber('tenant');
    Route::get('/{path}',[PrototypeDataController::class,'read'])->where('path','properties|units|tenants|tenants/[0-9]+|dashboard/stats|dashboard/activity');
    Route::post('/foundation/{resource}',[FoundationController::class,'save']);
    Route::patch('/foundation/{resource}/{id}',[FoundationController::class,'save'])->whereNumber('id');
});
