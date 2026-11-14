import "server-only";
import { OPERATOR, PREMIUM_PRICE, UNLIMITED_PRICE } from "@/lib/operator";
import type { Locale } from "./config";

type Sections = [string, string[]][];

export type LegalTexts = {
  draft: string;
  /** Shown on translations: which language version is binding. */
  binding: string | null;
  terms: { title: string; version: string; seeAlso: [string, string, string, string]; sections: Sections };
  privacy: { title: string; lead: string; sections: Sections };
  imprint: {
    title: string;
    incomplete: string;
    missing: string;
    operator: string;
    uid: string;
    contact: string;
    email: string;
    contentTitle: string;
    content: string;
    linksTitle: string;
    links: string;
  };
};

const op = OPERATOR.name || "the operator named in the imprint";
const address = `${OPERATOR.name}, ${OPERATOR.street}, ${OPERATOR.postalCodeAndCity}`;

const en: LegalTexts = {
  draft: "Draft, not yet legally reviewed",
  binding: null,
  terms: {
    title: "Terms of use",
    version: "Version {v}.",
    seeAlso: ["See also the ", "privacy policy", " and the ", "imprint"],
    sections: [
      ["1. Who these terms apply to", [
        `These terms govern the use of Jovia, an online service run by ${op} ("we"). By creating an account you accept them.`,
        "If you do not agree, please do not use Jovia.",
      ]],
      ["2. What Jovia does", [
        "Jovia creates travel itineraries with the help of artificial intelligence, based on what you tell it.",
        "Jovia is a planning tool. We are not a travel agency, tour operator or booking agent. We do not sell or arrange flights, accommodation or activities, and no travel contract is concluded with us.",
      ]],
      ["3. AI-generated content", [
        "Itineraries are generated automatically and are not checked by a person. They can contain mistakes: places may be closed, may have moved or may not exist, and routes may be impractical.",
        "All prices and budgets are estimates, not offers. Opening hours, availability, entry requirements and safety conditions are not verified.",
        "You are responsible for checking important details with the provider before you book or travel, including visa, health and safety requirements.",
        "You can report a problem with a plan using the button on every itinerary.",
      ]],
      ["4. Your account", [
        "You must be at least 16 years old and give a valid email address.",
        "Keep your password secret. You are responsible for activity in your account. Tell us if you believe someone else is using it.",
        "You can delete your account and all related data at any time under \"My data\".",
      ]],
      ["5. Free and paid plans", [
        "The Free plan includes a limited number of itineraries per month at no charge. The current limits are shown on the pricing page.",
        `Premium costs ${PREMIUM_PRICE} per month and includes more itineraries. Unlimited costs ${UNLIMITED_PRICE} per month, has no limit on the number of itineraries and uses our most capable AI model. Prices include any applicable value added tax.`,
        "Unlimited is meant for personal use. Automated or bulk creation of itineraries, or sharing an account, is not allowed under section 6.",
        "The paid plans are not yet available for purchase. Before they are, these terms will be updated with the payment method, the billing period, how to cancel and any right of withdrawal.",
        "We may change limits and features of the Free plan. Changes to a paid plan apply from the next billing period and are announced in advance.",
      ]],
      ["6. Acceptable use", [
        "Use Jovia only for planning your own or your group's travel.",
        "Do not try to disrupt the service, get around usage limits, access other people's data, or use automated tools to create itineraries in bulk.",
        "Do not enter unlawful content or sensitive information about other people.",
        "We may suspend or close accounts that break these rules.",
      ]],
      ["7. Your content and ours", [
        "What you enter remains yours. You allow us to process it to provide the service, as described in the privacy policy.",
        "You may use the itineraries created for you for your personal travel. The Jovia name, logo, design and software belong to us.",
      ]],
      ["8. Availability", [
        "We aim to keep Jovia available but do not guarantee uninterrupted service. Features may change, and the service may be paused for maintenance.",
      ]],
      ["9. Liability", [
        "We are liable without limit for damage caused intentionally or through gross negligence, and where the law does not allow liability to be limited.",
        "Otherwise our liability is excluded to the extent the law permits. In particular, we are not liable for costs or losses that arise because an itinerary was inaccurate, because a place, price or opening time differed from the plan, or because of services of third parties.",
      ]],
      ["10. Ending the agreement", [
        "You can stop using Jovia and delete your account at any time.",
        "We may end the agreement with reasonable notice, or immediately for a serious breach of these terms.",
      ]],
      ["11. Changes to these terms", [
        "We may update these terms. We will tell you about important changes by email or when you next log in. If you continue to use Jovia afterwards, the new terms apply.",
      ]],
      ["12. Law and place of jurisdiction", [
        "Swiss law applies. The courts at the operator's place of residence or registered office have jurisdiction. Mandatory consumer protection rules of your country of residence, including mandatory places of jurisdiction, remain unaffected.",
      ]],
    ],
  },
  privacy: {
    title: "Privacy policy",
    lead: "This draft describes how Jovia handles personal data today. A legal review under the Swiss FADP and the GDPR is still to follow before public launch.",
    sections: [
      ["Who is responsible", [
        `${address}, Switzerland.`,
        `For questions about your data, or to exercise your rights, write to ${OPERATOR.email}.`,
      ]],
      ["What we store", [
        "Account: your email address and a securely hashed password. We never store your password in readable form.",
        "Profile: the name, age group, currency, language, home town and canton you choose to enter.",
        "Consents: when you accepted this policy and when you turned personalisation on or off.",
        "Usage: when your account was last active and how many itineraries you created, to apply plan limits and see how many people use Jovia.",
      ]],
      ["What we use it for", [
        "To let you log in and keep your trips and preferences private to your account.",
        "To improve travel suggestions, only if you have turned long-term personalisation on.",
        "To understand overall usage of the service.",
      ]],
      ["What the operator can see", [
        "The operator can see account email addresses, registration and sign-in times, and overall usage figures.",
        "Trip contents and AI memory entries of individual users are not shown in the operator's admin area.",
      ]],
      ["Service providers", [
        "Database and sign-in: Supabase, hosted in Zurich, Switzerland.",
        "Website hosting: Vercel.",
        "AI trip planning: Anthropic, USA. What you enter in the trip planner (destination, dates, ages, interests, wishes) is sent to Anthropic to create your itinerary. Your email address and password are never sent.",
        "Sign-up and password emails are sent by Resend (Resend, Inc., USA) from servers in Ireland. Resend receives your email address and the content of these emails, nothing else.",
        "Holiday calendars and exchange rates are fetched from public services without any personal data.",
        "Maps on itineraries are loaded by your browser from OpenStreetMap (OpenStreetMap Foundation, UK), and destination photos from Wikimedia Commons (Wikimedia Foundation, USA). These services see your IP address when the map or photo loads, as with any website.",
        "Booking links take you to the provider's website (for example Booking.com, Google Flights or GetYourGuide). What you do there is covered by that provider's privacy policy. Jovia does not see what you book.",
      ]],
      ["Cookies", [
        "Jovia only uses cookies it needs to work: one keeps you signed in, one remembers the language you chose. There are no advertising or tracking cookies.",
      ]],
      ["Your choices", [
        "See and edit your data under “My data” and “Profile”.",
        "Turn long-term personalisation on or off at any time.",
        "Delete your account and all related data yourself under “My data”.",
      ]],
    ],
  },
  imprint: {
    title: "Imprint",
    incomplete: "Incomplete: operator details missing",
    missing: "[to be completed]",
    operator: "Operator of this website",
    uid: "Company number (UID): {uid}",
    contact: "Contact",
    email: "Email:",
    contentTitle: "About the content",
    content: "Itineraries on Jovia are created by artificial intelligence. Prices, opening hours and availability are estimates and are not checked by a person. Please verify important details with the provider before you book or travel.",
    linksTitle: "Links to other websites",
    links: "Jovia links to websites of third parties, for example maps. Their operators are responsible for the content of those sites.",
  },
};

