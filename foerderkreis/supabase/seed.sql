-- Seed data for Foerderkreis
-- Run after migration to set up initial circles

-- Default Kreise (Circles) for the school
INSERT INTO kreise (name, slug, description, icon, color) VALUES
  ('Garten-Kreis', 'garten', 'Pflege des Schulgartens, Beete, Kompost und Aussenanlagen', '🌱', '#4A8E50'),
  ('Bau-Kreis', 'bau', 'Reparaturen, Renovierungen und bauliche Projekte', '🔨', '#A85C10'),
  ('IT-Kreis', 'it', 'Technik, Website, App-Entwicklung und digitale Infrastruktur', '💻', '#5B8FC9'),
  ('Veranstaltungs-Kreis', 'veranstaltung', 'Feste, Feiern, Elternabende und besondere Anlaesse', '🎉', '#E8644A'),
  ('Kuechen-Kreis', 'kueche', 'Schulkueche, Mittagessen, Catering bei Veranstaltungen', '🍳', '#E8891C'),
  ('Finanz-Kreis', 'finanzen', 'Buchfuehrung, Foerderverein, Budgetplanung', '📊', '#736A5E'),
  ('Putz-Kreis', 'putzen', 'Reinigung und Pflege der Schulraeume', '🧹', '#84C287'),
  ('Kreativ-Kreis', 'kreativ', 'Basteln, Dekorieren, kuenstlerische Projekte', '🎨', '#F28068');
