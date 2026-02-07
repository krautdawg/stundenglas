import { FileText, Download, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import fs from "fs";
import path from "path";

interface Newsletter {
  subject: string;
  date: string;
  filename: string;
  path: string;
}

function parseDate(dateStr: string): Date {
  // Parse email date format
  return new Date(dateStr);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function extractNewsletterNumber(subject: string): string | null {
  const match = subject.match(/Newsletter\s+(\d+\/\d+)/i);
  return match ? match[1] : null;
}

async function getNewsletters(): Promise<Newsletter[]> {
  const newsletterDir = path.join(process.cwd(), "public", "newsletters");
  
  try {
    const indexPath = path.join(newsletterDir, "index.json");
    const data = fs.readFileSync(indexPath, "utf-8");
    const newsletters: Newsletter[] = JSON.parse(data);
    
    // Filter to only actual newsletters (not Speiseplan, Wochenplan etc.)
    // and clean up filenames
    return newsletters
      .filter((n) => n.subject.toLowerCase().includes("newsletter"))
      .filter((n) => n.filename.includes("_NL_") || n.filename.includes("gesamt"))
      .map((n) => ({
        ...n,
        filename: n.filename.replace(/[\r\n]/g, ""),
        path: n.path.replace(/[\r\n]/g, ""),
      }))
      .sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());
  } catch {
    return [];
  }
}

export default async function NewsletterPage() {
  const newsletters = await getNewsletters();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-extrabold">Newsletter-Archiv</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Alle Schul-Newsletter zum Download
        </p>
      </div>

      {newsletters.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading font-bold mb-2">Keine Newsletter</h3>
            <p className="text-sm text-muted-foreground">
              Es wurden noch keine Newsletter archiviert.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {newsletters.map((newsletter, idx) => {
            const date = parseDate(newsletter.date);
            const nlNumber = extractNewsletterNumber(newsletter.subject);
            
            return (
              <Card key={idx}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {nlNumber && (
                          <Badge variant="secondary" className="text-xs">
                            Nr. {nlNumber}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-medium text-sm truncate">
                        {newsletter.subject}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(date)}
                      </div>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <a href={newsletter.path} download>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        {newsletters.length} Newsletter im Archiv
      </p>
    </div>
  );
}