const de: LegalTexts = {
  draft: "Entwurf, noch nicht rechtlich geprüft",
  binding: "Diese Übersetzung dient dem Verständnis. Bei Abweichungen gilt die englische Fassung.",
  terms: {
    title: "Nutzungsbedingungen",
    version: "Version {v}.",
    seeAlso: ["Siehe auch die ", "Datenschutzerklärung", " und das ", "Impressum"],
    sections: [
      ["1. Geltungsbereich", [
        `Diese Bedingungen regeln die Nutzung von Jovia, einem Online-Dienst von ${op} («wir»). Mit dem Erstellen eines Kontos akzeptierst du sie.`,
        "Wenn du nicht einverstanden bist, nutze Jovia bitte nicht.",
      ]],
      ["2. Was Jovia macht", [
        "Jovia erstellt Reisepläne mit Hilfe künstlicher Intelligenz, basierend auf deinen Angaben.",
        "Jovia ist ein Planungswerkzeug. Wir sind kein Reisebüro, Reiseveranstalter oder Buchungsvermittler. Wir verkaufen oder vermitteln keine Flüge, Unterkünfte oder Aktivitäten, und mit uns kommt kein Reisevertrag zustande.",
      ]],
      ["3. KI-generierte Inhalte", [
        "Reisepläne werden automatisch erstellt und von keinem Menschen geprüft. Sie können Fehler enthalten: Orte können geschlossen, umgezogen oder gar nicht vorhanden sein, und Routen können unpraktisch sein.",
        "Alle Preise und Budgets sind Schätzungen, keine Angebote. Öffnungszeiten, Verfügbarkeit, Einreisebestimmungen und Sicherheitslage werden nicht geprüft.",
        "Du bist dafür verantwortlich, wichtige Angaben vor dem Buchen oder Reisen beim Anbieter zu prüfen, auch Visa-, Gesundheits- und Sicherheitsvorschriften.",
        "Probleme mit einem Plan kannst du über die Schaltfläche auf jedem Reiseplan melden.",
      ]],
      ["4. Dein Konto", [
        "Du musst mindestens 16 Jahre alt sein und eine gültige E-Mail-Adresse angeben.",
        "Halte dein Passwort geheim. Du bist für Aktivitäten in deinem Konto verantwortlich. Melde dich bei uns, wenn du glaubst, dass jemand anderes es nutzt.",
        "Du kannst dein Konto und alle zugehörigen Daten jederzeit unter «Meine Daten» löschen.",
      ]],
      ["5. Kostenlose und bezahlte Abos", [
        "Das Free-Abo enthält kostenlos eine begrenzte Anzahl Reisepläne pro Monat. Die aktuellen Grenzen stehen auf der Preisseite.",
        `Premium kostet ${PREMIUM_PRICE} pro Monat und enthält mehr Reisepläne. Unlimited kostet ${UNLIMITED_PRICE} pro Monat, hat keine Grenze bei der Anzahl Reisepläne und nutzt unser stärkstes KI-Modell. Die Preise enthalten allfällige Mehrwertsteuer.`,
        "Unlimited ist für den persönlichen Gebrauch gedacht. Automatisiertes oder massenhaftes Erstellen von Reiseplänen sowie das Teilen eines Kontos sind nach Ziffer 6 nicht erlaubt.",
        "Die bezahlten Abos können noch nicht gekauft werden. Vorher werden diese Bedingungen um Zahlungsart, Abrechnungszeitraum, Kündigung und ein allfälliges Widerrufsrecht ergänzt.",
        "Wir können Grenzen und Funktionen des Free-Abos ändern. Änderungen an einem bezahlten Abo gelten ab dem nächsten Abrechnungszeitraum und werden vorher angekündigt.",
      ]],
      ["6. Zulässige Nutzung", [
        "Nutze Jovia nur, um deine eigenen Reisen oder die deiner Gruppe zu planen.",
        "Versuche nicht, den Dienst zu stören, Nutzungsgrenzen zu umgehen, auf Daten anderer zuzugreifen oder mit automatisierten Werkzeugen massenhaft Reisepläne zu erstellen.",
        "Gib keine rechtswidrigen Inhalte oder heiklen Informationen über andere Personen ein.",
        "Wir können Konten sperren oder schliessen, die gegen diese Regeln verstossen.",
      ]],
      ["7. Deine und unsere Inhalte", [
        "Was du eingibst, bleibt deins. Du erlaubst uns, es zu bearbeiten, um den Dienst zu erbringen, wie in der Datenschutzerklärung beschrieben.",
        "Die für dich erstellten Reisepläne darfst du für deine privaten Reisen nutzen. Name, Logo, Gestaltung und Software von Jovia gehören uns.",
      ]],
      ["8. Verfügbarkeit", [
        "Wir bemühen uns, Jovia verfügbar zu halten, garantieren aber keinen unterbrechungsfreien Betrieb. Funktionen können sich ändern, und der Dienst kann für Wartungen pausieren.",
      ]],
      ["9. Haftung", [
        "Wir haften unbeschränkt für Schäden, die vorsätzlich oder grobfahrlässig verursacht werden, und soweit das Gesetz keine Beschränkung erlaubt.",
        "Im Übrigen ist unsere Haftung ausgeschlossen, soweit das Gesetz es zulässt. Insbesondere haften wir nicht für Kosten oder Verluste, die entstehen, weil ein Reiseplan ungenau war, weil ein Ort, Preis oder eine Öffnungszeit vom Plan abwich, oder wegen Leistungen Dritter.",
      ]],
      ["10. Beendigung", [
        "Du kannst Jovia jederzeit nicht mehr nutzen und dein Konto löschen.",
        "Wir können den Vertrag mit angemessener Frist beenden, oder sofort bei einem schweren Verstoss gegen diese Bedingungen.",
      ]],
      ["11. Änderungen dieser Bedingungen", [
        "Wir können diese Bedingungen anpassen. Über wichtige Änderungen informieren wir per E-Mail oder bei deiner nächsten Anmeldung. Wenn du Jovia danach weiter nutzt, gelten die neuen Bedingungen.",
      ]],
      ["12. Recht und Gerichtsstand", [
        "Es gilt Schweizer Recht. Zuständig sind die Gerichte am Wohn- oder Geschäftssitz des Betreibers. Zwingende Verbraucherschutzvorschriften deines Wohnsitzlandes, einschliesslich zwingender Gerichtsstände, bleiben vorbehalten.",
      ]],
    ],
  },
  privacy: {
    title: "Datenschutzerklärung",
    lead: "Dieser Entwurf beschreibt, wie Jovia heute mit Personendaten umgeht. Eine rechtliche Prüfung nach Schweizer DSG und DSGVO folgt vor dem offiziellen Start.",
    sections: [
      ["Verantwortlich", [
        `${address}, Schweiz.`,
        `Bei Fragen zu deinen Daten oder um deine Rechte auszuüben, schreib an ${OPERATOR.email}.`,
      ]],
      ["Was wir speichern", [
        "Konto: deine E-Mail-Adresse und ein sicher gehashtes Passwort. Dein Passwort speichern wir nie lesbar.",
        "Profil: Name, Altersgruppe, Währung, Sprache, Wohnort und Kanton, sofern du sie angibst.",
        "Einwilligungen: wann du dieser Erklärung zugestimmt und die Personalisierung ein- oder ausgeschaltet hast.",
        "Nutzung: wann dein Konto zuletzt aktiv war und wie viele Reisepläne du erstellt hast, um die Grenzen der Abos anzuwenden und zu sehen, wie viele Menschen Jovia nutzen.",
      ]],
      ["Wofür wir sie nutzen", [
        "Damit du dich anmelden kannst und deine Reisen und Vorlieben privat in deinem Konto bleiben.",
        "Um Reisevorschläge zu verbessern, nur wenn du die langfristige Personalisierung eingeschaltet hast.",
        "Um die Nutzung des Dienstes insgesamt zu verstehen.",
      ]],
      ["Was der Betreiber sieht", [
        "Der Betreiber sieht die E-Mail-Adressen der Konten, Zeitpunkte von Registrierung und Anmeldung sowie Nutzungszahlen insgesamt.",
        "Reiseinhalte und KI-Gedächtnis einzelner Nutzer werden im Admin-Bereich nicht angezeigt.",
      ]],
      ["Dienstleister", [
        "Datenbank und Anmeldung: Supabase, gehostet in Zürich, Schweiz.",
        "Hosting der Website: Vercel.",
        "KI-Reiseplanung: Anthropic, USA. Was du im Reiseplaner eingibst (Ziel, Daten, Alter, Interessen, Wünsche), wird an Anthropic gesendet, um deinen Reiseplan zu erstellen. Deine E-Mail-Adresse und dein Passwort werden nie gesendet.",
        "E-Mails zur Registrierung und zum Passwort verschickt Resend (Resend, Inc., USA) über Server in Irland. Resend erhält dafür deine E-Mail-Adresse und den Inhalt dieser E-Mails, sonst nichts.",
        "Ferienkalender und Wechselkurse werden ohne Personendaten von öffentlichen Diensten abgerufen.",
        "Karten in Reiseplänen lädt dein Browser von OpenStreetMap (OpenStreetMap Foundation, Grossbritannien), Fotos der Reiseziele von Wikimedia Commons (Wikimedia Foundation, USA). Diese Dienste sehen dabei deine IP-Adresse, wie bei jeder Website.",
        "Buchungslinks führen dich auf die Website des Anbieters (zum Beispiel Booking.com, Google Flights oder GetYourGuide). Was du dort tust, regelt die Datenschutzerklärung des Anbieters. Jovia sieht nicht, was du buchst.",
      ]],
      ["Cookies", [
        "Jovia nutzt nur Cookies, die für den Betrieb nötig sind: eines hält dich angemeldet, eines merkt sich die gewählte Sprache. Es gibt keine Werbe- oder Tracking-Cookies.",
      ]],
      ["Deine Möglichkeiten", [
        "Sieh und bearbeite deine Daten unter «Meine Daten» und «Profil».",
        "Schalte die langfristige Personalisierung jederzeit ein oder aus.",
        "Lösche dein Konto und alle zugehörigen Daten selbst unter «Meine Daten».",
      ]],
    ],
  },
  imprint: {
    title: "Impressum",
    incomplete: "Unvollständig: Angaben zum Betreiber fehlen",
    missing: "[noch zu ergänzen]",
    operator: "Betreiber dieser Website",
    uid: "Unternehmens-Identifikationsnummer (UID): {uid}",
    contact: "Kontakt",
    email: "E-Mail:",
    contentTitle: "Zu den Inhalten",
    content: "Reisepläne auf Jovia werden von künstlicher Intelligenz erstellt. Preise, Öffnungszeiten und Verfügbarkeit sind Schätzungen und werden von keinem Menschen geprüft. Bitte prüfe wichtige Angaben vor dem Buchen oder Reisen beim Anbieter.",
    linksTitle: "Links zu anderen Websites",
    links: "Jovia verlinkt auf Websites Dritter, zum Beispiel Karten. Für deren Inhalte sind die jeweiligen Betreiber verantwortlich.",
  },
};

