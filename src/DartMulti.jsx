import { useState, useRef } from 'react'
import {
  Search, FileSpreadsheet, Download, RotateCcw,
  TrendingUp, TrendingDown, Building2, ChevronRight,
  Sparkles, CheckCircle2, Loader2, Upload, BarChart2
} from 'lucide-react'

const API = window.location.hostname === 'localhost'
  ? `http://localhost:8002`
  : ''

/* ── 포맷 유틸 ─────────────────────────────────── */
const fa  = v => v == null ? '-' : (v < 0 ? `(${Math.abs(v/1e8).toLocaleString('ko-KR',{maximumFractionDigits:0})}억)` : `${(v/1e8).toLocaleString('ko-KR',{maximumFractionDigits:0})}억`)
const fp  = v => v != null ? `${v.toFixed(2)}%` : '-'
const fi  = v => v != null ? `${v.toFixed(2)}배` : '-'
const feps = v => v != null ? `${Math.round(v).toLocaleString()}원` : '-'

/* ── YoY 뱃지 ──────────────────────────────────── */
const YoY = ({ cur, prev }) => {
  if (cur == null || !prev || prev === 0) return <span className="text-gray-300 text-xs">-</span>
  const r = (cur - prev) / Math.abs(prev) * 100
  if (Math.abs(r) < 0.05) return <span className="text-gray-300 text-xs">-</span>
  return r > 0
    ? <span className="flex items-center gap-0.5 text-emerald-500 text-xs font-bold justify-end"><TrendingUp className="w-3 h-3"/>{r.toFixed(1)}%</span>
    : <span className="flex items-center gap-0.5 text-red-400 text-xs font-bold justify-end"><TrendingDown className="w-3 h-3"/>{Math.abs(r).toFixed(1)}%</span>
}

