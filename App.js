import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, SafeAreaView, KeyboardAvoidingView,
  Platform, ScrollView, LayoutAnimation, UIManager, Image, Linking, Modal
} from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import {
  Play, CheckCircle2, Trophy, Dumbbell, Activity,
  ChevronDown, ChevronUp, Camera, Home, User,
  TrendingUp, ChevronLeft, Utensils, Flame, Calendar,
  Zap, Target, Users, MessageSquare, Send, MessageCircle, Plus, X
} from 'lucide-react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// API BASE URL — configurar en .env (EXPO_PUBLIC_BACKEND_URL)
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://fitness-saas-backend.onrender.com';

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
  // === Ejercicios de Agustín ===
  'Sentadilla en multifuerza': require('./assets/exercises/sentadilla_con_barra.png'),
  'Elevación pelvis barra': require('./assets/exercises/hip_thrust.png'),
  'Femoral sentada 1 pierna': require('./assets/exercises/curl_femoral.png'),
  'Peso muerto barra': require('./assets/exercises/peso_muerto.png'),
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
  const [currentScreen, setCurrentScreen] = useState('login'); // 'login' | 'home' | 'workout' | ...
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);

  // Social & Community States
  const [feed, setFeed] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [socialProfile, setSocialProfile] = useState(null);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostImage, setNewPostImage] = useState(null);
  const [showCommentsFor, setShowCommentsFor] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  // Inbox & DMs States
  const [inbox, setInbox] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [newDmText, setNewDmText] = useState('');

  // Form states
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nextTarget, setNextTarget] = useState(null);
  const [successMode, setSuccessMode] = useState(false);
  const [initialSuggestion, setInitialSuggestion] = useState(null); // sugerencia pre-ejercicio (autoregulación)

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
  const [progressPhotos, setProgressPhotos] = useState([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState(null);

  // Body metrics
  const [bodyMetrics, setBodyMetrics] = useState([]);
  const [profileTab, setProfileTab] = useState('photos'); // 'photos' | 'metrics'
  const [weekTrainingDates, setWeekTrainingDates] = useState([]);
  const [studentBaseWeight, setStudentBaseWeight] = useState(null);
  const [studentGoal, setStudentGoal] = useState(null);
  const [savingMetrics, setSavingMetrics] = useState(false);
  const [metricsForm, setMetricsForm] = useState({ peso: '', masa_muscular: '', masa_grasa: '', cintura: '', cadera: '' });

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

  const updateProfileAvatar = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const localUri = result.assets[0].uri;
      setProfilePic(localUri); // mostrar inmediatamente mientras sube

      try {
        const filename = localUri.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        const formData = new FormData();
        formData.append('file', { uri: localUri, name: filename, type });

        const resp = await axios.post(
          `${BACKEND_URL}/student/${loggedInUser.id}/profile-photo`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        if (resp.data?.photo_url) {
          setProfilePic(resp.data.photo_url);
        }
      } catch (e) {
        console.error('Error subiendo foto de perfil:', e);
        // La foto local sigue visible aunque falle la subida
      }
    }
  };

  const uploadProgressPhoto = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setIsUploadingPhoto(true);
      try {
        const localUri = result.assets[0].uri;
        const filename = localUri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        const formData = new FormData();
        formData.append('file', { uri: localUri, name: filename, type });

        const response = await axios.post(`${BACKEND_URL}/student/${loggedInUser.id}/photos`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (response.data && response.data.photo_url) {
          Alert.alert("Éxito", "Foto de progreso subida correctamente!");
          fetchProgressPhotos(loggedInUser.id);
        }
      } catch (error) {
        console.error("Error al subir foto:", error);
        Alert.alert("Error", "Hubo un problema al subir tu foto.");
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const fetchBodyMetrics = async (studentId) => {
    const id = studentId || loggedInUser?.id;
    if (!id) return;
    try {
      const { data } = await axios.get(`${BACKEND_URL}/student/${id}/body-metrics`);
      setBodyMetrics(data || []);
    } catch (e) { console.error('Error fetching body metrics:', e); }
  };

  const saveBodyMetrics = async () => {
    if (!metricsForm.peso) { Alert.alert('Error', 'El peso es obligatorio.'); return; }
    setSavingMetrics(true);
    try {
      await axios.post(`${BACKEND_URL}/student/${loggedInUser.id}/body-metrics`, {
        peso: parseFloat(metricsForm.peso),
        masa_muscular: metricsForm.masa_muscular ? parseFloat(metricsForm.masa_muscular) : null,
        masa_grasa: metricsForm.masa_grasa ? parseFloat(metricsForm.masa_grasa) : null,
        cintura: metricsForm.cintura ? parseFloat(metricsForm.cintura) : null,
        cadera: metricsForm.cadera ? parseFloat(metricsForm.cadera) : null,
      });
      Alert.alert('¡Guardado!', 'Tus métricas fueron registradas.');
      setMetricsForm({ peso: '', masa_muscular: '', masa_grasa: '', cintura: '', cadera: '' });
      fetchBodyMetrics();
    } catch (e) {
      Alert.alert('Error', 'No se pudieron guardar las métricas.');
    } finally {
      setSavingMetrics(false);
    }
  };

  const fetchProgressPhotos = async (studentId) => {
    try {
      const id = studentId || loggedInUser?.id;
      if (!id) return;
      const { data } = await axios.get(`${BACKEND_URL}/student/${id}/photos`);
      setProgressPhotos(data || []);
    } catch (e) {
      console.error("Error fetching progress photos:", e);
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
  const fetchExercises = async (studentId) => {
    try {
      const id = studentId || loggedInUser?.id;
      if (!id) return;
      const response = await axios.get(`${BACKEND_URL}/student/${id}/next-workout`);
      if (response.data && response.data.exercises) {
        setSessionData({
          routine_id: response.data.routine_id,
          routine_name: response.data.routine_name,
          current_day: response.data.current_day,
          total_days: response.data.total_days,
          all_days_info: response.data.all_days_info || []
        });

        // Fetch ALL exercises for this routine instead of just the next workout
        const allResp = await axios.get(`${BACKEND_URL}/routines/${response.data.routine_id}/exercises`);
        const allLoadedExercises = allResp.data.map((ex) => {
          const name = ex.exercises?.name || `Ejercicio ${ex.exercise_id ? ex.exercise_id.substring(0, 4) : '???'}`;
          return {
            id: ex.exercise_id,
            routine_id: ex.routine_id,
            name: name,
            muscleGroup: ex.exercises?.muscle_group || '',
            targetSets: ex.sets || 3,
            setsCompleted: 0,
            day_number: ex.day_number,
            day_name: ex.day_name, // Capture day name from backend
            image: EXERCISE_IMAGES[name] || null,
            repScheme: (ex.reps_per_set ? ex.reps_per_set.replace(/,/g, '-') : null) || CUSTOM_REP_SCHEMES[name] || null,
            repsPerSet: ex.reps_per_set ? ex.reps_per_set.split(',') : []
          };
        });
        setExercises(allLoadedExercises);
      } else {
        setExercises([]);
      }
    } catch (error) {
      console.error("Error fetching exercises:", error);
      setExercises([]);
    }
  };
  const fetchMyPoints = async (studentId) => {
    try {
      const id = studentId || loggedInUser?.id;
      if (!id) return;
      const response = await axios.get(`${BACKEND_URL}/student/${id}/performance`);
      if (response.data && response.data.total_xp !== undefined) {
        setTotalXp(response.data.total_xp);
      }
    } catch (error) {
      console.error("Error fetching points:", error);
    }
  };

  const fetchRankings = async () => {
    setLoadingRankings(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/rankings`);
      setRankings(response.data);
    } catch (error) {
      console.error("Error fetching rankings:", error);
    } finally {
      setLoadingRankings(false);
    }
  };

  // Fetch nutrition plan
  const fetchNutritionPlan = async (studentId) => {
    const id = studentId || loggedInUser?.id;
    if (!id) return;
    setLoadingNutrition(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/student/${id}/nutrition`);
      setNutritionPlan(response.data);
    } catch (error) {
      console.error('Error fetching nutrition:', error);
    } finally {
      setLoadingNutrition(false);
    }
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      Alert.alert("Error", "Por favor ingresa email y contraseña");
      return;
    }
    setIsLoggingIn(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/auth/login`, {
        email: loginEmail.toLowerCase().trim(),
        password: loginPassword
      });
      
      if (response.data && response.data.id) {
        // Use student_id from backend if available, otherwise fall back to id
        const effectiveStudentId = response.data.student_id || response.data.id;
        const user = {
          id: effectiveStudentId,
          name: response.data.name,
          username: response.data.email.split('@')[0],
          student_id: effectiveStudentId
        };
        setLoggedInUser(user);
        setIsAuthenticated(true);
        setCurrentScreen('home');

        // Cargar avatar guardado si existe
        if (response.data.avatar_url) {
          setProfilePic(response.data.avatar_url);
        }

        // Cargar datos esenciales con 1 sola llamada al dashboard
        try {
          const dashRes = await axios.get(`${BACKEND_URL}/students/${user.id}/dashboard`);
          const d = dashRes.data;
          if (d.nutrition) setNutritionPlan(d.nutrition);
          if (d.metrics) setBodyMetrics(d.metrics);
          if (d.weekly_dates) setWeekTrainingDates(d.weekly_dates);
          if (d.student?.weight_kg) setStudentBaseWeight(parseFloat(d.student.weight_kg));
          if (d.student?.goal) setStudentGoal(d.student.goal);
          if (!response.data.avatar_url && d.student?.profile_photo_url) {
            setProfilePic(d.student.profile_photo_url);
          }
        } catch (e) { console.error('Dashboard fetch error:', e); }

        // Cargar ejercicios (necesario para entrenar)
        fetchExercises(user.id);
        fetchMyPoints(user.id);

        // Rankings y fotos se cargan lazy cuando el usuario navega
        // fetchRankings();  -- se llama cuando entra a la pestaña
        // fetchProgressPhotos(user.id);  -- se llama cuando entra a fotos
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error de Login", "Credenciales incorrectas o cuenta inactiva.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = forgotEmail.trim().toLowerCase();
    if (!email) {
      setForgotMessage('Ingresá tu email');
      return;
    }
    setForgotLoading(true);
    setForgotMessage('');
    try {
      const response = await axios.post(`${BACKEND_URL}/auth/forgot-password`, { email });
      if (response.data?.email_sent) {
        setForgotMessage('✓ Te enviamos un email con el link para restablecer tu contraseña.');
        setTimeout(() => {
          setShowForgotPassword(false);
          setForgotEmail('');
          setForgotMessage('');
        }, 3500);
      } else if (response.data?.reset_url) {
        // El email no se pudo enviar pero tenemos el link — abrirlo directamente en el navegador
        setForgotMessage('Abriendo el link para restablecer tu contraseña...');
        setTimeout(() => {
          const { Linking } = require('react-native');
          Linking.openURL(response.data.reset_url);
          setShowForgotPassword(false);
          setForgotEmail('');
          setForgotMessage('');
        }, 800);
      } else {
        setForgotMessage('✓ Si el email está registrado, recibirás un link.');
        setTimeout(() => {
          setShowForgotPassword(false);
          setForgotEmail('');
          setForgotMessage('');
        }, 3500);
      }
    } catch (error) {
      setForgotMessage('Error al enviar. Intentá de nuevo.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Initial fetch removed, now handled post-login
  useEffect(() => {
    // If we were using AsyncStorage for persistence, we would check it here
  }, []);


  // =====================================================
  // SOCIAL FETCHERS
  // =====================================================
  const fetchFeed = async () => {
    setLoadingFeed(true);
    try {
      const { data } = await axios.get(`${BACKEND_URL}/feed/${loggedInUser.id}`);
      setFeed(data || []);
    } catch (e) { console.error('Error feed:', e); } finally { setLoadingFeed(false); }
  };

  const fetchProfile = async (targetId) => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/users/${targetId}/profile`);
      const { data: postsData } = await axios.get(`${BACKEND_URL}/users/${targetId}/posts?request_user_id=${loggedInUser.id}`);
      setSocialProfile({ ...data, posts: postsData || [] });
    } catch (e) { console.error('Error profile:', e); }
  };

  const toggleLike = async (postId) => {
    try {
      const { data } = await axios.post(`${BACKEND_URL}/posts/${postId}/toggle-like`, { user_id: loggedInUser.id });
      const liked = data.status === 'liked';
      const inc = liked ? 1 : -1;
      setFeed(prev => prev.map(p => p.id === postId ? { ...p, has_liked: liked, likes_count: p.likes_count + inc } : p));
      if (socialProfile) {
        setSocialProfile(prev => ({ ...prev, posts: prev.posts.map(p => p.id === postId ? { ...p, has_liked: liked, likes_count: p.likes_count + inc } : p) }));
      }
    } catch (e) { console.error('Error like:', e); }
  };

  const submitPost = async () => {
    if (!newPostCaption) return;
    try {
      await axios.post(`${BACKEND_URL}/posts/`, { user_id: loggedInUser.id, caption: newPostCaption, image_url: newPostImage || 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&auto=format&fit=crop' });
      setShowNewPostModal(false); setNewPostCaption(''); setNewPostImage(null);
      if (currentScreen === 'community') fetchFeed();
      if (currentScreen === 'socialProfile') fetchProfile(loggedInUser.id);
    } catch (e) { Alert.alert('Error', 'No se pudo crear el post'); }
  };

  const fetchComments = async (postId) => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/posts/${postId}/comments`);
      setComments(data || []); setShowCommentsFor(postId);
    } catch (e) { console.error('Error comments:', e); }
  };

  const submitComment = async () => {
    if (!newComment || !showCommentsFor) return;
    try {
      await axios.post(`${BACKEND_URL}/posts/${showCommentsFor}/comments`, { user_id: loggedInUser.id, content: newComment });
      setNewComment(''); fetchComments(showCommentsFor);
      setFeed(prev => prev.map(p => p.id === showCommentsFor ? { ...p, comments_count: p.comments_count + 1 } : p));
    } catch (e) { console.error('Error submit comment:', e); }
  };

  const fetchInbox = async () => {
    try { const { data } = await axios.get(`${BACKEND_URL}/messages/${loggedInUser.id}`); setInbox(data || []); } catch (e) { console.error(e); }
  };

  const fetchChat = async (otherUser) => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/messages/${loggedInUser.id}/${otherUser.id}`);
      setChatHistory(data || []); setActiveChatUser(otherUser); setCurrentScreen('chatWindow');
    } catch (e) { console.error(e); }
  };

  const sendDm = async () => {
    if (!newDmText || !activeChatUser) return;
    try {
      const { data } = await axios.post(`${BACKEND_URL}/messages/`, { sender_id: loggedInUser.id, receiver_id: activeChatUser.id, content: newDmText });
      setChatHistory([...chatHistory, data]); setNewDmText('');
    } catch (e) { console.error(e); }
  };

  // =====================================================
  // HANDLERS
  // =====================================================
  const toggleExpand = async (id) => {
    // Bloquear expansión si el ejercicio ya completó todas sus series
    const exercise = exercises.find(ex => ex.id === id);
    if (exercise && exercise.setsCompleted >= exercise.targetSets) return;

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (expandedId === id) {
      setExpandedId(null);
      setInitialSuggestion(null);
    } else {
      setExpandedId(id);
      setWeight(''); setReps(''); setRpe(null);
      setNextTarget(null); setSuccessMode(false);
      setInitialSuggestion(null);

      // Buscar sugerencia de autoregulación basada en el último registro de este ejercicio
      try {
        const resp = await axios.get(`${BACKEND_URL}/student/${loggedInUser.id}/exercise/${id}/suggestion`);
        if (resp.data?.suggestion) {
          setInitialSuggestion({ exerciseId: id, ...resp.data });
          // Pre-rellenar los inputs con el peso y reps sugeridos
          setWeight(String(resp.data.suggestion.suggested_weight));
          setReps(String(resp.data.suggestion.suggested_reps));
        }
      } catch (e) {
        // Sin historial todavía, no pasa nada
      }
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

      {/* CONSISTENCIA SEMANAL */}
      {(() => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const dow = now.getDay(); // 0=Dom
        const mondayOffset = dow === 0 ? -6 : 1 - dow;
        const monday = new Date(now);
        monday.setDate(now.getDate() + mondayOffset);
        monday.setHours(0, 0, 0, 0);
        const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
        const days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          const dateStr = d.toISOString().split('T')[0];
          const isPast = d < now && dateStr !== todayStr;
          return {
            label: dayLabels[i],
            dateStr,
            isToday: dateStr === todayStr,
            isFuture: d > now && dateStr !== todayStr,
            isPast,
            trained: weekTrainingDates.includes(dateStr),
          };
        });
        const trainedCount = days.filter(d => d.trained).length;
        return (
          <View style={styles.weekCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={styles.weekCardTitle}>Consistencia semanal</Text>
              <Text style={{ color: '#6366F1', fontSize: 13, fontWeight: '700' }}>{trainedCount}/7 días</Text>
            </View>
            <View style={styles.weekDaysRow}>
              {days.map((day, i) => (
                <View key={i} style={styles.weekDayCol}>
                  <Text style={[styles.weekDayLabel, day.isToday && { color: '#6366F1' }]}>{day.label}</Text>
                  <View style={[
                    styles.weekDayCircle,
                    day.trained && styles.weekDayTrained,
                    day.isToday && !day.trained && styles.weekDayToday,
                    day.isFuture && styles.weekDayFuture,
                  ]}>
                    {day.trained
                      ? <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>✓</Text>
                      : <Text style={{ color: day.isFuture ? '#27272A' : '#3F3F46', fontSize: 10 }}>·</Text>
                    }
                  </View>
                </View>
              ))}
            </View>
          </View>
        );
      })()}

      {/* PESO CORPORAL */}
      {(studentBaseWeight || (bodyMetrics.length > 0 && bodyMetrics[0]?.peso)) && (() => {
        const latestWeight = bodyMetrics.length > 0 && bodyMetrics[0]?.peso
          ? parseFloat(bodyMetrics[0].peso)
          : studentBaseWeight;
        const delta = studentBaseWeight ? latestWeight - studentBaseWeight : 0;
        const lossGoal = /p[eé]rdida|definici[oó]n/i.test(studentGoal || '');
        const gainGoal = /hipertrofia|fuerza|ganancia/i.test(studentGoal || '');
        const isGood = lossGoal ? delta <= 0 : gainGoal ? delta >= 0 : true;
        const showDelta = bodyMetrics.length > 0 && studentBaseWeight && Math.abs(delta) > 0.09;
        const goalEmoji = lossGoal ? '🏃' : gainGoal ? '💪' : '⚖️';
        return (
          <View style={styles.weightCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.weightCardLabel}>Peso corporal</Text>
              <Text style={styles.weightCardValue}>{latestWeight} kg</Text>
              {showDelta ? (
                <Text style={{ color: isGood ? '#10B981' : '#EF4444', fontSize: 13, fontWeight: '600', marginTop: 3 }}>
                  {delta > 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)} kg vs inicio
                </Text>
              ) : (
                <Text style={{ color: '#52525B', fontSize: 12, marginTop: 3 }}>Peso al registrarse</Text>
              )}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 30 }}>{goalEmoji}</Text>
              <Text style={{ color: '#52525B', fontSize: 11, fontWeight: '600', marginTop: 4 }}>{studentGoal || 'Sin objetivo'}</Text>
            </View>
          </View>
        );
      })()}

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
          <Text style={styles.mainCardSubtitle}>
            {nutritionPlan?.meals?.length > 0
              ? `${nutritionPlan.meals.length} comidas planificadas`
              : 'Plan nutricional'}
          </Text>
          <Text style={styles.mainCardMeta}>
            {nutritionPlan?.meals?.length > 0
              ? 'Toca para ver tu plan completo'
              : 'Tu profe aún no asignó un plan'}
          </Text>
        </View>
        <ChevronDown color="#52525B" size={20} style={{ transform: [{ rotate: '-90deg' }] }} />
      </TouchableOpacity>

    </ScrollView>
  );

  // =====================================================
  // PANTALLA: WORKOUT (ejercicios del día)
  // =====================================================
  const renderWorkoutDaysList = () => {
    // Si tenemos la información detallada de los días desde el backend, la usamos
    const daysInfo = sessionData?.all_days_info && sessionData.all_days_info.length > 0 
      ? sessionData.all_days_info 
      : Array.from(
          { length: sessionData?.total_days || (exercises.length > 0 ? Math.max(...exercises.map(e => e.day_number || 1)) : 5) }, 
          (_, i) => ({ day_number: i + 1, day_name: `Día ${i + 1}` })
        );

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {sessionData ? sessionData.routine_name : 'Cargando...'}
          </Text>
          <Text style={{ color: '#A1A1AA', fontSize: 14, marginTop: 4 }}>Seleccioná el día para comenzar</Text>
        </View>

        {daysInfo.map(dayInfo => {
          const day = dayInfo.day_number;
          const dayExercises = exercises.filter(e => e.day_number === day);
          const exerciseCount = dayExercises.length;
          // Si el ejercicio ya trajo su propio nombre del backend, prevalece, si no, el del all_days_info
          const exName = dayExercises.length > 0 && dayExercises[0].day_name ? dayExercises[0].day_name : dayInfo.day_name;

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
                <Text style={styles.mainCardTitle}>{exName}</Text>
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
            {exercises.find(e => e.day_number === selectedDay && e.day_name)?.day_name || sessionData?.routine_name}
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

                  {/* Sugerencia de autoregulación ANTES del primer set */}
                  {initialSuggestion?.exerciseId === exercise.id && initialSuggestion.suggestion && exercise.setsCompleted === 0 && !nextTarget && (
                    <View style={[styles.suggestionBox, { borderColor: '#6366F1', backgroundColor: 'rgba(99,102,241,0.08)' }]}>
                      <Activity color="#6366F1" size={24} />
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={[styles.suggestionLabel, { color: '#A78BFA' }]}>Autoregulación sugerida</Text>
                        <Text style={styles.suggestionValue}>
                          {initialSuggestion.suggestion.suggested_weight} kg × {initialSuggestion.suggestion.suggested_reps} reps
                        </Text>
                        {initialSuggestion.last_log && (
                          <Text style={{ color: '#71717A', fontSize: 11, marginTop: 2 }}>
                            Última vez: {initialSuggestion.last_log.weight} kg × {initialSuggestion.last_log.reps} reps · RPE {initialSuggestion.last_log.rpe}
                          </Text>
                        )}
                        {initialSuggestion.suggestion.alert_message && (
                          <Text style={{ color: '#F59E0B', fontSize: 12, marginTop: 4 }}>
                            {initialSuggestion.suggestion.alert_message}
                          </Text>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Sugerencia post-serie (objetivo para el próximo set) */}
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
    const myRanking = rankings.find(r => r.student_id === loggedInUser?.id);
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
            const isMe = r.student_id === loggedInUser?.id;
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
    const latestMetric = bodyMetrics.length > 0 ? bodyMetrics[0] : null;
    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false}>
        {/* Top Section - Avatar and Stats */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <TouchableOpacity onPress={updateProfileAvatar} style={{ position: 'relative' }}>
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
                {rankings.find(r => r.student_id === loggedInUser?.id)?.position || '-'}
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
          <Text style={{ color: '#FAFAFA', fontSize: 15, fontWeight: '700' }}>{loggedInUser?.name || 'Atleta'}</Text>
          <Text style={{ color: '#D4D4D8', fontSize: 14, marginTop: 2 }}>{sessionData?.routine_name || 'Sin rutina asignada'}</Text>
        </View>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: '#27272A', paddingVertical: 8, borderRadius: 8, alignItems: 'center' }}
            onPress={() => { setProfileTab('metrics'); fetchBodyMetrics(); }}
          >
            <Text style={{ color: '#FAFAFA', fontSize: 13, fontWeight: '600' }}>Mis Métricas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: '#6366F1', paddingVertical: 8, borderRadius: 8, alignItems: 'center' }}
            onPress={uploadProgressPhoto}
            disabled={isUploadingPhoto}
          >
            {isUploadingPhoto ? (
              <ActivityIndicator color="#FAFAFA" size="small" />
            ) : (
              <Text style={{ color: '#FAFAFA', fontSize: 13, fontWeight: '600' }}>Subir Progreso</Text>
            )}
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={{ backgroundColor: 'transparent', paddingVertical: 8, borderRadius: 8, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#3F3F46' }}
          onPress={() => {
            setIsAuthenticated(false);
            setLoggedInUser(null);
            setCurrentScreen('login');
            setSessionData(null);
            setLoginEmail('');
            setLoginPassword('');
          }}
        >
          <Text style={{ color: '#71717A', fontSize: 13, fontWeight: '600' }}>Cerrar sesión</Text>
        </TouchableOpacity>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#27272A', marginBottom: 2 }}>
          <TouchableOpacity
            style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: profileTab === 'photos' ? '#FAFAFA' : 'transparent' }}
            onPress={() => setProfileTab('photos')}
          >
            <Camera color={profileTab === 'photos' ? '#FAFAFA' : '#52525B'} size={24} />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: profileTab === 'metrics' ? '#6366F1' : 'transparent' }}
            onPress={() => { setProfileTab('metrics'); fetchBodyMetrics(); }}
          >
            <Activity color={profileTab === 'metrics' ? '#6366F1' : '#52525B'} size={24} />
          </TouchableOpacity>
        </View>

        {/* Tab: Fotos de progreso */}
        {profileTab === 'photos' && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2, justifyContent: 'flex-start' }}>
            {progressPhotos.length > 0 ? (
              progressPhotos.map((photo) => (
                <TouchableOpacity key={photo.id} style={{ width: '33%', aspectRatio: 1, backgroundColor: '#18181B', marginBottom: 2 }} onPress={() => setSelectedPhotoUrl(photo.photo_url)}>
                  <Image source={{ uri: photo.photo_url }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                </TouchableOpacity>
              ))
            ) : (
              <View style={{ width: '100%', padding: 40, alignItems: 'center' }}>
                <Camera color="#3F3F46" size={48} />
                <Text style={{ color: '#71717A', marginTop: 12 }}>No has subido fotos aún.</Text>
              </View>
            )}
          </View>
        )}

        {/* Tab: Métricas corporales */}
        {profileTab === 'metrics' && (
          <View style={{ paddingTop: 16 }}>
            {/* Última medición */}
            {latestMetric && (
              <View style={{ backgroundColor: '#18181B', borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#27272A' }}>
                <Text style={{ color: '#A1A1AA', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>ÚLTIMA MEDICIÓN · {latestMetric.fecha}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  {latestMetric.peso && <View style={{ alignItems: 'center', minWidth: 60 }}><Text style={{ color: '#FAFAFA', fontSize: 20, fontWeight: '800' }}>{latestMetric.peso}</Text><Text style={{ color: '#71717A', fontSize: 11 }}>kg total</Text></View>}
                  {latestMetric.masa_muscular && <View style={{ alignItems: 'center', minWidth: 60 }}><Text style={{ color: '#10B981', fontSize: 20, fontWeight: '800' }}>{latestMetric.masa_muscular}</Text><Text style={{ color: '#71717A', fontSize: 11 }}>kg músculo</Text></View>}
                  {latestMetric.masa_grasa && <View style={{ alignItems: 'center', minWidth: 60 }}><Text style={{ color: '#F59E0B', fontSize: 20, fontWeight: '800' }}>{latestMetric.masa_grasa}</Text><Text style={{ color: '#71717A', fontSize: 11 }}>kg grasa</Text></View>}
                  {latestMetric.cintura && <View style={{ alignItems: 'center', minWidth: 60 }}><Text style={{ color: '#6366F1', fontSize: 20, fontWeight: '800' }}>{latestMetric.cintura}</Text><Text style={{ color: '#71717A', fontSize: 11 }}>cm cintura</Text></View>}
                  {latestMetric.cadera && <View style={{ alignItems: 'center', minWidth: 60 }}><Text style={{ color: '#6366F1', fontSize: 20, fontWeight: '800' }}>{latestMetric.cadera}</Text><Text style={{ color: '#71717A', fontSize: 11 }}>cm cadera</Text></View>}
                </View>
              </View>
            )}

            {/* Formulario nueva medición */}
            <Text style={{ color: '#FAFAFA', fontSize: 15, fontWeight: '700', marginBottom: 12 }}>Registrar nueva medición</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Peso (kg) *</Text>
                <TextInput style={styles.input} keyboardType="numeric" placeholder="0.0" placeholderTextColor="#52525B" value={metricsForm.peso} onChangeText={v => setMetricsForm(f => ({ ...f, peso: v }))} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Músculo (kg)</Text>
                <TextInput style={styles.input} keyboardType="numeric" placeholder="0.0" placeholderTextColor="#52525B" value={metricsForm.masa_muscular} onChangeText={v => setMetricsForm(f => ({ ...f, masa_muscular: v }))} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Grasa (kg)</Text>
                <TextInput style={styles.input} keyboardType="numeric" placeholder="0.0" placeholderTextColor="#52525B" value={metricsForm.masa_grasa} onChangeText={v => setMetricsForm(f => ({ ...f, masa_grasa: v }))} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Cintura (cm)</Text>
                <TextInput style={styles.input} keyboardType="numeric" placeholder="0" placeholderTextColor="#52525B" value={metricsForm.cintura} onChangeText={v => setMetricsForm(f => ({ ...f, cintura: v }))} />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Cadera (cm)</Text>
                <TextInput style={styles.input} keyboardType="numeric" placeholder="0" placeholderTextColor="#52525B" value={metricsForm.cadera} onChangeText={v => setMetricsForm(f => ({ ...f, cadera: v }))} />
              </View>
              <View style={{ flex: 1 }} />
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={saveBodyMetrics} disabled={savingMetrics}>
              {savingMetrics ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Guardar Métricas</Text>}
            </TouchableOpacity>

            {/* Historial */}
            {bodyMetrics.length > 1 && (
              <View style={{ marginTop: 24 }}>
                <Text style={{ color: '#A1A1AA', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 10 }}>HISTORIAL</Text>
                {bodyMetrics.slice(1).map((m, i) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#27272A' }}>
                    <Text style={{ color: '#71717A', fontSize: 13 }}>{m.fecha}</Text>
                    <Text style={{ color: '#FAFAFA', fontSize: 13 }}>{m.peso} kg</Text>
                    {m.masa_muscular ? <Text style={{ color: '#10B981', fontSize: 13 }}>{m.masa_muscular} mús</Text> : null}
                    {m.masa_grasa ? <Text style={{ color: '#F59E0B', fontSize: 13 }}>{m.masa_grasa} gras</Text> : null}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Full Screen Photo Modal */}
        <Modal visible={!!selectedPhotoUrl} transparent={true} animationType="fade" onRequestClose={() => setSelectedPhotoUrl(null)}>
          <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
            <TouchableOpacity style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 }} onPress={() => setSelectedPhotoUrl(null)}>
              <X color="#FFF" size={32} />
            </TouchableOpacity>
            {selectedPhotoUrl && (
              <Image source={{ uri: selectedPhotoUrl }} style={{ width: '100%', height: '80%', resizeMode: 'contain' }} />
            )}
          </View>
        </Modal>

      </ScrollView>
    );
  };

  // =====================================================
  // PANTALLA: NUTRICIÓN
  // =====================================================
  const renderNutrition = () => {
    if (loadingNutrition) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <ActivityIndicator color="#10B981" size="large" />
          <Text style={{ color: '#52525B', marginTop: 12 }}>Cargando plan nutricional...</Text>
        </View>
      );
    }
    if (!nutritionPlan || !nutritionPlan.meals || nutritionPlan.meals.length === 0) {
      return (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('home')}>
            <ChevronLeft color="#A1A1AA" size={22} />
            <Text style={styles.backText}>Inicio</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
            <Utensils color="#3F3F46" size={48} />
            <Text style={{ color: '#A1A1AA', fontSize: 16, fontWeight: '700', marginTop: 16 }}>Sin plan nutricional</Text>
            <Text style={{ color: '#52525B', fontSize: 14, marginTop: 8, textAlign: 'center' }}>Tu profesor todavía no cargó tu plan. Consultale para que lo configure.</Text>
          </View>
        </ScrollView>
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
          <Text style={styles.dateText}>AGUSTIN ELIZONDO TEAM</Text>
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
                  {meal.text ? (
                    <Text style={{ color: '#D4D4D8', fontSize: 14, lineHeight: 22 }}>
                      {meal.text}
                    </Text>
                  ) : meal.options && meal.options.length > 0 ? (
                    meal.options.map((option, oidx) => (
                      <View key={oidx} style={{ marginBottom: oidx < meal.options.length - 1 ? 16 : 0 }}>
                        <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '700', marginBottom: 8 }}>{option.title}</Text>
                        {option.items.map((item, iidx) => (
                          <View key={iidx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6, gap: 8 }}>
                            <Text style={{ color: '#3F3F46', fontSize: 14 }}>•</Text>
                            <Text style={{ color: '#D4D4D8', fontSize: 14, flex: 1, lineHeight: 20 }}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    ))
                  ) : (
                    <Text style={{ color: '#52525B', fontSize: 13, fontStyle: 'italic' }}>Sin detalles cargados.</Text>
                  )}
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
  // PANTALLAS: FEED Y SOCIAL
  // =====================================================
  const renderCommunity = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Text style={styles.headerTitle}>FitGram</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity style={styles.iconButtonPrimary} onPress={() => setShowNewPostModal(true)}>
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButtonSecondary} onPress={() => { fetchInbox(); setCurrentScreen('inbox'); }}>
            <MessageSquare size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {loadingFeed ? <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 40 }} /> :
        feed.map(post => (
          <View key={post.id} style={styles.postCard}>
            <TouchableOpacity style={styles.postHeader} onPress={() => { fetchProfile(post.user_id); setCurrentScreen('socialProfile'); }}>
              <Image source={{ uri: post.user_avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100' }} style={styles.postAvatar} />
              <View>
                <Text style={{ color: '#FAFAFA', fontWeight: '700', fontSize: 15 }}>{post.username || post.user_name}</Text>
                <Text style={{ color: '#A1A1AA', fontSize: 12 }}>{new Date(post.created_at).toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>

            {post.image_url && <Image source={{ uri: post.image_url }} style={styles.postImage} />}

            <View style={styles.postActions}>
              <TouchableOpacity style={[styles.postActionBtn, post.has_liked && { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]} onPress={() => toggleLike(post.id)}>
                <Dumbbell size={24} color={post.has_liked ? '#10B981' : '#FAFAFA'} />
                <Text style={{ color: post.has_liked ? '#10B981' : '#FAFAFA', marginLeft: 6, fontWeight: '700', fontSize: 15 }}>{post.likes_count}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.postActionBtn} onPress={() => fetchComments(post.id)}>
                <MessageCircle size={24} color="#FAFAFA" />
                <Text style={{ color: '#FAFAFA', marginLeft: 6, fontWeight: '700', fontSize: 15 }}>{post.comments_count}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.postActionBtn, { marginLeft: 'auto' }]} onPress={() => fetchChat({ id: post.user_id, name: post.user_name || post.username, avatar_url: post.user_avatar })}>
                <Send size={24} color="#FAFAFA" />
              </TouchableOpacity>
            </View>

            {post.caption ? (
              <View style={styles.postCaption}>
                <Text style={{ color: '#FAFAFA', fontSize: 14 }}>
                  <Text style={{ fontWeight: '700' }}>{post.username || post.user_name} </Text>
                  {post.caption}
                </Text>
              </View>
            ) : null}
          </View>
        ))
      }
    </ScrollView>
  );

  const renderSocialProfile = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <TouchableOpacity style={styles.backButton} onPress={() => { setCurrentScreen('community'); setSocialProfile(null); }}>
        <ChevronLeft color="#A1A1AA" size={22} />
        <Text style={styles.backText}>FitGram Feed</Text>
      </TouchableOpacity>

      {socialProfile ? (
        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <Image source={{ uri: socialProfile.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100' }} style={styles.profileAvatarModal} />
          <Text style={{ color: '#FAFAFA', fontSize: 24, fontWeight: '800', marginTop: 12 }}>{socialProfile.name}</Text>
          <Text style={{ color: '#A1A1AA', fontSize: 15 }}>@{socialProfile.username || socialProfile.name.toLowerCase().replace(' ', '')}</Text>
          <Text style={{ color: '#E4E4E7', fontSize: 14, marginTop: 12, textAlign: 'center', paddingHorizontal: 20 }}>{socialProfile.bio || 'Atleta de FitPro.'}</Text>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 32, marginVertical: 24 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#FAFAFA', fontSize: 22, fontWeight: '800' }}>{socialProfile.posts_count || 0}</Text>
              <Text style={{ color: '#A1A1AA', fontSize: 13 }}>Posts</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#FAFAFA', fontSize: 22, fontWeight: '800' }}>{socialProfile.followers_count || 0}</Text>
              <Text style={{ color: '#A1A1AA', fontSize: 13 }}>Seguidores</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#FAFAFA', fontSize: 22, fontWeight: '800' }}>{socialProfile.following_count || 0}</Text>
              <Text style={{ color: '#A1A1AA', fontSize: 13 }}>Seguidos</Text>
            </View>
          </View>

          <View style={styles.profileGrid}>
            {socialProfile.posts && socialProfile.posts.map(p => (
              <View key={p.id} style={styles.gridItem}>
                {p.image_url ? <Image source={{ uri: p.image_url }} style={{ width: '100%', height: '100%' }} /> : <View style={{ width: '100%', height: '100%', backgroundColor: '#27272A' }} />}
              </View>
            ))}
          </View>
        </View>
      ) : <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 40 }} />}
    </ScrollView>
  );

  const renderInbox = () => (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('community')}>
        <ChevronLeft color="#A1A1AA" size={22} />
        <Text style={styles.backText}>FitGram Feed</Text>
      </TouchableOpacity>

      <Text style={[styles.headerTitle, { marginBottom: 20 }]}>Mensajes Directos</Text>

      {inbox.length === 0 ? <Text style={{ color: '#A1A1AA', textAlign: 'center', marginTop: 40, fontSize: 15 }}>No tienes mensajes aún.</Text> :
        inbox.map(conv => (
          <TouchableOpacity key={conv.other_user.id} style={styles.dmConvCard} onPress={() => fetchChat(conv.other_user)}>
            <Image source={{ uri: conv.other_user.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100' }} style={{ width: 56, height: 56, borderRadius: 28 }} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ color: '#FAFAFA', fontWeight: '800', fontSize: 16 }}>{conv.other_user.username || conv.other_user.name}</Text>
                <Text style={{ color: '#71717A', fontSize: 12 }}>{new Date(conv.last_message.created_at).toLocaleDateString()}</Text>
              </View>
              <Text style={{ color: conv.last_message.sender_id === loggedInUser.id ? '#71717A' : '#E4E4E7', fontSize: 14 }} numberOfLines={1}>
                {conv.last_message.sender_id === loggedInUser.id ? 'Tú: ' : ''}{conv.last_message.content}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      }
    </ScrollView>
  );

  const renderChatWindow = () => (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={0}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: Platform.OS === 'android' ? 40 : 20, borderBottomWidth: 1, borderBottomColor: '#27272A', backgroundColor: '#18181B' }}>
        <TouchableOpacity style={{ marginRight: 16 }} onPress={() => { setCurrentScreen('inbox'); fetchInbox(); }}>
          <ChevronLeft size={24} color="#FAFAFA" />
        </TouchableOpacity>
        {activeChatUser && (
          <>
            <Image source={{ uri: activeChatUser.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100' }} style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12 }} />
            <Text style={{ color: '#FAFAFA', fontSize: 18, fontWeight: '800' }}>{activeChatUser.username || activeChatUser.name}</Text>
          </>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 20 }}>
        {chatHistory.map(msg => {
          const isMe = msg.sender_id === loggedInUser.id;
          return (
            <View key={msg.id} style={{
              alignSelf: isMe ? 'flex-end' : 'flex-start',
              backgroundColor: isMe ? '#6366F1' : '#27272A',
              paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20,
              borderBottomRightRadius: isMe ? 4 : 20,
              borderBottomLeftRadius: !isMe ? 4 : 20,
              maxWidth: '85%', marginBottom: 12
            }}>
              <Text style={{ color: '#fff', fontSize: 15, lineHeight: 22 }}>{msg.content}</Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={{ flexDirection: 'row', padding: 16, backgroundColor: '#18181B', borderTopWidth: 1, borderTopColor: '#27272A', alignItems: 'center', paddingBottom: Platform.OS === 'ios' ? 32 : 16 }}>
        <TextInput
          style={[styles.input, { flex: 1, padding: 14, borderRadius: 24, fontSize: 15, textAlign: 'left', marginBottom: 0 }]}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#A1A1AA"
          value={newDmText}
          onChangeText={setNewDmText}
        />
        <TouchableOpacity style={[styles.iconButtonPrimary, { marginLeft: 12, width: 48, height: 48, borderRadius: 24, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center' }]} onPress={sendDm}>
          <Send size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  const renderLogin = () => (
    <ScrollView contentContainerStyle={[styles.scrollContent, { justifyContent: 'center', flexGrow: 1 }]}>
      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <Dumbbell color="#6366F1" size={60} />
        <Text style={[styles.headerTitle, { fontSize: 32, marginTop: 10 }]}>Impera Fitness</Text>
        <Text style={{ color: '#71717A', fontSize: 16, marginTop: 4 }}>Acceso Alumnos</Text>
      </View>

      <View style={{ gap: 16 }}>
        <View>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, { textAlign: 'left', fontSize: 16 }]}
            placeholder="tu@email.com"
            placeholderTextColor="#52525B"
            keyboardType="email-address"
            autoCapitalize="none"
            value={loginEmail}
            onChangeText={setLoginEmail}
          />
        </View>

        <View>
          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={[styles.input, { textAlign: 'left', fontSize: 16 }]}
            placeholder="••••••••"
            placeholderTextColor="#52525B"
            secureTextEntry
            value={loginPassword}
            onChangeText={setLoginPassword}
          />
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, { marginTop: 10 }]} 
          onPress={handleLogin}
          disabled={isLoggingIn}
        >
          {isLoggingIn ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Entrar</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { setForgotEmail(loginEmail); setShowForgotPassword(true); }} style={{ marginTop: 16 }}>
          <Text style={{ color: '#7C3AED', textAlign: 'center', fontSize: 13, fontWeight: '600' }}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        <Text style={{ color: '#52525B', textAlign: 'center', marginTop: 20, fontSize: 13 }}>
          ¿No tienes acceso? Consulta con tu profesor.
        </Text>
      </View>

      {/* Modal Forgot Password */}
      {showForgotPassword && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24, zIndex: 100 }}>
          <View style={{ backgroundColor: '#18181B', borderRadius: 16, padding: 28, width: '100%', maxWidth: 380, borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)' }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 6 }}>Restablecer contraseña</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 20, lineHeight: 18 }}>Ingresá tu email y te enviamos un link para crear una nueva contraseña.</Text>
            <TextInput
              style={[styles.input, { textAlign: 'left', fontSize: 15, marginBottom: 16 }]}
              placeholder="tu@email.com"
              placeholderTextColor="#52525B"
              keyboardType="email-address"
              autoCapitalize="none"
              value={forgotEmail}
              onChangeText={setForgotEmail}
              autoFocus
            />
            {forgotMessage ? (
              <Text style={{ color: forgotMessage.startsWith('✓') ? '#10B981' : '#EF4444', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>{forgotMessage}</Text>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: '#3F3F46', alignItems: 'center' }}
                onPress={() => { setShowForgotPassword(false); setForgotMessage(''); setForgotEmail(''); }}
              >
                <Text style={{ color: '#9CA3AF', fontWeight: '600', fontSize: 14 }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: '#7C3AED', alignItems: 'center', opacity: forgotLoading ? 0.6 : 1 }}
                onPress={handleForgotPassword}
                disabled={forgotLoading}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{forgotLoading ? 'Enviando...' : 'Enviar link'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );

  // =====================================================
  // RENDER PRINCIPAL
  // =====================================================
  return (
    <SafeAreaView style={styles.container}>
      {currentScreen !== 'chatWindow' ? (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>

          {currentScreen === 'login' && renderLogin()}
          {currentScreen === 'home' && renderHome()}
          {currentScreen === 'workout' && renderWorkout()}
          {currentScreen === 'progress' && renderProgress()}
          {currentScreen === 'community' && renderCommunity()}
          {currentScreen === 'socialProfile' && renderSocialProfile()}
          {currentScreen === 'inbox' && renderInbox()}
          {currentScreen === 'nutrition' && renderNutrition()}
          {currentScreen === 'profile' && renderProfile()}

        </KeyboardAvoidingView>
      ) : (
        renderChatWindow()
      )}

      {/* Social Modals */}
      <Modal visible={showNewPostModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: '#FAFAFA', fontSize: 20, fontWeight: '800' }}>Nuevo Post</Text>
              <TouchableOpacity onPress={() => setShowNewPostModal(false)}>
                <X size={24} color="#A1A1AA" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={{ height: 200, backgroundColor: '#27272A', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden' }} onPress={async () => {
              // Simulating file pick
              setNewPostImage('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800');
            }}>
              {newPostImage ? <Image source={{ uri: newPostImage }} style={{ width: '100%', height: '100%' }} /> : <><Camera size={36} color="#A1A1AA" /><Text style={{ color: '#A1A1AA', marginTop: 12, fontWeight: '600' }}>Toca para subir foto</Text></>}
            </TouchableOpacity>
            <TextInput style={[styles.input, { height: 100, textAlign: 'left', textAlignVertical: 'top', fontSize: 15, padding: 16, borderRadius: 16, marginBottom: 20 }]} placeholder="Escribe un pie de foto... #entrenamiento" placeholderTextColor="#71717A" multiline value={newPostCaption} onChangeText={setNewPostCaption} />
            <TouchableOpacity style={styles.saveButton} onPress={submitPost}>
              <Text style={styles.saveButtonText}>Publicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showCommentsFor !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { marginTop: 'auto', marginBottom: 0, height: '75%', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#27272A' }}>
              <Text style={{ color: '#FAFAFA', fontSize: 18, fontWeight: '800' }}>Comentarios</Text>
              <TouchableOpacity onPress={() => setShowCommentsFor(null)}>
                <X size={24} color="#A1A1AA" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }}>
              {comments.length === 0 ? <Text style={{ color: '#A1A1AA', textAlign: 'center', marginTop: 40 }}>Sé el primero en comentar.</Text> :
                comments.map(c => (
                  <View key={c.id} style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                    <Image source={{ uri: c.user_avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100' }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#FAFAFA', fontWeight: '700', fontSize: 15, marginBottom: 4 }}>{c.username || c.user_name}</Text>
                      <Text style={{ color: '#D4D4D8', fontSize: 14, lineHeight: 20 }}>{c.content}</Text>
                      <Text style={{ color: '#71717A', fontSize: 11, marginTop: 4 }}>{new Date(c.created_at).toLocaleDateString()}</Text>
                    </View>
                  </View>
                ))
              }
            </ScrollView>
            <View style={{ flexDirection: 'row', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#27272A', alignItems: 'center' }}>
              <TextInput style={[styles.input, { flex: 1, padding: 12, borderRadius: 24, fontSize: 14, textAlign: 'left', marginBottom: 0 }]} placeholder="Agrega un comentario..." placeholderTextColor="#A1A1AA" value={newComment} onChangeText={setNewComment} />
              <TouchableOpacity style={[styles.iconButtonPrimary, { marginLeft: 12, width: 44, height: 44, borderRadius: 22, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center' }]} onPress={submitComment}>
                <Send size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* BOTTOM TAB BAR */}
      {isAuthenticated && <View style={styles.tabBar}>
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
          onPress={() => { fetchNutritionPlan(loggedInUser?.id); setCurrentScreen('nutrition'); }}
        >
          <Utensils color={currentScreen === 'nutrition' ? '#10B981' : '#52525B'} size={22} />
          <Text style={[styles.tabLabel, currentScreen === 'nutrition' && { color: '#10B981' }]}>Nutrición</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => { fetchFeed(); setCurrentScreen('community'); }}
        >
          <Users color={currentScreen === 'community' ? '#6366F1' : '#52525B'} size={22} />
          <Text style={[styles.tabLabel, currentScreen === 'community' && styles.tabLabelActive]}>Comunidad</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => {
            setCurrentScreen('profile');
            fetchProgressPhotos();
          }}
        >
          <User color={currentScreen === 'profile' ? '#6366F1' : '#52525B'} size={22} />
          <Text style={[styles.tabLabel, currentScreen === 'profile' && styles.tabLabelActive]}>Perfil</Text>
        </TouchableOpacity>
      </View>}
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

  // WEEKLY CALENDAR
  weekCard: {
    backgroundColor: '#18181B', borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: '#27272A', marginBottom: 12,
  },
  weekCardTitle: { color: '#FAFAFA', fontSize: 15, fontWeight: '700' },
  weekDaysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDayCol: { alignItems: 'center', gap: 6 },
  weekDayLabel: { color: '#52525B', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  weekDayCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#27272A', borderWidth: 1.5, borderColor: '#3F3F46',
    alignItems: 'center', justifyContent: 'center',
  },
  weekDayTrained: { backgroundColor: '#10B981', borderColor: '#10B981' },
  weekDayToday: { borderColor: '#6366F1', borderWidth: 2 },
  weekDayFuture: { backgroundColor: '#18181B', borderColor: '#27272A' },

  // WEIGHT CARD
  weightCard: {
    backgroundColor: '#18181B', borderRadius: 20, padding: 18,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderColor: '#27272A', marginBottom: 12,
  },
  weightCardLabel: { color: '#71717A', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  weightCardValue: { color: '#FAFAFA', fontSize: 28, fontWeight: '800', marginTop: 4 },

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
    borderTopColor: '#1C1C1F', paddingVertical: 10, paddingHorizontal: 4,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  tabItem: { flex: 1, alignItems: 'center', gap: 4 },
  tabLabel: { color: '#52525B', fontSize: 10, fontWeight: '600' },
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

  // SOCIAL MODALS & BUTTONS
  iconButtonPrimary: { backgroundColor: '#6366F1', padding: 12, borderRadius: 12 },
  iconButtonSecondary: { backgroundColor: '#27272A', padding: 12, borderRadius: 12 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#18181B', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#27272A' },
  profileAvatarModal: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: '#6366F1' },

  profileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  gridItem: { width: '31%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden' },

  // DM CARDS
  dmConvCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#18181B', padding: 16, borderRadius: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#27272A'
  },

  // POST CARDS
  postCard: {
    backgroundColor: '#18181B', borderRadius: 24, padding: 20,
    marginBottom: 20, borderWidth: 1, borderColor: '#27272A'
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  postAvatar: { width: 44, height: 44, borderRadius: 22 },
  postImage: { width: '100%', aspectRatio: 1, borderRadius: 16, marginBottom: 16 },
  postActions: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  postActionBtn: { flexDirection: 'row', alignItems: 'center', padding: 8, paddingHorizontal: 12, borderRadius: 12 },
  postCaption: { paddingTop: 4 }
});