const fr: LegalTexts = {
  draft: "Projet, pas encore vérifié juridiquement",
  binding: "Cette traduction sert à la compréhension. En cas de divergence, la version anglaise fait foi.",
  terms: {
    title: "Conditions d'utilisation",
    version: "Version {v}.",
    seeAlso: ["Voir aussi la ", "politique de confidentialité", " et les ", "mentions légales"],
    sections: [
      ["1. Champ d'application", [
        `Ces conditions régissent l'utilisation de Jovia, un service en ligne exploité par ${op} (« nous »). En créant un compte, tu les acceptes.`,
        "Si tu n'es pas d'accord, n'utilise pas Jovia.",
      ]],
      ["2. Ce que fait Jovia", [
        "Jovia crée des itinéraires de voyage à l'aide de l'intelligence artificielle, à partir de ce que tu lui indiques.",
        "Jovia est un outil de planification. Nous ne sommes ni une agence de voyages, ni un organisateur de voyages, ni un intermédiaire de réservation. Nous ne vendons ni n'organisons de vols, d'hébergements ou d'activités, et aucun contrat de voyage n'est conclu avec nous.",
      ]],
      ["3. Contenu généré par l'IA", [
        "Les itinéraires sont générés automatiquement et ne sont pas vérifiés par une personne. Ils peuvent contenir des erreurs : des lieux peuvent être fermés, avoir déménagé ou ne pas exister, et des trajets peuvent être peu pratiques.",
        "Tous les prix et budgets sont des estimations, pas des offres. Les horaires, la disponibilité, les conditions d'entrée et la sécurité ne sont pas vérifiés.",
        "Il t'appartient de vérifier les informations importantes auprès du prestataire avant de réserver ou de partir, y compris les exigences de visa, de santé et de sécurité.",
        "Tu peux signaler un problème avec un plan grâce au bouton présent sur chaque itinéraire.",
      ]],
      ["4. Ton compte", [
        "Tu dois avoir au moins 16 ans et indiquer une adresse e-mail valide.",
        "Garde ton mot de passe secret. Tu es responsable de l'activité de ton compte. Préviens-nous si tu penses que quelqu'un d'autre l'utilise.",
        "Tu peux supprimer ton compte et toutes les données liées à tout moment sous « Mes données ».",
      ]],
      ["5. Abonnements gratuit et payants", [
        "L'abonnement Free comprend gratuitement un nombre limité d'itinéraires par mois. Les limites actuelles figurent sur la page des tarifs.",
        `Premium coûte ${PREMIUM_PRICE} par mois et comprend plus d'itinéraires. Unlimited coûte ${UNLIMITED_PRICE} par mois, n'a pas de limite d'itinéraires et utilise notre modèle d'IA le plus performant. Les prix incluent l'éventuelle TVA.`,
        "Unlimited est destiné à un usage personnel. La création automatisée ou en masse d'itinéraires et le partage d'un compte ne sont pas autorisés selon le point 6.",
        "Les abonnements payants ne peuvent pas encore être achetés. Avant cela, ces conditions seront complétées par le mode de paiement, la période de facturation, la résiliation et un éventuel droit de rétractation.",
        "Nous pouvons modifier les limites et fonctions de l'abonnement Free. Les changements d'un abonnement payant s'appliquent dès la période de facturation suivante et sont annoncés à l'avance.",
      ]],
      ["6. Utilisation autorisée", [
        "Utilise Jovia uniquement pour planifier tes voyages ou ceux de ton groupe.",
        "N'essaie pas de perturber le service, de contourner les limites d'utilisation, d'accéder aux données d'autrui ou de créer des itinéraires en masse avec des outils automatisés.",
        "Ne saisis pas de contenu illicite ni d'informations sensibles sur d'autres personnes.",
        "Nous pouvons suspendre ou fermer les comptes qui enfreignent ces règles.",
      ]],
      ["7. Ton contenu et le nôtre", [
        "Ce que tu saisis t'appartient. Tu nous autorises à le traiter pour fournir le service, comme décrit dans la politique de confidentialité.",
        "Tu peux utiliser les itinéraires créés pour toi pour tes voyages personnels. Le nom, le logo, le design et le logiciel de Jovia nous appartiennent.",
      ]],
      ["8. Disponibilité", [
        "Nous nous efforçons de garder Jovia disponible mais ne garantissons pas un service sans interruption. Les fonctions peuvent changer et le service peut être suspendu pour maintenance.",
      ]],
      ["9. Responsabilité", [
        "Nous répondons sans limite des dommages causés intentionnellement ou par négligence grave, ainsi que lorsque la loi ne permet pas de limiter la responsabilité.",
        "Pour le reste, notre responsabilité est exclue dans la mesure permise par la loi. En particulier, nous ne répondons pas des frais ou pertes dus à un itinéraire inexact, à un lieu, un prix ou un horaire différent du plan, ou aux prestations de tiers.",
      ]],
      ["10. Fin du contrat", [
        "Tu peux cesser d'utiliser Jovia et supprimer ton compte à tout moment.",
        "Nous pouvons mettre fin au contrat avec un préavis raisonnable, ou immédiatement en cas de violation grave de ces conditions.",
      ]],
      ["11. Modifications de ces conditions", [
        "Nous pouvons mettre à jour ces conditions. Nous t'informons des changements importants par e-mail ou lors de ta prochaine connexion. Si tu continues à utiliser Jovia ensuite, les nouvelles conditions s'appliquent.",
      ]],
      ["12. Droit applicable et for", [
        "Le droit suisse s'applique. Les tribunaux du domicile ou du siège de l'exploitant sont compétents. Les règles impératives de protection des consommateurs de ton pays de résidence, y compris les fors impératifs, sont réservées.",
      ]],
    ],
  },
  privacy: {
    title: "Politique de confidentialité",
    lead: "Ce projet décrit comment Jovia traite aujourd'hui les données personnelles. Un examen juridique selon la LPD suisse et le RGPD suivra avant le lancement officiel.",
    sections: [
      ["Responsable", [
        `${address}, Suisse.`,
        `Pour toute question sur tes données ou pour exercer tes droits, écris à ${OPERATOR.email}.`,
      ]],
      ["Ce que nous enregistrons", [
        "Compte : ton adresse e-mail et un mot de passe haché de façon sécurisée. Nous n'enregistrons jamais ton mot de passe en clair.",
        "Profil : le nom, la tranche d'âge, la monnaie, la langue, le domicile et le canton que tu choisis d'indiquer.",
        "Consentements : quand tu as accepté cette politique et quand tu as activé ou désactivé la personnalisation.",
        "Utilisation : la dernière activité de ton compte et le nombre d'itinéraires créés, pour appliquer les limites des abonnements et savoir combien de personnes utilisent Jovia.",
      ]],
      ["À quoi cela sert", [
        "Te permettre de te connecter et garder tes voyages et préférences privés dans ton compte.",
        "Améliorer les propositions de voyage, uniquement si tu as activé la personnalisation à long terme.",
        "Comprendre l'utilisation globale du service.",
      ]],
      ["Ce que voit l'exploitant", [
        "L'exploitant voit les adresses e-mail des comptes, les dates d'inscription et de connexion ainsi que les chiffres d'utilisation globaux.",
        "Le contenu des voyages et la mémoire de l'IA des utilisateurs ne sont pas affichés dans l'espace d'administration.",
      ]],
      ["Prestataires", [
        "Base de données et connexion : Supabase, hébergé à Zurich, Suisse.",
        "Hébergement du site : Vercel.",
        "Planification IA : Anthropic, États-Unis. Ce que tu saisis dans le planificateur (destination, dates, âges, centres d'intérêt, souhaits) est envoyé à Anthropic pour créer ton itinéraire. Ton adresse e-mail et ton mot de passe ne sont jamais envoyés.",
        "Les e-mails d'inscription et de mot de passe sont envoyés par Resend (Resend, Inc., États-Unis) depuis des serveurs en Irlande. Resend reçoit ton adresse e-mail et le contenu de ces e-mails, rien d'autre.",
        "Les calendriers de vacances et les taux de change proviennent de services publics, sans données personnelles.",
        "Les cartes des itinéraires sont chargées par ton navigateur depuis OpenStreetMap (OpenStreetMap Foundation, Royaume-Uni), et les photos des destinations depuis Wikimedia Commons (Wikimedia Foundation, États-Unis). Ces services voient ton adresse IP au chargement, comme pour tout site web.",
        "Les liens de réservation te mènent sur le site du prestataire (par exemple Booking.com, Google Flights ou GetYourGuide). Ce que tu y fais relève de sa politique de confidentialité. Jovia ne voit pas ce que tu réserves.",
      ]],
      ["Cookies", [
        "Jovia n'utilise que les cookies nécessaires à son fonctionnement : l'un te garde connecté, l'autre retient la langue choisie. Il n'y a pas de cookies publicitaires ni de suivi.",
      ]],
      ["Tes choix", [
        "Consulte et modifie tes données sous « Mes données » et « Profil ».",
        "Active ou désactive la personnalisation à long terme à tout moment.",
        "Supprime toi-même ton compte et toutes les données liées sous « Mes données ».",
      ]],
    ],
  },
  imprint: {
    title: "Mentions légales",
    incomplete: "Incomplet : informations sur l'exploitant manquantes",
    missing: "[à compléter]",
    operator: "Exploitant de ce site",
    uid: "Numéro d'identification des entreprises (IDE) : {uid}",
    contact: "Contact",
    email: "E-mail :",
    contentTitle: "À propos du contenu",
    content: "Les itinéraires de Jovia sont créés par une intelligence artificielle. Les prix, horaires et disponibilités sont des estimations et ne sont pas vérifiés par une personne. Vérifie les informations importantes auprès du prestataire avant de réserver ou de partir.",
    linksTitle: "Liens vers d'autres sites",
    links: "Jovia renvoie vers des sites de tiers, par exemple des cartes. Leurs exploitants sont responsables du contenu de ces sites.",
  },
};

