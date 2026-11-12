# Jovia einrichten

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

Diese beiden Einstellungen sind kostenlos und zwingend nötig. Ohne sie führt der Link in der Bestätigungs-E-Mail auf `localhost` und lässt sich nicht öffnen.

Die E-Mail-Vorlagen (**Emails → Templates**) lassen sich bei neuen kostenlosen Projekten nicht bearbeiten. Das ist nicht nötig: Die Standardvorlagen funktionieren mit Jovia. Wer später einen eigenen E-Mail-Dienst einträgt, kann die Vorlagen anpassen und dann diese Links verwenden, damit sie auf jedem Gerät funktionieren:

- *Confirm signup*: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard`
- *Reset password*: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`

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

## 5. KI-Reiseplanung einschalten (Anthropic)

1. Auf https://console.anthropic.com ein Konto anlegen und ein Zahlungsmittel hinterlegen. Die KI wird nach Nutzung abgerechnet.
2. Unter **Limits** ein monatliches Ausgabenlimit setzen, damit die Kosten gedeckelt sind.
3. Unter **API Keys** einen Schlüssel erstellen und kopieren.
4. In Vercel als Umgebungsvariable `ANTHROPIC_API_KEY` eintragen (Production) und **Redeploy** klicken.
5. `/setup-check` zeigt danach bei «AI planner key» ein OK.

6. In Supabase im **SQL Editor** zusätzlich die Datei `supabase/migrations/0002_subscriptions.sql` ausführen. Sie legt die Tabelle für Free und Premium an.

**Stufen:** Free = 2 Pläne pro Monat, bis 21 Tage. Premium = 30 Pläne pro Monat (CHF 5.95 pro Monat), bis 21 Tage. Unlimited = unbegrenzte Pläne mit Claude Opus (CHF 99.90 pro Monat), bis 21 Tage. Bezahlte Stufen noch nicht kaufbar. Für Unlimited zuerst `supabase/migrations/0004_unlimited_tier.sql` im SQL Editor ausführen; das Modell lässt sich mit `ANTHROPIC_MODEL_UNLIMITED` ändern. Free und Premium nutzen standardmässig das günstige Modell `claude-haiku-5-5`. Die Zahlen stehen in `src/lib/billing.ts`. Admin-Konten zählen mindestens als Premium. Im Admin-Bereich lassen sich Premium und Unlimited von Hand vergeben, bis eine Online-Bezahlung angebunden ist. Die Modelle lassen sich in Vercel mit `ANTHROPIC_MODEL_FREE` und `ANTHROPIC_MODEL` überschreiben.

## Was schon funktioniert

Startseite, Registrierung, E-Mail-Bestätigung, Login, Passwort vergessen und zurücksetzen, Abmelden, geschützte Bereiche, Profil bearbeiten, «My data» mit Einwilligung zur Personalisierung und Kontolöschung, Admin-Übersicht mit Nutzungszahlen, Eingabemaske, KI-Reiseplanung, gespeicherte Reisepläne mit Tagesplanung und Budgetübersicht, Reise löschen, KI-Inhalt melden.

## Was als Nächstes kommt

Interaktive Karte und Bilder, Aktivitäten tauschen und entfernen, Tag neu planen, PDF-Export, Feedback und KI-Gedächtnis.

## Lokal starten (optional)

```
cp .env.example .env.local   # Werte eintragen
npm install
npm run dev
```

## Impressum und AGB

Name, Adresse und Kontakt-E-Mail des Betreibers stehen in `src/lib/operator.ts`. Solange sie leer sind, zeigt das Impressum rote Platzhalter. AGB (`/terms`), Datenschutzerklärung (`/privacy`) und Impressum (`/imprint`) sind Entwürfe und sollten vor dem öffentlichen Start rechtlich geprüft werden.

## Schweizer Funktionen (Wohnort, Flughäfen, Schulferien, Wechselkurse)

1. In Supabase im **SQL Editor** die Datei `supabase/migrations/0003_home_location.sql` ausführen. Sie ergänzt das Profil um Wohnkanton und Wohnort.
2. Sonst ist nichts einzurichten: Schulferien und Feiertage kommen von der freien OpenHolidays API, Wechselkurse von Frankfurter (Referenzkurse der Europäischen Zentralbank). Beide brauchen keinen Schlüssel.
3. Der Standort des Geräts ist freiwillig, wird auf rund einen Kilometer gerundet und nur für die jeweilige Planung verwendet, nie gespeichert.
