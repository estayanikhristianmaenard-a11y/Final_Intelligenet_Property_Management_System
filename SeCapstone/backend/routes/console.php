<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('propertypro:create-user {email} {role}', function () {
    $email = $this->argument('email');
    $role = $this->argument('role');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !in_array($role, ['admin','manager'], true)) {
        $this->error('Use a valid email and admin or manager role. Create tenants through the Manager screen.');
        return 1;
    }
    if (\App\Models\User::where('email',$email)->exists()) {
        $this->error('This email already exists.');
        return 1;
    }
    $name = $this->ask('Name');
    $password = $this->secret('Password (at least 12 characters)');
    if (!$name || strlen($password ?? '') < 12) {
        $this->error('Name and a password of at least 12 characters are required.');
        return 1;
    }
    $user = new \App\Models\User;
    $user->name = $name;
    $user->email = $email;
    $user->role = $role;
    $user->password = $password;
    $user->save();
    $this->info('Account created.');
    return 0;
})->purpose('Create a local Manager or maintenance Admin account');

Artisan::command('propertypro:generate-rent', function () {
    $generator=app(\App\Services\RentGenerator::class);
    $date=\Carbon\CarbonImmutable::now('Asia/Manila')->startOfDay();
    foreach(\Illuminate\Support\Facades\DB::table('leases')->pluck('id') as $id) {
        try {if($generator->generate($id,$date))$this->info('Rent cycle available for lease #'.$id);}
        catch(\Illuminate\Validation\ValidationException $e){$this->warn('Lease #'.$id.' blocked: '.$e->validator->errors()->first());}
    }
})->purpose('Generate only today\'s eligible anniversary rent; safe to repeat');
Schedule::command('propertypro:generate-rent')->hourly()->withoutOverlapping();
