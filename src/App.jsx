import React, { useEffect, useState } from 'react';
import { 
  ClipboardList, 
  ArrowRight, 
  CheckCircle, 
  RefreshCcw, 
  Download, 
  Database,
  User,
  AlertCircle,
  ShieldCheck,
  ChevronLeft,
  Minus,
  Plus
} from 'lucide-react';

// --- DATOS DEL TEST ---
const QUESTIONS = [
  "Torpe o entumecido",
  "Acalorado",
  "Con temblor en las piernas",
  "Incapaz de relajarse",
  "Con temor a que ocurra lo peor",
  "Mareado, o que se le va la cabeza",
  "Con latidos del corazón fuertes y acelerados",
  "Inestable",
  "Atemorizado o asustado",
  "Nervioso",
  "Con sensación de bloqueo",
  "Con temblores en las manos",
  "Inquieto, inseguro",
  "Con miedo a perder el control",
  "Con sensación de ahogo",
  "Con temor a morir",
  "Con miedo",
  "Con problemas digestivos",
  "Con desvanecimientos",
  "Con rubor facial",
  "Con sudores, fríos o calientes"
];

const OPTIONS = [
  { value: 0, label: "No" },
  { value: 1, label: "Leve" },
  { value: 2, label: "Moderado" },
  { value: 3, label: "Bastante" }
];

