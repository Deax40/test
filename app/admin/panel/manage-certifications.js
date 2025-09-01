 'use client'
 import { useEffect, useState } from 'react'
 
 export default function ManageCertifications() {
   const [tools, setTools] = useState([])
   const [certs, setCerts] = useState([])
   const [category, setCategory] = useState('CARE')
   const [toolId, setToolId] = useState('')
   const [months, setMonths] = useState(12)
   const [file, setFile] = useState(null)
   const [msg, setMsg] = useState('')
 
   async function load(cat = category) {
     try {
       const toolsRes = await fetch(`/api/tools?category=${cat}`, { cache: 'no-store' })
       if (!toolsRes.ok) throw new Error('tools')
       const toolsData = await toolsRes.json()
      setTools(toolsData.tools || [])
      const toolsList = Array.isArray(toolsData.tools) ? toolsData.tools : []
      const dbTools = toolsList.filter(t => typeof t.id === 'number')
      setTools(dbTools)
     } catch (e) {
       setTools([])
     }
     try {
       const certRes = await fetch('/api/certifications', { cache: 'no-store' })
       if (!certRes.ok) throw new Error('certs')
       const certData = await certRes.json()
       setCerts(certData.certifications || [])
     } catch (e) {
       setCerts([])
     }
   }
   useEffect(() => {
     setToolId('')
     load(category)
   }, [category])
 
   async function addCert(e) {
     e.preventDefault()
     setMsg('')
     const fd = new FormData()
     fd.append('toolId', toolId)
     fd.append('months', months)
     if (file) fd.append('file', file)
     const res = await fetch('/api/certifications', { method: 'POST', body: fd })
