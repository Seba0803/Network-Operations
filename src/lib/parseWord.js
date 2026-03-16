export async function parseProtocollo(file) {
  const arrayBuffer = await file.arrayBuffer()

  await new Promise((resolve, reject) => {
    if (window.mammoth) return resolve()
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js'
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })

  let text = ''
  try {
    const result = await window.mammoth.extractRawText({ arrayBuffer })
    text = result.value || ''
  } catch(e1) {
    try {
      const result = await window.mammoth.extractRawText({ arrayBuffer: new Uint8Array(arrayBuffer) })
      text = result.value || ''
    } catch(e2) {
      throw new Error('Impossibile leggere il file. Prova a salvarlo come .docx da Word e ricaricalo.')
    }
  }
  if (!text.trim()) throw new Error('Il file sembra vuoto o in formato non supportato. Salvalo come .docx e riprova.')
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  const MESI = {
    gennaio:0, febbraio:1, marzo:2, aprile:3, maggio:4, giugno:5,
    luglio:6, agosto:7, settembre:8, ottobre:9, novembre:10, dicembre:11
  }

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

  // ── Rilevamento tipo operazione ──────────────────────────
  const isMinishopApertura = /apre il MINISHOP di/i.test(text)
  const isNegozioApertura  = /apre la FILIALE di/i.test(text)
  const isTrasferimento    = /si trasferi/i.test(text) || /trasferirà/i.test(text)
  const isMiniToShop       = /MINISHOP di .+ diventa FILIALE/i.test(text)

  // ── Nome ─────────────────────────────────────────────────
  let nome = ''
  if (isNegozioApertura) {
    const m = text.match(/apre la FILIALE di ([^\n:]+)/i)
    nome = m ? m[1].trim() : ''
  } else if (isMinishopApertura) {
    const m = text.match(/apre il MINISHOP di ([^\n:]+)/i)
    nome = m ? m[1].trim() : ''
  } else if (isMiniToShop) {
    const m = text.match(/il MINISHOP di ([^\s]+)\s+diventa/i)
    nome = m ? m[1].trim() : ''
  } else if (isTrasferimento) {
    const m = text.match(/FILIALE ([^:]+?):/i)
    nome = m ? m[1].trim() : ''
  }

  // ── Tipo filiale (ATG / Diretta / Autogestita) ────────────
  const tipoMatch = text.match(/TIPO FILIALE\s*[-–]?\s*([^\n]+)/i)
  const tipoFiliale = tipoMatch ? tipoMatch[1].trim() : ''
  const isDiretta = /dirett/i.test(tipoFiliale)
  // Autogestita = ATG
  const isAutogestita = /autogestit/i.test(tipoFiliale) || /ATG/i.test(tipoFiliale)

  // ── Campi anagrafici ──────────────────────────────────────
  const codiceMatch  = text.match(/CODICE FILIALE\s*[-–]?\s*([^\n]+)/i)
  const codiceFiliale = codiceMatch ? codiceMatch[1].trim() : ''

  const indirizzoMatch = text.match(/INDIRIZZO NEGOZIO\s*[-–]?\s*([^\n]+)/i)
  const indirizzo = indirizzoMatch ? indirizzoMatch[1].trim() : ''

  const zonaMatch = text.match(/ZONA\s*[-–]?\s*([^\n]+)/i)
  const zona = zonaMatch ? zonaMatch[1].trim() : ''

  const autogestoreMatch = text.match(/AUTOGESTORE\s+([^\n]+)/i)
  const autogestore = autogestoreMatch ? autogestoreMatch[1].trim() : ''

  // ── Date ──────────────────────────────────────────────────
  let dataAmministrativa = ''
  let dataCommerciale    = ''
  let dataTrasferimento  = ''

  for (const line of lines) {
    const dateInLine = line.match(/\d{1,2}\s+\w+\s+\d{4}/)
    if (!dateInLine) continue
    const lower = line.toLowerCase()
    if ((lower.includes('amministrativ') || lower.includes('fox')) && !dataAmministrativa) {
      dataAmministrativa = parseDate(dateInLine[0])
    }
    if (lower.includes('commerciale') && !dataCommerciale) {
      dataCommerciale = parseDate(dateInLine[0])
    }
    if ((lower.includes('trasferi') || lower.includes('nuovi locali')) && !dataTrasferimento) {
      dataTrasferimento = parseDate(dateInLine[0])
    }
  }

  // ── Tipo suggerito ────────────────────────────────────────
  let suggeritedType = 'ALTRO'
  if (isMiniToShop) {
    suggeritedType = 'TRASFORMAZIONE DA MINI A SHOP'
  } else if (isTrasferimento) {
    suggeritedType = 'TRASFERIMENTO'
  } else if (isMinishopApertura) {
    suggeritedType = isDiretta ? 'NUOVO MINISHOP DIRETTA' : 'NUOVO MINISHOP'
  } else if (isNegozioApertura) {
    suggeritedType = isDiretta ? 'NUOVO NEGOZIO DIRETTA' : 'NUOVO NEGOZIO'
  }

  // ── Note pre-compilate ────────────────────────────────────
  const noteLines = []
  if (codiceFiliale)       noteLines.push(`Codice filiale: ${codiceFiliale}`)
  if (tipoFiliale)         noteLines.push(`Tipo: ${tipoFiliale}`)
  if (indirizzo)           noteLines.push(`Indirizzo: ${indirizzo}`)
  if (zona)                noteLines.push(`Zona: ${zona}`)
  if (autogestore)         noteLines.push(`Autogestore: ${autogestore}`)
  if (dataAmministrativa)  noteLines.push(`Apertura amministrativa (Fox): ${new Date(dataAmministrativa + 'T00:00:00').toLocaleDateString('it-IT')}`)
  if (dataTrasferimento)   noteLines.push(`Data trasferimento: ${new Date(dataTrasferimento + 'T00:00:00').toLocaleDateString('it-IT')}`)
  if (dataCommerciale)     noteLines.push(`Apertura commerciale: ${new Date(dataCommerciale + 'T00:00:00').toLocaleDateString('it-IT')}`)

  return {
    nome,
    codiceFiliale,
    tipoFiliale,
    isDiretta,
    isAutogestita,
    isMinishopApertura,
    isNegozioApertura,
    isTrasferimento,
    isMiniToShop,
    indirizzo,
    zona,
    autogestore,
    dataAmministrativa,
    dataCommerciale,
    dataTrasferimento,
    suggeritedType,
    noteLines,
  }
}
