import Link from "next/link";

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-heading font-extrabold mb-6">Impressum</h1>

      <div className="space-y-4 text-sm text-muted-foreground">
        <section>
          <h2 className="font-heading font-bold text-foreground mb-1">
            Angaben gemaess &sect; 5 TMG
          </h2>
          <p>
            Foerderverein der Schule des Lebens e.V.
            <br />
            Kloster Lehnin
            <br />
            Brandenburg, Deutschland
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-foreground mb-1">
            Vertreten durch
          </h2>
          <p>Der Vorstand des Foerdervereins</p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-foreground mb-1">
            Kontakt
          </h2>
          <p>
            E-Mail: foerderkreis@schuledesleben.de
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-foreground mb-1">
            Verantwortlich fuer den Inhalt nach &sect; 55 Abs. 2 RStV
          </h2>
          <p>
            Foerderverein der Schule des Lebens e.V.
            <br />
            Kloster Lehnin, Brandenburg
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-foreground mb-1">
            Haftungsausschluss
          </h2>
          <p>
            Die Inhalte dieser App wurden mit groesster Sorgfalt erstellt. Fuer
            die Richtigkeit, Vollstaendigkeit und Aktualitaet der Inhalte
            koennen wir jedoch keine Gewaehr uebernehmen.
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
