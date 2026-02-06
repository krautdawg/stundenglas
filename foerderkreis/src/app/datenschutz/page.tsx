import Link from "next/link";

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-heading font-extrabold mb-6">
        Datenschutzerklaerung
      </h1>

      <div className="space-y-6 text-sm text-muted-foreground">
        <section>
          <h2 className="font-heading font-bold text-foreground mb-2">
            1. Verantwortlicher
          </h2>
          <p>
            Foerderverein der Schule des Lebens e.V., Kloster Lehnin,
            Brandenburg.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-foreground mb-2">
            2. Welche Daten wir erheben
          </h2>
          <ul className="list-disc list-inside space-y-1">
            <li>E-Mail-Adresse (fuer die Anmeldung per Magic Link)</li>
            <li>Vorname und Nachname</li>
            <li>Profilbild (optional, max. 1 MB)</li>
            <li>Kurzbiografie und Faehigkeiten (optional)</li>
            <li>Erfasste Ehrenamtsstunden (Datum, Dauer, Beschreibung)</li>
            <li>Kreis-Mitgliedschaften</li>
            <li>Aufgaben-Erstellung und -Uebernahme</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading font-bold text-foreground mb-2">
            3. Zweck der Verarbeitung
          </h2>
          <p>
            Die Daten werden ausschliesslich zur Organisation des
            ehrenamtlichen Engagements an der Schule des Lebens verwendet.
            Dies umfasst die Erfassung von Ehrenamtsstunden, die Koordination
            von Aufgaben und die Kommunikation innerhalb der Schulgemeinschaft.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-foreground mb-2">
            4. Rechtsgrundlage
          </h2>
          <p>
            Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. a
            DSGVO (Einwilligung) sowie Art. 6 Abs. 1 lit. f DSGVO
            (berechtigtes Interesse der Schulgemeinschaft).
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-foreground mb-2">
            5. Datenspeicherung
          </h2>
          <p>
            Alle Daten werden auf Servern in Frankfurt am Main (EU) bei
            Supabase (eu-central-1) gespeichert. Es findet keine Uebertragung
            in Drittlaender statt.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-foreground mb-2">
            6. Datenschutz-Modus
          </h2>
          <p>
            Jedes Mitglied kann den Datenschutz-Modus aktivieren. In diesem
            Fall wird die Familie in der oeffentlichen Rangliste als
            &quot;Anonyme Familie&quot; angezeigt. Administratoren sehen
            weiterhin alle Daten.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-foreground mb-2">
            7. Deine Rechte
          </h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
            <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
            <li>Recht auf Loeschung (Art. 17 DSGVO)</li>
            <li>Recht auf Datenportabilitaet (Art. 20 DSGVO) &mdash; CSV-Export</li>
            <li>Recht auf Widerspruch (Art. 21 DSGVO)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading font-bold text-foreground mb-2">
            8. Keine Tracking-Tools
          </h2>
          <p>
            Diese App verwendet keine Analyse- oder Tracking-Tools Dritter.
            Es werden keine Cookies fuer Werbezwecke gesetzt.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-foreground mb-2">
            9. Kontakt
          </h2>
          <p>
            Bei Fragen zum Datenschutz wende dich an:
            foerderkreis@schuledesleben.de
          </p>
        </section>
      </div>

      <div className="mt-8">
        <Link href="/login" className="text-primary hover:underline text-sm">
          &larr; Zurueck
        </Link>
      </div>
    </div>
  );
}
