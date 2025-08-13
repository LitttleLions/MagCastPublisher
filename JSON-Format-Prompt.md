# JSON-Format Spezifikation für MagCast Publishing System

## Aufgabe für Content-AI
Sie sollen Artikel für ein automatisiertes Magazin-Publishing-System schreiben. Ihre Artikel werden von einem intelligenten Layout-System verarbeitet, das automatisch professionelle Magazine generiert. Folgen Sie diesem JSON-Format exakt:

## Vollständige JSON-Struktur

```json
{
  "issue": {
    "id": "AUSGABE_ID",
    "title": "MAGAZIN_TITEL", 
    "date": "YYYY-MM-DD"
  },
  "sections": ["RUBRIK_1", "RUBRIK_2", "RUBRIK_N"],
  "articles": [
    {
      "id": "eindeutige-artikel-id",
      "section": "EXAKT_WIE_IN_SECTIONS_ARRAY",
      "type": "ARTIKEL_TYP",
      "title": "Artikel-Überschrift",
      "dek": "Untertitel oder Vorspann (optional)",
      "author": "Ihr Name oder Pseudonym",
      "body_html": "HTML_CONTENT",
      "images": [
        {
          "src": "VOLLSTÄNDIGE_URL",
          "role": "BILD_ROLLE",
          "caption": "Bildunterschrift (optional)",
          "credit": "Bildquelle (optional)",
          "focal_point": "X_KOORDINATE,Y_KOORDINATE"
        }
      ]
    }
  ]
}
```

## Detaillierte Feld-Spezifikationen

### Issue-Metadaten (Pflichtfelder)
- **id**: Eindeutige Ausgaben-ID (Format: jahr-monat, z.B. "2025-01" oder thematische IDs)
- **title**: Vollständiger Magazin-Titel (wird auf Titelseite verwendet)
- **date**: Publikationsdatum im ISO-Format YYYY-MM-DD

### Sections Array
- Liste aller Rubriken in gewünschter Reihenfolge
- Artikel müssen exakt diesen Rubrik-Namen in "section"-Feld verwenden
- Beispiele: ["Editorial", "Titel", "Technologie", "Kultur", "Service"]

### Artikel-Felder

#### Pflichtfelder:
- **id**: Eindeutige Artikel-ID (nur Buchstaben, Zahlen, Bindestriche)
- **section**: MUSS exakt einem Wert aus "sections" Array entsprechen
- **type**: Artikel-Typ, erlaubte Werte:
  - `"feature"` - Hauptartikel mit größerem Layout-Budget
  - `"article"` - Standard-Artikel 
  - `"news"` - Kurzmeldung, kompaktes Layout
  - `"editorial"` - Kommentar/Editorial
- **title**: Artikel-Überschrift (wird als Headline verwendet)
- **author**: Autor-Name (wird im Artikel angezeigt)
- **body_html**: Artikel-Inhalt als sauberes HTML (siehe HTML-Regeln unten)

#### Optionale Felder:
- **dek**: Untertitel/Vorspann/Teaser (wird prominent unter Headline platziert)

### HTML-Content Regeln (body_html)

**Erlaubte HTML-Tags:**
- `<p>` - Absätze (Standard-Textblöcke)
- `<h2>`, `<h3>` - Zwischenüberschriften (h1 ist reserviert für title)
- `<strong>`, `<em>` - Hervorhebungen
- `<ul>`, `<ol>`, `<li>` - Listen
- `<blockquote>` - Zitate
- `<a href="">` - Links

**HTML-Beispiel:**
```html
"<p>Einleitungsabsatz mit wichtigen Informationen.</p><h2>Erste Zwischenüberschrift</h2><p>Weiterer Absatz mit <strong>wichtigen Begriffen</strong> und <em>Betonungen</em>.</p><blockquote>Ein wichtiges Zitat zur Untermauerung des Arguments.</blockquote><p>Schlussabsatz mit <a href=\"https://example.com\">relevanten Links</a>.</p>"
```

**Wichtige HTML-Regeln:**
- Keine `<br>`-Tags verwenden (Absätze mit `<p>`)
- Keine Inline-Styles oder CSS-Klassen
- Keine `<div>` oder Layout-Tags
- UTF-8 Zeichen korrekt escapen für JSON
- Anführungszeichen in HTML mit `\"` escapen

### Bilder-Array

Jeder Artikel kann 0-n Bilder haben. Pro Bild:

#### Pflichtfelder:
- **src**: Vollständige URL zu hochwertigem Bild (mind. 800px Breite empfohlen)
- **role**: Bild-Rolle bestimmt Layout-Behandlung:
  - `"hero"` - Hauptbild, bekommt prominente Platzierung
  - `"inline"` - Bild im Textfluss
  - `"gallery"` - Teil einer Bildergalerie

#### Optionale Felder:
- **caption**: Bildunterschrift (wird unter Bild angezeigt)
- **credit**: Bildquelle/Fotograf (wird klein unter Bild angezeigt)
- **focal_point**: Wichtigster Bildbereich als "x,y" Koordinaten (0.0-1.0), z.B. "0.5,0.3" für horizontal mittig, vertikal oberes Drittel

### Bild-URL Anforderungen
- Verwenden Sie nur hochwertige, lizenzfreie Bilder
- Empfohlene Quellen: Unsplash, Pexels (mit korrekter Lizenz)
- Mindest-Auflösung: 800x600 Pixel
- Format: JPG oder PNG
- Beispiel: `"https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800"`