export default function App() {
  // --- ESTADOS ---
  // views: 'demographics' | 'test' | 'results' | 'admin'
  const [currentView, setCurrentView] = useState('demographics');
  const [records, setRecords] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bai_records') || '[]');
    } catch {
      return [];
    }
  });
  const [secretClicks, setSecretClicks] = useState(0);
  
  // Estado actual del usuario rellenando el test
  const [currentUser, setCurrentUser] = useState({ edad: '', carrera: '' });
  const [answers, setAnswers] = useState({}); // { index_pregunta: valor }
  const [error, setError] = useState('');

  useEffect(() => {
    localStorage.setItem('bai_records', JSON.stringify(records));
  }, [records]);



  useEffect(() => {
    try {
      localStorage.setItem('bai_records', JSON.stringify(records));
    } catch {
      // Si el navegador bloquea localStorage, la app sigue funcionando en memoria.
    }
  }, [records]);

  // --- MANEJADORES ---
  const handleSecretClick = () => {
    const newClicks = secretClicks + 1;
    setSecretClicks(newClicks);
    
    // Si hace click 5 veces en el título, entra al admin
    if (newClicks >= 5) {
      setCurrentView('admin');
      setSecretClicks(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Resetear el contador de clicks después de 2 segundos de inactividad
    setTimeout(() => {
      setSecretClicks(0);
    }, 2000);
  };

  const handleDemographicsChange = (e) => {
    let { name, value } = e.target;
    
    if (name === 'carrera') {
      // Solo letras, forzar mayúsculas, máximo 4 caracteres
      value = value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
    }
    
    setCurrentUser({ ...currentUser, [name]: value });
    setError('');
  };

  const adjustAge = (amount) => {
    let currentAge = parseInt(currentUser.edad) || 18; // Edad por defecto si está vacío
    let newAge = currentAge + amount;
    if (newAge < 1) newAge = 1;
    if (newAge > 120) newAge = 120;
    setCurrentUser(prev => ({ ...prev, edad: newAge.toString() }));
    setError('');
  };

  const startTest = (e) => {
    e.preventDefault();
    if (!currentUser.edad || !currentUser.carrera) {
      setError('Por favor, completa todos los campos antes de continuar.');
      return;
    }
    setError('');
    setCurrentView('test');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnswerSelect = (questionIndex, value) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: value }));
    setError('');
  };

  const submitTest = () => {
    // Validar que se hayan respondido las 21 preguntas
    if (Object.keys(answers).length < QUESTIONS.length) {
      setError('Por favor, responde todas las preguntas antes de finalizar el test.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Calcular puntuación
    let totalScore = 0;
    Object.values(answers).forEach(val => totalScore += val);

    // Determinar interpretación
    let interpretation = '';
    if (totalScore <= 21) interpretation = 'Ansiedad muy baja';
    else if (totalScore <= 35) interpretation = 'Ansiedad moderada';
    else interpretation = 'Ansiedad severa';

    // Guardar registro
    const newRecord = {
      id: Date.now(),
      date: new Date().toISOString(),
      edad: currentUser.edad,
      carrera: currentUser.carrera,
      score: totalScore,
      interpretation: interpretation,
      rawAnswers: { ...answers }
    };

    setRecords(prev => [...prev, newRecord]);
    setCurrentView('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForNextUser = () => {
    setCurrentUser({ edad: '', carrera: '' });
    setAnswers({});
    setError('');
    setCurrentView('demographics');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const exportCSV = () => {
    if (records.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }

    const baseHeaders = ['ID', 'Fecha', 'Edad', 'Carrera', 'Puntuación Total', 'Nivel de Ansiedad'];
    const questionHeaders = QUESTIONS.map((q, i) => `P${i + 1}`);
    const headers = [...baseHeaders, ...questionHeaders];

    const rows = records.map(r => {
      const baseData = [
        r.id,
        new Date(r.date).toLocaleString(),
        r.edad,
        `"${r.carrera}"`,
        r.score,
        r.interpretation
      ];
      const answersData = QUESTIONS.map((_, i) => r.rawAnswers[i]);
      return [...baseData, ...answersData];
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `resultados_bai_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- COMPONENTES DE VISTA ---

  const renderDemographics = () => (
    <div className="max-w-md mx-auto bg-white p-8 sm:p-10 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-slate-100 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
      
      <div className="flex flex-col items-center justify-center mb-8">
        <div className="bg-blue-50 p-4 rounded-full text-blue-600 mb-4">
          <User size={36} strokeWidth={2.5} />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-800 text-center tracking-tight">Bienvenido</h2>
        <p className="text-slate-500 text-center mt-2 text-sm max-w-[250px]">Ingresa tus datos para comenzar la evaluación confidencial.</p>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm font-medium rounded-xl flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={startTest} className="space-y-6">
        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-slate-700 pl-1">Edad</label>
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={() => adjustAge(-1)} 
              className="h-14 w-14 bg-slate-100 rounded-xl hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center active:scale-95 transition-all focus:ring-2 focus:ring-blue-500 outline-none shrink-0"
            >
              <Minus size={20} />
            </button>
            <input 
              type="number" 
              name="edad" 
              min="1" max="120"
              value={currentUser.edad} 
              onChange={handleDemographicsChange}
              className="flex-1 px-5 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500 rounded-xl outline-none transition-all placeholder:text-slate-400 font-bold text-center text-slate-800 text-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="Ej. 20"
            />
            <button 
              type="button" 
              onClick={() => adjustAge(1)} 
              className="h-14 w-14 bg-slate-100 rounded-xl hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center active:scale-95 transition-all focus:ring-2 focus:ring-blue-500 outline-none shrink-0"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-slate-700 pl-1">Acrónimo de Carrera</label>
          <input 
            type="text" 
            name="carrera" 
            value={currentUser.carrera} 
            onChange={handleDemographicsChange}
            maxLength={4}
            className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500 rounded-xl outline-none transition-all placeholder:text-slate-400 font-bold text-slate-800 text-lg uppercase tracking-widest"
            placeholder="Ej. IMT, ITC, IIS"
          />
        </div>
        <button 
          type="submit"
          className="w-full mt-8 bg-blue-600 text-white font-bold text-lg py-4 px-6 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          Comenzar Evaluación <ArrowRight size={22} />
        </button>
      </form>
    </div>
  );

  const renderTest = () => {
    const answeredCount = Object.keys(answers).length;
    const progress = Math.round((answeredCount / QUESTIONS.length) * 100);

    return (
      <div className="max-w-3xl mx-auto">
        {/* Sticky Progress Header */}
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-slate-100 mb-8 sticky top-4 z-10">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold text-slate-800">Prueba de Ansiedad de BECK</h2>
            <span className="text-sm font-bold px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
              {answeredCount} / {QUESTIONS.length}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-slate-500 mt-4 font-medium">
            Indique cuánto le ha afectado cada síntoma en la <strong className="text-slate-700">última semana, incluyendo hoy</strong>.
          </p>
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl flex items-center gap-2">
              <AlertCircle size={18} /> {error}
            </div>
          )}
        </div>

        {/* Questions List */}
        <div className="space-y-6">
          {QUESTIONS.map((question, qIndex) => (
            <div key={qIndex} className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
              <h3 className="text-xl font-bold text-slate-800 mb-6">
                <span className="text-slate-400 mr-2">{qIndex + 1}.</span>
                {question}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {OPTIONS.map((opt) => {
                  const isSelected = answers[qIndex] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleAnswerSelect(qIndex, opt.value)}
                      className={`relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all duration-200 outline-none active:scale-95
                        ${isSelected 
                          ? 'border-blue-600 bg-blue-50 shadow-sm ring-2 ring-blue-600/20' 
                          : 'border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50'
                        }
                      `}
                    >
                      <span className={`text-base sm:text-lg font-bold text-center leading-tight ${isSelected ? 'text-blue-900' : 'text-slate-500'}`}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Submit Section */}
        <div className="mt-10 mb-8 flex justify-end">
          <button 
            onClick={submitTest}
            className="bg-slate-900 text-white font-bold py-5 px-8 rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98] flex items-center gap-3 text-lg w-full sm:w-auto justify-center"
          >
            Ver Resultados de Evaluación <CheckCircle size={24} />
          </button>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const lastRecord = records[records.length - 1];
    
    let colorClass = 'text-green-600';
    let bgClass = 'bg-green-50 border-green-200';
    let ringClass = 'ring-green-100';
    
    if (lastRecord.score >= 22 && lastRecord.score <= 35) {
      colorClass = 'text-yellow-600';
      bgClass = 'bg-yellow-50 border-yellow-200';
      ringClass = 'ring-yellow-100';
    } else if (lastRecord.score >= 36) {
      colorClass = 'text-red-600';
      bgClass = 'bg-red-50 border-red-200';
      ringClass = 'ring-red-100';
    }

    return (
      <div className="max-w-md mx-auto bg-white p-8 sm:p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 text-center relative overflow-hidden">
        
        <div className="mb-8 flex justify-center">
          <div className={`p-5 rounded-full ${bgClass} ring-8 ${ringClass}`}>
            <ClipboardList size={40} className={colorClass} strokeWidth={2.5} />
          </div>
        </div>
        
        <h2 className="text-3xl font-extrabold text-slate-800 mb-2 tracking-tight">Resultados</h2>
        <p className="text-slate-500 font-medium mb-8">Evaluación procesada exitosamente.</p>

        <div className={`p-8 rounded-3xl border-2 ${bgClass} mb-8 relative overflow-hidden`}>
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <ClipboardList size={100} className={colorClass} />
          </div>
          <div className="relative z-10">
            <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${colorClass} opacity-80`}>Puntuación Total</div>
            <div className={`text-7xl font-black mb-3 ${colorClass} tracking-tighter`}>{lastRecord.score}</div>
            <div className={`text-xl font-extrabold ${colorClass}`}>{lastRecord.interpretation}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-10 text-left">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Edad</div>
            <div className="text-slate-800 font-semibold">{lastRecord.edad} años</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Carrera / Profesión</div>
            <div className="text-slate-800 font-semibold">{lastRecord.carrera}</div>
          </div>
        </div>

        <button 
          onClick={resetForNextUser}
          className="w-full bg-blue-600 text-white font-bold text-lg py-4 px-6 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <RefreshCcw size={22} /> Evaluar a otra persona
        </button>
      </div>
    );
  };

  const renderAdmin = () => (
    <div className="max-w-5xl mx-auto bg-white p-8 sm:p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-6 border-b border-slate-100 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-slate-900 p-2 rounded-lg text-white">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Panel Oculto</h2>
          </div>
          <p className="text-slate-500 font-medium">Datos acumulados en esta sesión: <strong className="text-slate-800">{records.length} registros</strong></p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setCurrentView('demographics')}
            className="flex-1 sm:flex-none bg-slate-100 text-slate-700 font-bold py-3 px-5 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
          >
            <ChevronLeft size={20} /> Volver
          </button>
          <button 
            onClick={exportCSV}
            disabled={records.length === 0}
            className="flex-1 sm:flex-none bg-emerald-600 text-white font-bold py-3 px-5 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <Download size={20} /> Descargar CSV
          </button>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-3xl border-2 border-slate-100 border-dashed">
          <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
            <Database size={32} className="text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-1">Base de datos vacía</h3>
          <p className="text-slate-500 font-medium">Aún no hay participantes registrados.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Edad</th>
                <th className="px-6 py-4">Carrera</th>
                <th className="px-6 py-4 text-center">Puntaje</th>
                <th className="px-6 py-4">Nivel</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium bg-white">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">{new Date(r.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                  <td className="px-6 py-4">{r.edad}</td>
                  <td className="px-6 py-4 truncate max-w-[150px]">{r.carrera}</td>
                  <td className="px-6 py-4 text-center font-black text-slate-900 text-base">{r.score}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide ${
                      r.score <= 21 ? 'bg-green-100 text-green-800' :
                      r.score <= 35 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {r.interpretation}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/50 text-slate-900 font-sans selection:bg-blue-200 selection:text-blue-900 pb-12">
      
      {/* Header Clean */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm shadow-slate-200/20">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-center">
          {/* LOGO - Botón Oculto */}
          <div 
            className="flex items-center gap-3 text-blue-600 cursor-default select-none active:scale-95 transition-transform" 
            onClick={handleSecretClick}
          >
            <div className="bg-blue-600 text-white p-2 rounded-xl">
               <ClipboardList size={26} strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-slate-800">Prueba de Ansiedad de BECK</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 sm:py-12">
        {currentView === 'demographics' && renderDemographics()}
        {currentView === 'test' && renderTest()}
        {currentView === 'results' && renderResults()}
        {currentView === 'admin' && renderAdmin()}
      </main>

    </div>
  );
}