@extends('admin.layout')

@section('title', 'Projeler')

@section('content')
  <div class="row" style="justify-content: space-between;">
    <h1>Projeler</h1>
    <form method="post" action="{{ route('logout') }}">@csrf<button class="ghost" type="submit">Çıkış</button></form>
  </div>
  <p class="muted">
    Yalnızca <strong>Görünür</strong> işaretli projeler sitede yer alır. GitHub'a eklediğin yeni repolar kendiliğinden
    sitede çıkmaz; aşağıdan elle eklersin.
  </p>

  @if (session('ok')) <div class="flash ok">{{ session('ok') }}</div> @endif
  @if (session('error')) <div class="flash error">{{ session('error') }}</div> @endif
  @if ($errors->any())
    <div class="flash error">
      @foreach ($errors->all() as $e) <div>{{ $e }}</div> @endforeach
    </div>
  @endif
  @unless ($githubOk)
    <div class="flash error">GitHub'a ulaşılamadı; repo listesi boş. Mevcut projeler etkilenmez.</div>
  @endunless
  @if ($privateOrMissing->isNotEmpty())
    <div class="flash error">
      Bu projelerin repoları herkese açık listede yok (gizli ya da silinmiş olabilir):
      {{ $privateOrMissing->implode(', ') }}
    </div>
  @endif

  <div class="row">
    <form method="post" action="{{ route('admin.export') }}">@csrf<button class="ghost" type="submit">Dışa aktar (projects.json)</button></form>
    @if ($publishEnabled)
      <form method="post" action="{{ route('admin.publish') }}">@csrf<button type="submit">Yayınla (commit + push)</button></form>
    @else
      <span class="muted">Yayınla düğmesi kapalı: .env içinde PORTFOLIO_PUBLISH_ENABLED=true</span>
    @endif
  </div>

  <h2>Siteye eklenmiş projeler ({{ $projects->count() }})</h2>

  @foreach ($projects as $p)
    <div class="card">
      <div class="row" style="justify-content: space-between;">
        <strong>{{ $p->texts['en']['name'] ?? $p->slug }}</strong>
        <span>
          <span class="pill {{ $p->visible ? 'on' : '' }}">{{ $p->visible ? 'görünür' : 'gizli' }}</span>
          <a href="https://github.com/{{ $githubUser }}/{{ $p->repo }}" target="_blank" rel="noopener">{{ $p->repo }}</a>
        </span>
      </div>

      <form method="post" action="{{ route('admin.projects.update', $p) }}">
        @csrf @method('PUT')
        <div class="row" style="margin-top:.6rem;">
          <label class="check"><input type="checkbox" name="visible" value="1" @checked($p->visible)> Görünür</label>
          <label class="check"><input type="checkbox" name="featured" value="1" @checked($p->featured)> Öne çıkan</label>
          <label class="check"><input type="checkbox" name="wip" value="1" @checked($p->wip)> Geliştiriliyor</label>
        </div>

        <div class="grid">
          <div><label>Sıra</label><input type="number" name="sort" min="0" value="{{ old('sort', $p->sort) }}"></div>
          <div><label>Yıl</label><input type="number" name="year" value="{{ old('year', $p->year) }}"></div>
          <div><label>Teknolojiler (virgülle)</label><input type="text" name="stack" value="{{ implode(', ', $p->stack ?? []) }}"></div>
        </div>

        <details>
          <summary>Metinler (TR / EN / FR / DE)</summary>
          @foreach ($languages as $lang)
            @php $t = $p->texts[$lang] ?? []; @endphp
            <div class="lang">
              <strong>{{ strtoupper($lang) }}</strong>
              <label>Ad</label>
              <input type="text" name="texts[{{ $lang }}][name]" value="{{ $t['name'] ?? '' }}" required>
              <label>Tek satır özet</label>
              <input type="text" name="texts[{{ $lang }}][summary]" value="{{ $t['summary'] ?? '' }}" required>
              <label>Açıklama</label>
              <textarea name="texts[{{ $lang }}][description]" required>{{ $t['description'] ?? '' }}</textarea>
              <label>Öne çıkanlar (her satıra bir madde)</label>
              <textarea name="texts[{{ $lang }}][highlights]">{{ implode("\n", $t['highlights'] ?? []) }}</textarea>
              <label>Detay (isteğe bağlı, en fazla 6000 karakter)</label>
              <textarea name="texts[{{ $lang }}][details]" rows="10" maxlength="6000"
                placeholder="## Genel bakış&#10;Boş satırla ayrılan paragraflar.&#10;&#10;## Mimari&#10;- Madde bir&#10;- Madde iki&#10;&#10;Yalnızca ## başlık, paragraf ve - madde; başka biçim yorumlanmaz.">{{ $t['details'] ?? '' }}</textarea>
            </div>
          @endforeach
        </details>

        <p><button type="submit">Kaydet</button></p>
      </form>
    </div>
  @endforeach

  <h2>GitHub'daki diğer açık repolar ({{ $available->count() }})</h2>
  <p class="muted">Eklenen proje önce gizli olur. Metinleri düzenleyip "Görünür" yapınca siteye girer.</p>
  @forelse ($available as $r)
    <div class="card row" style="justify-content: space-between;">
      <div>
        <a href="{{ $r['url'] }}" target="_blank" rel="noopener">{{ $r['name'] }}</a>
        @if ($r['fork']) <span class="pill">fork</span> @endif
        <div class="muted">{{ $r['language'] ?? '—' }} · {{ $r['description'] ?? 'açıklama yok' }}</div>
      </div>
      <form method="post" action="{{ route('admin.projects.store') }}">
        @csrf
        <input type="hidden" name="repo" value="{{ $r['name'] }}">
        <button class="ghost" type="submit">Ekle (gizli)</button>
      </form>
    </div>
  @empty
    <p class="muted">Eklenecek başka açık repo yok.</p>
  @endforelse
@endsection
