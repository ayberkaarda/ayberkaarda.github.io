<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(PortfolioProjectSeeder::class);

        $email = env('ADMIN_EMAIL', 'ayberk20arda@gmail.com');

        if (! User::where('email', $email)->exists()) {
            $password = env('ADMIN_PASSWORD') ?: Str::password(20, symbols: false);

            User::create([
                'name' => 'Admin',
                'email' => $email,
                'password' => Hash::make($password),
            ]);

            $this->command?->warn("Admin kullanıcısı oluşturuldu: $email");
            if (! env('ADMIN_PASSWORD')) {
                $this->command?->warn("Parola (yalnızca bir kez gösterilir): $password");
            }
        }
    }
}
