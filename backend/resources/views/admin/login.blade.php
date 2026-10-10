@extends('admin.layout')

@section('title', 'Giriş')

@section('content')
  <div style="max-width: 24rem; margin: 4rem auto 0;">
    <h1>Portfolyo paneli</h1>
    <p class="muted">Yalnızca yerelde çalışır.</p>

    <form method="post" action="{{ url('admin/login') }}">
      @csrf
      <label for="email">E-posta</label>
      <input id="email" type="email" name="email" value="{{ old('email') }}" required autofocus>
      @error('email') <div class="flash error">{{ $message }}</div> @enderror

      <label for="password">Parola</label>
      <input id="password" type="password" name="password" required>

      <p style="margin-top: 1.2rem;"><button type="submit">Giriş yap</button></p>
    </form>
  </div>
@endsection
