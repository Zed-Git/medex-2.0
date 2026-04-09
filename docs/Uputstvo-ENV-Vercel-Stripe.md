# Uputstvo: ENV + Vercel + Stripe kada Next preuzima domen `www.medexnews.com`

Tekst je za tebe na srpskom/hrvatskom. Sadržaj sajta ostaje na engleskom u kodu.

Ovo uputstvo je **korigovano** za tvoj slučaj:
- Next.js app preuzima **ceo domen** `https://www.medexnews.com`
- Stari WordPress na GoDaddy se **gasi**
- Znači: u produkciji **SITE URL = APP URL = isti domen**

## 1. Šta ja (agent) ne mogu umesto tebe

- Ne mogu da se ulogujem na tvoj **Vercel**, **Stripe** ili **Supabase**.
- Ne mogu da napravim Stripe **live webhook endpoint** i uzmem `whsec_...` umesto tebe.
- Ne mogu da promenim DNS na GoDaddy umesto tebe.

Ali mogu: da ti dam tačan spisak promenljivih + tačan redosled koraka.

---

## 2. Lokalni razvoj (`.env.local` na računaru) — radiš SAD

Cilj: **Stripe u test režimu** (da rade test kartice i Stripe CLI).

Obavezno lokalno:

| Promenljiva | Vrednost |
|-------------|----------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` |
| `STRIPE_TEST_SECRET_KEY` | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET_TEST` | `whsec_...` (iz `stripe listen`) |

Kako do `whsec_...` lokalno:

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

U tom terminalu Stripe CLI ispiše `whsec_...` → to nalepiš u `.env.local` kao `STRIPE_WEBHOOK_SECRET_TEST`.

Ostalo lokalno:

- `NEXT_PUBLIC_BASE_URL=http://localhost:3000` (OK lokalno)
- `NEXT_PUBLIC_SITE_URL=https://www.medexnews.com` (OK, SEO domen)
- `NEXT_PUBLIC_APP_URL` može biti prazno lokalno (kod ima fallback na localhost)

---

## 3. Vercel Production (www.medexnews.com) — radiš kad krećeš deploy

### 3.1 Domen: prebaci `www.medexnews.com` na Vercel (pre Stripe live webhook-a)

1. Vercel → Project → **Settings → Domains**  
2. Dodaj `www.medexnews.com`  
3. Vercel će ti reći koje DNS zapise treba dodati.
4. GoDaddy → DNS management → dodaj/izmeni zapise kako Vercel kaže.

Tek kad `https://www.medexnews.com` stvarno otvara **Next** (ne WordPress), nastavljaš dalje.

### 3.2 ENV promenljive na Vercelu (Production scope)

Vercel → Project → **Settings → Environment Variables** → Scope: **Production**

Pošto Next preuzima sve na istom domenu, postavi:

- `NEXT_PUBLIC_SITE_URL=https://www.medexnews.com`
- `NEXT_PUBLIC_APP_URL=https://www.medexnews.com`

Za `NEXT_PUBLIC_BASE_URL`:

- **Ne postavljaj** ga u produkciji (ili obriši ako postoji).  
  Razlog: da se nikad slučajno ne desi da produkcija koristi `http://localhost:3000`.

Zatim kopiraš i ostale vrednosti (iz tvog lokalnog `.env.local`) u Vercel Production:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`, opciono `RESEND_FROM`
- `NEXT_PUBLIC_ADMIN_EMAIL`
- `MEDEX_ADMIN_DASHBOARD_PIN`
- (ostalo što koristiš)

### 3.3 Stripe u produkciji: mora LIVE par + LIVE webhook

1. Stripe Dashboard → ugasi “Test mode” (mora LIVE).
2. Developers → API keys:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_...`
   - `STRIPE_SECRET_KEY` = `sk_live_...`

3. Developers → Webhooks → Add endpoint:
   - Endpoint URL: `https://www.medexnews.com/api/webhook`
   - Izaberi događaje koje koristiš (najčešće `checkout.session.completed`).
   - Sačuvaj endpoint → “Signing secret” (`whsec_...`) = `STRIPE_WEBHOOK_SECRET` na Vercelu (Production).

**Ne mešaj test i live**:
- Lokalno: `pk_test` + `sk_test` + `STRIPE_WEBHOOK_SECRET_TEST`
- Produkcija: `pk_live` + `sk_live` + `STRIPE_WEBHOOK_SECRET`

### 3.4 Posle promene ENV na Vercelu

Uradi **Redeploy** (Deployments → Redeploy), jer se `NEXT_PUBLIC_*` vrednosti ugrađuju u build u trenutku deploy-a.

---

## 4. Brza provera posle deploy-a

Otvori:
- `https://www.medexnews.com/robots.txt`
- `https://www.medexnews.com/sitemap.xml`

I proveri u Vercel Logs:
- da nema upozorenja o pk/sk “mode mismatch” (kod može da upozori u server logu).

---

## 5. Gde još ima objašnjenja u repou

- `.env.example` — spisak svih ključeva.
- `src/lib/public-app-url.ts` — kako se pravi APP URL (Stripe return i email CTA).
- `src/lib/site-url.ts` — SEO “site url” (canonical, OG, sitemap).
- `src/lib/stripe-server.ts` — logika test vs live.
