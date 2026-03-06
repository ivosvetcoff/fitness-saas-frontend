import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView,
  Platform, ScrollView, LayoutAnimation, UIManager, Image, Linking
} from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import {
  Play, CheckCircle2, Trophy, Dumbbell, Activity,
  ChevronDown, ChevronUp, Camera, Home, User,
  TrendingUp, ChevronLeft, Utensils, Flame, Calendar,
  Zap, Target
} from 'lucide-react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// API BASE URL - Cambiado a la IP de la computadora para probar desde el celular
const BACKEND_URL = 'http://192.168.100.8:8000';

// Mapa de imágenes de ejercicios (nombre exacto de la DB → asset local)
const EXERCISE_IMAGES = {
  // === Plan real de Ivo (Team Pato – 5 Días) ===
  // DÍA 1
  'Vuelos Laterales Sentado': require('./assets/exercises/vuelos_laterales.png'),
  'Press Banco Plano con Barra': require('./assets/exercises/press_de_banca.png'),
  'Press Inclinado en Smith': require('./assets/exercises/press_smith_inclinado.png'),
  'Pec Deck (Mariposa)': require('./assets/exercises/pec_deck.png'),
  'Curl en Banco Scott': require('./assets/exercises/curl_scott.png'),
  'Curl Bayesiano en Polea': require('./assets/exercises/curl_bayesiano.png'),
  'Elevaciones Colgado': require('./assets/exercises/elevaciones_colgado.png'),
  // DÍA 2
  'Curl Femoral': require('./assets/exercises/curl_femoral.png'),
  'Peso Muerto con Barra': require('./assets/exercises/peso_muerto.png'),
  'Sentadilla Sumo en Máquina': require('./assets/exercises/sentadilla_sumo.png'),
  'Sentadilla Búlgara': require('./assets/exercises/sentadilla_bulgara.png'),
  'Extensión de Cuádriceps': require('./assets/exercises/extension_cuadriceps.png'),
  'Pantorrillas Sentado': require('./assets/exercises/pantorrillas_sentado.png'),
  'Crunch en Polea': require('./assets/exercises/crunch_polea.png'),
  // DÍA 3
  'Pullover con Cuerda en Polea': require('./assets/exercises/pullover_polea.png'),
  'Hammer Alto Unilateral': require('./assets/exercises/hammer_alto.png'),
  'Remo T-Bar Agarre Abierto': require('./assets/exercises/remo_tbar.png'),
  'Posteriores en Mariposa': require('./assets/exercises/posteriores_mariposa.png'),
  'Vuelos Laterales en Máquina': require('./assets/exercises/vuelos_laterales_maquina.png'),
  'Empuje de Tríceps': require('./assets/exercises/empuje_triceps.png'),
  'Press Francés': require('./assets/exercises/press_frances.png'),
  // DÍA 4
  'Aductores en Máquina': require('./assets/exercises/sentadilla_sumo.png'),
  'Sentadilla en Smith': require('./assets/exercises/press_smith_inclinado.png'),
  'Prensa de Piernas': require('./assets/exercises/prensa_piernas.png'),
  'Estocada Caminando': require('./assets/exercises/sentadilla_bulgara.png'),
  'Pantorrillas de Pie': require('./assets/exercises/pantorrillas_sentado.png'),
  // DÍA 5
  'Vuelos Laterales en Polea': require('./assets/exercises/vuelos_laterales.png'),
  'Press Militar en Smith': require('./assets/exercises/press_militar.png'),
  'Posteriores en Cable': require('./assets/exercises/posteriores_mariposa.png'),
  'Banco Plano con Mancuernas': require('./assets/exercises/press_de_banca.png'),
  'Cruces de Polea': require('./assets/exercises/pec_deck.png'),
  'Martillo Alternado': require('./assets/exercises/curl_biceps.png'),
  'Extensiones con Cuerda': require('./assets/exercises/extension_triceps.png'),
  'Fondos Libres': require('./assets/exercises/extension_triceps.png'),
  'Banco Inclinado Crunch': require('./assets/exercises/crunch_polea.png'),
  'Rodilla al Pecho': require('./assets/exercises/elevaciones_colgado.png'),
  // === Legacy (compatibilidad con ejercicios anteriores) ===
  'Sentadilla con Barra': require('./assets/exercises/sentadilla_con_barra.png'),
  'Press de Banca': require('./assets/exercises/press_de_banca.png'),
  'Peso Muerto Convencional': require('./assets/exercises/peso_muerto.png'),
  'Press Militar': require('./assets/exercises/press_militar.png'),
  'Remo con Barra': require('./assets/exercises/remo_con_barra.png'),
  'Dominadas': require('./assets/exercises/dominadas.png'),
  'Curl de Bíceps': require('./assets/exercises/curl_biceps.png'),
  'Extensión de Tríceps': require('./assets/exercises/extension_triceps.png'),
  'Hip Thrust': require('./assets/exercises/hip_thrust.png'),
  'Face Pull': require('./assets/exercises/face_pull.png'),
  'Press Inclinado con Mancuernas': require('./assets/exercises/press_inclinado.png'),
  'Peso Muerto Rumano': require('./assets/exercises/peso_muerto_rumano.png'),
};

// Mapeo temporal para esquemas de repeticiones específicos
const CUSTOM_REP_SCHEMES = {
  'Vuelos Laterales Sentado': '20-15-12-10',
  'Press Banco Plano con Barra': '12-10-8-8',
  'Pec Deck (Mariposa)': '15-12-10-10',
  'Curl en Banco Scott': '15-12-10-8',
  'Sentadilla Sumo en Máquina': '20-15-12-10',
  'Prensa de Piernas': '20-15-12-10',
  'Empuje de Tríceps': '15-12-10-8',
};

