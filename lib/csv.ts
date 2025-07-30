import { parse } from "csv-parse/browser/esm/sync"
import { stringify } from "csv-stringify/browser/esm/sync"

// Generic function to export data to CSV
export function exportToCsv<T extends Record<string, any>>(data: T[], filename: string) {
  if (data.length === 0) {
    alert("No data to export.")
    return
  }

  const headers = Object.keys(data[0])
  const records = data.map((row) => headers.map((header) => row[header]))

  const csvString = stringify([headers, ...records])

  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Generic function to import data from CSV
export function importFromCsv<T extends Record<string, any>>(csvString: string, expectedHeaders: (keyof T)[]): T[] {
  const records = parse(csvString, {
    columns: true, // Treat the first row as headers
    skip_empty_lines: true,
  })

  if (records.length === 0) {
    alert("CSV file is empty or contains no valid data rows.")
    return []
  }

  const actualHeaders = Object.keys(records[0])
  const missingHeaders = expectedHeaders.filter((header) => !actualHeaders.includes(String(header)))

  if (missingHeaders.length > 0) {
    alert(
      `Missing expected headers in CSV: ${missingHeaders.join(", ")}. Please ensure your CSV matches the required format.`,
    )
    return []
  }

  // Convert string values to appropriate types (numbers)
  return records.map((record: Record<string, any>) => {
    const newRecord: Record<string, any> = {}
    for (const key in record) {
      if (Object.prototype.hasOwnProperty.call(record, key)) {
        const value = record[key]
        // Attempt to convert to number if it looks like a number
        if (["unitCost", "unitPrice", "quantity", "quantitySold", "quantitySent", "totalSale"].includes(key)) {
          newRecord[key] = Number.parseFloat(value) || 0
        } else {
          newRecord[key] = value
        }
      }
    }
    return newRecord as T
  })
}
