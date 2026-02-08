
import { MySwordModuleType, BibleVerse } from '../types';

declare const initSqlJs: any;

let SQL: any = null;

export const initSQLite = async () => {
  if (SQL) return SQL;
  SQL = await initSqlJs({
    locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
  });
  return SQL;
};

export const loadMySwordFile = async (file: File): Promise<{ db: any, type: MySwordModuleType, name: string }> => {
  const sql = await initSQLite();
  const arrayBuffer = await file.arrayBuffer();
  const db = new sql.Database(new Uint8Array(arrayBuffer));
  
  const fileName = file.name.toLowerCase();
  let type: MySwordModuleType = 'bbl';
  
  if (fileName.includes('.bbl.')) type = 'bbl';
  else if (fileName.includes('.cmt.')) type = 'cmt';
  else if (fileName.includes('.dct.')) type = 'dct';
  else if (fileName.includes('.bok.')) type = 'bok';
  else if (fileName.includes('.jor.')) type = 'jor';
  
  if (fileName.includes('xref') || fileName.includes('tsk')) type = 'xref';

  return { db, type, name: file.name.split('.')[0].toUpperCase() };
};

export const BIBLE_BOOKS: Record<string, number> = {
  "Gênesis": 1, "Êxodo": 2, "Levítico": 3, "Números": 4, "Deuteronômio": 5,
  "Josué": 6, "Juízes": 7, "Rute": 8, "1 Samuel": 9, "2 Samuel": 10,
  "1 Reis": 11, "2 Reis": 12, "1 Crônicas": 13, "2 Crônicas": 14, "Esdras": 15,
  "Neemias": 16, "Ester": 17, "Jó": 18, "Salmos": 19, "Provérbios": 20,
  "Eclesiastes": 21, "Cantares": 22, "Isaías": 23, "Jeremias": 24, "Lamentações": 25,
  "Ezequiel": 26, "Daniel": 27, "Oseias": 28, "Joel": 29, "Amós": 30,
  "Obadias": 31, "Jonas": 32, "Miqueias": 33, "Naum": 34, "Habacuque": 35,
  "Sofonias": 36, "Ageu": 37, "Zacarias": 38, "Malaquias": 39,
  "Mateus": 40, "Marcos": 41, "Lucas": 42, "João": 43, "Atos": 44,
  "Romanos": 45, "1 Coríntios": 46, "2 Coríntios": 47, "Gálatas": 48, "Efésios": 49,
  "Filipenses": 50, "Colossenses": 51, "1 Tessalonicenses": 52, "2 Tessalonicenses": 53, "1 Timóteo": 54,
  "2 Timóteo": 55, "Tito": 56, "Filemom": 57, "Hebreus": 58, "Tiago": 59,
  "1 Pedro": 60, "2 Pedro": 61, "1 João": 62, "2 João": 63, "3 João": 64,
  "Judas": 65, "Apocalipse": 66
};

export const getVerses = (db: any, bookId: number, chapter: number): BibleVerse[] => {
  try {
    const res = db.exec(`SELECT verse, scripture FROM Bible WHERE book = ${bookId} AND chapter = ${chapter} ORDER BY verse`);
    if (!res || res.length === 0) return [];
    
    return res[0].values.map((v: any) => {
      let rawScripture = v[1];
      const titleTagsRegex = /<(h[1-6]|title|b|s|h)>(.*?)<\/\1>/gi;
      let titleParts: string[] = [];
      let match;
      while ((match = titleTagsRegex.exec(rawScripture)) !== null) {
        titleParts.push(match[2].replace(/<[^>]+>/g, '').trim());
      }
      const title = titleParts.length > 0 ? titleParts.join(' ') : undefined;
      const text = rawScripture
        .replace(/<(h[1-6]|title|b|s|h)>.*?<\/\1>/gi, '')
        .replace(/<f>.*?<\/f>/g, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();
      return { number: v[0], text: text, title: title };
    });
  } catch (err) {
    console.error("Erro ao ler versículos:", err);
    return [];
  }
};

export const getVerseReferences = (db: any, bookId: number, chapter: number, verse: number): string | null => {
  const tables = ['Commentary', 'Comments', 'Details', 'CrossReference'];
  
  // Tenta encontrar a tabela correta no banco (ignora case)
  const schemaRes = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
  const existingTables = schemaRes[0]?.values.map((v: any) => v[0].toLowerCase()) || [];

  for (const tableName of tables) {
    if (!existingTables.includes(tableName.toLowerCase())) continue;
    
    try {
      // MySword usa diferentes nomes de colunas. Tentamos uma query robusta.
      // Alguns usam versebegin, outros verse.
      const query = `
        SELECT content FROM ${tableName} 
        WHERE (book = ${bookId} OR Book = ${bookId}) 
        AND (chapter = ${chapter} OR Chapter = ${chapter}) 
        AND (
          (verse = ${verse} OR Verse = ${verse}) OR 
          (versebegin <= ${verse} AND verseend >= ${verse}) OR
          (VerseBegin <= ${verse} AND VerseEnd >= ${verse})
        )
        LIMIT 1
      `;
      const res = db.exec(query);
      if (res && res.length > 0 && res[0].values.length > 0) {
        let content = res[0].values[0][0];
        if (!content) continue;
        
        return String(content)
          .replace(/<a[^>]*>(.*?)<\/a>/g, '$1')
          .replace(/\[\[(.*?)\]\]/g, '$1')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&quot;/g, '"')
          .replace(/\s+/g, ' ')
          .trim();
      }
    } catch (err) {
      console.warn(`Erro ao consultar tabela ${tableName}:`, err);
      continue;
    }
  }
  return null;
};

export const getChapterCount = (db: any, bookId: number): number => {
  try {
    const res = db.exec(`SELECT MAX(chapter) FROM Bible WHERE book = ${bookId}`);
    return res[0]?.values[0][0] || 0;
  } catch (err) {
    return 0;
  }
};

export const getVerseCount = (db: any, bookId: number, chapter: number): number => {
  try {
    const res = db.exec(`SELECT MAX(verse) FROM Bible WHERE book = ${bookId} AND chapter = ${chapter}`);
    return res[0]?.values[0][0] || 0;
  } catch (err) {
    return 0;
  }
};
