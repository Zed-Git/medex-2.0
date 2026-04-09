# Medex 2.0 — Email notification system repair

**Notebook report — Golden Standard 5.0.0**

This document records the diagnosis, code changes, and rationale for aligning the Medex 2.0 email flow with Next.js 15+ App Router practices. It is written for developers who are new to Next.js server routes, Server Actions, and third-party email APIs (Resend).

---

## Part A — English

### 1. Context

The platform follows a **digital reflex** workflow: after a patient submits a request, **both the patient and the administrator** must receive email notifications via **Resend**; additional messages are sent after Stripe payment when the final PDF is ready. This report explains what was wrong, what was changed in the codebase, and how those changes relate to **Next.js 15+** conventions.

### 2. Diagnosis (what was wrong)

| Issue | Explanation (beginner-friendly) |
|--------|-----------------------------------|
| **A. Self-HTTP calls from the server** | Some API routes attempted to send email by calling `fetch("https://your-site/api/send-email")` from inside the same application. In production (e.g. Vercel), the server must know the **exact public URL**; cold starts and routing can fail, and **calling yourself over HTTP** is unreliable. The database insert could succeed while **no email was ever sent**. |
| **B. Landing page did not trigger the “first email”** | The home page button **“SEND FOR EXPERT ANALYSIS”** used a **Server Action** (`submitMedicalRequest`) that only wrote to **Supabase**. It never invoked the email layer. A separate route (`POST /api/request-analysis`) did send emails, so behaviour depended on **which page** the user used. |
| **C. Admin payload mismatch** | The admin panel sent `reportId: "REP-51"` but the email dispatcher only looked for `requestId` or `id`. The request reference was **missing**, so the API returned **400** and the UI showed a generic **“Email notification system error”**. |
| **D. Next.js 15+ dynamic APIs** | `headers()` must be **awaited**. The success page used `useSearchParams()` without a **Suspense** boundary, which can break **static generation / build** in the App Router. |
| **E. Type safety** | Some places used loose typing (`any`) for Stripe or PDF rendering, which hides bugs at compile time. |

### 3. Therapy (what was changed, file by file)

| File | Change | Why it matters |
|------|--------|----------------|
| **`src/lib/email-service.ts`** *(new)* | Central **Resend** module: sends **initial confirmation** (patient + admin), **final PDF** emails after payment, and a **legacy** mapper for `POST /api/send-email`. HTML escaping for admin bodies; optional trim of env quotes for API key and `RESEND_FROM`. | **Single place** for email logic — easier to test, log, and maintain templates. |
| **`src/app/api/request-analysis/route.ts`** | After DB insert, calls **`sendRequestSubmissionEmails`** instead of `fetch` to `/api/send-email`. | Removes fragile **self-fetch**; same Node process, more dependable delivery. |
| **`src/app/api/webhook/route.ts`** | After PDF upload + DB update, calls **`sendFinalPdfReportEmails`**; keeps **`await headers()`** for Stripe signature verification; Stripe **`apiVersion`** aligned with the installed SDK; stricter PDF element typing. | Correct **webhook verification** and a **typed** PDF pipeline. |
| **`src/app/api/send-email/route.ts`** | Delegates to **`dispatchLegacySendEmailBody`**; returns **502** with **details** if Resend fails (not a misleading 200). | Honest API contract for **admin tools** and debugging. |
| **`src/app/actions.ts`** | After successful **`submitMedicalRequest`** insert, calls **`sendRequestSubmissionEmails`** (pricing text from `site_config` when available). | The **first email** fires from the **landing form**, not only from `/request-analysis`. |
| **`src/app/admin-zdravko/page.tsx`** | Sends **`requestId`** alongside **`reportId`**; reads **`error` / `details`** from failed responses. | Fixes **400** from missing ID; clearer operator-facing errors. |
| **`src/app/request-analysis/page.tsx`** | Restored as a real **client page** (form → `POST /api/request-analysis`). | Had been overwritten by mistake; broke the default page export and build. |
| **`src/app/success/page.tsx`** | Inner component + **`Suspense`** fallback around content that uses **`useSearchParams`**. | Satisfies **Next.js App Router** expectations for URL-dependent client hooks. |
| **`src/components/EmailTemplate.tsx`** | Kept consistent with the shared email pipeline for patient-facing HTML. | One visual and copy baseline for Resend-rendered messages. |

### 4. Why this matches the Next.js 15+ standard

1. **Async dynamic APIs** — `await headers()` in Route Handlers is the supported pattern for reading request headers; the Stripe webhook **must** read `stripe-signature` reliably.
2. **Avoid unnecessary server-to-server HTTP to your own app** — Prefer **direct module calls** (`email-service`) inside Route Handlers or Server Actions so deployment URL and cold starts do not block email.
3. **Suspense + `useSearchParams`** — Wrapping the relevant subtree avoids prerender/build issues when the client depends on the URL query string.
4. **Strict TypeScript** — Replacing `any` with proper types (and precise casts where the library requires them) catches mistakes before production.

### 5. Operational checklist

- Set **`RESEND_API_KEY`** and a verified **`RESEND_FROM`** sender in the Resend dashboard.
- Optionally set **`MEDEX_ADMIN_EMAIL`** for the administrator inbox.
- Ensure server-only Supabase operations use the **service role** key only on the server, never in browser code.

