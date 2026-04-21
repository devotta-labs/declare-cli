export type Stats = {
  created?: number
  updated?: number
  deleted?: number
  ignored?: number
  total?: number
}

export type ObjectReport = {
  klass?: string
  uid?: string
  index?: number
  errorReports?: ErrorReport[]
}

export type ErrorReport = {
  message?: string
  mainKlass?: string
  errorCode?: string
  errorProperty?: string
}

export type TypeReport = {
  klass?: string
  stats?: Stats
  objectReports?: ObjectReport[]
}

export type ImportReport = {
  status?: string
  stats?: Stats
  typeReports?: TypeReport[]
}

const KLASS_LABEL: Record<string, string> = {
  'org.hisp.dhis.category.Category': 'Category',
  'org.hisp.dhis.category.CategoryOption': 'CategoryOption',
  'org.hisp.dhis.category.CategoryCombo': 'CategoryCombo',
  'org.hisp.dhis.option.OptionSet': 'OptionSet',
  'org.hisp.dhis.option.Option': 'Option',
  'org.hisp.dhis.dataelement.DataElement': 'DataElement',
  'org.hisp.dhis.dataset.DataSet': 'DataSet',
}

function label(klass: string | undefined): string {
  if (!klass) return 'Unknown'
  return KLASS_LABEL[klass] ?? klass.split('.').pop() ?? klass
}

export function printReport(report: ImportReport, title: string): void {
  console.log(`\n${title}`)
  console.log('─'.repeat(title.length))

  const status = report.status ?? 'UNKNOWN'
  console.log(`status: ${status}`)

  const s = report.stats ?? {}
  console.log(
    `totals: created=${s.created ?? 0}  updated=${s.updated ?? 0}  deleted=${s.deleted ?? 0}  ignored=${s.ignored ?? 0}  total=${s.total ?? 0}`,
  )

  const typeReports = report.typeReports ?? []
  if (typeReports.length > 0) {
    console.log('\nby type:')
    for (const tr of typeReports) {
      const ts = tr.stats ?? {}
      console.log(
        `  ${label(tr.klass).padEnd(18)}  created=${ts.created ?? 0}  updated=${ts.updated ?? 0}  ignored=${ts.ignored ?? 0}`,
      )
    }
  }

  const errors: Array<{ klass: string; msg: string; prop: string | undefined }> = []
  for (const tr of typeReports) {
    for (const or of tr.objectReports ?? []) {
      for (const er of or.errorReports ?? []) {
        errors.push({
          klass: label(tr.klass),
          msg: er.message ?? 'unknown error',
          prop: er.errorProperty,
        })
      }
    }
  }

  if (errors.length > 0) {
    console.log(`\nerrors (${errors.length}):`)
    for (const e of errors) {
      const where = e.prop ? `${e.klass}.${e.prop}` : e.klass
      console.log(`  ✗ ${where}: ${e.msg}`)
    }
  }
}