## Layout-System Verhalten

### Automatische Entscheidungen:
Das System analysiert jeden Artikel und trifft intelligente Layout-Entscheidungen:

1. **Spalten-Layout**: 1-3 Spalten basierend auf Textlänge
2. **Typografie**: Schriftgröße 9.5-10.5pt für optimale Lesbarkeit  
3. **Bild-Platzierung**: Hero-Bilder bekommen mehr Raum, Inline-Bilder fließen im Text
4. **Seiten-Umbruch**: Automatische Optimierung für Print-Layout

### Content-Empfehlungen:
- **Feature-Artikel**: 800-1200 Wörter, 1-2 Bilder (mind. 1 Hero)
- **Standard-Artikel**: 400-800 Wörter, 0-1 Bilder  
- **News-Artikel**: 100-300 Wörter, 0-1 Bilder
- **Editorial**: 300-600 Wörter, meist ohne Bilder

## Vollständiges Beispiel

```json
{
  "issue": {
    "id": "tech-2025-01",
    "title": "Zukunftstechnologien Magazin",
    "date": "2025-01-15"
  },
  "sections": ["Editorial", "Technologie", "Innovation", "Trends"],
  "articles": [
    {
      "id": "ki-revolution-2025",
      "section": "Technologie",
      "type": "feature",
      "title": "KI Revolution: Wie maschinelles Lernen unsere Arbeitswelt verändert",
      "dek": "Von automatisierten Entscheidungen bis hin zu kreativen Assistenten – künstliche Intelligenz prägt bereits heute unseren Arbeitsalltag",
      "author": "Dr. Sarah Müller",
      "body_html": "<p>Künstliche Intelligenz ist längst keine Science-Fiction mehr, sondern Realität in deutschen Unternehmen. Von der automatisierten Datenanalyse bis hin zur personalisierten Kundenbetreuung – KI-Systeme übernehmen zunehmend komplexe Aufgaben.</p><h2>Die Transformation hat bereits begonnen</h2><p>Laut einer aktuellen Studie setzen bereits <strong>67% der deutschen Unternehmen</strong> KI-Technologien ein. Die Bandbreite reicht von einfachen Chatbots bis hin zu komplexen Entscheidungssystemen.</p><blockquote>\"KI wird nicht Jobs ersetzen, sondern Jobs verändern. Es geht um Augmentation, nicht um Substitution.\"</blockquote><p>Besonders spannend sind die Entwicklungen im Bereich <em>generativer KI</em>, die kreative Prozesse unterstützt und neue Formen der Zusammenarbeit zwischen Mensch und Maschine ermöglicht.</p>",
      "images": [
        {
          "src": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800",
          "role": "hero",
          "caption": "KI-gestützte Arbeitsplätze werden zur neuen Normalität",
          "credit": "Unsplash / Tech Innovations",
          "focal_point": "0.5,0.4"
        },
        {
          "src": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600",
          "role": "inline",
          "caption": "Mensch-Maschine-Kollaboration in der Praxis"
        }
      ]
    },
    {
      "id": "quantum-computing-durchbruch",
      "section": "Innovation", 
      "type": "article",
      "title": "Quantencomputing: Der nächste technologische Sprung",
      "author": "Prof. Michael Weber",
      "body_html": "<p>Quantencomputer versprechen Rechenleistungen, die klassische Computer nie erreichen können. Die ersten kommerziellen Anwendungen stehen vor der Tür.</p><p>Unternehmen wie IBM, Google und deutsche Startups arbeiten fieberhaft an praxistauglichen Lösungen für Kryptographie, Simulation und Optimierung.</p>",
      "images": [
        {
          "src": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600",
          "role": "hero",
          "caption": "Quantencomputer öffnen neue Dimensionen der Datenverarbeitung"
        }
      ]
    }
  ]
}
```

## Validierung & Qualitätskontrolle

Bevor Sie das JSON einreichen, prüfen Sie:

✅ **JSON-Syntax**: Verwenden Sie einen JSON-Validator  
✅ **Pflichtfelder**: Alle required Felder ausgefüllt  
✅ **Section-Konsistenz**: Artikel-sections existieren im sections-Array  
✅ **HTML-Korrektheit**: Keine ungültigen Tags oder ungeschlossene Elemente  
✅ **Bild-URLs**: Alle URLs funktionsfähig und hochwertig  
✅ **Escaping**: Anführungszeichen in HTML korrekt escaped  

## Häufige Fehler vermeiden

❌ **Falsch**: `"section": "Technology"` (nicht im sections-Array)  
✅ **Richtig**: `"section": "Technologie"` (exakt wie in sections definiert)

❌ **Falsch**: `"body_html": "Absatz 1<br><br>Absatz 2"`  
✅ **Richtig**: `"body_html": "<p>Absatz 1</p><p>Absatz 2</p>"`

❌ **Falsch**: `"src": "bild.jpg"` (relative URL)  
✅ **Richtig**: `"src": "https://domain.com/bild.jpg"` (absolute URL)

❌ **Falsch**: `"type": "Hauptartikel"` (ungültiger Typ)  
✅ **Richtig**: `"type": "feature"` (definierter Artikel-Typ)

Mit diesem Format erstellen Sie Content, der perfekt vom MagCast Publishing-System verarbeitet wird und professionelle, automatisch layoutete Magazine erzeugt.