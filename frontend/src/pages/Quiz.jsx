import { useState, useEffect } from 'react';
import { Trophy, Timer, Target, ArrowRight, CheckCircle, XCircle, BookOpen, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { aiAPI, quizAPI, coursesAPI } from '../services/api';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

export default function Quiz() {
  const { user, updateUser } = useAuthStore();
  const [step, setStep] = useState('select'); // select, loading, quiz, results
  const [matieres, setMatieres] = useState([]);
  const [selectedMatiere, setSelectedMatiere] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [canRetry, setCanRetry] = useState(null);

  useEffect(() => {
    fetchMatieres();
  }, []);

  useEffect(() => {
    let timer;
    if (step === 'quiz' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const fetchMatieres = async () => {
    try {
      setLoading(true);
      const response = await coursesAPI.getMatieresByFiliere(user?.filiere);
      setMatieres(response.data || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des matières');
    } finally {
      setLoading(false);
    }
  };

  const checkRetryStatus = async (matiere) => {
    try {
      const response = await quizAPI.canRetry(matiere);
      setCanRetry(response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur:', error);
      return null;
    }
  };

  const handleSelectMatiere = async (matiere) => {
    const matiereNom = matiere.nom || matiere;
    setSelectedMatiere(matiereNom);
    
    // Vérifier si retente possible
    const retryStatus = await checkRetryStatus(matiereNom);
    
    if (retryStatus && !retryStatus.can_retry) {
      toast.error(retryStatus.reason);
      return;
    }

    // Déterminer le nombre de questions
    const nombreQuestions = retryStatus?.is_first_attempt ? 15 : 10;
    
    if (!retryStatus?.is_first_attempt) {
      toast('Deuxième tentative : 10 questions, points divisés par 2', {
        icon: '⚠️',
        duration: 5000,
      });
    }

    setLoading(true);
    setStep('loading');

    try {
      // Générer le quiz avec l'IA
      const coursResponse = await coursesAPI.getByMatiere(matiereNom);
      const cours = coursResponse.data[0];
      
      const contenuCours = cours 
        ? `${cours.titre}\n\n${cours.description}\n\nCe cours couvre les aspects fondamentaux de la matière.`
        : `${matiereNom} - Ce cours couvre les aspects fondamentaux de la matière.`;
      
      const response = await aiAPI.generateQuiz(matiereNom, contenuCours, nombreQuestions);
      
      setQuizData({
        matiere: matiereNom,
        questions: response.data.quiz.questions,
        tentative_numero: retryStatus?.is_first_attempt ? 1 : 2,
      });
      
      setCurrentQuestion(0);
      setAnswers([]);
      setSelectedAnswer(null);
      setStartTime(Date.now());
      setTimeLeft(nombreQuestions * 60); // 1 minute par question
      setStep('quiz');
      
      toast.success('Quiz généré ! Bonne chance 🍀');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la génération du quiz');
      setStep('select');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (index) => {
    setSelectedAnswer(index);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) {
      toast.error('Veuillez sélectionner une réponse');
      return;
    }

    const isCorrect = selectedAnswer === quizData.questions[currentQuestion].correct_answer;
    
    setAnswers([...answers, {
      question: quizData.questions[currentQuestion].question,
      user_answer: selectedAnswer,
      correct_answer: quizData.questions[currentQuestion].correct_answer,
      correct: isCorrect,
      explication: quizData.questions[currentQuestion].explication,
      partie_cours: quizData.questions[currentQuestion].partie_cours,
    }]);

    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      // Fin du quiz
      handleFinishQuiz();
    }
  };

  const handleFinishQuiz = async () => {
    const tempsEcoule = Math.floor((Date.now() - startTime) / 1000);
    const score = answers.filter(a => a.correct).length + (selectedAnswer === quizData.questions[currentQuestion].correct_answer ? 1 : 0);
    
    // Ajouter la dernière réponse
    const finalAnswers = [...answers, {
      question: quizData.questions[currentQuestion].question,
      user_answer: selectedAnswer,
      correct_answer: quizData.questions[currentQuestion].correct_answer,
      correct: selectedAnswer === quizData.questions[currentQuestion].correct_answer,
      explication: quizData.questions[currentQuestion].explication,
      partie_cours: quizData.questions[currentQuestion].partie_cours,
    }];

    try {
      const response = await quizAPI.submit({
        matiere: quizData.matiere,
        score,
        total_questions: quizData.questions.length,
        temps_ecoule: tempsEcoule,
        tentative_numero: quizData.tentative_numero,
        questions_data: finalAnswers,
      });

      // Mettre à jour l'utilisateur
      updateUser({
        points_exp: response.data.nouveau_total_points,
        niveau: response.data.niveau,
      });

      // Animation confetti si passage de niveau
      if (response.data.niveau_up) {
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.6 }
        });
        
        setTimeout(() => {
          toast.success(`🎉 Tu déchires ! Tu es au niveau ${response.data.niveau} !`, {
            duration: 5000,
          });
        }, 500);
      }

      setQuizData({
        ...quizData,
        results: {
          score,
          total: quizData.questions.length,
          percentage: Math.round((score / quizData.questions.length) * 100),
          temps_ecoule: tempsEcoule,
          points_gagnes: response.data.points_gagnes,
          points_perdus: response.data.points_perdus,
          net_points: response.data.net_points,
          niveau_up: response.data.niveau_up,
          nouveau_niveau: response.data.niveau,
          answers: finalAnswers,
        }
      });

      setStep('results');
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la soumission du quiz');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = quizData ? ((currentQuestion + 1) / quizData.questions.length) * 100 : 0;

  // Écran de sélection de matière
  if (step === 'select') {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Quiz - Teste tes connaissances</h1>
          <p className="text-gray-400">
            Choisis une matière pour commencer
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-accent"></div>
          </div>
        ) : matieres.length === 0 ? (
          <div className="card text-center py-12">
            <BookOpen size={64} className="mx-auto text-gray-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucune matière disponible</h3>
            <p className="text-gray-400">
              Les matières pour ta filière ({user?.filiere}) ne sont pas encore disponibles.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matieres.map((matiere, index) => (
              <button
                key={matiere.id || matiere.nom || index}
                onClick={() => handleSelectMatiere(matiere)}
                className="card hover:scale-105 transition-all text-left"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Trophy size={40} className="text-accent mb-4" />
                <h3 className="text-xl font-semibold mb-2">{matiere.nom || matiere}</h3>
                <p className="text-gray-400 text-sm mb-4">
                  {matiere.description || 'Première tentative : 15 questions'}
                </p>
                <div className="flex items-center gap-2 text-sm text-accent">
                  <span>Commencer</span>
                  <ArrowRight size={16} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Écran de chargement
  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fadeIn">
        <div className="card max-w-md text-center">
          <Sparkles size={64} className="mx-auto text-accent mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold mb-4">L'IA génère ton quiz...</h2>
          <p className="text-gray-400 mb-6">
            Création de questions personnalisées basées sur le cours de {selectedMatiere}
          </p>
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-accent mx-auto"></div>
        </div>
      </div>
    );
  }

  // Écran de quiz
  if (step === 'quiz' && quizData) {
    const question = quizData.questions[currentQuestion];
    const isLastQuestion = currentQuestion === quizData.questions.length - 1;
    const isBonusQuestion = quizData.tentative_numero === 1 && isLastQuestion;

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
        {/* En-tête */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{quizData.matiere}</h2>
            <div className={`badge ${timeLeft < 60 ? 'bg-error' : ''}`}>
              <Timer size={20} />
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Barre de progression */}
          <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-accent to-purple h-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="flex justify-between mt-2 text-sm text-gray-400">
            <span>Question {currentQuestion + 1} / {quizData.questions.length}</span>
            <span>{Math.round(progress)}% complété</span>
          </div>
        </div>

        {/* Question */}
        <div className="card">
          {isBonusQuestion && (
            <div className="mb-4 p-4 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/30 rounded-xl">
              <p className="text-center font-bold text-orange-400">
                🌟 QUESTION BONUS - 200 POINTS ! 🌟
              </p>
            </div>
          )}

          <h3 className="text-xl font-semibold mb-6">{question.question}</h3>

          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  selectedAnswer === index
                    ? 'bg-accent text-white shadow-lg scale-105'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    selectedAnswer === index ? 'bg-white text-accent' : 'bg-white/10'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={handleNextQuestion}
              disabled={selectedAnswer === null}
              className="btn btn-primary w-full"
            >
              {isLastQuestion ? 'Terminer le quiz' : 'Question suivante'}
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Écran de résultats
  if (step === 'results' && quizData?.results) {
    const { results } = quizData;
    
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
        {/* En-tête des résultats */}
        <div className="card text-center">
          {results.niveau_up && (
            <div className="mb-6 p-6 bg-gradient-to-r from-accent/20 to-purple/20 border border-accent/30 rounded-xl">
              <h2 className="text-3xl font-bold mb-2">🎉 Tu déchires !</h2>
              <p className="text-xl">Tu es au niveau {results.nouveau_niveau} !</p>
            </div>
          )}

          <Trophy size={80} className="mx-auto text-accent mb-4" />
          <h2 className="text-4xl font-bold mb-2">
            {results.score} / {results.total}
          </h2>
          <p className="text-2xl text-gray-400 mb-4">{results.percentage}%</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="card bg-white/5">
              <p className="text-sm text-gray-400">Points gagnés</p>
              <p className="text-2xl font-bold text-success">+{results.points_gagnes}</p>
            </div>
            <div className="card bg-white/5">
              <p className="text-sm text-gray-400">Points perdus</p>
              <p className="text-2xl font-bold text-error">-{results.points_perdus}</p>
            </div>
            <div className="card bg-white/5">
              <p className="text-sm text-gray-400">Temps écoulé</p>
              <p className="text-2xl font-bold">{formatTime(results.temps_ecoule)}</p>
            </div>
          </div>
        </div>

        {/* Détail des réponses */}
        <div className="card">
          <h3 className="text-2xl font-bold mb-6">Détail des réponses</h3>
          
          <div className="space-y-4">
            {results.answers.map((answer, index) => (
              <div
                key={index}
                className={`card ${
                  answer.correct
                    ? 'bg-success/10 border-success/30'
                    : 'bg-error/10 border-error/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  {answer.correct ? (
                    <CheckCircle className="text-success flex-shrink-0" size={24} />
                  ) : (
                    <XCircle className="text-error flex-shrink-0" size={24} />
                  )}
                  
                  <div className="flex-1">
                    <p className="font-semibold mb-2">
                      Question {index + 1} : {answer.question}
                    </p>
                    
                    {!answer.correct && (
                      <p className="text-sm text-error mb-2">
                        ❌ Ta réponse : {quizData.questions[index].options[answer.user_answer]}
                      </p>
                    )}
                    
                    <p className="text-sm text-success mb-2">
                      ✅ Bonne réponse : {quizData.questions[index].options[answer.correct_answer]}
                    </p>
                    
                    <div className="mt-3 p-3 bg-white/5 rounded-lg">
                      <p className="text-sm text-gray-300">
                        <strong>Explication :</strong> {answer.explication}
                      </p>
                      {answer.partie_cours && (
                        <p className="text-xs text-gray-400 mt-2">
                          📚 Partie du cours : {answer.partie_cours}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => {
              setStep('select');
              setQuizData(null);
              setSelectedMatiere(null);
            }}
            className="btn btn-secondary flex-1"
          >
            <BookOpen size={20} />
            Choisir une autre matière
          </button>
          
          {canRetry?.can_retry && results.percentage < 50 && (
            <button
              onClick={() => handleSelectMatiere(quizData.matiere)}
              className="btn btn-primary flex-1"
            >
              <Target size={20} />
              Retenter (dernière chance)
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
