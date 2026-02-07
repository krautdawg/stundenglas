import Link from "next/link";

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-heading font-extrabold mb-6">Impressum</h1>

      <div className="space-y-4 text-sm text-muted-foreground">
        <section>
          <h2 className="font-heading font-bold text-foreground mb-1">
            Betreiber der App
          </h2>
          <p>
            Tim Neunzig
            <br />
            KI Katapult
            <br />
            Werder (Havel)
            <br />
            Deutschland
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-foreground mb-1">
            Kontakt
          </h2>
          <p>
            E-Mail:{" "}
            <a href="mailto:tim@ki-katapult.de" className="text-primary hover:underline">
              tim@ki-katapult.de
            </a>
            <br />
            Telefon: Auf Anfrage erhaeltlich
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-foreground mb-1">
            Haftung fuer Inhalte
          </h2>
          <p>
            Die Inhalte dieser App wurden mit groesster Sorgfalt erstellt. Fuer
            die Richtigkeit, Vollstaendigkeit und Aktualitaet der Inhalte
            koennen wir jedoch keine Gewaehr uebernehmen. Als Diensteanbieter
            sind wir fuer eigene Inhalte auf diesen Seiten in Uebereinstimmung
            mit geltenden Gesetzen verantwortlich. Wir sind als Diensteanbieter
            jedoch nicht verpflichtet, uebermittelte oder gespeicherte fremde
            Informationen zu ueberwachen oder nach Umstaenden zu forschen, die
            auf eine rechtswidrige Taetigkeit hinweisen.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-foreground mb-1">
            Urheberrecht
          </h2>
          <p>
            Die in dieser App praesentierten Inhalte unterliegen der deutschen
            Urheberrechtsgesetzgebung. Die Vervielfaeltigung, Bearbeitung,
            Verbreitung und jede Art der Verwertung ausserhalb der Grenzen des
            Urheberrechtes beduerfen der schriftlichen Zustimmung des Autors
            oder Urhebers.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-foreground mb-1">
            Datenschutz
          </h2>
          <p>
            Informationen zum Datenschutz finden Sie in unserer{" "}
            <Link href="/datenschutz" className="text-primary hover:underline">
              Datenschutzerklaerung
            </Link>
            .
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