// Componente Timer Aislado para evitar re-renders de toda la App
const WorkoutTimer = () => {
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [customTimerInput, setCustomTimerInput] = useState('');

  useEffect(() => {
    let interval = null;
    if (isTimerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(sec => sec - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerActive(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timerSeconds]);

  const startTimer = (secs) => {
    setTimerSeconds(secs);
    setIsTimerActive(true);
  };

  return (
    <View style={{ marginTop: 24, borderTopWidth: 1, borderColor: '#27272A', paddingTop: 20 }}>
      <Text style={[styles.label, { textAlign: 'center' }]}>Temporizador de Descanso</Text>
      {isTimerActive ? (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 48, fontWeight: '900', color: timerSeconds <= 5 && timerSeconds > 0 ? '#EF4444' : '#10B981', fontVariant: ['tabular-nums'] }}>
            {Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:{(timerSeconds % 60).toString().padStart(2, '0')}
          </Text>
          <TouchableOpacity style={{ marginTop: 12, paddingVertical: 8, paddingHorizontal: 16 }} onPress={() => setIsTimerActive(false)}>
            <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '700', textTransform: 'uppercase' }}>Detener</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
            {[30, 60, 90, 120].map(s => (
              <TouchableOpacity key={s} onPress={() => startTimer(s)} style={{ backgroundColor: '#27272A', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 }}>
                <Text style={{ color: '#FAFAFA', fontSize: 13, fontWeight: '700' }}>{s}s</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
            <TextInput
              style={{ backgroundColor: '#09090B', color: '#FAFAFA', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#3F3F46', textAlign: 'center', width: 90 }}
              placeholder="Segs" placeholderTextColor="#52525B" keyboardType="numeric"
              value={customTimerInput} onChangeText={setCustomTimerInput}
            />
            <TouchableOpacity
              style={{ backgroundColor: '#6366F1', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 }}
              onPress={() => { if (parseInt(customTimerInput) > 0) startTimer(parseInt(customTimerInput)); }}
            >
              <Text style={{ color: '#FAFAFA', fontSize: 13, fontWeight: '700' }}>Iniciar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default function App() {
  // =====================================================
  // ESTADO GLOBAL
  // =====================================================
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home' | 'workout' | 'progress' | 'nutrition' | 'profile'
  const [sessionData, setSessionData] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const STUDENT_ID = "123e4567-e89b-12d3-a456-426614174000";

  // Form states
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nextTarget, setNextTarget] = useState(null);
  const [successMode, setSuccessMode] = useState(false);

  // XP / Points system
  const [totalXp, setTotalXp] = useState(0);
  const [lastXpEarned, setLastXpEarned] = useState(0);
  const [showXpFlash, setShowXpFlash] = useState(false);
  const [rankings, setRankings] = useState([]);
  const [loadingRankings, setLoadingRankings] = useState(false);

  // Nutrition plan
  const [nutritionPlan, setNutritionPlan] = useState(null);
  const [loadingNutrition, setLoadingNutrition] = useState(false);
  const [expandedMeal, setExpandedMeal] = useState(null);

  // Day selection
  const [selectedDay, setSelectedDay] = useState(null);

  // Profile & Social
  const [profilePic, setProfilePic] = useState(null);

  // Timer
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [customTimerInput, setCustomTimerInput] = useState('');

  useEffect(() => {
    let interval = null;
    if (isTimerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(sec => sec - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerActive(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timerSeconds]);

  const startTimer = (secs) => {
    setTimerSeconds(secs);
    setIsTimerActive(true);
  };

  const handleImagePick = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfilePic(result.assets[0].uri);
    }
  };

  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // =====================================================
  // FETCH DATA
  // =====================================================
  const fetchExercises = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/student/${STUDENT_ID}/next-workout`);
      if (response.data && response.data.exercises) {
        setSessionData({
          routine_id: response.data.routine_id,
          routine_name: response.data.routine_name,
          current_day: response.data.current_day,
          total_days: response.data.total_days
        });

        // Fetch ALL exercises for this routine instead of just the next workout
        const allResp = await axios.get(`${BACKEND_URL}/routines/${response.data.routine_id}/exercises`);
        const allLoadedExercises = allResp.data.map((ex) => {
          const name = ex.exercises?.name || `Ejercicio ${ex.exercise_id.substring(0, 4)}`;
          return {
            id: ex.exercise_id,
            routine_id: ex.routine_id,
            name: name,
            muscleGroup: ex.exercises?.muscle_group || '',
            targetSets: ex.sets || 3,
            setsCompleted: 0,
            day_number: ex.day_number,
            image: EXERCISE_IMAGES[name] || null,
            repScheme: CUSTOM_REP_SCHEMES[name] || null,
          };
        });
        // Sort by day and id to stay consistent
        setExercises(allLoadedExercises.sort((a, b) => a.day_number - b.day_number));
      }
    } catch (error) {
      console.error("Error fetching exercises:", error);
    }
  };

  useEffect(() => { fetchExercises(); fetchMyPoints(); fetchNutritionPlan(); }, []);

  // Fetch student XP points
  const fetchMyPoints = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/student/${STUDENT_ID}/points`);
      setTotalXp(response.data?.total_xp || 0);
    } catch (error) {
      console.error('Error fetching points:', error);
    }
  };

  // Fetch rankings
  const fetchRankings = async () => {
    setLoadingRankings(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/rankings`);
      setRankings(response.data?.rankings || []);
    } catch (error) {
      console.error('Error fetching rankings:', error);
    } finally {
      setLoadingRankings(false);
    }
  };

  // Fetch nutrition plan
  const fetchNutritionPlan = async () => {
    setLoadingNutrition(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/student/${STUDENT_ID}/nutrition`);
      setNutritionPlan(response.data);
    } catch (error) {
      console.error('Error fetching nutrition:', error);
    } finally {
      setLoadingNutrition(false);
    }
  };

  // =====================================================
  // HANDLERS
  // =====================================================
  const toggleExpand = (id) => {
    // Bloquear expansión si el ejercicio ya completó todas sus series
    const exercise = exercises.find(ex => ex.id === id);
    if (exercise && exercise.setsCompleted >= exercise.targetSets) return;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      setWeight(''); setReps(''); setRpe(null);
      setNextTarget(null); setSuccessMode(false);
    }
  };

  const handleSave = async (exerciseId) => {
    if (!weight || !reps || !rpe) {
      Alert.alert('Faltan Datos', 'Por favor completá peso, reps y RPE.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        workout_id: sessionData?.routine_id || "unknown",
        exercise_id: exerciseId,
        set_number: (exercises.find(ex => ex.id === exerciseId)?.setsCompleted || 0) + 1,
        actual_weight: parseFloat(weight),
        actual_reps: parseInt(reps),
        actual_rpe: parseFloat(rpe)
      };
      const response = await axios.post(`${BACKEND_URL}/logs/`, payload);
      const suggestion = response.data?.next_target;
      const xpEarned = response.data?.xp_earned || 0;

      if (suggestion) {
        setNextTarget(suggestion);
      }

      // Show XP earned
      setLastXpEarned(xpEarned);
      setTotalXp(prev => prev + xpEarned);
      setShowXpFlash(true);

      setExercises(exercises.map(ex =>
        ex.id === exerciseId ? { ...ex, setsCompleted: ex.setsCompleted + 1 } : ex
      ));
      setSuccessMode(true);
      setTimeout(() => {
        setSuccessMode(false);
        setShowXpFlash(false);
        setWeight(''); setReps(''); setRpe(null); setNextTarget(null);
      }, 2500);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo guardar la serie.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // PANTALLA: HOME
  // =====================================================
  const renderHome = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}>
      {/* Header con saludo */}
      <View style={styles.homeHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greetingText}>{greeting()} 👋</Text>
          <Text style={styles.studentNameText}>Atleta</Text>
        </View>
      </View>

      {/* Banner motivacional */}
      <View style={styles.bannerCard}>
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>No hay excusas.</Text>
          <Text style={styles.bannerSubtitle}>Solo resultados.</Text>
          <Text style={styles.bannerDate}>{today.charAt(0).toUpperCase() + today.slice(1)}</Text>
        </View>
        <View style={styles.bannerIcon}>
          <Flame color="#F59E0B" size={48} />
        </View>
      </View>

      {/* Stats rápidos */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Zap color="#F59E0B" size={22} />
          <Text style={styles.statNumber}>{totalXp.toLocaleString()}</Text>
          <Text style={styles.statLabel}>XP Total</Text>
        </View>
        <View style={styles.statCard}>
          <Target color="#6366F1" size={22} />
          <Text style={styles.statNumber}>{sessionData ? `Día ${sessionData.current_day}` : '—'}</Text>
          <Text style={styles.statLabel}>Entreno</Text>
        </View>
        <View style={styles.statCard}>
          <TrendingUp color="#10B981" size={22} />
          <Text style={styles.statNumber}>{exercises.length}</Text>
          <Text style={styles.statLabel}>Ejercicios</Text>
        </View>
      </View>

      {/* TARJETA: ENTRENAMIENTO */}
      <TouchableOpacity
        style={styles.mainCard}
        activeOpacity={0.85}
        onPress={() => { setSelectedDay(null); setCurrentScreen('workout'); }}
      >
        <View style={styles.mainCardIcon}>
          <Dumbbell color="#FAFAFA" size={28} />
        </View>
        <View style={styles.mainCardContent}>
          <Text style={styles.mainCardTitle}>Entrenamiento</Text>
          <Text style={styles.mainCardSubtitle}>
            {sessionData
              ? `Día ${sessionData.current_day}: ${sessionData.routine_name}`
              : 'Sin rutina asignada'
            }
          </Text>
          <Text style={styles.mainCardMeta}>
            {exercises.length > 0
              ? `${exercises.length} ejercicios · ${exercises.reduce((a, e) => a + (e.targetSets || 3), 0)} series`
              : 'Tu profesor aún no te asignó una rutina'
            }
          </Text>
        </View>
        <ChevronDown color="#52525B" size={20} style={{ transform: [{ rotate: '-90deg' }] }} />
      </TouchableOpacity>

      {/* TARJETA: RANKING */}
      <TouchableOpacity
        style={styles.mainCard}
        activeOpacity={0.85}
        onPress={() => { fetchRankings(); setCurrentScreen('progress'); }}
      >
        <View style={[styles.mainCardIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
          <Trophy color="#F59E0B" size={28} />
        </View>
        <View style={styles.mainCardContent}>
          <Text style={styles.mainCardTitle}>Ranking</Text>
          <Text style={styles.mainCardSubtitle}>{totalXp.toLocaleString()} XP acumulados</Text>
          <Text style={styles.mainCardMeta}>Mirá tu posición entre todos los atletas</Text>
        </View>
        <ChevronDown color="#52525B" size={20} style={{ transform: [{ rotate: '-90deg' }] }} />
      </TouchableOpacity>

      {/* TARJETA: NUTRICIÓN */}
      <TouchableOpacity
        style={styles.mainCard}
        activeOpacity={0.85}
        onPress={() => setCurrentScreen('nutrition')}
      >
        <View style={[styles.mainCardIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
          <Utensils color="#10B981" size={28} />
        </View>
        <View style={styles.mainCardContent}>
          <Text style={styles.mainCardTitle}>Plan Nutricional</Text>
          <Text style={styles.mainCardSubtitle}>Recomposición corporal</Text>
          <Text style={styles.mainCardMeta}>5 comidas · suplementos · hidratación</Text>
        </View>
        <ChevronDown color="#52525B" size={20} style={{ transform: [{ rotate: '-90deg' }] }} />
      </TouchableOpacity>

    </ScrollView>
  );

  // =====================================================
  // PANTALLA: WORKOUT (ejercicios del día)
  // =====================================================
  const renderWorkoutDaysList = () => {
    const dayNames = {
      1: 'DÍA 1 – Pecho + Hombros laterales/posteriores + Bíceps',
      2: 'DÍA 2 – Piernas (isquios/glúteos) + Pantorrillas',
      3: 'DÍA 3 – Espalda + Deltoides posteriores + Tríceps',
      4: 'DÍA 4 – Piernas (cuádriceps + aductores) + Pantorrillas',
      5: 'DÍA 5 – Hombros + Pectorales + Brazos',
    };

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {sessionData ? sessionData.routine_name : 'Cargando...'}
          </Text>
          <Text style={{ color: '#A1A1AA', fontSize: 14, marginTop: 4 }}>Seleccioná el día para comenzar</Text>
        </View>

        {[1, 2, 3, 4, 5].map(day => {
          const dayExercises = exercises.filter(e => e.day_number === day);
          const exerciseCount = dayExercises.length;

          return (
            <TouchableOpacity
              key={`day-${day}`}
              style={styles.mainCard}
              activeOpacity={0.85}
              onPress={() => setSelectedDay(day)}
            >
              <View style={[styles.mainCardIcon, sessionData?.current_day === day ? { backgroundColor: 'rgba(99, 102, 241, 0.2)' } : {}]}>
                <Dumbbell color={sessionData?.current_day === day ? "#6366F1" : "#FAFAFA"} size={28} />
              </View>
              <View style={styles.mainCardContent}>
                <Text style={styles.mainCardTitle}>{dayNames[day]}</Text>
                <Text style={styles.mainCardSubtitle}>
                  {exerciseCount > 0 ? `${exerciseCount} Ejercicios asignados` : 'Libre'}
                </Text>
                {sessionData?.current_day === day && (
                  <Text style={{ color: '#6366F1', fontSize: 12, fontWeight: '700', marginTop: 4 }}>Toca hoy 🔥</Text>
                )}
              </View>
              <ChevronDown color="#52525B" size={20} style={{ transform: [{ rotate: '-90deg' }] }} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderWorkoutDayDetail = () => {
    const dayExercises = exercises.filter(e => e.day_number === selectedDay);

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}>
        {/* Back + Header */}
        <TouchableOpacity style={styles.backButton} onPress={() => setSelectedDay(null)}>
          <ChevronLeft color="#A1A1AA" size={22} />
          <Text style={styles.backText}>Volver a días</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.dateText}>Día {selectedDay}</Text>
          <Text style={styles.headerTitle}>
            {{
              1: 'Pecho + Hombros lat/post + Bíceps',
              2: 'Piernas (isquios) + Pantorrillas',
              3: 'Espalda + Deltoides post + Tríceps',
              4: 'Piernas (cuádriceps) + Pantorrillas',
              5: 'Hombros + Pectorales + Brazos'
            }[selectedDay] || sessionData?.routine_name}
          </Text>
        </View>

        {/* Ejercicios */}
        {dayExercises.map((exercise) => {
          const isExpanded = expandedId === exercise.id;
          return (
            <View key={exercise.id} style={styles.cardContainer}>
              <TouchableOpacity
                style={[styles.cardHeader, isExpanded && styles.cardHeaderExpanded]}
                activeOpacity={0.8}
                onPress={() => toggleExpand(exercise.id)}
              >
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.exerciseImageContainer}>
                    {exercise.image
                      ? <Image source={exercise.image} style={styles.exerciseImage} />
                      : <Dumbbell color="#FAFAFA" size={24} />
                    }
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.setsInfo}>
                      {exercise.setsCompleted >= exercise.targetSets
                        ? `✅ Completado (${exercise.setsCompleted}/${exercise.targetSets} sets)`
                        : exercise.setsCompleted > 0
                          ? `${exercise.setsCompleted}/${exercise.targetSets} sets completados`
                          : `${exercise.targetSets || 3} sets ${exercise.repScheme ? `(${exercise.repScheme})` : ''} · ${exercise.muscleGroup || ''}`}
                    </Text>
                  </View>
                </View>
                {exercise.setsCompleted >= exercise.targetSets
                  ? <CheckCircle2 color="#10B981" size={22} />
                  : isExpanded
                    ? <ChevronUp color="#6366F1" size={22} />
                    : <ChevronDown color="#52525B" size={22} />
                }
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.cardBody}>
                  {/* Botón de Tutorial */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row', alignItems: 'center', backgroundColor: '#27272A',
                      padding: 12, borderRadius: 12, marginBottom: 16, justifyContent: 'center',
                      borderWidth: 1, borderColor: '#3F3F46'
                    }}
                    onPress={() => Linking.openURL(`https://www.youtube.com/results?search_query=como+hacer+${encodeURIComponent(exercise.name)}+ejercicio`)}
                  >
                    <Play color="#10B981" size={18} style={{ marginRight: 8 }} />
                    <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '700', textTransform: 'uppercase' }}>Ver tutorial del ejercicio</Text>
                  </TouchableOpacity>

                  {/* Sugerencia previa */}
                  {nextTarget && (
                    <View style={styles.suggestionBox}>
                      <Trophy color="#F59E0B" size={24} />
                      <View style={{ marginLeft: 12 }}>
                        <Text style={styles.suggestionLabel}>Próximo Objetivo</Text>
                        <Text style={styles.suggestionValue}>
                          {nextTarget.suggested_weight} kg × {nextTarget.suggested_reps} reps
                        </Text>
                      </View>
                    </View>
                  )}

                  {successMode ? (
                    <View style={styles.simpleSuccess}>
                      <CheckCircle2 color="#10B981" size={64} />
                      <Text style={styles.simpleSuccessText}>¡Serie Guardada!</Text>
                      {showXpFlash && lastXpEarned > 0 && (
                        <Text style={styles.xpFlash}>+{lastXpEarned.toLocaleString()} XP</Text>
                      )}
                    </View>
                  ) : (
                    <View>
                      <View style={styles.inputRow}>
                        <View style={styles.inputWrapper}>
                          <Text style={styles.label}>Peso (kg)</Text>
                          <TextInput style={styles.input} keyboardType="numeric" placeholder="0"
                            placeholderTextColor="#52525B" value={weight} onChangeText={setWeight} />
                        </View>
                        <View style={styles.inputWrapper}>
                          <Text style={styles.label}>
                            Reps {exercise.repScheme ? `(Obj: ${exercise.repScheme.split('-')[Math.min(exercise.setsCompleted, (exercise.repScheme.split('-').length || 1) - 1)]})` : ''}
                          </Text>
                          <TextInput style={styles.input} keyboardType="numeric"
                            placeholder={exercise.repScheme ? exercise.repScheme.split('-')[Math.min(exercise.setsCompleted, (exercise.repScheme.split('-').length || 1) - 1)] : "0"}
                            placeholderTextColor="#52525B" value={reps} onChangeText={setReps} />
                        </View>
                      </View>

                      <Text style={styles.label}>¿Cómo te sentiste?</Text>
                      <View style={styles.emojiContainer}>
                        <TouchableOpacity style={[styles.emojiCard, rpe === 7 && styles.emojiFacilActive]} onPress={() => setRpe(7)}>
                          <Text style={styles.emojiIcon}>😊</Text>
                          <Text style={[styles.emojiLabel, rpe === 7 && { color: '#10B981' }]}>Fácil</Text>
                          <Text style={styles.emojiRpeHint}>RPE 7</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.emojiCard, rpe === 8 && styles.emojiModeradoActive]} onPress={() => setRpe(8)}>
                          <Text style={styles.emojiIcon}>😐</Text>
                          <Text style={[styles.emojiLabel, rpe === 8 && { color: '#3B82F6' }]}>Moderado</Text>
                          <Text style={styles.emojiRpeHint}>RPE 8</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.emojiCard, rpe === 9 && styles.emojiExigenteActive]} onPress={() => setRpe(9)}>
                          <Text style={styles.emojiIcon}>😤</Text>
                          <Text style={[styles.emojiLabel, rpe === 9 && { color: '#F59E0B' }]}>Exigente</Text>
                          <Text style={styles.emojiRpeHint}>RPE 9</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.emojiCard, rpe === 10 && styles.emojiFalloActive]} onPress={() => setRpe(10)}>
                          <Text style={styles.emojiIcon}>😵</Text>
                          <Text style={[styles.emojiLabel, rpe === 10 && { color: '#FAFAFA' }]}>Al Fallo</Text>
                          <Text style={styles.emojiRpeHint}>RPE 10</Text>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity style={styles.saveButton} onPress={() => handleSave(exercise.id)} disabled={loading}>
                        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Guardar Serie</Text>}
                      </TouchableOpacity>

                      {/* Temporizador Aislado */}
                      <WorkoutTimer />
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}

        {dayExercises.length > 0 && (
          <TouchableOpacity
            style={[styles.saveButton, styles.finishButton]}
            onPress={async () => {
              if (!sessionData) return;
              setIsFinishing(true);
              try {
                // Optionally mark day as complete in backend if hitting day logic
                await axios.post(`${BACKEND_URL}/routines/${sessionData.routine_id}/complete-day`);
                Alert.alert(
                  "¡Día Completado! 🎉",
                  "Gran trabajo. Tu progreso se ha guardado.",
                  [{ text: "Genial", onPress: () => { fetchExercises(); fetchMyPoints(); setSelectedDay(null); } }]
                );
              } catch (error) {
                console.error(error);
                Alert.alert("Error", "No se pudo finalizar la sesión.");
              } finally {
                setIsFinishing(false);
              }
            }}
            disabled={isFinishing}
          >
            {isFinishing
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.saveButtonText}>Terminar Día {selectedDay}</Text>
            }
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  };

  const renderWorkout = () => {
    if (!selectedDay) {
      return renderWorkoutDaysList();
    }
    return renderWorkoutDayDetail();
  };

  // =====================================================
  // PANTALLA: PROGRESO / RANKING
  // =====================================================
  const renderProgress = () => {
    const myRanking = rankings.find(r => r.student_id === STUDENT_ID);
    const myPosition = myRanking?.position || '—';
    const positionEmojis = ['', '🥇', '🥈', '🥉'];

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('home')}>
          <ChevronLeft color="#A1A1AA" size={22} />
          <Text style={styles.backText}>Inicio</Text>
        </TouchableOpacity>

        {/* Mi XP Hero */}
        <View style={styles.xpHeroCard}>
          <Flame color="#F59E0B" size={40} />
          <Text style={styles.xpHeroNumber}>{totalXp.toLocaleString()}</Text>
          <Text style={styles.xpHeroLabel}>XP TOTALES</Text>
          {myRanking && (
            <View style={styles.positionBadge}>
              <Text style={styles.positionBadgeText}>
                {positionEmojis[myPosition] || ''} Puesto #{myPosition}
              </Text>
            </View>
          )}
        </View>

        {/* Ranking */}
        <Text style={styles.sectionTitle}>🏆 Ranking de Atletas</Text>

        {loadingRankings ? (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <ActivityIndicator color="#6366F1" size="large" />
          </View>
        ) : rankings.length === 0 ? (
          <View style={styles.emptyRanking}>
            <Trophy color="#27272A" size={48} />
            <Text style={{ color: '#52525B', marginTop: 12, fontSize: 15, fontWeight: '600' }}>
              Aún no hay datos de ranking
            </Text>
            <Text style={{ color: '#3F3F46', marginTop: 4, fontSize: 13 }}>
              Completá series para sumar XP
            </Text>
          </View>
        ) : (
          rankings.map((r, idx) => {
            const isMe = r.student_id === STUDENT_ID;
            const emoji = positionEmojis[r.position] || `#${r.position}`;
            return (
              <View
                key={r.student_id}
                style={[
                  styles.rankingRow,
                  isMe && styles.rankingRowMe,
                  r.position === 1 && styles.rankingRowFirst
                ]}
              >
                <Text style={styles.rankingPosition}>{emoji}</Text>
                <View style={[
                  styles.rankingAvatar,
                  isMe && { borderColor: '#6366F1', borderWidth: 2 }
                ]}>
                  <Text style={styles.rankingAvatarText}>
                    {r.name?.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rankingName, isMe && { color: '#6366F1' }]}>
                    {r.name} {isMe ? '(Vos)' : ''}
                  </Text>
                  <Text style={styles.rankingSets}>{r.total_sets} series</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.rankingXp, r.position === 1 && { color: '#F59E0B' }]}>
                    {r.total_xp.toLocaleString()}
                  </Text>
                  <Text style={styles.rankingXpLabel}>XP</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    );
  };

  // =====================================================
  // PANTALLA: PERFIL
  // =====================================================
  const renderProfile = () => {
    // Generar un "feed" falso con las fotos de progreso
    const dummyFeed = Array(9).fill(null);
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}>
        {/* Top Section - Avatar and Stats */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity onPress={handleImagePick} style={{ position: 'relative' }}>
            <View style={{
              width: 90, height: 90, borderRadius: 45, backgroundColor: '#27272A',
              alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#6366F1', overflow: 'hidden'
            }}>
              {profilePic ? (
                <Image source={{ uri: profilePic }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
              ) : (
                <User color="#A1A1AA" size={40} />
              )}
            </View>
            <View style={{
              position: 'absolute', bottom: 0, right: 0, backgroundColor: '#6366F1',
              width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
              borderWidth: 2, borderColor: '#09090B'
            }}>
              <Camera color="#FAFAFA" size={14} />
            </View>
          </TouchableOpacity>

          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-evenly', marginLeft: 10 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#FAFAFA', fontSize: 18, fontWeight: '800' }}>{sessionData ? sessionData.total_days : 0}</Text>
              <Text style={{ color: '#71717A', fontSize: 12, fontWeight: '500' }}>Días</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#FAFAFA', fontSize: 18, fontWeight: '800' }}>
                {rankings.find(r => r.student_id === STUDENT_ID)?.position || '-'}
              </Text>
              <Text style={{ color: '#71717A', fontSize: 12, fontWeight: '500' }}>Puesto</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#FAFAFA', fontSize: 18, fontWeight: '800' }}>
                {totalXp > 1000 ? (totalXp / 1000).toFixed(1) + 'k' : totalXp}
              </Text>
              <Text style={{ color: '#71717A', fontSize: 12, fontWeight: '500' }}>XP</Text>
            </View>
          </View>
        </View>

        {/* Bio Section */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ color: '#FAFAFA', fontSize: 15, fontWeight: '700' }}>Atleta</Text>
          <Text style={{ color: '#D4D4D8', fontSize: 14, marginTop: 2 }}>{sessionData?.routine_name || 'Sin rutina asignada'}</Text>
          <Text style={{ color: '#A1A1AA', fontSize: 14, marginTop: 4 }}>"No hay excusas, solo resultados 🔥"</Text>
        </View>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: '#27272A', paddingVertical: 8, borderRadius: 8, alignItems: 'center' }}>
            <Text style={{ color: '#FAFAFA', fontSize: 13, fontWeight: '600' }}>Editar Perfil</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: '#6366F1', paddingVertical: 8, borderRadius: 8, alignItems: 'center' }}
            onPress={handleImagePick}
          >
            <Text style={{ color: '#FAFAFA', fontSize: 13, fontWeight: '600' }}>Subir Progreso</Text>
          </TouchableOpacity>
        </View>

        {/* Feed Icons */}
        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#27272A', marginBottom: 2 }}>
          <View style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#FAFAFA' }}>
            <Activity color="#FAFAFA" size={24} />
          </View>
          <View style={{ flex: 1, alignItems: 'center', paddingVertical: 12 }}>
            <Camera color="#52525B" size={24} />
          </View>
        </View>

        {/* Grid Feed */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2, justifyContent: 'flex-start' }}>
          {dummyFeed.map((_, i) => (
            <View key={i} style={{ width: '33%', aspectRatio: 1, backgroundColor: '#18181B', marginBottom: 2 }}>
              <View style={{ flex: 1, borderWidth: 1, borderColor: '#09090B', alignItems: 'center', justifyContent: 'center' }}>
                <Dumbbell color="#27272A" size={24} />
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    );
  };

  // =====================================================
  // PANTALLA: NUTRICIÓN
  // =====================================================
  const renderNutrition = () => {
    if (loadingNutrition || !nutritionPlan) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <ActivityIndicator color="#10B981" size="large" />
          <Text style={{ color: '#52525B', marginTop: 12 }}>Cargando plan nutricional...</Text>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('home')}>
          <ChevronLeft color="#A1A1AA" size={22} />
          <Text style={styles.backText}>Inicio</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={{ marginBottom: 24 }}>
          <Text style={styles.dateText}>TEAM PATO COACHING</Text>
          <Text style={styles.headerTitle}>Plan Nutricional</Text>
          <Text style={{ color: '#71717A', fontSize: 14, marginTop: 4 }}>🔥 Objetivo: Recomposición corporal</Text>
        </View>

        {/* Macros Card */}
        <View style={[styles.bannerCard, { borderColor: 'rgba(16, 185, 129, 0.2)' }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Objetivos Diarios</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <View style={styles.macroChip}>
                <Text style={styles.macroValue}>{nutritionPlan.objectives.calories}</Text>
                <Text style={styles.macroLabel}>Calorías</Text>
              </View>
              <View style={styles.macroChip}>
                <Text style={[styles.macroValue, { color: '#EF4444' }]}>{nutritionPlan.objectives.protein}</Text>
                <Text style={styles.macroLabel}>Proteínas</Text>
              </View>
              <View style={styles.macroChip}>
                <Text style={[styles.macroValue, { color: '#F59E0B' }]}>{nutritionPlan.objectives.carbs}</Text>
                <Text style={styles.macroLabel}>Carbos</Text>
              </View>
              <View style={styles.macroChip}>
                <Text style={[styles.macroValue, { color: '#6366F1' }]}>{nutritionPlan.objectives.fats}</Text>
                <Text style={styles.macroLabel}>Grasas</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Meals */}
        <Text style={styles.sectionTitle}>🍽 Comidas del Día</Text>
        {nutritionPlan.meals.map((meal) => {
          const isOpen = expandedMeal === meal.id;
          return (
            <View key={meal.id} style={styles.cardContainer}>
              <TouchableOpacity
                style={[styles.cardHeader, isOpen && styles.cardHeaderExpanded]}
                activeOpacity={0.8}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setExpandedMeal(isOpen ? null : meal.id);
                }}
              >
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.exerciseImageContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                    <Text style={{ fontSize: 28 }}>{meal.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exerciseName}>{meal.name}</Text>
                    <Text style={styles.setsInfo}>{meal.time} · {meal.options.length} opción{meal.options.length > 1 ? 'es' : ''}</Text>
                    {meal.note && <Text style={{ color: '#F59E0B', fontSize: 11, marginTop: 2 }}>{meal.note}</Text>}
                  </View>
                </View>
                {isOpen ? <ChevronUp color="#10B981" size={22} /> : <ChevronDown color="#52525B" size={22} />}
              </TouchableOpacity>

              {isOpen && (
                <View style={styles.cardBody}>
                  {meal.options.map((option, oidx) => (
                    <View key={oidx} style={{ marginBottom: oidx < meal.options.length - 1 ? 16 : 0 }}>
                      <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '700', marginBottom: 8 }}>{option.title}</Text>
                      {option.items.map((item, iidx) => (
                        <View key={iidx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, gap: 8 }}>
                          <Text style={{ color: '#3F3F46', fontSize: 14 }}>•</Text>
                          <Text style={{ color: '#D4D4D8', fontSize: 14, flex: 1, lineHeight: 20 }}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {/* Water */}
        <View style={[styles.bannerCard, { borderColor: 'rgba(59, 130, 246, 0.2)', marginTop: 8 }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#3B82F6', fontSize: 15, fontWeight: '800', marginBottom: 4 }}>💧 Hidratación</Text>
            <Text style={{ color: '#D4D4D8', fontSize: 14, lineHeight: 20 }}>{nutritionPlan.water}</Text>
          </View>
        </View>

        {/* Supplements */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>💊 Suplementos</Text>
        {nutritionPlan.supplements.map((supp, idx) => (
          <View key={idx} style={{
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            backgroundColor: '#18181B', borderRadius: 14, padding: 16, marginBottom: 8,
            borderWidth: 1, borderColor: '#27272A',
          }}>
            <Text style={{ color: '#FAFAFA', fontSize: 15, fontWeight: '600' }}>{supp.name}</Text>
            <Text style={{ color: '#71717A', fontSize: 13 }}>{supp.when}</Text>
          </View>
        ))}

        {/* Weekend rule */}
        <View style={[styles.bannerCard, { borderColor: 'rgba(245, 158, 11, 0.2)', marginTop: 16 }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#F59E0B', fontSize: 15, fontWeight: '800', marginBottom: 4 }}>🍕 Fin de Semana</Text>
            <Text style={{ color: '#D4D4D8', fontSize: 14, lineHeight: 20 }}>{nutritionPlan.weekend_rule}</Text>
          </View>
        </View>

        {/* Reminders */}
        <View style={[styles.bannerCard, { borderColor: 'rgba(99, 102, 241, 0.2)', marginTop: 8, marginBottom: 20 }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#6366F1', fontSize: 15, fontWeight: '800', marginBottom: 8 }}>✔ Recordá</Text>
            {nutritionPlan.reminders.map((rem, idx) => (
              <Text key={idx} style={{ color: '#D4D4D8', fontSize: 14, marginBottom: 4, lineHeight: 20 }}>↳ {rem}</Text>
            ))}
          </View>
        </View>

        {/* Portion Guide – Hand Method */}
        <Text style={styles.sectionTitle}>🤲 Guía de Porciones</Text>
        <View style={{
          backgroundColor: '#18181B', borderRadius: 14, padding: 16, marginBottom: 12,
          borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.25)',
        }}>
          <Text style={{ color: '#A1A1AA', fontSize: 13, lineHeight: 20 }}>
            Usá tu propia mano como referencia para medir porciones. Es personal, porque el tamaño de tu mano se ajusta a tu cuerpo.
          </Text>
        </View>
        {nutritionPlan.protein_portions.map((pp, idx) => {
          const catColors = {
            protein: { bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.3)', accent: '#10B981', label: 'PROTEÍNA' },
            carbs: { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.3)', accent: '#F59E0B', label: 'CARBOHIDRATO' },
            fats: { bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.3)', accent: '#3B82F6', label: 'GRASA' },
          };
          const c = catColors[pp.category] || catColors.protein;
          return (
            <View key={idx} style={{
              backgroundColor: c.bg, borderRadius: 16, padding: 16, marginBottom: 10,
              borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', gap: 14,
            }}>
              <View style={{
                width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.3)',
                justifyContent: 'center', alignItems: 'center',
              }}>
                <Text style={{ fontSize: 28 }}>{pp.icon || '🫲'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <Text style={{ color: '#FAFAFA', fontSize: 15, fontWeight: '700' }}>{pp.food}</Text>
                  <View style={{ backgroundColor: c.accent + '22', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ color: c.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 }}>{c.label}</Text>
                  </View>
                </View>
                <Text style={{ color: '#D4D4D8', fontSize: 13, marginTop: 1 }}>{pp.measure}</Text>
                <Text style={{ color: '#71717A', fontSize: 12, marginTop: 2 }}>{pp.equivalent}</Text>
              </View>
            </View>
          );
        })}

      </ScrollView>
    );
  };

  // =====================================================
  // RENDER PRINCIPAL
  // =====================================================
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>

        {currentScreen === 'home' && renderHome()}
        {currentScreen === 'workout' && renderWorkout()}
        {currentScreen === 'progress' && renderProgress()}
        {currentScreen === 'nutrition' && renderNutrition()}
        {currentScreen === 'profile' && renderProfile()}

      </KeyboardAvoidingView>

      {/* BOTTOM TAB BAR */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setCurrentScreen('home')}
        >
          <Home color={currentScreen === 'home' ? '#6366F1' : '#52525B'} size={22} />
          <Text style={[styles.tabLabel, currentScreen === 'home' && styles.tabLabelActive]}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => { setSelectedDay(null); setCurrentScreen('workout'); }}
        >
          <Dumbbell color={currentScreen === 'workout' ? '#6366F1' : '#52525B'} size={22} />
          <Text style={[styles.tabLabel, currentScreen === 'workout' && styles.tabLabelActive]}>Entreno</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => { fetchRankings(); setCurrentScreen('progress'); }}
        >
          <Trophy color={currentScreen === 'progress' ? '#F59E0B' : '#52525B'} size={22} />
          <Text style={[styles.tabLabel, currentScreen === 'progress' && { color: '#F59E0B' }]}>Ranking</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setCurrentScreen('nutrition')}
        >
          <Utensils color={currentScreen === 'nutrition' ? '#10B981' : '#52525B'} size={22} />
          <Text style={[styles.tabLabel, currentScreen === 'nutrition' && { color: '#10B981' }]}>Nutrición</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setCurrentScreen('profile')}
        >
          <User color={currentScreen === 'profile' ? '#6366F1' : '#52525B'} size={22} />
          <Text style={[styles.tabLabel, currentScreen === 'profile' && styles.tabLabelActive]}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// =====================================================
// ESTILOS
// =====================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B' },
  keyboardView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },

  // HOME HEADER
  homeHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 24,
  },
  greetingText: { color: '#71717A', fontSize: 14, fontWeight: '500' },
  studentNameText: { color: '#FAFAFA', fontSize: 28, fontWeight: '800', marginTop: 2 },
  cameraButton: {
    padding: 12, backgroundColor: '#18181B', borderRadius: 14,
    borderWidth: 1, borderColor: '#27272A',
  },

  // BANNER
  bannerCard: {
    backgroundColor: '#18181B', borderRadius: 20, padding: 24,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#27272A', marginBottom: 20,
  },
  bannerContent: { flex: 1 },
  bannerTitle: { color: '#FAFAFA', fontSize: 22, fontWeight: '800' },
  bannerSubtitle: { color: '#6366F1', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  bannerDate: { color: '#71717A', fontSize: 13, fontWeight: '500' },
  bannerIcon: { marginLeft: 16 },

  // STATS ROW
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: '#18181B', borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#27272A', gap: 6,
  },
  statNumber: { color: '#FAFAFA', fontSize: 18, fontWeight: '800' },
  statLabel: { color: '#52525B', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },

  // MAIN CARDS
  mainCard: {
    backgroundColor: '#18181B', borderRadius: 20, padding: 20,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderColor: '#27272A', marginBottom: 12, gap: 16,
  },
  mainCardIcon: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  mainCardContent: { flex: 1 },
  mainCardTitle: { color: '#FAFAFA', fontSize: 17, fontWeight: '700' },
  mainCardSubtitle: { color: '#A1A1AA', fontSize: 13, fontWeight: '500', marginTop: 2 },
  mainCardMeta: { color: '#52525B', fontSize: 12, fontWeight: '500', marginTop: 4 },

  // BOTTOM TAB BAR
  tabBar: {
    flexDirection: 'row', backgroundColor: '#0F0F11', borderTopWidth: 1,
    borderTopColor: '#1C1C1F', paddingVertical: 10, paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 4 },
  tabLabel: { color: '#52525B', fontSize: 11, fontWeight: '600' },
  tabLabelActive: { color: '#6366F1' },

  // BACK BUTTON
  backButton: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginBottom: 16,
  },
  backText: { color: '#A1A1AA', fontSize: 15, fontWeight: '600' },

  // WORKOUT HEADER
  header: { marginBottom: 24 },
  dateText: {
    color: '#71717A', fontSize: 13, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 1.5,
  },
  headerTitle: { color: '#FAFAFA', fontSize: 26, fontWeight: '800', marginTop: 4 },

  // EXERCISE CARDS
  cardContainer: {
    marginBottom: 12, borderRadius: 20, overflow: 'hidden',
    backgroundColor: '#18181B', borderWidth: 1, borderColor: '#27272A',
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 18,
  },
  cardHeaderExpanded: { borderBottomWidth: 1, borderBottomColor: '#27272A' },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  exerciseImageContainer: {
    width: 56, height: 56, borderRadius: 14, backgroundColor: '#000',
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
    overflow: 'hidden',
  },
  exerciseImage: {
    width: 56, height: 56, borderRadius: 14, resizeMode: 'cover',
  },
  exerciseName: { color: '#FAFAFA', fontSize: 16, fontWeight: '700' },
  setsInfo: { color: '#52525B', fontSize: 13, fontWeight: '600', marginTop: 2 },

  cardBody: { padding: 18 },

  // SUGGESTION BOX
  suggestionBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  suggestionLabel: { color: '#A1A1AA', fontSize: 12, fontWeight: '600' },
  suggestionValue: { color: '#F59E0B', fontSize: 18, fontWeight: '800', marginTop: 2 },

  simpleSuccess: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30 },
  simpleSuccessText: { color: '#10B981', fontSize: 18, fontWeight: '700', marginTop: 12 },

  // INPUTS
  inputRow: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  inputWrapper: { flex: 1 },
  label: { color: '#A1A1AA', fontSize: 13, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#09090B', borderRadius: 14, padding: 16,
    color: '#FAFAFA', fontSize: 20, fontWeight: '700', borderWidth: 1,
    borderColor: '#3F3F46', textAlign: 'center',
  },

  // EMOJI RPE
  emojiContainer: { flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 24 },
  emojiCard: {
    flex: 1, paddingVertical: 12, paddingHorizontal: 4, borderRadius: 16,
    backgroundColor: '#27272A', borderWidth: 1.5, borderColor: '#3F3F46',
    alignItems: 'center', justifyContent: 'center',
  },
  emojiIcon: { fontSize: 32, marginBottom: 6 },
  emojiLabel: { color: '#A1A1AA', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  emojiRpeHint: { color: '#52525B', fontSize: 10, fontWeight: '600', marginTop: 2 },
  emojiFacilActive: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: '#10B981' },
  emojiModeradoActive: { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: '#3B82F6' },
  emojiExigenteActive: { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: '#F59E0B' },
  emojiFalloActive: { backgroundColor: 'rgba(239, 68, 68, 0.25)', borderColor: '#EF4444' },

  // BUTTONS
  saveButton: {
    backgroundColor: '#6366F1', borderRadius: 16, paddingVertical: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  saveButtonText: { color: '#FAFAFA', fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  finishButton: { backgroundColor: '#10B981', marginTop: 12, borderRadius: 20 },

  // XP FLASH
  xpFlash: {
    color: '#F59E0B', fontSize: 28, fontWeight: '900', marginTop: 8,
    textShadowColor: 'rgba(245, 158, 11, 0.5)', textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },

  // RANKING SCREEN
  xpHeroCard: {
    backgroundColor: '#18181B', borderRadius: 24, padding: 32,
    alignItems: 'center', borderWidth: 1, borderColor: '#27272A',
    marginBottom: 28,
  },
  xpHeroNumber: {
    color: '#FAFAFA', fontSize: 48, fontWeight: '900', marginTop: 12,
    letterSpacing: -2,
  },
  xpHeroLabel: {
    color: '#71717A', fontSize: 13, fontWeight: '700', letterSpacing: 2,
    marginTop: 4, textTransform: 'uppercase',
  },
  positionBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)', paddingHorizontal: 16,
    paddingVertical: 8, borderRadius: 20, marginTop: 16,
    borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  positionBadgeText: {
    color: '#6366F1', fontSize: 15, fontWeight: '800',
  },

  sectionTitle: {
    color: '#FAFAFA', fontSize: 20, fontWeight: '800', marginBottom: 16,
  },

  emptyRanking: {
    alignItems: 'center', justifyContent: 'center', padding: 40,
    backgroundColor: '#18181B', borderRadius: 20, borderWidth: 1,
    borderColor: '#27272A',
  },

  rankingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#18181B', borderRadius: 16, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: '#27272A',
  },
  rankingRowMe: {
    borderColor: 'rgba(99, 102, 241, 0.4)',
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
  },
  rankingRowFirst: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
  },
  rankingPosition: {
    fontSize: 22, width: 36, textAlign: 'center',
  },
  rankingAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#27272A',
    alignItems: 'center', justifyContent: 'center',
  },
  rankingAvatarText: {
    color: '#A1A1AA', fontSize: 18, fontWeight: '800',
  },
  rankingName: {
    color: '#FAFAFA', fontSize: 15, fontWeight: '700',
  },
  rankingSets: {
    color: '#52525B', fontSize: 12, fontWeight: '600', marginTop: 2,
  },
  rankingXp: {
    color: '#FAFAFA', fontSize: 18, fontWeight: '900',
  },
  rankingXpLabel: {
    color: '#52525B', fontSize: 10, fontWeight: '700', textTransform: 'uppercase',
  },

  // NUTRITION
  macroChip: {
    backgroundColor: '#27272A', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    alignItems: 'center', minWidth: 80,
  },
  macroValue: {
    color: '#10B981', fontSize: 15, fontWeight: '800',
  },
  macroLabel: {
    color: '#71717A', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', marginTop: 2,
  },
});
