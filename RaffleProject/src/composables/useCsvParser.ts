import Papa, { type ParseResult } from 'papaparse';

export interface CsvResult {
  names: string[];
  rowCount: number;
  headers: string[];
}

export function useCsvParser() {
  function parseFile(file: File, nameColumn?: string): Promise<CsvResult> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete(results: ParseResult<Record<string, string>>) {
          const headers = results.meta.fields || [];
          const col = nameColumn || guessNameColumn(headers);

          if (!col) {
            reject(new Error('Could not detect a name column. Available columns: ' + headers.join(', ')));
            return;
          }

          const names = results.data
            .map(row => row[col]?.trim())
            .filter((n): n is string => !!n && n.length > 0);

          resolve({ names, rowCount: names.length, headers });
        },
        error(err: Error) {
          reject(err);
        },
      });
    });
  }

  function guessNameColumn(headers: string[]): string | undefined {
    const priorities = ['name', 'username', 'user', 'handle', 'participant', 'full_name', 'display_name'];
    const lower = headers.map(h => h.toLowerCase().trim());

    for (const keyword of priorities) {
      const idx = lower.findIndex(h => h === keyword);
      if (idx !== -1) return headers[idx];
    }

    for (const keyword of priorities) {
      const idx = lower.findIndex(h => h.includes(keyword));
      if (idx !== -1) return headers[idx];
    }

    return headers[0];
  }

  return { parseFile };
}
