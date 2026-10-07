import { supabase } from '../../../lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('problemas')
    .select('*, incidencias(nombre), soluciones(*, personas(nombre))')
    .order('created_at', { ascending: false })

  if (error) return new Response('Error: ' + error.message, { status: 500 })

  const cabeceras = [
    'ID',
    'Empresa',
    'Teléfono',
    'Correo',
    'Incidencia',
    'Descripción',
    'Solución inicial',
    'Soluciones adicionales',
    'Prioridad',
    'Estado',
    'Fecha',
  ]

  // Escapa y ajusta al formato español (punto y coma como separador)
  const preparar = (v) => {
    let s = String(v ?? '')
    s = s.replace(/"/g, '""')
    if (/^-?\d+\.\d+$/.test(s)) {
      s = s.replace('.', ',')
    }
    if (s.includes(';') || s.includes('"') || s.includes('\n')) {
      s = `"${s}"`
    }
    return s
  }

  const formatearSoluciones = (sols) => {
    if (!sols || sols.length === 0) return ''
    return sols
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map(s => {
        const marca = s.aceptada ? '[ACEPTADA]' : '[pendiente]'
        const autor = s.personas?.nombre ? ` (${s.personas.nombre})` : ''
        return `${marca} ${s.texto}${autor}`
      })
      .join(' | ')
  }

  const filas = data.map(p => [
    p.id,
    p.empresa,
    p.telefono,
    p.correo,
    p.incidencias?.nombre ?? '',
    p.descripcion,
    p.solucion,
    formatearSoluciones(p.soluciones),
    p.prioridad,
    p.estado,
    p.created_at,
  ].map(preparar).join(';'))

  const csv = '\uFEFF' + [cabeceras.join(';'), ...filas].join('\r\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="problemas_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}