'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function IncidenciasPage() {
  const [incidencias, setIncidencias] = useState<any[]>([])
  const [nueva, setNueva] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const cargar = async () => {
    const { data, error } = await supabase
      .from('incidencias')
      .select('*')
      .order('nombre', { ascending: true })
    if (error) setError(error.message)
    else setIncidencias(data || [])
  }

  useEffect(() => { cargar() }, [])

  const agregar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nueva.trim()) return
    setCargando(true)
    setError('')

    const { error } = await supabase
      .from('incidencias')
      .insert([{ nombre: nueva.trim() }])

    if (error) {
      setError(error.message)
    } else {
      setNueva('')
      await cargar()
    }
    setCargando(false)
  }

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar esta incidencia? Los problemas asociados quedarán sin tipo.')) return
    const { error } = await supabase.from('incidencias').delete().eq('id', id)
    if (error) setError(error.message)
    else cargar()
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">🗂️ Catálogo de Incidencias</h1>

      <form onSubmit={agregar} className="bg-white shadow rounded-lg p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <input
          required
          placeholder="Nueva incidencia (ej: Red caída)"
          className="border p-2 rounded flex-1"
          value={nueva}
          onChange={e => setNueva(e.target.value)}
        />
        <button
          disabled={cargando}
          className="bg-blue-600 text-white rounded p-2 px-4 hover:bg-blue-700 disabled:opacity-50"
        >
          {cargando ? 'Guardando...' : 'Agregar'}
        </button>
      </form>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg divide-y">
        {incidencias.length === 0 && (
          <p className="p-4 text-gray-500">No hay incidencias registradas.</p>
        )}
        {incidencias.map(i => (
          <div key={i.id} className="flex justify-between items-center p-3">
            <span>{i.nombre}</span>
            <button
              onClick={() => eliminar(i.id)}
              className="text-red-600 hover:underline text-sm"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}