---

## Part B — Srpsko-hrvatski

### 1. Kontekst

Aplikacija prati **digitalni reflex**: posle prijave pacijenta treba da stignu **mejlovi pacijentu i administratoru** preko **Resenda**, a kasnije i posle uplate preko **Stripe-a** kada je finalni PDF spreman. Ovaj odeljak objašnjava **šta nije radilo**, **šta je izmenjeno u kodu** i **zašto to ima smisla** u kontekstu **Next.js 15+** App Routera.

### 2. Dijagnoza (šta je bio problem)

| Problem | Objašnjenje (jednostavno) |
|--------|----------------------------|
| **A. Self-HTTP pozivi sa servera** | Neki API rutovi su pokušavali da pošalju mejl preko `fetch` ka sopstvenom endpointu (`/api/send-email`). U produkciji to često **pukne** (URL, hladan start, rutiranje). **Baza može da upiše podatak, a mejl nikad ne ode.** |
| **B. Početna strana nije slala „prvi mejl”** | Dugme **„SEND FOR EXPERT ANALYSIS”** koristi **Server Action** (`submitMedicalRequest`) koji samo upisuje u **Supabase**. **Nije zvao** sloj za mejl. Druga putanja (`POST /api/request-analysis`) jeste slala mejlove — ponašanje je zavisilo od toga **gde** korisnik popunjava formu. |
| **C. Nevažeći payload u admin panelu** | Admin je slao `reportId: "REP-51"`, a parser je tražio samo `requestId` ili `id`. Referenca zahteva je **nedostajala** → API **400** → korisnik vidi generičku **„Email notification system error”**. |
| **D. Next.js 15+ dinamički API** | `headers()` mora biti **`await`**. Stranica uspeha je koristila `useSearchParams()` bez **Suspense** granice, što može da pokvari **build** / statičku obradu. |
| **E. Tipovi** | Delovi koda sa `any` za Stripe/PDF skrivaju greške do produkcije. |

### 3. Terapija (šta je tačno promenjeno po fajlovima)

| Fajl | Promena | Zašto je važno |
|------|---------|----------------|
| **`src/lib/email-service.ts`** *(novi)* | Jedan centralni modul za **Resend**: prvi mejl (pacijent + admin), finalni PDF posle uplate, **legacy** mapiranje za `POST /api/send-email`. | **Jedna tačka** za logiku mejlova — lakše održavanje i logovanje. |
| **`src/app/api/request-analysis/route.ts`** | Posle INSERT-a u bazu poziva **`sendRequestSubmissionEmails`**, ne `fetch` na `/api/send-email`. | Uklanja **nestabilan self-fetch**. |
| **`src/app/api/webhook/route.ts`** | Posle PDF-a poziva **`sendFinalPdfReportEmails`**; zadržan **`await headers()`** za Stripe; usklađen **`apiVersion`**; čvršći tipovi za PDF. | Ispravna **verifikacija webhooka** i **tipovi**. |
| **`src/app/api/send-email/route.ts`** | Prosleđuje **`dispatchLegacySendEmailBody`**; vraća **502** sa detaljima ako Resend ne uspe. | API ne laže da je sve u redu ako mejl nije poslat. |
| **`src/app/actions.ts`** | Posle uspešnog `submitMedicalRequest` poziva **`sendRequestSubmissionEmails`**. | **Prvi mejl** i sa **landing** forme. |
| **`src/app/admin-zdravko/page.tsx`** | Šalje **`requestId`** uz **`reportId`**; čita **`error` / `details`**. | Ispravlja problem sa ID-jem; jasnije greške. |
| **`src/app/request-analysis/page.tsx`** | Ponovo prava **klijentska stranica** sa formom. | Ranije slučajno prepisana API rutom. |
| **`src/app/success/page.tsx`** | **`Suspense`** oko dela koji koristi **`useSearchParams`**. | U skladu sa **Next.js App Router** pravilima. |
| **`src/components/EmailTemplate.tsx`** | Usklađeno sa zajedničkim mejl tokom. | Jedinstven HTML za pacijenta. |

### 4. Veza sa Next.js 15+ „standardom”

1. **`await headers()`** — očekivani način čitanja zaglavlja u Route Handlerima; Stripe webhook **mora** pouzdano da pročita potpis.
2. **Bez suvišnog HTTP poziva ka sopstvenom API-ju** — direktan poziv modula (`email-service`) u istom procesu je pouzdaniji.
3. **Suspense + `useSearchParams`** — smanjuje probleme pri **buildu** i statičkoj generaciji.
4. **Strogi TypeScript** — manje skrivenih grešaka u produkciji.

### 5. Šta proveriti u produkciji

- **`RESEND_API_KEY`** i verifikovan domen za **`RESEND_FROM`** u Resend konzoli.
- Po želji **`MEDEX_ADMIN_EMAIL`** za admin inbox.
- **Supabase**: **service role** ključ samo na serveru; nikad u klijentskom kodu.

---

*Document version: aligned with Golden Standard 5.0.0 (`golden-standard-5.0.0` tag).*
