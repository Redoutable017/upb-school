import { useState, useEffect } from 'react';
import { BookOpen, Download, FileText, Search, Filter } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { coursesAPI, aiAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Courses() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState([]);
  const [matieres, setMatieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMatiere, setSelectedMatiere] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showAIExplanation, setShowAIExplanation] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchMatieres();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await coursesAPI.getAll(user?.filiere);
      setCourses(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des cours');
    } finally {
      setLoading(false);
    }
  };

  const fetchMatieres = async () => {
    try {
      const response = await coursesAPI.getMatieresByFiliere(user?.filiere, user?.niveau_etude);
      setMatieres(response.data);
    } catch (error) {
      console.error('Erreur chargement matières:', error);
    }
  };

  const handleDownload = (type, course) => {
    const file = course[`fichier_${type}`];
    if (file) {
      // Simuler le téléchargement (en production, remplacer par le vrai lien)
      toast.success(`Téléchargement de ${type.toUpperCase()} - ${course.titre}`);
      // window.open(file, '_blank');
    } else {
      toast.error(`${type.toUpperCase()} non disponible pour ce cours`);
    }
  };

  const handleAIExplanation = async () => {
    if (!aiQuestion.trim()) {
      toast.error('Veuillez poser une question');
      return;
    }

    setAiLoading(true);
    try {
      const response = await aiAPI.explain(
        selectedCourse.matiere,
        selectedCourse.titre,
        aiQuestion
      );
      setAiResponse(response.data.explication);
    } catch (error) {
      toast.error('Erreur lors de la demande à l\'IA');
    } finally {
      setAiLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchSearch = course.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       course.matiere.toLowerCase().includes(searchTerm.toLowerCase());
    const matchMatiere = !selectedMatiere || course.matiere === selectedMatiere;
    return matchSearch && matchMatiere;
  });

  const getMatiereColor = (matiere) => {
    const colors = {
      'TEEO': 'from-blue-500 to-cyan-500',
      'ANALYSE': 'from-purple-500 to-pink-500',
      'ANGLAIS': 'from-orange-500 to-yellow-500',
      'ARCHITECTURE': 'from-green-500 to-teal-500',
      'ALGORITHME': 'from-indigo-500 to-purple-500',
      'ALGEBRE': 'from-pink-500 to-rose-500',
      'MERISE': 'from-cyan-500 to-blue-500',
      'MICRO ECONOMIE': 'from-yellow-500 to-orange-500',
    };
    
    for (const key in colors) {
      if (matiere.includes(key)) return colors[key];
    }
    return 'from-gray-500 to-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold">Mes Cours</h1>
          <p className="text-gray-400 mt-2">
            {user?.filiere} - {user?.niveau_etude}
          </p>
        </div>
        <div className="badge text-lg">
          {filteredCourses.length} cours disponibles
        </div>
      </div>

      {/* Filtres et Recherche */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              className="input pl-12"
              placeholder="Rechercher un cours ou une matière..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtre par matière */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              className="input pl-12"
              value={selectedMatiere}
              onChange={(e) => setSelectedMatiere(e.target.value)}
            >
              <option value="">Toutes les matières</option>
              {matieres.map((matiere) => (
                <option key={matiere.code} value={matiere.nom}>
                  {matiere.nom} {matiere.has_tp ? '(avec TP)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Liste des cours */}
      {selectedCourse ? (
        // Vue détaillée du cours
        <div className="space-y-6">
          <button
            onClick={() => setSelectedCourse(null)}
            className="btn btn-secondary"
          >
            ← Retour à la liste
          </button>

          <div className="card">
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-16 h-16 bg-gradient-to-br ${getMatiereColor(selectedCourse.matiere)} rounded-2xl flex items-center justify-center text-white font-bold text-2xl`}>
                {selectedCourse.matiere.charAt(0)}
              </div>
              <div>
                <h2 className="text-3xl font-bold">{selectedCourse.titre}</h2>
                <p className="text-gray-400">{selectedCourse.matiere}</p>
              </div>
            </div>

            <p className="text-gray-300 mb-6">{selectedCourse.description}</p>

            {/* Boutons de téléchargement */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <button
                onClick={() => handleDownload('cours', selectedCourse)}
                className="card hover:scale-105 transition-transform cursor-pointer"
              >
                <FileText size={40} className="text-blue-400 mb-3" />
                <h3 className="font-semibold mb-1">Cours</h3>
                <p className="text-sm text-gray-400">Document principal</p>
                <div className="mt-3">
                  <span className="btn btn-primary w-full">
                    <Download size={18} />
                    Télécharger
                  </span>
                </div>
              </button>

              <button
                onClick={() => handleDownload('td', selectedCourse)}
                className="card hover:scale-105 transition-transform cursor-pointer"
              >
                <FileText size={40} className="text-purple-400 mb-3" />
                <h3 className="font-semibold mb-1">TD</h3>
                <p className="text-sm text-gray-400">Travaux dirigés</p>
                <div className="mt-3">
                  <span className="btn btn-primary w-full">
                    <Download size={18} />
                    Télécharger
                  </span>
                </div>
              </button>

              <button
                onClick={() => handleDownload('tp', selectedCourse)}
                className="card hover:scale-105 transition-transform cursor-pointer"
              >
                <FileText size={40} className="text-green-400 mb-3" />
                <h3 className="font-semibold mb-1">TP</h3>
                <p className="text-sm text-gray-400">Travaux pratiques</p>
                <div className="mt-3">
                  <span className="btn btn-primary w-full">
                    <Download size={18} />
                    Télécharger
                  </span>
                </div>
              </button>
            </div>

            {/* Section IA */}
            <div className="card bg-gradient-to-br from-accent/10 to-purple/10 border-accent/30">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                🤖 Poser une question à l'IA
              </h3>
              
              <div className="space-y-4">
                <textarea
                  className="input min-h-[100px]"
                  placeholder="Posez votre question sur ce cours..."
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                />

                <button
                  onClick={handleAIExplanation}
                  disabled={aiLoading}
                  className="btn btn-primary w-full"
                >
                  {aiLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                      L'IA réfléchit...
                    </>
                  ) : (
                    <>
                      <BookOpen size={20} />
                      Demander à l'IA
                    </>
                  )}
                </button>

                {aiResponse && (
                  <div className="card bg-white/5">
                    <h4 className="font-semibold mb-2 text-accent">Réponse de l'IA :</h4>
                    <p className="whitespace-pre-wrap text-gray-200">{aiResponse}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Liste des cours
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
              <div
                key={course.id}
                onClick={() => setSelectedCourse(course)}
                className="card hover:scale-105 transition-all cursor-pointer"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${getMatiereColor(course.matiere)} rounded-xl flex items-center justify-center text-white font-bold text-lg mb-4`}>
                  {course.matiere.charAt(0)}
                </div>
                
                <h3 className="text-xl font-semibold mb-2">{course.titre}</h3>
                <p className="text-accent text-sm font-semibold mb-2">{course.matiere}</p>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {course.description}
                </p>

                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">Cours</span>
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">TD</span>
                  {course.fichier_tp && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">TP</span>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-white/10">
                  <span className="text-sm text-gray-400">
                    Cliquez pour voir les détails
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full card text-center py-12">
              <BookOpen size={64} className="mx-auto text-gray-600 mb-4" />
              <p className="text-xl text-gray-400">Aucun cours trouvé</p>
              <p className="text-gray-500 mt-2">
                Essayez de modifier vos filtres de recherche
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