/* ── KPI 카드 ───────────────────────────────────── */
const KPI = ({ label, values, fmt = fa, color = 'blue' }) => {
  const bg = { blue:'bg-blue-50 border-blue-100', green:'bg-emerald-50 border-emerald-100', purple:'bg-purple-50 border-purple-100', red:'bg-red-50 border-red-100' }
  const tx = { blue:'text-blue-700', green:'text-emerald-700', purple:'text-purple-700', red:'text-red-600' }
  return (
    <div className={`rounded-2xl p-4 border ${bg[color]}`}>
      <div className="text-xs text-gray-400 mb-2 font-medium">{label}</div>
      <div className="flex gap-3">
        {values.map((v, i) => (
          <div key={i} className="flex-1 text-center">
            <div className={`text-lg font-extrabold ${tx[color]}`}>{fmt(v.val)}</div>
            <div className="text-xs text-gray-400 mt-0.5">{v.name.slice(0,4)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── 섹션 헤더 ──────────────────────────────────── */
const SecHead = ({ title, color }) => (
  <tr>
    <td colSpan={8} className={`py-2 px-4 text-xs font-bold tracking-widest uppercase text-white ${color}`}>
      {title}
    </td>
  </tr>
)

/* ── 데이터 행 ──────────────────────────────────── */
const Row = ({ label, corps, dataKey, fmt = fa, bold = false, sub = false }) => (
  <tr className={`border-b border-gray-100 hover:bg-gray-50/50 transition ${bold ? 'font-semibold bg-gray-50/80' : ''} ${sub ? 'text-gray-400' : ''}`}>
    <td className={`py-2.5 px-4 text-sm whitespace-nowrap ${sub ? 'pl-8' : ''}`}>{label}</td>
    {corps.map((corp, ci) => {
      const v23 = corp.data['2023']?.[dataKey]
      const v24 = corp.data['2024']?.[dataKey]
      const v25 = corp.data['2025']?.[dataKey]
      return [
        <td key={`${ci}-23`} className="py-2.5 px-3 text-right text-sm font-mono text-gray-500">{fmt(v23)}</td>,
        <td key={`${ci}-24`} className="py-2.5 px-3 text-right text-sm font-mono text-gray-500">{fmt(v24)}</td>,
        <td key={`${ci}-25`} className={`py-2.5 px-3 text-right text-sm font-mono ${bold ? 'text-gray-900' : 'text-gray-700'}`}>{fmt(v25)}</td>,
        <td key={`${ci}-yoy`} className="py-2.5 px-3 text-right text-sm">
          <YoY cur={v25} prev={v24} />
        </td>,
      ]
    })}
  </tr>
)

/* ── 회사 검색 박스 ─────────────────────────────── */
const COLORS = ['bg-blue-600','bg-indigo-600','bg-violet-600']
const LIGHT  = ['bg-blue-50','bg-indigo-50','bg-violet-50']
const BORDER = ['border-blue-200','border-indigo-200','border-violet-200']

function CompanySearch({ idx, confirmed, onConfirm, onClear }) {
  const [query,  setQuery]  = useState('')
  const [cands,  setCands]  = useState([])
  const [loading,setLoad]   = useState(false)
  const [error,  setError]  = useState('')

  const doSearch = async () => {
    if (!query.trim()) return
    setLoad(true); setError(''); setCands([])
    try {
      const res  = await fetch(`${API}/api/search`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ name: query.trim() }),
      })
      const data = await res.json()
      if (!data.results?.length) { setError('검색 결과 없음'); setLoad(false); return }
      if (data.results.length === 1) { onConfirm(data.results[0]); setLoad(false); return }
      setCands(data.results)
    } catch { setError('서버 연결 실패') }
    setLoad(false)
  }

  if (confirmed) return (
    <div className={`rounded-2xl border ${BORDER[idx]} ${LIGHT[idx]} px-5 py-4 flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        <div>
          <div className="font-bold text-gray-900">{confirmed.corp_name}</div>
          <div className="text-xs text-gray-400">{confirmed.stock_code || '비상장'}</div>
        </div>
      </div>
      <button onClick={onClear} className="text-xs text-gray-400 hover:text-red-400 transition">
        <RotateCcw className="w-4 h-4"/>
      </button>
    </div>
  )

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300"/>
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key==='Enter' && doSearch()}
            placeholder={`회사 ${idx+1} 이름 입력`}
            className={`w-full pl-9 pr-3 py-3 rounded-xl border ${BORDER[idx]} bg-white text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400`}
          />
        </div>
        <button onClick={doSearch} disabled={loading}
          className={`px-4 py-3 ${COLORS[idx]} hover:opacity-90 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition flex items-center gap-1`}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4"/>}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {cands.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden max-h-48 overflow-y-auto">
          {cands.map(c => (
            <button key={c.corp_code} onClick={() => { onConfirm(c); setCands([]) }}
              className="w-full px-4 py-2.5 text-left hover:bg-blue-50 flex justify-between items-center text-sm transition">
              <span className="font-medium text-gray-800">{c.corp_name}</span>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded font-mono">{c.stock_code || '비상장'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── 업로드 비교 단일연도 행 ─────────────────────── */
const UploadRow = ({ label, uploadData, dartCorps, dataKey, fmt = fa, bold = false, sub = false }) => (
  <tr className={`border-b border-gray-100 hover:bg-gray-50/50 transition ${bold ? 'font-semibold bg-gray-50/80' : ''} ${sub ? 'text-gray-400' : ''}`}>
    <td className={`py-2.5 px-4 text-sm whitespace-nowrap ${sub ? 'pl-8' : ''}`}>{label}</td>
    <td className="py-2.5 px-3 text-right text-sm font-mono font-bold text-amber-600">{fmt(uploadData?.[dataKey])}</td>
    {dartCorps.map((corp, i) => (
      <td key={i} className="py-2.5 px-3 text-right text-sm font-mono text-gray-700">{fmt(corp.data?.[dataKey])}</td>
    ))}
  </tr>
)

/* ══════════════════════════════════════════════════
   메인
══════════════════════════════════════════════════ */
export default function DartMulti() {
  const [activeTab,  setActiveTab]  = useState('multi')  // 'multi' | 'upload'

  // 멀티비교 탭
  const [confirmed, setConfirmed]   = useState([null, null, null])
  const [step,      setStep]        = useState('input')  // input | loading | result
  const [status,    setStatus]      = useState('')
  const [error,     setError]       = useState('')
  const [result,    setResult]      = useState(null)
  const [filename,  setFilename]    = useState('')
  const [opinions,  setOpinions]    = useState({})
  const [aiLoading, setAiLoad]      = useState({})

  // 업로드 비교 탭
  const fileRef                     = useRef(null)
  const [upFile,     setUpFile]     = useState(null)
  const [upCorpName, setUpCorpName] = useState('')
  const [upYear,     setUpYear]     = useState(2024)
  const [upCorps,    setUpCorps]    = useState([null, null])  // 비교 상장사 최대 2개
  const [upStep,     setUpStep]     = useState('input')       // input | loading | result
  const [upResult,   setUpResult]   = useState(null)
  const [upError,    setUpError]    = useState('')

  const confirm = (idx, corp) => setConfirmed(prev => { const n=[...prev]; n[idx]=corp; return n })
  const clear   = (idx)       => setConfirmed(prev => { const n=[...prev]; n[idx]=null; return n })
  const allConfirmed = confirmed.every(Boolean)

  const doAnalyze = async () => {
    setStep('loading'); setError(''); setStatus('DART 데이터 수집 중...')
    try {
      const res  = await fetch(`${API}/api/analyze-multi`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ corps: confirmed.map(c => ({ corp_code: c.corp_code, corp_name: c.corp_name })) }),
      })
      const data = await res.json()
      if (data.detail) throw new Error(data.detail)
      setResult(data.corps)
      setFilename(data.filename)
      setStep('result')
    } catch(e) { setError(`오류: ${e.message}`); setStep('input') }
  }

  const getOpinion = async (corp) => {
    setAiLoad(p => ({...p, [corp.corp_name]: true}))
    try {
      const res  = await fetch(`${API}/api/opinion`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ corp_name: corp.corp_name, data: corp.data }),
      })
      const data = await res.json()
      setOpinions(p => ({...p, [corp.corp_name]: data.lines}))
    } catch(e) { setOpinions(p => ({...p, [corp.corp_name]: [`오류: ${e.message}`]})) }
    setAiLoad(p => ({...p, [corp.corp_name]: false}))
  }

  const reset = () => { setStep('input'); setConfirmed([null,null,null]); setResult(null); setOpinions({}); setError('') }

  const confirmUp = (idx, corp) => setUpCorps(prev => { const n=[...prev]; n[idx]=corp; return n })
  const clearUp   = (idx)       => setUpCorps(prev => { const n=[...prev]; n[idx]=null; return n })
  const resetUp   = () => { setUpStep('input'); setUpFile(null); setUpCorpName(''); setUpCorps([null,null]); setUpResult(null); setUpError(''); if(fileRef.current) fileRef.current.value='' }

  const doUploadCompare = async () => {
    if (!upFile || !upCorpName.trim() || !upCorps[0]) return
    setUpStep('loading'); setUpError('')
    try {
      const fd = new FormData()
      fd.append('file', upFile)
      fd.append('year', upYear)
      fd.append('upload_corp_name', upCorpName.trim())
      fd.append('comp_corps', JSON.stringify(upCorps.filter(Boolean).map(c => ({ corp_code: c.corp_code, corp_name: c.corp_name }))))
      const res  = await fetch(`${API}/api/upload-compare`, { method: 'POST', body: fd })
      const data = await res.json()
      if (data.detail) throw new Error(data.detail)
      setUpResult(data)
      setUpStep('result')
    } catch(e) { setUpError(`오류: ${e.message}`); setUpStep('input') }
  }

  /* ── 렌더 ───────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50">

      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-6 h-6 text-blue-600"/>
              <span className="font-extrabold text-gray-900 text-lg">DART 재무분석기</span>
              <span className="text-xs bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">v9</span>
            </div>
            {/* 탭 */}
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              <button onClick={() => setActiveTab('multi')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition
                  ${activeTab==='multi' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                <BarChart2 className="w-4 h-4"/> 멀티비교
              </button>
              <button onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition
                  ${activeTab==='upload' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                <Upload className="w-4 h-4"/> 내 회사 비교
              </button>
            </div>
          </div>
          {activeTab==='multi' && step==='result' && (
            <button onClick={reset} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition">
              <RotateCcw className="w-4 h-4"/> 다시 분석
            </button>
          )}
          {activeTab==='upload' && upStep==='result' && (
            <button onClick={resetUp} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-amber-600 transition">
              <RotateCcw className="w-4 h-4"/> 다시 분석
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* ══════════════════════════════════════════
            업로드 비교 탭
        ══════════════════════════════════════════ */}
        {activeTab === 'upload' && (
          <>
            {/* 입력 */}
            {upStep === 'input' && (
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-10">
                  <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">내 회사 재무제표 비교</h1>
                  <p className="text-gray-400">Excel 업로드 → Claude AI 파싱 → DART 상장사와 자동 비교</p>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">

                  {/* 파일 업로드 */}
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">재무제표 Excel 파일</label>
                    <div
                      onClick={() => fileRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition
                        ${upFile ? 'border-amber-300 bg-amber-50' : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/30'}`}>
                      <Upload className={`w-8 h-8 mx-auto mb-2 ${upFile ? 'text-amber-500' : 'text-gray-300'}`}/>
                      {upFile
                        ? <p className="text-sm font-semibold text-amber-600">{upFile.name}</p>
                        : <p className="text-sm text-gray-400">클릭하여 Excel 파일 선택 (.xlsx, .xls)</p>}
                      <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
                        onChange={e => setUpFile(e.target.files?.[0] || null)}/>
                    </div>
                  </div>

                  {/* 회사명 + 연도 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-2 block">회사명</label>
                      <input value={upCorpName} onChange={e => setUpCorpName(e.target.value)}
                        placeholder="예) (주)우리회사"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-2 block">재무제표 연도</label>
                      <div className="flex gap-2">
                        {[2023, 2024, 2025].map(y => (
                          <button key={y} onClick={() => setUpYear(y)}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold transition border
                              ${upYear===y ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-500 border-gray-200 hover:border-amber-300'}`}>
                            {y}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 비교 상장사 */}
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-3 block">비교할 상장사 (최대 2개)</label>
                    <div className="space-y-3">
                      {[0, 1].map(i => (
                        <div key={i}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`w-5 h-5 rounded-full ${['bg-blue-500','bg-indigo-500'][i]} text-white text-xs flex items-center justify-center font-bold`}>{i+1}</span>
                            <span className="text-xs text-gray-400">{i===0 ? '필수' : '선택'}</span>
                          </div>
                          <CompanySearch idx={i} confirmed={upCorps[i]}
                            onConfirm={c => confirmUp(i,c)} onClear={() => clearUp(i)}/>
                        </div>
                      ))}
                    </div>
                  </div>

                  {upError && <p className="text-sm text-red-500 text-center">{upError}</p>}

                  <button onClick={doUploadCompare}
                    disabled={!upFile || !upCorpName.trim() || !upCorps[0]}
                    className={`w-full py-4 rounded-2xl font-bold text-white text-base transition shadow-md
                      ${upFile && upCorpName.trim() && upCorps[0]
                        ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
                        : 'bg-gray-300 cursor-not-allowed'}`}>
                    비교 분석 시작 <ChevronRight className="inline w-5 h-5"/>
                  </button>
                </div>
              </div>
            )}

            {/* 로딩 */}
            {upStep === 'loading' && (
              <div className="text-center py-32">
                <Loader2 className="w-16 h-16 text-amber-500 animate-spin mx-auto mb-6"/>
                <p className="text-gray-500 text-lg font-medium">Claude AI가 Excel을 분석 중입니다...</p>
                <p className="text-gray-300 text-sm mt-2">형식에 관계없이 재무 항목을 자동으로 추출합니다</p>
              </div>
            )}

            {/* 결과 */}
            {upStep === 'result' && upResult && (() => {
              const { upload_corp, dart_corps, year } = upResult
              const allCorps = [
                { corp_name: upload_corp.corp_name, data: upload_corp.data, isUpload: true },
                ...dart_corps.map(c => ({ ...c, isUpload: false }))
              ]
              return (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-extrabold text-gray-900">
                      <span className="text-amber-500">{upload_corp.corp_name}</span>
                      {dart_corps.map(c => <span key={c.corp_name} className="text-gray-400"> · {c.corp_name}</span>)}
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">{year}년 재무제표 비교 · 억원 단위</p>
                    {upload_corp.error && (
                      <p className="text-sm text-red-400 mt-2 bg-red-50 px-4 py-2 rounded-xl">⚠️ {upload_corp.error}</p>
                    )}
                  </div>

                  {/* KPI */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: `${year} 매출`, key: '매출', fmt: fa, color: 'blue' },
                      { label: `${year} 영업이익`, key: '영업이익', fmt: fa, color: 'green' },
                      { label: `${year} 영업이익률`, key: '영업이익률', fmt: fp, color: 'purple' },
                      { label: `${year} 부채비율`, key: '부채비율', fmt: fp, color: 'red' },
                    ].map(({ label, key, fmt, color }) => (
                      <KPI key={key} color={color} label={label} fmt={fmt}
                        values={allCorps.map(c => ({ name: c.corp_name, val: c.data?.[key] }))}/>
                    ))}
                  </div>

                  {/* 비교 테이블 */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead>
                        <tr className="bg-slate-800 text-white text-xs">
                          <th className="text-left py-3 px-4 font-semibold w-40">항목</th>
                          <th className="text-right py-3 px-4 font-bold text-amber-300">{upload_corp.corp_name}</th>
                          {dart_corps.map(c => (
                            <th key={c.corp_name} className="text-right py-3 px-4 font-semibold">{c.corp_name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <SecHead title="손익계산서" color="bg-blue-700"/>
                        {[
                          ['매출(영업수익)', '매출', fa, true],
                          ['매출원가', '매출원가', fa, false],
                          ['매출총이익', '매출총이익', fa, false],
                          ['판매비와관리비', '판매비와관리비', fa, false],
                          ['영업이익', '영업이익', fa, true],
                          ['당기순이익', '당기순이익', fa, true],
                          ['EPS', 'EPS', feps, false],
                        ].map(([label, key, fmt, bold]) => (
                          <UploadRow key={key} label={label} uploadData={upload_corp.data}
                            dartCorps={dart_corps} dataKey={key} fmt={fmt} bold={bold}/>
                        ))}
                        <SecHead title="재무상태표" color="bg-emerald-700"/>
                        {[
                          ['자산총계', '자산총계', fa, true],
                          ['부채총계', '부채총계', fa, true],
                          ['자본총계', '자본총계', fa, true],
                          ['이익잉여금', '이익잉여금', fa, false],
                        ].map(([label, key, fmt, bold]) => (
                          <UploadRow key={key} label={label} uploadData={upload_corp.data}
                            dartCorps={dart_corps} dataKey={key} fmt={fmt} bold={bold}/>
                        ))}
                        <SecHead title="투자지표" color="bg-purple-700"/>
                        {[
                          ['영업이익률', '영업이익률', fp, false],
                          ['순이익률', '순이익률', fp, false],
                          ['ROE', 'ROE', fp, false],
                          ['부채비율', '부채비율', fp, false],
                          ['유동비율', '유동비율', fp, false],
                        ].map(([label, key, fmt, bold]) => (
                          <UploadRow key={key} label={label} uploadData={upload_corp.data}
                            dartCorps={dart_corps} dataKey={key} fmt={fmt} bold={bold}/>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-center text-xs text-gray-400">
                    ※ 업로드 회사(<span className="text-amber-500 font-bold">{upload_corp.corp_name}</span>)는 Claude AI 파싱 기반 · DART 상장사는 공시 데이터 기준
                  </p>
                </div>
              )
            })()}
          </>
        )}

        {/* ══════════════════════════════════════════
            멀티비교 탭
        ══════════════════════════════════════════ */}
        {activeTab === 'multi' && (
        <>

        {/* ── 입력 화면 ──────────────────────────── */}
        {step === 'input' && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">3개 기업 재무 비교</h1>
              <p className="text-gray-400">DART 공시 기반 · account_id 정밀 매핑 · Claude CLI AI 분석 · Excel 자동 생성</p>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-5">
              {[0,1,2].map(i => (
                <div key={i}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-6 h-6 rounded-full ${COLORS[i]} text-white text-xs flex items-center justify-center font-bold`}>{i+1}</span>
                    <span className="text-sm font-semibold text-gray-600">회사 {i+1}</span>
                  </div>
                  <CompanySearch idx={i} confirmed={confirmed[i]}
                    onConfirm={c => confirm(i,c)} onClear={() => clear(i)}/>
                </div>
              ))}

              {error && <p className="text-sm text-red-500 text-center">{error}</p>}

              <button onClick={doAnalyze} disabled={!allConfirmed}
                className={`w-full py-4 rounded-2xl font-bold text-white text-base transition shadow-md
                  ${allConfirmed ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-gray-300 cursor-not-allowed'}`}>
                분석 시작 <ChevronRight className="inline w-5 h-5"/>
              </button>
            </div>
          </div>
        )}

        {/* ── 로딩 ─────────────────────────────── */}
        {step === 'loading' && (
          <div className="text-center py-32">
            <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-6"/>
            <p className="text-gray-500 text-lg font-medium">{status}</p>
            <p className="text-gray-300 text-sm mt-2">DART API에서 3개 회사 × 3개년 데이터 수집 중...</p>
          </div>
        )}

        {/* ── 결과 ─────────────────────────────── */}
        {step === 'result' && result && (
          <div className="space-y-8">

            {/* 타이틀 + 다운로드 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">
                  {result.map(c => c.corp_name).join('  ·  ')}
                </h2>
                <p className="text-sm text-gray-400 mt-1">2023 · 2024 · 2025  연결재무제표 기준 (억원)</p>
              </div>
              <a href={`${API}/api/download/${filename}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition">
                <Download className="w-4 h-4"/> Excel 다운로드
              </a>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPI color="blue" label="2025 매출" fmt={fa}
                values={result.map(c => ({ name: c.corp_name, val: c.data['2025']?.매출 }))}/>
              <KPI color="green" label="2025 영업이익" fmt={fa}
                values={result.map(c => ({ name: c.corp_name, val: c.data['2025']?.영업이익 }))}/>
              <KPI color="purple" label="2025 영업이익률" fmt={fp}
                values={result.map(c => ({ name: c.corp_name, val: c.data['2025']?.영업이익률 }))}/>
              <KPI color="red" label="2025 부채비율" fmt={fp}
                values={result.map(c => ({ name: c.corp_name, val: c.data['2025']?.부채비율 }))}/>
            </div>

            {/* 멀티 비교 테이블 */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  {/* 회사 헤더 */}
                  <tr className="bg-slate-800 text-white text-xs">
                    <th className="text-left py-3 px-4 font-semibold w-36">항목</th>
                    {result.map((corp, ci) => (
                      [
                        <th key={`${ci}-23`} className={`text-right py-3 px-3 font-medium opacity-60`}>'23</th>,
                        <th key={`${ci}-24`} className={`text-right py-3 px-3 font-medium opacity-60`}>'24</th>,
                        <th key={`${ci}-25`} className={`text-right py-3 px-3 font-semibold`}>{corp.corp_name.slice(0,4)} '25</th>,
                        <th key={`${ci}-yoy`} className={`text-right py-3 px-3 font-medium`}>YoY</th>,
                      ]
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <SecHead title="손익계산서" color="bg-blue-700"/>
                  <Row label="매출(영업수익)"        corps={result} dataKey="매출"                        bold/>
                  <Row label="매출원가"               corps={result} dataKey="매출원가"                   sub/>
                  <Row label="매출총이익"             corps={result} dataKey="매출총이익"/>
                  <Row label="판매비와관리비"         corps={result} dataKey="판매비와관리비"              sub/>
                  <Row label="영업이익"               corps={result} dataKey="영업이익"                   bold/>
                  <Row label="금융수익"               corps={result} dataKey="금융수익"                   sub/>
                  <Row label="금융비용"               corps={result} dataKey="금융비용"                   sub/>
                  <Row label="법인세차감전순이익"     corps={result} dataKey="법인세비용차감전순이익"/>
                  <Row label="법인세비용"             corps={result} dataKey="법인세비용"                  sub/>
                  <Row label="당기순이익"             corps={result} dataKey="당기순이익"                  bold/>
                  <Row label="EPS"                    corps={result} dataKey="EPS"                         fmt={feps} sub/>

                  <SecHead title="재무상태표" color="bg-emerald-700"/>
                  <Row label="유동자산"               corps={result} dataKey="유동자산"/>
                  <Row label="비유동자산"             corps={result} dataKey="비유동자산"/>
                  <Row label="자산총계"               corps={result} dataKey="자산총계"                    bold/>
                  <Row label="유동부채"               corps={result} dataKey="유동부채"/>
                  <Row label="비유동부채"             corps={result} dataKey="비유동부채"/>
                  <Row label="부채총계"               corps={result} dataKey="부채총계"                    bold/>
                  <Row label="이익잉여금"             corps={result} dataKey="이익잉여금"/>
                  <Row label="자본총계"               corps={result} dataKey="자본총계"                    bold/>

                  <SecHead title="투자지표" color="bg-purple-700"/>
                  <Row label="영업이익률"             corps={result} dataKey="영업이익률"                  fmt={fp}/>
                  <Row label="순이익률"               corps={result} dataKey="순이익률"                    fmt={fp}/>
                  <Row label="ROE"                    corps={result} dataKey="ROE"                          fmt={fp}/>
                  <Row label="ROA"                    corps={result} dataKey="ROA"                          fmt={fp}/>
                  <Row label="부채비율"               corps={result} dataKey="부채비율"                    fmt={fp}/>
                  <Row label="유동비율"               corps={result} dataKey="유동비율"                    fmt={fp}/>
                  <Row label="이자보상배율"           corps={result} dataKey="이자보상배율"                fmt={fi}/>
                </tbody>
              </table>
            </div>

            {/* Claude CLI AI 의견 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {result.map((corp, ci) => (
                <div key={ci} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className={`px-5 py-4 flex items-center justify-between ${['bg-blue-700','bg-indigo-700','bg-violet-700'][ci]}`}>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-white opacity-80"/>
                      <span className="font-bold text-white text-sm">{corp.corp_name} AI 분석</span>
                    </div>
                    {!opinions[corp.corp_name] && (
                      <button onClick={() => getOpinion(corp)} disabled={aiLoading[corp.corp_name]}
                        className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1">
                        {aiLoading[corp.corp_name] ? <><Loader2 className="w-3 h-3 animate-spin"/>분석중</> : 'AI 분석 요청'}
                      </button>
                    )}
                  </div>
                  <div className="p-5">
                    {!opinions[corp.corp_name] && !aiLoading[corp.corp_name] && (
                      <p className="text-sm text-gray-300 text-center py-6">버튼을 눌러 Claude CLI AI 분석을 요청하세요</p>
                    )}
                    {aiLoading[corp.corp_name] && (
                      <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2"/>
                        <p className="text-xs text-gray-400">Claude CLI 분석 중...</p>
                      </div>
                    )}
                    {opinions[corp.corp_name] && (
                      <ol className="space-y-2">
                        {opinions[corp.corp_name].map((line, li) => (
                          <li key={li} className={`text-xs leading-relaxed px-3 py-2 rounded-lg ${li%2===0 ? 'bg-gray-50' : 'bg-white'} text-gray-700`}>
                            {line}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-gray-400">
              ※ 출처: 금융감독원 전자공시(DART) · 연결재무제표 기준 · account_id 기반 정밀 매핑 · v9
            </p>
          </div>
        )}
        </> // 멀티비교 탭 끝
        )}

      </main>
    </div>
  )
}
