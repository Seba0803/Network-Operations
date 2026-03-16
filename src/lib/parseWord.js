export async function parseProtocollo(file) {
  const arrayBuffer = await file.arrayBuffer()
  const { default: mammoth } = await import('https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js')
  const result = await mammoth.extractRawText({ arrayBuffer })
  const text = result.value

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  // Nome filiale
  const nomeMatch = text.match(/apre la FILIALE di ([^\n:]+)/i) ||
                    text.match(/apre il MINISHOP di ([^\n:]+)/i) ||
                    text.match(/apre la SEDE di ([^\n:]+)/i)
  const nome = nomeMatch ? nomeMatch[1].trim() : ''

  // Tipo filiale (ATG o DIRETTA)
  const tipoMatch = text.match(/TIPO FILIALE\s*[-–]?\s*([^\n]+)/i)
  const tipoFiliale = tipoMatch ? tipoMatch[1].trim().toUpperCase() : ''
  const isDiretta = tipoFiliale.includes('DIRETT')

  // Codice filiale
  const codiceMatch = text.match(/CODICE FILIALE\s*[-–]?\s*([^\n]+)/i)
  const codiceFiliale = codiceMatch ? codiceMatch[1].trim() : ''

  // Indirizzo
  const indirizzoMatch = text.match(/INDIRIZZO NEGOZIO\s*[-–]?\s*([^\n]+)/i)
  const indirizzo = indirizzoMatch ? indirizzoMatch[1].trim() : ''

  // Date — cerca pattern dd mese yyyy o dd/mm/yyyy
  const datePattern = /(\d{1,2}[\s\/]\w+[\s\/]\d{4})[^\n]*(apertura\s+amministrativa|fox)/gi
  const dateCommPattern = /(\d{1,2}[\s\/]\w+[\s\/]\d{4})[^\n]*(apertura\s+commerciale)/gi

  const MESI = { gennaio:0,febbraio:1,marzo:2,aprile:3,maggio:4,giugno:5,luglio:6,agosto:7,settembre:8,ottobre:9,novembre:10,dicembre:11 }

  function parseDate(str) {
    if (!str) return ''
    const m = str.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/)
    if (m) {
      const month = MESI[m[2].toLowerCase()]
      if (month !== undefined) {
        const d = new Date(parseInt(m[3]), month, parseInt(m[1]))
        return d.toISOString().slice(0, 10)
      }
    }
    const m2 = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    if (m2) return `${m2[3]}-${m2[2].padStart(2,'0')}-${m2[1].padStart(2,'0')}`
    return ''
  }

  // Scorri le righe cercando date + tipo apertura
  let dataAmministrativa = ''
  let dataCommerciale = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const dateInLine = line.match(/\d{1,2}\s+\w+\s+\d{4}/)
    if (!dateInLine) continue
    const lower = line.toLowerCase()
    if ((lower.includes('amministrativ') || lower.includes('fox')) && !dataAmministrativa) {
      dataAmministrativa = parseDate(dateInLine[0])
    }
    if (lower.includes('commerciale') && !dataCommerciale) {
      dataCommerciale = parseDate(dateInLine[0])
    }
  }

  // Autogestore
  const autogestoreMatch = text.match(/AUTOGESTORE\s+([^\n]+)/i)
  const autogestore = autogestoreMatch ? autogestoreMatch[1].trim() : ''

  // Zona
  const zonaMatch = text.match(/ZONA\s*[-–]?\s*([^\n]+)/i)
  const zona = zonaMatch ? zonaMatch[1].trim() : ''

  const isMinishop = text.toLowerCase().includes('minishop')

  return {
    nome,
    codiceFiliale,
    tipoFiliale,
    isDiretta,
    isMinishop,
    indirizzo,
    zona,
    autogestore,
    dataAmministrativa,
    dataCommerciale,
    suggeritedType: isMinishop
      ? (isDiretta ? 'NUOVO MINISHOP DIRETTA' : 'NUOVO MINISHOP')
      : (isDiretta ? 'NUOVO NEGOZIO DIRETTA' : 'NUOVO NEGOZIO'),
  }
}
