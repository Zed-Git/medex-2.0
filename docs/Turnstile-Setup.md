# Cloudflare Turnstile — Uputstvo za postavljanje

## Šta je Turnstile?

Cloudflare Turnstile je moderna CAPTCHA zaštita koja ne zahtijeva rješavanje zagonetki ("označite sve semafor slike"). Korisnik samo posjeti stranicu i Turnstile automatski verifikuje da li se radi o čovjeku — bez ikakve interakcije u većini slučajeva.

Koristi se za zaštitu forme "Send for Expert Analysis" na glavnoj stranici i kontakt forme (`/contact`).

---

## 1. Gdje uzeti ključeve?

1. Prijavite se na [Cloudflare Dashboard](https://dash.cloudflare.com)
2. U lijevom meniju odaberite **Turnstile**
3. Kliknite **Add site**
4. Unesite naziv stranice (npr. `MedExNews`) i domenu (npr. `medexnews.com`)
5. Odaberite **Widget type** → preporučeno: **Managed** (Cloudflare sam odlučuje) ili **Always** (uvijek prikazuje izazov za forme)
6. Kliknite **Create**
7. Dobićete dva ključa:
   - **Site Key** — javni ključ (može biti u kodu i bundlu)
   - **Secret Key** — tajni ključ (SAMO na serveru, NIKAD u kodu koji ide klijentu)

> **Napomena:** Za forme se preporučuje `Always` challenge mode — osigurava da svaki korisnik prođe provjeru, što je jače od `Managed` moda koji može propustiti neke botove.

---

## 2. Postavljanje lokalnog razvoja (`.env.local`)

Kopirajte `.env.example` u `.env.local` i dodajte ključeve:

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAA...   # vaš Site Key
TURNSTILE_SECRET_KEY=0x4AAAAAAA...             # vaš Secret Key
```

> **Graceful degradation:** Ako ostavite oba ključa prazna, CAPTCHA widget se **neće prikazati** i forme će raditi normalno. Ovo je namjerno ponašanje za lokalni razvoj bez ključeva.

---

## 3. Postavljanje na Vercel (produkcija)

1. Idite na [Vercel Dashboard](https://vercel.com) → vaš projekat
2. Kliknite **Settings** → **Environment Variables**
3. Dodajte sljedeće varijable za **Production** (i po želji Preview):

| Naziv varijable                    | Vrijednost         | Okruženje              |
|------------------------------------|--------------------|------------------------|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`   | `0x4AAAAAAA...`    | Production, Preview    |
| `TURNSTILE_SECRET_KEY`             | `0x4AAAAAAA...`    | Production, Preview    |

4. Nakon dodavanja varijabli, pokrenite novi **Deployment** (Vercel automatski ne redeploy-uje sa novim ENV vrijednostima dok ne napravite novi deploy).

---

## 4. Kako funkcionira verifikacija?

### Klijentska strana (browser):
- Turnstile widget učitava Cloudflare skriptu i prikazuje interaktivni element
- Nakon uspješne provjere, widget pozove `onSuccess(token)` callback
- Token se šalje zajedno sa podacima forme serveru

### Serverska strana (Next.js API / Server Action):
- Server uzme token iz request body-a
- Pozove Cloudflare API: `POST https://challenges.cloudflare.com/turnstile/v0/siteverify`
- Ako verifikacija prođe → obradi zahtjev
- Ako ne prođe → vrati grešku 400

### Graceful degradation:
- Ako `TURNSTILE_SECRET_KEY` nije postavljen → server preskače verifikaciju (forme rade normalno)
- Ako `NEXT_PUBLIC_TURNSTILE_SITE_KEY` nije postavljen → widget se ne prikazuje, submit nije blokiran

---

## 5. Testiranje

Cloudflare nudi posebne site ključeve za testiranje:

| Site Key                                    | Ponašanje               |
|---------------------------------------------|-------------------------|
| `1x00000000000000000000AA`                  | Uvijek prođe (pass)     |
| `2x00000000000000000000AB`                  | Uvijek ne prođe (fail)  |
| `3x00000000000000000000FF`                  | Uvijek prikazuje izazov |

Za testiranje u lokalnom developmentu koristite `1x00000000000000000000AA` kao `NEXT_PUBLIC_TURNSTILE_SITE_KEY` i bilo koji string kao `TURNSTILE_SECRET_KEY`.

---

## 6. Koji fajlovi su izmijenjeni?

| Fajl                                          | Izmjena                                       |
|-----------------------------------------------|-----------------------------------------------|
| `src/app/page.tsx`                            | Dodat Turnstile widget iznad submit dugmeta   |
| `src/app/actions.ts`                          | Server-side verifikacija tokena               |
| `src/app/api/request-analysis/route.ts`       | Server-side verifikacija tokena               |
| `src/app/contact/page.tsx`                    | Dodat Turnstile widget iznad submit dugmeta   |
| `src/app/api/contact/route.ts`                | Server-side verifikacija tokena               |
| `.env.example`                                | Dodane varijable `NEXT_PUBLIC_TURNSTILE_SITE_KEY` i `TURNSTILE_SECRET_KEY` |
| `docs/Turnstile-Setup.md`                     | Ovo uputstvo                                  |
