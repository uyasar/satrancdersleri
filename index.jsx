```react
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously, 
  signInWithCustomToken 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { 
  Trophy, 
  BookOpen, 
  Settings, 
  Play, 
  CheckCircle, 
  ChevronRight, 
  Plus, 
  Trash2, 
  User as UserIcon,
  ArrowLeft,
  Video,
  Target,
  Award,
  BarChart3,
  LogOut,
  LayoutDashboard,
  ShieldCheck
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'chess-pro-v1';

// --- Helper: Script Loader ---
const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

// --- Main App Component ---
export default function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('landing');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [userProgress, setUserProgress] = useState({ completedLessons: [] });
  const [loading, setLoading] = useState(true);

  // Auth & Initial Load
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth initialization failed", err);
      }
    };
    initAuth();

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        const progressRef = doc(db, 'artifacts', appId, 'users', u.uid, 'progress', 'data');
        onSnapshot(progressRef, (snap) => {
          if (snap.exists()) setUserProgress(snap.data());
          else setDoc(progressRef, { completedLessons: [] });
        });
        
        // Register user for admin visibility
        setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', u.uid), {
          uid: u.uid,
          lastActive: new Date().toISOString(),
          isAnonymous: u.isAnonymous
        }, { merge: true });
      }
    });

    return () => unsubAuth();
  }, []);

  // Sync Global Data
  useEffect(() => {
    if (!user) return;

    const unsubCourses = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'courses'), (snap) => {
      setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const unsubLessons = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'lessons'), (snap) => {
      setLessons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubUsers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'users'), (snap) => {
      setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubCourses();
      unsubLessons();
      unsubUsers();
    };
  }, [user]);

  const markComplete = async (lessonId) => {
    if (!user || userProgress.completedLessons.includes(lessonId)) return;
    const progressRef = doc(db, 'artifacts', appId, 'users', user.uid, 'progress', 'data');
    await updateDoc(progressRef, {
      completedLessons: [...userProgress.completedLessons, lessonId]
    });
  };

  if (loading) return (
    <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center gap-6">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="text-amber-500 font-mono tracking-[0.3em] text-sm animate-pulse uppercase">Ustalık Yükleniyor...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-amber-500/30">
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setCurrentView('landing')}>
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Trophy className="text-slate-950" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter leading-none text-white">CHECKMATE</h1>
              <span className="text-[10px] text-amber-500 font-bold tracking-[0.2em] uppercase">Pro Academy</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-10">
            <button onClick={() => setCurrentView('courses')} className={`text-sm font-bold tracking-wide transition-colors ${currentView === 'courses' ? 'text-amber-500' : 'text-slate-400 hover:text-white'}`}>KURSLAR</button>
            <button onClick={() => setCurrentView('profile')} className={`text-sm font-bold tracking-wide transition-colors ${currentView === 'profile' ? 'text-amber-500' : 'text-slate-400 hover:text-white'}`}>GELİŞİM</button>
            <button onClick={() => setCurrentView('admin')} className="p-2 text-slate-500 hover:text-amber-500 transition-colors"><Settings size={20} /></button>
          </div>

          <div className="flex items-center gap-4 border-l border-white/10 pl-6">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-slate-500 uppercase">Durum</p>
              <p className="text-xs font-bold text-white">{user?.isAnonymous ? 'Misafir' : 'Premium'}</p>
            </div>
            <div className="w-10 h-10 bg-slate-800 rounded-full border border-white/10 flex items-center justify-center text-amber-500 shadow-inner">
              <UserIcon size={20} />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {currentView === 'landing' && <LandingView onStart={() => setCurrentView('courses')} />}
        
        {currentView === 'courses' && (
          <CourseCatalog 
            courses={courses} 
            lessons={lessons}
            userProgress={userProgress}
            onSelect={(c) => { setSelectedCourse(c); setCurrentView('lesson'); }} 
          />
        )}

        {currentView === 'lesson' && selectedCourse && (
          <LessonInterface 
            course={selectedCourse}
            lessons={lessons.filter(l => l.courseId === selectedCourse.id)}
            userProgress={userProgress}
            onComplete={markComplete}
            onBack={() => setCurrentView('courses')}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboard 
            courses={courses} 
            lessons={lessons} 
            users={allUsers}
            appId={appId}
            db={db}
          />
        )}

        {currentView === 'profile' && (
          <ProfileView 
            user={user} 
            progress={userProgress} 
            courses={courses} 
            lessons={lessons} 
          />
        )}
      </main>
    </div>
  );
}

// --- Views ---

function LandingView({ onStart }) {
  return (
    <div className="py-20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none"></div>
      
      <div className="grid lg:grid-cols-2 gap-20 items-center relative z-10">
        <div className="space-y-10">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black text-amber-500 tracking-[0.2em] uppercase">Yeni Nesil Satranç Okulu</span>
          </div>
          <h2 className="text-7xl md:text-8xl font-black tracking-tight leading-[0.85] text-white">
            BİR <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-600 underline decoration-amber-500/30 underline-offset-8">HAMLE</span><br />
            ÖNDE OL.
          </h2>
          <p className="text-xl text-slate-400 max-w-lg leading-relaxed font-medium">
            Sadece oynamayı değil, tahtayı bir strateji mimarı gibi yönetmeyi öğrenin. Dünyanın en zeki oyununda ustalığa giden yol burada başlar.
          </p>
          <div className="flex gap-6">
            <button 
              onClick={onStart}
              className="px-10 py-5 bg-amber-500 text-slate-950 font-black rounded-2xl hover:bg-amber-400 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-amber-500/20"
            >
              EĞİTİME BAŞLA
            </button>
            <button className="px-10 py-5 bg-slate-900 text-white font-bold rounded-2xl border border-white/5 hover:bg-slate-800 transition-all">
              BİZİ TANIYIN
            </button>
          </div>
        </div>

        <div className="relative group">
           <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-transparent rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
           <div className="relative aspect-square bg-slate-900/50 border border-white/5 rounded-[3rem] p-12 backdrop-blur-sm overflow-hidden flex items-center justify-center">
              <div className="grid grid-cols-8 gap-1 opacity-20 rotate-12 scale-150 absolute inset-0">
                {[...Array(64)].map((_, i) => (
                  <div key={i} className={`aspect-square ${((Math.floor(i/8) + i%8) % 2 === 0) ? 'bg-slate-700' : 'bg-slate-800'}`}></div>
                ))}
              </div>
              <Trophy size={160} className="text-amber-500 relative z-10 drop-shadow-[0_0_40px_rgba(245,158,11,0.4)] animate-bounce" style={{animationDuration: '3s'}} />
           </div>
        </div>
      </div>
    </div>
  );
}

function CourseCatalog({ courses, lessons, userProgress, onSelect }) {
  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <h3 className="text-4xl font-black text-white">Eğitim Kütüphanesi</h3>
          <p className="text-slate-400 font-medium">Büyükusta olma yolunda özenle hazırlanmış müfredatlar.</p>
        </div>
        <div className="flex gap-4">
          <div className="px-5 py-3 bg-slate-900 border border-white/5 rounded-2xl flex items-center gap-3">
            <BarChart3 size={18} className="text-amber-500" />
            <span className="text-sm font-bold text-slate-300">{courses.length} Aktif Kurs</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map(course => {
          const courseLessons = lessons.filter(l => l.courseId === course.id);
          const completed = courseLessons.filter(l => userProgress.completedLessons.includes(l.id)).length;
          const pct = courseLessons.length > 0 ? (completed / courseLessons.length) * 100 : 0;

          return (
            <div 
              key={course.id}
              onClick={() => onSelect(course)}
              className="group relative bg-slate-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden cursor-pointer transition-all hover:border-amber-500/40 hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-500/5"
            >
              <div className="h-52 bg-slate-800/50 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="text-7xl group-hover:scale-125 transition-transform duration-700">{course.icon || '♟️'}</span>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                  <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] font-black text-amber-500 tracking-widest uppercase">
                    {course.level || 'TEMEL'}
                  </span>
                  <div className="flex items-center gap-2 text-slate-500">
                    <BookOpen size={14} />
                    <span className="text-xs font-bold">{courseLessons.length} Bölüm</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-2xl font-black text-white group-hover:text-amber-500 transition-colors mb-2">{course.title}</h4>
                  <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">{course.description}</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <span>Tamamlanma</span>
                    <span className="text-amber-500">%{Math.round(pct)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 transition-all duration-700" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LessonInterface({ course, lessons, userProgress, onComplete, onBack }) {
  const [activeLesson, setActiveLesson] = useState(lessons[0] || null);
  const [mode, setMode] = useState('video'); // video, puzzle
  const [isSolved, setIsSolved] = useState(false);

  useEffect(() => {
    if (lessons.length > 0 && !activeLesson) setActiveLesson(lessons[0]);
  }, [lessons]);

  if (!activeLesson) return <div className="text-center py-20 opacity-40">Ders yükleniyor...</div>;

  return (
    <div className="grid lg:grid-cols-12 gap-10">
      <div className="lg:col-span-3 space-y-6">
        <button onClick={onBack} className="flex items-center gap-3 text-xs font-black text-slate-500 hover:text-amber-500 transition-colors uppercase tracking-[0.2em]">
          <ArrowLeft size={16} /> Listeye Dön
        </button>
        <div className="bg-slate-900/60 border border-white/5 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl">
          <div className="p-6 border-b border-white/5 bg-white/5">
            <h5 className="font-black text-xs text-amber-500 uppercase tracking-widest mb-1">{course.title}</h5>
            <p className="text-[10px] text-slate-500 font-bold">{lessons.length} Bölüm Hazır</p>
          </div>
          <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
            {lessons.map((lesson, idx) => {
              const active = activeLesson.id === lesson.id;
              const done = userProgress.completedLessons.includes(lesson.id);
              return (
                <button 
                  key={lesson.id}
                  onClick={() => { setActiveLesson(lesson); setIsSolved(false); setMode('video'); }}
                  className={`w-full p-5 flex items-center gap-4 transition-all border-l-4 ${active ? 'bg-amber-500/5 border-amber-500' : 'bg-transparent border-transparent hover:bg-white/5'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${done ? 'bg-green-500/20 text-green-500' : 'bg-slate-800 text-slate-500'}`}>
                    {done ? <CheckCircle size={16} /> : idx + 1}
                  </div>
                  <div className="text-left overflow-hidden">
                    <p className={`text-sm font-bold truncate ${active ? 'text-white' : 'text-slate-400'}`}>{lesson.title}</p>
                    <p className="text-[10px] text-slate-600 font-bold uppercase">{lesson.duration || '12 DK'}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="lg:col-span-9 space-y-8">
        <div className="bg-slate-900/60 border border-white/5 rounded-[3rem] p-10 backdrop-blur-md shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
            <h2 className="text-4xl font-black text-white tracking-tight">{activeLesson.title}</h2>
            <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-white/5">
              <button 
                onClick={() => setMode('video')}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl text-xs font-black transition-all ${mode === 'video' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Video size={14} /> VİDEO DERS
              </button>
              <button 
                onClick={() => setMode('puzzle')}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl text-xs font-black transition-all ${mode === 'puzzle' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Target size={14} /> UYGULAMA
              </button>
            </div>
          </div>

          {mode === 'video' ? (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
              <div className="aspect-video bg-black rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl relative group">
                {activeLesson.videoUrl ? (
                  <iframe 
                    className="w-full h-full" 
                    src={activeLesson.videoUrl.replace('watch?v=', 'embed/')} 
                    allowFullScreen
                  ></iframe>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-700 gap-4">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center animate-pulse"><Play size={40} /></div>
                    <p className="font-black text-xs tracking-widest uppercase">Eğitim Videosu Hazırlanıyor</p>
                  </div>
                )}
              </div>
              <div className="bg-white/5 p-8 rounded-3xl border border-white/5">
                <h6 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4">Eğitmen Notu</h6>
                <p className="text-lg text-slate-300 leading-relaxed font-medium">{activeLesson.content || "Ders içeriği henüz girilmemiş."}</p>
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={() => setMode('puzzle')}
                  className="px-10 py-4 bg-amber-500 text-slate-950 font-black rounded-2xl hover:scale-105 transition-all shadow-xl shadow-amber-500/20"
                >
                  TESTE GEÇ <ChevronRight size={18} className="inline ml-2" />
                </button>
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-16 items-center animate-in slide-in-from-right-8">
              <div className="space-y-8">
                <div className="p-8 bg-slate-950/50 rounded-3xl border border-white/5 space-y-4">
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-500 rounded text-[10px] font-black uppercase tracking-widest">Görev</span>
                  <h4 className="text-2xl font-bold text-white leading-snug">{activeLesson.instruction || "Beyaz oynar ve 1 hamlede mat eder."}</h4>
                </div>
                {isSolved && (
                  <div className="p-8 bg-green-500/10 border border-green-500/20 rounded-3xl animate-bounce">
                    <p className="text-green-500 font-black flex items-center gap-3 italic text-xl">
                      <Award size={24} /> KUSURSUZ HAMLE!
                    </p>
                    <button 
                      onClick={() => onComplete(activeLesson.id)}
                      className="mt-6 w-full py-4 bg-green-500 text-slate-950 font-black rounded-2xl shadow-lg shadow-green-500/20"
                    >
                      BÖLÜMÜ TAMAMLA
                    </button>
                  </div>
                )}
              </div>
              <div>
                <ChessBoard fen={activeLesson.fen} onMove={() => setIsSolved(true)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChessBoard({ fen = 'start', onMove }) {
  const boardId = useRef(`board-${Math.random().toString(36).substr(2, 9)}`);
  
  useEffect(() => {
    const init = async () => {
      await loadScript("https://code.jquery.com/jquery-3.5.1.min.js");
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/chessboard-js/1.0.0/chessboard-1.0.0.min.js");
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js");
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/chessboard-js/1.0.0/chessboard-1.0.0.min.css";
      document.head.appendChild(link);

      const game = new window.Chess(fen === 'start' ? undefined : fen);
      const board = window.Chessboard(boardId.current, {
        draggable: true,
        position: fen,
        onDrop: (source, target) => {
          const move = game.move({ from: source, to: target, promotion: 'q' });
          if (move === null) return 'snapback';
          if (onMove) onMove();
        }
      });
      window.addEventListener('resize', () => board.resize());
    };
    init();
  }, [fen]);

  return (
    <div className="w-full max-w-[450px] mx-auto p-4 bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl">
      <div id={boardId.current} className="w-full border-4 border-slate-950 rounded-lg overflow-hidden"></div>
    </div>
  );
}

function AdminDashboard({ courses, lessons, users, appId, db }) {
  const [tab, setTab] = useState('courses');
  const [isAdding, setIsAdding] = useState(false);

  const addCourse = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'courses'), {
      title: fd.get('title'),
      description: fd.get('description'),
      level: fd.get('level'),
      icon: fd.get('icon') || '♟️',
      createdAt: new Date().toISOString()
    });
    setIsAdding(false);
  };

  const deleteItem = async (coll, id) => {
    if (window.confirm('Bu içeriği kalıcı olarak silmek istediğinize emin misiniz?')) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', coll, id));
    }
  };

  return (
    <div className="bg-slate-900/60 border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-md shadow-2xl">
      <div className="flex border-b border-white/5 bg-white/5 overflow-x-auto">
        {[
          { id: 'courses', label: 'Kurs Yönetimi', icon: <BookOpen size={16} /> },
          { id: 'lessons', label: 'Bölüm Editörü', icon: <Video size={16} /> },
          { id: 'users', label: 'Kullanıcı Listesi', icon: <Users size={16} /> }
        ].map(t => (
          <button 
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-10 py-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${tab === t.id ? 'bg-amber-500 text-slate-950' : 'text-slate-500 hover:text-slate-300'}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="p-10 min-h-[500px]">
        {tab === 'courses' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h4 className="text-xl font-bold text-white">Aktif Kurslar</h4>
              <button 
                onClick={() => setIsAdding(!isAdding)}
                className="flex items-center gap-2 px-6 py-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl font-black text-[10px] tracking-widest uppercase"
              >
                <Plus size={16} /> YENİ KURS EKLE
              </button>
            </div>

            {isAdding && (
              <form onSubmit={addCourse} className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-slate-950 rounded-3xl border border-white/10 animate-in slide-in-from-top-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Kurs Adı</label>
                  <input name="title" className="w-full p-4 bg-slate-900 border border-white/5 rounded-2xl outline-none focus:border-amber-500 transition-colors" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2">İkon (Emoji)</label>
                  <input name="icon" placeholder="🏆" className="w-full p-4 bg-slate-900 border border-white/5 rounded-2xl outline-none focus:border-amber-500 transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Zorluk Seviyesi</label>
                  <select name="level" className="w-full p-4 bg-slate-900 border border-white/5 rounded-2xl outline-none focus:border-amber-500 transition-colors">
                    <option value="BAŞLANGIÇ">Başlangıç</option>
                    <option value="ORTA">Orta Seviye</option>
                    <option value="İLERİ">Büyükusta Hazırlık</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Açıklama</label>
                  <input name="description" className="w-full p-4 bg-slate-900 border border-white/5 rounded-2xl outline-none focus:border-amber-500 transition-colors" required />
                </div>
                <button type="submit" className="md:col-span-2 py-4 bg-amber-500 text-slate-950 font-black rounded-2xl shadow-xl shadow-amber-500/20 mt-4">KURS EKLE</button>
              </form>
            )}

            <div className="grid gap-4">
              {courses.map(c => (
                <div key={c.id} className="p-6 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group">
                  <div className="flex items-center gap-6">
                    <span className="text-3xl">{c.icon}</span>
                    <div>
                      <h6 className="font-bold text-white">{c.title}</h6>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">{c.level}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => deleteItem('courses', c.id)} className="p-3 text-slate-500 hover:text-red-500 bg-slate-900 rounded-xl transition-colors"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'lessons' && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-4">
            <Video size={48} className="opacity-20" />
            <p className="text-sm font-medium italic">Bölüm Editörü modülü: Mevcut kurslara video ve FEN dizimlerini atamak için kullanılır.</p>
          </div>
        )}

        {tab === 'users' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map(u => (
              <div key={u.id} className="p-6 bg-white/5 border border-white/5 rounded-3xl flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center text-amber-500 border border-white/5">
                  <UserIcon size={24} />
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] font-mono text-slate-500 truncate mb-1">{u.uid}</p>
                  <p className="text-xs font-black text-amber-500 uppercase tracking-widest">
                    {u.isAnonymous ? 'Deneme Hesabı' : 'Kayıtlı Oyuncu'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileView({ user, progress, courses, lessons }) {
  const completed = progress.completedLessons.length;
  const total = lessons.length;
  const pct = total > 0 ? (completed / total) * 100 : 0;
  
  const rank = useMemo(() => {
    if (completed > 20) return "Grandmaster";
    if (completed > 10) return "International Master";
    if (completed > 5) return "Candidate Master";
    return "Pawn";
  }, [completed]);

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="relative p-12 bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-[3rem] overflow-hidden flex flex-col md:flex-row items-center gap-12 shadow-2xl shadow-amber-500/5">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12">
          <Trophy size={300} />
        </div>
        
        <div className="relative">
          <div className="w-40 h-40 bg-amber-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-amber-500/30">
            <UserIcon size={80} className="text-slate-950" />
          </div>
          <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-slate-950 border-4 border-amber-500 rounded-2xl flex items-center justify-center text-amber-500 shadow-xl">
            <Award size={24} />
          </div>
        </div>

        <div className="text-center md:text-left space-y-4">
          <h2 className="text-5xl font-black text-white tracking-tighter uppercase">{rank}</h2>
          <p className="text-slate-500 font-mono text-sm tracking-widest">{user?.uid}</p>
          
          <div className="flex flex-wrap gap-4 pt-4 justify-center md:justify-start">
             <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/5 backdrop-blur-md">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Dersler</span>
                <span className="text-2xl font-black text-amber-500">{completed} / {total}</span>
             </div>
             <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/5 backdrop-blur-md">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Gelişim</span>
                <span className="text-2xl font-black text-amber-500">%{Math.round(pct)}</span>
             </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
         <div className="bg-slate-900/60 border border-white/5 p-10 rounded-[2.5rem] backdrop-blur-md">
            <h4 className="text-xl font-black text-white mb-8 flex items-center gap-3">
               <ShieldCheck size={24} className="text-amber-500" /> BAŞARI ROZETLERİ
            </h4>
            <div className="grid grid-cols-4 gap-6">
               {[1,2,3,4,5,6,7,8].map(i => {
                 const unlocked = (completed / 2) >= i;
                 return (
                   <div key={i} className={`aspect-square rounded-2xl flex items-center justify-center border transition-all duration-500 ${unlocked ? 'bg-amber-500/20 border-amber-500/40 text-amber-500 shadow-lg shadow-amber-500/10 scale-110' : 'bg-slate-950 border-white/5 text-slate-800'}`}>
                      <Trophy size={20} />
                   </div>
                 );
               })}
            </div>
         </div>
         
         <div className="bg-slate-900/60 border border-white/5 p-10 rounded-[2.5rem] backdrop-blur-md">
            <h4 className="text-xl font-black text-white mb-8 flex items-center gap-3">
               <LayoutDashboard size={24} className="text-amber-500" /> SON ETKİNLİK
            </h4>
            <div className="space-y-4">
               {progress.completedLessons.slice(-4).reverse().map(id => {
                 const lesson = lessons.find(l => l.id === id);
                 return (
                   <div key={id} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="w-10 h-10 bg-green-500/20 text-green-500 rounded-xl flex items-center justify-center"><CheckCircle size={20} /></div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-white truncate">{lesson?.title || 'Bilinmeyen Ders'}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Tamamlandı</p>
                      </div>
                   </div>
                 );
               })}
               {completed === 0 && (
                 <div className="py-10 text-center opacity-30 italic font-medium">Henüz bir hamle yapmadınız. Maceraya bugün başlayın!</div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}

```
