<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>@yield('title', 'Portfolyo paneli')</title>
  <style>
    :root { --paper:#f4f1ea; --ink:#1a1917; --ink-2:#5c5955; --rule:#d9d4c7; --accent:#a23e2a; --ok:#2f6b3a; }
    @media (prefers-color-scheme: dark) {
      :root { --paper:#151412; --ink:#ece8df; --ink-2:#9e9a91; --rule:#2e2c28; --accent:#d86a4c; --ok:#6fbf7d; }
    }
    * { box-sizing: border-box; }
    body { margin:0; background:var(--paper); color:var(--ink); font:16px/1.55 system-ui, "Segoe UI", sans-serif; }
    main { max-width: 56rem; margin: 0 auto; padding: 1.5rem 1.25rem 4rem; }
    h1, h2 { font-family: Georgia, "Times New Roman", serif; font-weight: 500; margin: 0 0 .5rem; }
    h2 { font-size: 1.25rem; margin-top: 2.5rem; }
    a { color: var(--accent); }
    hr { border: 0; border-top: 1px solid var(--rule); margin: 1.5rem 0; }
    .muted { color: var(--ink-2); font-size: .875rem; }
    .flash { padding: .6rem .8rem; border: 1px solid var(--rule); margin: 1rem 0; }
    .flash.ok { border-color: var(--ok); }
    .flash.error { border-color: var(--accent); color: var(--accent); }
    input[type=text], input[type=email], input[type=password], input[type=number], textarea {
      width: 100%; padding: .45rem .55rem; border: 1px solid var(--rule); background: transparent; color: inherit; font: inherit;
    }
    textarea { min-height: 5rem; }
    label { display: block; font-size: .8125rem; color: var(--ink-2); margin: .6rem 0 .2rem; }
    label.check { display: inline-flex; align-items: center; gap: .4rem; margin-right: 1.2rem; color: var(--ink); font-size: .9375rem; }
    button { font: inherit; padding: .45rem .9rem; border: 1px solid var(--ink); background: var(--ink); color: var(--paper); cursor: pointer; }
    button.ghost { background: transparent; color: var(--ink); }
    .row { display: flex; gap: 1rem; flex-wrap: wrap; align-items: center; }
    .grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); }
    .card { border-top: 1px solid var(--rule); padding: 1rem 0; }
    .pill { font: .75rem ui-monospace, Consolas, monospace; padding: .1rem .4rem; border: 1px solid var(--rule); }
    .pill.on { border-color: var(--ok); color: var(--ok); }
    details { margin-top: .8rem; }
    summary { cursor: pointer; color: var(--accent); }
    .lang { border-left: 2px solid var(--rule); padding-left: .8rem; margin-top: 1rem; }
  </style>
</head>
<body>
<main>
  @yield('content')
</main>
</body>
</html>
