'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Incidencia = { id: number; nombre: string }
type Persona = { id: number; nombre: string }
type Solucion = {
  id: number
  problema_id: number
  persona_id: number | null
  texto: string
  aceptada: boolean
  created_at: string
  personas: { nombre: string } | null
}
type Problema = {
  id: number
  empresa: string
  telefono: string | null
  correo: string | null
  incidencia_id: number | null
  descripcion: string
  solucion: string | null
  prioridad: string
  estado: string
  created_at: string
  incidencias: { nombre: string } | null
  soluciones: Solucion[]
}

const formInicial = {
  empresa: '',
  telefono: '',
  correo: '',
  incidencia_id: '',
  descripcion: '',
  solucion: '',
  prioridad: 'media',
}

export default function Home() {
  const [problemas, setProblemas] = useState<Problema[]>([])
  const [incidencias, setIncidencias] = useState<Incidencia[]>([])
  const [personas, setPersonas] = useState<Persona[]>([])
  const [form, setForm] = useState(formInicial)
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  // Estado para el formulario de "agregar solución" que se abre por problema
  const [solucionAbierta, setSolucionAbierta] = useState<number | null>(null)
  const [nuevaSolucion, setNuevaSolucion] = useState({ texto: '', persona_id: '' })
  const [guardandoSolucion, setGuardandoSolucion] = useState(false)

  const cargarDatos = async () => {
    const { data: incs } = await supabase
      .from('incidencias')
      .select('*')
      .order('nombre')
    setIncidencias(incs || [])

    const { data: pers } = await supabase
      .from('personas')
      .select('*')
      .order('nombre')
    setPersonas(pers || [])

    const { data: probs, error } = await supabase
      .from('problemas')
      .select('*, incidencias(nombre), soluciones(*, personas(nombre))')
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setProblemas(probs || [])
  }

  useEffect(() => { cargarDatos() }, [])

  const agregar = async (e: React.FormEvent) => {
    e.preventDefault()
    setCargando(true)
    setError('')

    const payload = {
      empresa: form.empresa.trim(),
      telefono: form.telefono.trim() || null,
      correo: form.correo.trim() || null,
      incidencia_id: form.incidencia_id ? Number(form.incidencia_id) : null,
      descripcion: form.descripcion.trim(),
      solucion: form.solucion.trim() || null,
      prioridad: form.prioridad,
    }

    const { error } = await supabase.from('problemas').insert([payload])

    if (error) {
      setError(error.message)
    } else {
      setForm(formInicial)
      await cargarDatos()
    }
    setCargando(false)
  }

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar este problema y todas sus soluciones?')) return
    await supabase.from('problemas').delete().eq('id', id)
    cargarDatos()
  }

  const abrirFormSolucion = (problemaId: number) => {
    if (solucionAbierta === problemaId) {
      setSolucionAbierta(null)
    } else {
      setSolucionAbierta(problemaId)
      setNuevaSolucion({ texto: '', persona_id: '' })
    }
  }

  const agregarSolucion = async (problemaId: number) => {
    if (!nuevaSolucion.texto.trim()) return
    setGuardandoSolucion(true)
    setError('')

    const { error } = await supabase.from('soluciones').insert([{
      problema_id: problemaId,
      persona_id: nuevaSolucion.persona_id ? Number(nuevaSolucion.persona_id) : null,
      texto: nuevaSolucion.texto.trim(),
    }])

    if (error) {
      setError(error.message)
    } else {
      setNuevaSolucion({ texto: '', persona_id: '' })
      setSolucionAbierta(null)
      await cargarDatos()
    }
    setGuardandoSolucion(false)
  }

  const eliminarSolucion = async (id: number) => {
    if (!confirm('¿Eliminar esta solución?')) return
    await supabase.from('soluciones').delete().eq('id', id)
    cargarDatos()
  }

  const toggleAceptada = async (sol: Solucion) => {
    await supabase
      .from('soluciones')
      .update({ aceptada: !sol.aceptada })
      .eq('id', sol.id)
    cargarDatos()
  }

  const filtrados = problemas.filter(p => {
    const q = busqueda.toLowerCase()
    if (!q) return true
    return (
      p.empresa?.toLowerCase().includes(q) ||
      p.descripcion?.toLowerCase().includes(q) ||
      p.incidencias?.nombre?.toLowerCase().includes(q) ||
      p.correo?.toLowerCase().includes(q) ||
      p.soluciones?.some(s => s.texto.toLowerCase().includes(q))
    )
  })

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">📋 Registro de Problemas</h1>

      <form onSubmit={agregar} className="bg-white shadow rounded-lg p-4 mb-6 grid gap-3 md:grid-cols-2">
        <input
          required
          placeholder="Empresa *"
          className="border p-2 rounded"
          value={form.empresa}
          onChange={e => setForm({ ...form, empresa: e.target.value })}
        />
        <select
          required
          className="border p-2 rounded"
          value={form.incidencia_id}
          onChange={e => setForm({ ...form, incidencia_id: e.target.value })}
        >
          <option value="">Seleccione tipo de incidencia *</option>
          {incidencias.map(i => (
            <option key={i.id} value={i.id}>{i.nombre}</option>
          ))}
        </select>
        <input
          type="tel"
          placeholder="Teléfono (opcional)"
          className="border p-2 rounded"
          value={form.telefono}
          onChange={e => setForm({ ...form, telefono: e.target.value })}
        />
        <input
          type="email"
          placeholder="Correo (opcional)"
          className="border p-2 rounded"
          value={form.correo}
          onChange={e => setForm({ ...form, correo: e.target.value })}
        />
        <textarea
          required
          placeholder="Descripción del problema *"
          className="border p-2 rounded md:col-span-2"
          rows={3}
          value={form.descripcion}
          onChange={e => setForm({ ...form, descripcion: e.target.value })}
        />
        <textarea
          placeholder="Solución inicial (opcional)"
          className="border p-2 rounded md:col-span-2"
          rows={2}
          value={form.solucion}
          onChange={e => setForm({ ...form, solucion: e.target.value })}
        />
        <select
          className="border p-2 rounded"
          value={form.prioridad}
          onChange={e => setForm({ ...form, prioridad: e.target.value })}
        >
          <option value="baja">Prioridad baja</option>
          <option value="media">Prioridad media</option>
          <option value="alta">Prioridad alta</option>
        </select>
        <button
          disabled={cargando}
          className="bg-blue-600 text-white rounded p-2 hover:bg-blue-700 disabled:opacity-50"
        >
          {cargando ? 'Guardando...' : 'Agregar problema'}
        </button>
      </form>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <input
          placeholder="🔍 Buscar por empresa, descripción, correo, tipo o solución..."
          className="border p-2 rounded flex-1"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        <a
          href="/api/exportar"
          className="bg-green-600 text-white px-4 py-2 rounded text-center hover:bg-green-700"
        >
          ⬇️ Exportar a Excel (CSV)
        </a>
      </div>

      <div className="grid gap-3">
        {filtrados.length === 0 && (
          <p className="text-gray-500">No hay problemas registrados.</p>
        )}
        {filtrados.map(p => {
          const tieneAceptada = p.soluciones?.some(s => s.aceptada)
          return (
            <div key={p.id} className="bg-white shadow rounded-lg p-4">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded font-mono">
                      #{p.id}
                    </span>
                    <h2 className="font-bold text-lg">{p.empresa}</h2>
                    {tieneAceptada && (
                      <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                        ✅ Resuelto
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs mt-2">
                    {p.incidencias?.nombre && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {p.incidencias.nombre}
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded ${
                      p.prioridad === 'alta' ? 'bg-red-100 text-red-800' :
                      p.prioridad === 'media' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'}`}>
                      {p.prioridad}
                    </span>
                  </div>
                  {(p.telefono || p.correo) && (
                    <p className="text-xs text-gray-500 mt-2">
                      {p.telefono && <>📞 {p.telefono} </>}
                      {p.correo && <>✉️ {p.correo}</>}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => eliminar(p.id)}
                  className="text-red-600 hover:underline text-sm flex-shrink-0"
                >
                  Eliminar
                </button>
              </div>

              <p className="mt-2 text-gray-700">{p.descripcion}</p>

              {p.solucion && (
                <p className="mt-2 text-sm bg-green-50 border-l-4 border-green-500 p-2">
                  <strong>Solución inicial:</strong> {p.solucion}
                </p>
              )}

              {/* Soluciones adicionales */}
              <div className="mt-3 border-t pt-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm text-gray-700">
                    Soluciones adicionales ({p.soluciones?.length || 0})
                  </h3>
                  <button
                    onClick={() => abrirFormSolucion(p.id)}
                    className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded"
                  >
                    {solucionAbierta === p.id ? 'Cancelar' : '+ Agregar solución'}
                  </button>
                </div>

                {p.soluciones?.length === 0 && solucionAbierta !== p.id && (
                  <p className="text-xs text-gray-400">Aún no hay soluciones adicionales.</p>
                )}

                {p.soluciones?.map(s => (
                  <div
                    key={s.id}
                    className={`text-sm p-2 rounded mb-2 border-l-4 ${
                      s.aceptada ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <p className="text-gray-800">{s.texto}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {s.personas?.nombre || 'Anónimo'} · {new Date(s.created_at).toLocaleString('es-ES')}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <label className="flex items-center gap-1 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={s.aceptada}
                            onChange={() => toggleAceptada(s)}
                          />
                          Aceptada
                        </label>
                        <button
                          onClick={() => eliminarSolucion(s.id)}
                          className="text-red-600 hover:underline text-xs"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {solucionAbierta === p.id && (
                  <div className="mt-2 p-3 bg-blue-50 rounded border border-blue-200 space-y-2">
                    <textarea
                      placeholder="Escribe la solución..."
                      className="border p-2 rounded w-full text-sm"
                      rows={2}
                      value={nuevaSolucion.texto}
                      onChange={e => setNuevaSolucion({ ...nuevaSolucion, texto: e.target.value })}
                    />
                    <div className="flex gap-2 flex-col sm:flex-row">
                      <select
                        className="border p-2 rounded text-sm flex-1"
                        value={nuevaSolucion.persona_id}
                        onChange={e => setNuevaSolucion({ ...nuevaSolucion, persona_id: e.target.value })}
                      >
                        <option value="">Autor (opcional)</option>
                        {personas.map(per => (
                          <option key={per.id} value={per.id}>{per.nombre}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => agregarSolucion(p.id)}
                        disabled={guardandoSolucion || !nuevaSolucion.texto.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        {guardandoSolucion ? 'Guardando...' : 'Guardar solución'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-400 mt-3">
                Reportado: {new Date(p.created_at).toLocaleString('es-ES')}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}