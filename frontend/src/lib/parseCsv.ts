import Papa from 'papaparse'

export function previewCsv(file: File) {
  return new Promise<{ headers: string[]; rows: Record<string, string>[]; rowCount: number }>(
    (resolve, reject) => {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(results.errors[0]?.message || 'Unable to parse CSV'))
            return
          }

          resolve({
            headers: results.meta.fields ?? [],
            rows: results.data.slice(0, 5),
            rowCount: results.data.length,
          })
        },
        error: (error) => reject(error),
      })
    }
  )
}
