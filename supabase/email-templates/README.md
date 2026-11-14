# Account emails (Supabase)

The two emails Jovia sends: confirm sign-up and reset password. Each file holds all four
languages; Supabase picks one from `language` in the user's metadata, which the website sets
at sign-up and whenever the language is changed. Without it, English is used.

Paste them in Supabase: **Authentication → Emails → Templates**.

## Confirm signup

Subject:

```
{{ $l := "en" }}{{ with .Data }}{{ with .language }}{{ $l = . }}{{ end }}{{ end }}{{ if eq $l "de" }}Bestätige dein Jovia-Konto{{ else if eq $l "fr" }}Confirme ton compte Jovia{{ else if eq $l "it" }}Conferma il tuo account Jovia{{ else }}Confirm your Jovia account{{ end }}
```

Message body: the full content of `confirm-signup.html`.

## Reset password

Subject:

```
{{ $l := "en" }}{{ with .Data }}{{ with .language }}{{ $l = . }}{{ end }}{{ end }}{{ if eq $l "de" }}Neues Passwort für Jovia{{ else if eq $l "fr" }}Nouveau mot de passe pour Jovia{{ else if eq $l "it" }}Nuova password per Jovia{{ else }}Reset your Jovia password{{ end }}
```

Message body: the full content of `reset-password.html`.

The other templates (magic link, change email, invite, reauthentication) are not used by Jovia yet.
