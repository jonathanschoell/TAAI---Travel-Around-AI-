# TAAI einrichten

Diese Anleitung bringt die Seite online. Du brauchst dafür dein Supabase-Projekt (Zürich) und dein Vercel-Konto. Schlüssel gehören nur in Vercel, nie in den Code und nie in einen Chat.

## 1. Datenbank anlegen (Supabase)

1. Supabase öffnen → dein Projekt → **SQL Editor** → **New query**.
2. Den gesamten Inhalt der Datei `supabase/migrations/0001_init.sql` einfügen und **Run** klicken.
3. Unter **Table Editor** erscheinen danach die Tabellen (`profiles`, `trips`, `memory_items` …).

## 2. Anmeldung einstellen (Supabase → Authentication)

- **Sign In / Providers → Email:** «Confirm email» einschalten. Mindestlänge des Passworts auf 10 setzen.
- **URL Configuration:**
  - *Site URL*: die Adresse deiner Seite, z. B. `https://dein-projekt.vercel.app`
  - *Redirect URLs*: `https://dein-projekt.vercel.app/auth/callback` und `https://dein-projekt.vercel.app/auth/confirm`
- **Emails → Templates** (empfohlen, damit Links auf jedem Gerät funktionieren):
  - *Confirm signup*, Link ersetzen durch:
    `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard`
  - *Reset password*, Link ersetzen durch:
    `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`

Der eingebaute E-Mail-Versand von Supabase ist stark begrenzt und nur zum Testen gedacht. Vor dem Start mit echten Nutzern unter **Emails → SMTP Settings** einen eigenen Dienst (z. B. Resend) mit eigener Domain eintragen.

## 3. Seite veröffentlichen (Vercel)

1. Vercel → **Add New → Project** → dieses GitHub-Repository auswählen.
2. Unter **Environment Variables** eintragen (Werte aus Supabase → Project Settings → API Keys):

| Name | Wert |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key |
| `SUPABASE_SECRET_KEY` | Secret key (geheim, nur hier eintragen) |
| `ADMIN_EMAILS` | die zwei Admin-Adressen, mit Komma getrennt |
| `NEXT_PUBLIC_SITE_URL` | Adresse der Seite ohne Schrägstrich am Ende |

3. **Deploy** klicken. Nach jeder Änderung an den Variablen einmal **Redeploy**.
4. Zur Kontrolle `https://deine-adresse/setup-check` öffnen. Die Seite zeigt, welche Werte die Website findet und ob Supabase antwortet. Werte selbst werden dort nie angezeigt.

Die Variablen müssen für die Umgebung **Production** gesetzt sein. Namen exakt so schreiben wie in der Tabelle, ohne Leerzeichen und ohne Anführungszeichen.

## 4. Admin-Konten

1. Auf der veröffentlichten Seite beide Admin-Adressen ganz normal registrieren, jeweils mit einem eigenen, neuen Passwort.
2. Bestätigungslink in der E-Mail öffnen.
3. Nach dem Login erscheint für diese Konten der Menüpunkt **Admin**.

Admin ist nur, wer in `ADMIN_EMAILS` steht und seine E-Mail bestätigt hat. Ein zweiter Anmeldefaktor für Admin-Konten folgt in einem späteren Schritt.

## Was schon funktioniert

Startseite, Registrierung, E-Mail-Bestätigung, Login, Passwort vergessen und zurücksetzen, Abmelden, geschützte Bereiche, Profil bearbeiten, «My data» mit Einwilligung zur Personalisierung und Kontolöschung, Admin-Übersicht mit Nutzungszahlen.

## Was als Nächstes kommt

Eingabemaske und KI-Reiseplanung (dafür wird später `ANTHROPIC_API_KEY` benötigt), Ergebnisseite mit Karte und Budget, Bearbeiten, Feedback und KI-Gedächtnis.

## Lokal starten (optional)

```
cp .env.example .env.local   # Werte eintragen
npm install
npm run dev
```