const it: LegalTexts = {
  draft: "Bozza, non ancora verificata legalmente",
  binding: "Questa traduzione serve alla comprensione. In caso di differenze fa fede la versione inglese.",
  terms: {
    title: "Condizioni d'uso",
    version: "Versione {v}.",
    seeAlso: ["Vedi anche l'", "informativa sulla privacy", " e le ", "note legali"],
    sections: [
      ["1. Ambito di applicazione", [
        `Queste condizioni regolano l'uso di Jovia, un servizio online gestito da ${op} («noi»). Creando un account le accetti.`,
        "Se non sei d'accordo, non usare Jovia.",
      ]],
      ["2. Cosa fa Jovia", [
        "Jovia crea itinerari di viaggio con l'aiuto dell'intelligenza artificiale, in base a ciò che le indichi.",
        "Jovia è uno strumento di pianificazione. Non siamo un'agenzia di viaggi, un tour operator né un intermediario di prenotazioni. Non vendiamo né organizziamo voli, alloggi o attività, e con noi non si conclude alcun contratto di viaggio.",
      ]],
      ["3. Contenuti generati dall'IA", [
        "Gli itinerari sono generati automaticamente e non vengono controllati da una persona. Possono contenere errori: i luoghi possono essere chiusi, essersi spostati o non esistere, e i percorsi possono essere poco pratici.",
        "Tutti i prezzi e i budget sono stime, non offerte. Orari, disponibilità, requisiti d'ingresso e condizioni di sicurezza non sono verificati.",
        "Sta a te verificare le informazioni importanti presso il fornitore prima di prenotare o partire, inclusi i requisiti di visto, salute e sicurezza.",
        "Puoi segnalare un problema con un piano tramite il pulsante presente in ogni itinerario.",
      ]],
      ["4. Il tuo account", [
        "Devi avere almeno 16 anni e indicare un indirizzo e-mail valido.",
        "Tieni segreta la tua password. Sei responsabile delle attività nel tuo account. Avvisaci se pensi che qualcun altro lo stia usando.",
        "Puoi eliminare il tuo account e tutti i dati collegati in qualsiasi momento in «I miei dati».",
      ]],
      ["5. Abbonamenti gratuito e a pagamento", [
        "L'abbonamento Free include gratuitamente un numero limitato di itinerari al mese. I limiti attuali sono indicati nella pagina dei prezzi.",
        `Premium costa ${PREMIUM_PRICE} al mese e include più itinerari. Unlimited costa ${UNLIMITED_PRICE} al mese, non ha limiti al numero di itinerari e usa il nostro modello di IA più potente. I prezzi includono l'eventuale IVA.`,
        "Unlimited è pensato per l'uso personale. La creazione automatizzata o in massa di itinerari e la condivisione di un account non sono consentite secondo il punto 6.",
        "Gli abbonamenti a pagamento non si possono ancora acquistare. Prima di allora queste condizioni saranno completate con il metodo di pagamento, il periodo di fatturazione, la disdetta e l'eventuale diritto di recesso.",
        "Possiamo modificare limiti e funzioni dell'abbonamento Free. Le modifiche a un abbonamento a pagamento valgono dal periodo di fatturazione successivo e sono annunciate in anticipo.",
      ]],
      ["6. Uso consentito", [
        "Usa Jovia solo per pianificare i tuoi viaggi o quelli del tuo gruppo.",
        "Non cercare di disturbare il servizio, aggirare i limiti di utilizzo, accedere ai dati altrui o creare itinerari in massa con strumenti automatizzati.",
        "Non inserire contenuti illeciti né informazioni sensibili su altre persone.",
        "Possiamo sospendere o chiudere gli account che violano queste regole.",
      ]],
      ["7. I tuoi contenuti e i nostri", [
        "Ciò che inserisci resta tuo. Ci autorizzi a trattarlo per fornire il servizio, come descritto nell'informativa sulla privacy.",
        "Puoi usare gli itinerari creati per te per i tuoi viaggi personali. Nome, logo, design e software di Jovia appartengono a noi.",
      ]],
      ["8. Disponibilità", [
        "Ci impegniamo a mantenere Jovia disponibile ma non garantiamo un servizio senza interruzioni. Le funzioni possono cambiare e il servizio può essere sospeso per manutenzione.",
      ]],
      ["9. Responsabilità", [
        "Rispondiamo senza limiti dei danni causati intenzionalmente o per negligenza grave, e laddove la legge non consenta di limitare la responsabilità.",
        "Per il resto la nostra responsabilità è esclusa nella misura consentita dalla legge. In particolare non rispondiamo di costi o perdite dovuti a un itinerario inesatto, a un luogo, prezzo o orario diverso dal piano, o a prestazioni di terzi.",
      ]],
      ["10. Fine del contratto", [
        "Puoi smettere di usare Jovia ed eliminare il tuo account in qualsiasi momento.",
        "Possiamo porre fine al contratto con un preavviso ragionevole, o immediatamente in caso di grave violazione di queste condizioni.",
      ]],
      ["11. Modifiche di queste condizioni", [
        "Possiamo aggiornare queste condizioni. Ti informeremo delle modifiche importanti via e-mail o al tuo prossimo accesso. Se continui a usare Jovia, valgono le nuove condizioni.",
      ]],
      ["12. Diritto applicabile e foro", [
        "Si applica il diritto svizzero. Sono competenti i tribunali del domicilio o della sede del gestore. Restano salve le norme imperative di protezione dei consumatori del tuo paese di residenza, compresi i fori imperativi.",
      ]],
    ],
  },
  privacy: {
    title: "Informativa sulla privacy",
    lead: "Questa bozza descrive come Jovia tratta oggi i dati personali. Una verifica legale secondo la LPD svizzera e il GDPR seguirà prima del lancio ufficiale.",
    sections: [
      ["Titolare", [
        `${address}, Svizzera.`,
        `Per domande sui tuoi dati o per esercitare i tuoi diritti, scrivi a ${OPERATOR.email}.`,
      ]],
      ["Cosa salviamo", [
        "Account: il tuo indirizzo e-mail e una password protetta con hash. Non salviamo mai la password in forma leggibile.",
        "Profilo: nome, fascia d'età, valuta, lingua, luogo di residenza e cantone che scegli di indicare.",
        "Consensi: quando hai accettato questa informativa e quando hai attivato o disattivato la personalizzazione.",
        "Utilizzo: l'ultima attività del tuo account e quanti itinerari hai creato, per applicare i limiti degli abbonamenti e capire quante persone usano Jovia.",
      ]],
      ["A cosa servono", [
        "Per permetterti di accedere e mantenere privati nel tuo account viaggi e preferenze.",
        "Per migliorare i suggerimenti di viaggio, solo se hai attivato la personalizzazione a lungo termine.",
        "Per capire l'utilizzo complessivo del servizio.",
      ]],
      ["Cosa vede il gestore", [
        "Il gestore vede gli indirizzi e-mail degli account, le date di registrazione e di accesso e i dati di utilizzo complessivi.",
        "I contenuti dei viaggi e la memoria dell'IA dei singoli utenti non sono mostrati nell'area di amministrazione.",
      ]],
      ["Fornitori di servizi", [
        "Database e accesso: Supabase, ospitato a Zurigo, Svizzera.",
        "Hosting del sito: Vercel.",
        "Pianificazione con IA: Anthropic, USA. Ciò che inserisci nel pianificatore (destinazione, date, età, interessi, desideri) viene inviato ad Anthropic per creare il tuo itinerario. Indirizzo e-mail e password non vengono mai inviati.",
        "Le e-mail di registrazione e per la password sono inviate da Resend (Resend, Inc., USA) tramite server in Irlanda. Resend riceve il tuo indirizzo e-mail e il contenuto di queste e-mail, nient'altro.",
        "Calendari delle vacanze e tassi di cambio provengono da servizi pubblici, senza dati personali.",
        "Le mappe degli itinerari sono caricate dal tuo browser da OpenStreetMap (OpenStreetMap Foundation, Regno Unito) e le foto delle destinazioni da Wikimedia Commons (Wikimedia Foundation, USA). Questi servizi vedono il tuo indirizzo IP al caricamento, come per qualsiasi sito.",
        "I link di prenotazione ti portano sul sito del fornitore (per esempio Booking.com, Google Flights o GetYourGuide). Ciò che fai lì è regolato dalla sua informativa sulla privacy. Jovia non vede cosa prenoti.",
      ]],
      ["Cookie", [
        "Jovia usa solo i cookie necessari al funzionamento: uno ti mantiene connesso, uno ricorda la lingua scelta. Non ci sono cookie pubblicitari o di tracciamento.",
      ]],
      ["Le tue scelte", [
        "Vedi e modifica i tuoi dati in «I miei dati» e «Profilo».",
        "Attiva o disattiva la personalizzazione a lungo termine in qualsiasi momento.",
        "Elimina tu stesso il tuo account e tutti i dati collegati in «I miei dati».",
      ]],
    ],
  },
  imprint: {
    title: "Note legali",
    incomplete: "Incompleto: mancano i dati del gestore",
    missing: "[da completare]",
    operator: "Gestore di questo sito",
    uid: "Numero d'identificazione delle imprese (IDI): {uid}",
    contact: "Contatto",
    email: "E-mail:",
    contentTitle: "Sui contenuti",
    content: "Gli itinerari su Jovia sono creati da un'intelligenza artificiale. Prezzi, orari e disponibilità sono stime e non sono verificati da una persona. Verifica le informazioni importanti presso il fornitore prima di prenotare o partire.",
    linksTitle: "Link ad altri siti",
    links: "Jovia rimanda a siti di terzi, per esempio mappe. I rispettivi gestori sono responsabili dei loro contenuti.",
  },
};

export const LEGAL: Record<Locale, LegalTexts> = { en, de, fr, it };
