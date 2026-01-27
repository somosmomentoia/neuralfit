'use client';

import { useEffect, useState, useMemo } from 'react';
import { apiFetch } from '@/lib/api';
import styles from './page.module.css';

interface Overview {
  totalSessions: number;
  totalMinutes: number;
  totalCalories: number;
  totalExercises: number;
  currentStreak: number;
  bestStreak: number;
  avgSessionDuration: number;
  avgCaloriesPerSession: number;
  thisMonthSessions: number;
  monthlyGrowth: number;
}

interface WeeklyData {
  week: string;
  sessions: number;
  calories: number;
  minutes: number;
}

interface MonthlyData {
  month: string;
  sessions: number;
  calories: number;
}

interface RecentSession {
  id: string;
  date: string;
  durationMinutes: number | null;
  caloriesBurned: number | null;
  isFreeWorkout: boolean;
}

interface TopCalorieExercise {
  name: string;
  calories: number;
  avgCalories: number;
}

interface ProgressData {
  overview: Overview;
  sessionsByDay: Record<number, number>;
  weeklyData: WeeklyData[];
  monthlyData: MonthlyData[];
  topMuscleGroups: { name: string; count: number }[];
  topCalorieExercises: {
    week: TopCalorieExercise[];
    byMonth: Record<string, TopCalorieExercise[]>;
    year: TopCalorieExercise[];
  };
  recentSessions: {
    week: RecentSession[];
    byMonth: Record<string, RecentSession[]>;
    year: RecentSession[];
  };
  lastSession: RecentSession | null;
}

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTH_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function ProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<'week' | 'month' | 'year'>('week');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [flippedCard, setFlippedCard] = useState<'calories' | 'sessions' | null>(null);
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);
  const [sessionsCardExpanded, setSessionsCardExpanded] = useState(false);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`/client/progress?year=${selectedYear}`);
        const progressData = await res.json();
        setData(progressData);
      } catch (error) {
        console.error('Error fetching progress:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, [selectedYear]);

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h`;
    }
    return `${minutes}m`;
  };

  // Calcular datos según el período seleccionado
  const periodData = useMemo(() => {
    if (!data) return { calories: 0, sessions: 0, caloriesGrowth: 0, sessionsGrowth: 0 };
    
    const weeklyData = data.weeklyData || [];
    const monthlyData = data.monthlyData || [];
    
    if (periodFilter === 'week') {
      // Última semana de weeklyData
      const lastWeek = weeklyData[weeklyData.length - 1] || { calories: 0, sessions: 0 };
      const prevWeek = weeklyData[weeklyData.length - 2] || { calories: 0, sessions: 0 };
      const caloriesGrowth = prevWeek.calories > 0 
        ? Math.round(((lastWeek.calories - prevWeek.calories) / prevWeek.calories) * 100)
        : lastWeek.calories > 0 ? 100 : 0;
      const sessionsGrowth = prevWeek.sessions > 0
        ? Math.round(((lastWeek.sessions - prevWeek.sessions) / prevWeek.sessions) * 100)
        : lastWeek.sessions > 0 ? 100 : 0;
      return {
        calories: lastWeek.calories,
        sessions: lastWeek.sessions,
        caloriesGrowth,
        sessionsGrowth
      };
    } else if (periodFilter === 'month') {
      // Buscar el mes seleccionado en monthlyData
      const monthName = MONTH_SHORT[selectedMonth];
      const monthDataItem = monthlyData.find(m => m.month === monthName) || { calories: 0, sessions: 0 };
      const monthIndex = monthlyData.findIndex(m => m.month === monthName);
      const prevMonth = monthIndex > 0 ? monthlyData[monthIndex - 1] : { calories: 0, sessions: 0 };
      const caloriesGrowth = prevMonth.calories > 0
        ? Math.round(((monthDataItem.calories - prevMonth.calories) / prevMonth.calories) * 100)
        : monthDataItem.calories > 0 ? 100 : 0;
      const sessionsGrowth = prevMonth.sessions > 0
        ? Math.round(((monthDataItem.sessions - prevMonth.sessions) / prevMonth.sessions) * 100)
        : monthDataItem.sessions > 0 ? 100 : 0;
      return {
        calories: monthDataItem.calories,
        sessions: monthDataItem.sessions,
        caloriesGrowth,
        sessionsGrowth
      };
    } else {
      // Año completo
      const totalCalories = monthlyData.reduce((acc, m) => acc + m.calories, 0);
      const totalSessions = monthlyData.reduce((acc, m) => acc + m.sessions, 0);
      return {
        calories: totalCalories,
        sessions: totalSessions,
        caloriesGrowth: data.overview.monthlyGrowth,
        sessionsGrowth: data.overview.monthlyGrowth
      };
    }
  }, [data, periodFilter, selectedMonth]);

  // Datos del gráfico según período
  const chartData = useMemo(() => {
    if (!data) return [];
    
    const weeklyData = data.weeklyData || [];
    const monthlyData = data.monthlyData || [];
    const sessionsByDay = data.sessionsByDay || {};
    
    if (periodFilter === 'week') {
      return [1, 2, 3, 4, 5, 6, 0].map(day => ({
        label: DAY_LABELS[day === 0 ? 6 : day - 1],
        value: sessionsByDay[day] || 0
      }));
    } else if (periodFilter === 'month') {
      // Mostrar semanas del mes
      return weeklyData.slice(-4).map((w, i) => ({
        label: `S${i + 1}`,
        value: w.sessions
      }));
    } else {
      // Mostrar meses del año
      return monthlyData.map(m => ({
        label: m.month,
        value: m.sessions
      }));
    }
  }, [data, periodFilter]);

  const maxChartValue = useMemo(() => {
    return Math.max(...chartData.map(d => d.value), 1);
  }, [chartData]);

  const totalChartSessions = useMemo(() => {
    return chartData.reduce((acc, d) => acc + d.value, 0);
  }, [chartData]);

  // Mapa de calor para la card de sesiones - cada entrenamiento individual
  const heatmapData = useMemo(() => {
    if (!data) return [];
    
    const sessions = periodFilter === 'week' 
      ? data.recentSessions?.week 
      : periodFilter === 'month' 
        ? data.recentSessions?.byMonth?.[MONTH_SHORT[selectedMonth]] 
        : data.recentSessions?.year;
    
    if (!sessions || sessions.length === 0) return [];
    
    // Calcular intensidad máxima para normalizar
    const maxCalories = Math.max(...sessions.map(s => s.caloriesBurned || 0), 1);
    const maxMinutes = Math.max(...sessions.map(s => s.durationMinutes || 0), 1);
    
    // Cada sesión es un punto en el heatmap
    return sessions.map(session => {
      const date = new Date(session.date);
      const calories = session.caloriesBurned || 0;
      const minutes = session.durationMinutes || 0;
      // Intensidad basada en calorías y duración (promedio ponderado)
      const intensity = (calories / maxCalories * 0.6) + (minutes / maxMinutes * 0.4);
      
      return {
        id: session.id,
        date,
        dateStr: date.toISOString().split('T')[0],
        intensity: Math.min(intensity, 1),
        calories,
        minutes,
        isFreeWorkout: session.isFreeWorkout
      };
    }).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [data, periodFilter, selectedMonth]);

  // Información contextual de la barra seleccionada
  const selectedBarInfo = useMemo(() => {
    if (selectedBarIndex === null || !data) return null;
    
    const barData = chartData[selectedBarIndex];
    if (!barData) return null;
    
    const weeklyData = data.weeklyData || [];
    const monthlyData = data.monthlyData || [];
    
    if (periodFilter === 'week') {
      // Días de la semana: obtener sesiones del día
      const dayIndex = [1, 2, 3, 4, 5, 6, 0][selectedBarIndex];
      const sessions = data.recentSessions?.week?.filter(s => {
        const sessionDay = new Date(s.date).getDay();
        return sessionDay === dayIndex;
      }) || [];
      const totalCalories = sessions.reduce((acc, s) => acc + (s.caloriesBurned || 0), 0);
      const totalMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
      
      return {
        title: DAY_LABELS[selectedBarIndex],
        sessions: barData.value,
        calories: totalCalories,
        minutes: totalMinutes,
        details: sessions.slice(0, 3)
      };
    } else if (periodFilter === 'month') {
      // Semanas del mes
      const weekData = weeklyData.slice(-4)[selectedBarIndex];
      return {
        title: `Semana ${selectedBarIndex + 1}`,
        sessions: weekData?.sessions || 0,
        calories: weekData?.calories || 0,
        minutes: weekData?.minutes || 0,
        details: []
      };
    } else {
      // Meses del año
      const monthData = monthlyData[selectedBarIndex];
      const monthSessions = data.recentSessions?.byMonth?.[monthData?.month] || [];
      const totalMinutes = monthSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
      
      return {
        title: MONTH_NAMES[selectedBarIndex] || monthData?.month,
        sessions: monthData?.sessions || 0,
        calories: monthData?.calories || 0,
        minutes: totalMinutes,
        details: monthSessions.slice(0, 3)
      };
    }
  }, [selectedBarIndex, data, chartData, periodFilter]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <span>Cargando tu progreso...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>No se pudo cargar el progreso</p>
        </div>
      </div>
    );
  }

  const getPeriodLabel = () => {
    if (periodFilter === 'week') return 'Semana';
    if (periodFilter === 'month') return MONTH_NAMES[selectedMonth];
    return `${selectedYear}`;
  };

  const getActivityTitle = () => {
    if (periodFilter === 'week') return 'Actividad Semanal';
    if (periodFilter === 'month') return `Actividad de ${MONTH_NAMES[selectedMonth]}`;
    return 'Actividad Anual';
  };

  return (
    <div className={styles.container}>
      {/* Period Filter Pills */}
      <div className={styles.periodFilterContainer}>
        <div className={styles.periodPills}>
          <button 
            className={`${styles.periodPill} ${periodFilter === 'week' ? styles.periodPillActive : ''}`}
            onClick={() => { setPeriodFilter('week'); setShowMonthPicker(false); setSelectedBarIndex(null); }}
          >
            Semana
          </button>
          <button 
            className={`${styles.periodPill} ${periodFilter === 'month' ? styles.periodPillActive : ''}`}
            onClick={() => { setPeriodFilter('month'); setShowMonthPicker(!showMonthPicker); setSelectedBarIndex(null); }}
          >
            {periodFilter === 'month' ? MONTH_SHORT[selectedMonth] : 'Mes'}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <button 
            className={`${styles.periodPill} ${periodFilter === 'year' ? styles.periodPillActive : ''}`}
            onClick={() => { setPeriodFilter('year'); setShowMonthPicker(false); setSelectedBarIndex(null); }}
          >
            Año
          </button>
        </div>
        
        {/* Month Picker with Year Selector */}
        {showMonthPicker && periodFilter === 'month' && (
          <div className={styles.monthPickerContainer}>
            {/* Year Selector */}
            <div className={styles.yearSelector}>
              <button 
                className={styles.yearArrow}
                onClick={(e) => { e.stopPropagation(); setSelectedYear(prev => prev - 1); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <span className={styles.yearLabel}>{selectedYear}</span>
              <button 
                className={styles.yearArrow}
                onClick={(e) => { e.stopPropagation(); setSelectedYear(prev => Math.min(prev + 1, new Date().getFullYear())); }}
                disabled={selectedYear >= new Date().getFullYear()}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
            {/* Month Grid */}
            <div className={styles.monthPicker}>
              {MONTH_SHORT.map((month, index) => {
                const isCurrentYear = selectedYear === new Date().getFullYear();
                const isFutureMonth = isCurrentYear && index > new Date().getMonth();
                return (
                  <button
                    key={month}
                    className={`${styles.monthPickerItem} ${selectedMonth === index ? styles.monthPickerItemActive : ''} ${isFutureMonth ? styles.monthPickerItemDisabled : ''}`}
                    onClick={() => { if (!isFutureMonth) { setSelectedMonth(index); setShowMonthPicker(false); } }}
                    disabled={isFutureMonth}
                  >
                    {month}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards Row */}
      <div className={styles.statsRow}>
        {/* Calories Card - Flippable */}
        <div 
          className={`${styles.flipCard} ${flippedCard === 'calories' ? styles.flipped : ''}`}
          onClick={() => setFlippedCard(flippedCard === 'calories' ? null : 'calories')}
        >
          <div className={styles.flipCardInner}>
            {/* Front */}
            <div className={styles.flipCardFront}>
              <div className={styles.statHeader}>
                <svg className={styles.statIconSvg} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 23c-3.5 0-6.4-2.9-6.4-6.4 0-2.5 2.1-5.1 4.2-7.6.6-.7 1.2-1.4 1.7-2.1.2-.2.4-.3.5-.3.1 0 .3.1.5.3.5.7 1.1 1.4 1.7 2.1 2.1 2.5 4.2 5.1 4.2 7.6 0 3.5-2.9 6.4-6.4 6.4z"/>
                </svg>
                <span className={styles.statTitle}>Calorías quemadas</span>
              </div>
              <div className={styles.statValueRow}>
                <span className={styles.statValue}>{periodData.calories.toLocaleString()}</span>
              </div>
              <div className={styles.statUnit}>Kcal</div>
              <div className={styles.statGrowth}>
                <span className={periodData.caloriesGrowth >= 0 ? styles.growthPositive : styles.growthNegative}>
                  {periodData.caloriesGrowth >= 0 ? '+' : ''}{periodData.caloriesGrowth}%
                </span>
              </div>
              <div className={styles.flipHint}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 1l4 4-4 4"/>
                  <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                  <path d="M7 23l-4-4 4-4"/>
                  <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                </svg>
              </div>
            </div>
            {/* Back */}
            <div className={styles.flipCardBack}>
              <div className={styles.backHeader}>
                <svg className={styles.statIconSvg} width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 23c-3.5 0-6.4-2.9-6.4-6.4 0-2.5 2.1-5.1 4.2-7.6.6-.7 1.2-1.4 1.7-2.1.2-.2.4-.3.5-.3.1 0 .3.1.5.3.5.7 1.1 1.4 1.7 2.1 2.1 2.5 4.2 5.1 4.2 7.6 0 3.5-2.9 6.4-6.4 6.4z"/>
                </svg>
                <span className={styles.backTitle}>Top ejercicios</span>
              </div>
              <div className={styles.backList}>
                {(() => {
                  const exercises = periodFilter === 'week' 
                    ? data.topCalorieExercises?.week 
                    : periodFilter === 'month' 
                      ? data.topCalorieExercises?.byMonth?.[MONTH_SHORT[selectedMonth]] 
                      : data.topCalorieExercises?.year;
                  return (exercises || []).length > 0 ? (
                    (exercises || []).map((ex: TopCalorieExercise, i: number) => (
                      <div key={i} className={styles.backListItem}>
                        <span className={styles.backListName}>{ex.name}</span>
                        <span className={styles.backListValue}>{ex.calories}kcal</span>
                      </div>
                    ))
                  ) : (
                    <div className={styles.backEmpty}>Sin datos aún</div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Sessions Card - Flippable */}
        <div 
          className={`${styles.flipCard} ${flippedCard === 'sessions' ? styles.flipped : ''}`}
          onClick={() => setFlippedCard(flippedCard === 'sessions' ? null : 'sessions')}
        >
          <div className={styles.flipCardInner}>
            {/* Front */}
            <div className={styles.flipCardFront}>
              <div className={styles.statHeader}>
                <svg className={styles.statIconSvg} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span className={styles.statTitle}>Entrenamientos</span>
              </div>
              <div className={styles.statValueRow}>
                <span className={styles.statValue}>{periodData.sessions}</span>
              </div>
              <div className={styles.statUnit}>{getPeriodLabel()}</div>
              <div className={styles.statGrowth}>
                <span className={periodData.sessionsGrowth >= 0 ? styles.growthPositive : styles.growthNegative}>
                  {periodData.sessionsGrowth >= 0 ? '+' : ''}{periodData.sessionsGrowth}%
                </span>
              </div>
              <div className={styles.flipHint}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 1l4 4-4 4"/>
                  <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                  <path d="M7 23l-4-4 4-4"/>
                  <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                </svg>
              </div>
            </div>
            {/* Back */}
            <div className={styles.flipCardBack}>
              <div className={styles.backHeader}>
                <svg className={styles.statIconSvg} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span className={styles.backTitle}>Últimos entrenos</span>
              </div>
              <div className={styles.backList}>
                {(() => {
                  const sessions = periodFilter === 'week' 
                    ? data.recentSessions?.week 
                    : periodFilter === 'month' 
                      ? data.recentSessions?.byMonth?.[MONTH_SHORT[selectedMonth]] 
                      : data.recentSessions?.year;
                  return (sessions || []).length > 0 ? (
                    (sessions || []).slice(0, 5).map((session: RecentSession, i: number) => (
                      <div key={i} className={styles.backListItem}>
                        <span className={styles.backListName}>
                          {new Date(session.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                        </span>
                        <span className={styles.backListValue}>{session.durationMinutes || 0}m</span>
                      </div>
                    ))
                  ) : (
                    <div className={styles.backEmpty}>Sin entrenos aún</div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Section */}
      <div className={styles.weeklySection}>
        <h2 className={styles.sectionTitle}>{getActivityTitle()}</h2>
        
        <div className={styles.weeklyCard}>
          <div className={styles.weeklyHeader}>
            <div className={styles.weeklyLabel}>
              <svg className={styles.sessionsIconSvg} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>Sesiones</span>
            </div>
            <div className={styles.weeklyTotal}>
              <span className={styles.totalNumber}>{totalChartSessions}</span>
              <span className={styles.totalLabel}>sesiones</span>
            </div>
          </div>
          <p className={styles.weeklySubtext}>entrenamientos completados</p>
          
          <div className={styles.weeklyChart}>
            {chartData.map((item, index) => {
              const isSelected = selectedBarIndex === index;
              const barInfo = isSelected ? selectedBarInfo : null;
              
              return (
                <div 
                  key={index} 
                  className={`${styles.chartColumn} ${isSelected ? styles.chartColumnSelected : ''}`}
                  onClick={() => setSelectedBarIndex(isSelected ? null : index)}
                >
                  <div className={styles.chartBarContainer}>
                    <div className={styles.chartBarWrapper} style={{ height: `${(item.value / maxChartValue) * 100}%` }}>
                      {/* Mini tooltip sobre la barra */}
                      {barInfo && (
                        <div className={styles.miniTooltip}>
                          <span className={styles.miniTooltipValue}>{barInfo.calories}<small>kcal</small></span>
                          <span className={styles.miniTooltipDivider}>•</span>
                          <span className={styles.miniTooltipValue}>{barInfo.minutes}<small>min</small></span>
                        </div>
                      )}
                      <div 
                        className={`${styles.chartBar} ${item.value > 0 ? styles.chartBarActive : ''} ${isSelected ? styles.chartBarSelected : ''}`}
                      />
                    </div>
                  </div>
                  <span className={`${styles.chartLabel} ${isSelected ? styles.chartLabelSelected : ''}`}>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Period Summary - Collapsible with Heatmap */}
      <div className={`${styles.summaryCard} ${sessionsCardExpanded ? styles.summaryCardExpanded : ''}`}>
        <div 
          className={styles.summaryCardHeader}
          onClick={() => setSessionsCardExpanded(!sessionsCardExpanded)}
        >
          <div className={styles.summaryHeaderTop}>
            <span className={styles.summaryLabel}>
              {periodFilter === 'week' ? 'Esta semana' : periodFilter === 'month' ? MONTH_NAMES[selectedMonth] : `Año ${selectedYear}`}
            </span>
            <div className={styles.summaryHeaderRight}>
              <span className={`${styles.summaryBadge} ${periodData.sessionsGrowth >= 0 ? '' : styles.summaryBadgeNegative}`}>
                {periodData.sessionsGrowth >= 0 ? '▲' : '▼'} {Math.abs(periodData.sessionsGrowth)}%
              </span>
              <div className={`${styles.summaryExpandIcon} ${sessionsCardExpanded ? styles.rotated : ''}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
            </div>
          </div>
          <div className={styles.summaryValue}>{periodData.sessions} entrenamientos</div>
          <p className={styles.summarySubtext}>
            {periodData.sessionsGrowth >= 0 
              ? 'Vas mejor que el período anterior. ¡Sigue así!' 
              : 'Puedes mejorar. ¡Vamos a entrenar!'}
          </p>
        </div>
        
        {/* Heatmap expandible */}
        <div className={`${styles.heatmapWrapper} ${sessionsCardExpanded ? styles.expanded : ''}`}>
          <div className={styles.heatmapInner}>
            <div className={styles.heatmapContent}>
              <div className={styles.heatmapLabel}>Mapa de actividad</div>
              <div className={styles.heatmapGrid}>
                {heatmapData.length > 0 ? (
                  heatmapData.map((session, i) => (
                    <div 
                      key={session.id || i} 
                      className={styles.heatmapDay}
                      title={`${session.date.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short' })} • ${session.calories}kcal • ${session.minutes}min`}
                    >
                      <div 
                        className={`${styles.heatmapDot} ${session.isFreeWorkout ? styles.heatmapDotFree : ''}`}
                        style={{ 
                          transform: `scale(${0.5 + session.intensity * 0.5})`,
                          opacity: 0.6 + session.intensity * 0.4
                        }}
                      />
                      <span className={styles.heatmapDayLabel}>
                        {session.date.getDate()}/{session.date.getMonth() + 1}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className={styles.heatmapEmpty}>Sin entrenamientos en este período</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Total Summary */}
      <div className={styles.totalSection}>
        <h2 className={styles.sectionTitle}>Resumen total</h2>
        
        <div className={styles.totalGrid}>
          <div className={styles.totalCard}>
            <div className={styles.totalIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <span className={styles.totalValue}>{data.overview.totalSessions}</span>
            <span className={styles.totalLabelBottom}>Entrenamientos</span>
          </div>

          <div className={styles.totalCard}>
            <div className={styles.totalIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <span className={styles.totalValue}>{formatTime(data.overview.totalMinutes)}</span>
            <span className={styles.totalLabelBottom}>Tiempo total</span>
          </div>

          <div className={styles.totalCard}>
            <div className={styles.totalIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 23c-3.5 0-6.4-2.9-6.4-6.4 0-2.5 2.1-5.1 4.2-7.6.6-.7 1.2-1.4 1.7-2.1.2-.2.4-.3.5-.3.1 0 .3.1.5.3.5.7 1.1 1.4 1.7 2.1 2.1 2.5 4.2 5.1 4.2 7.6 0 3.5-2.9 6.4-6.4 6.4z"/>
              </svg>
            </div>
            <span className={styles.totalValue}>{data.overview.totalCalories.toLocaleString()}</span>
            <span className={styles.totalLabelBottom}>Calorías quemadas</span>
          </div>

          <div className={styles.totalCard}>
            <div className={styles.totalIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 20V10M12 20V4M6 20v-6"/>
              </svg>
            </div>
            <span className={styles.totalValue}>{data.overview.totalExercises}</span>
            <span className={styles.totalLabelBottom}>Ejercicios</span>
          </div>
        </div>
      </div>

      {/* Averages */}
      <div className={styles.averagesSection}>
        <h2 className={styles.sectionTitle}>Promedios</h2>
        
        <div className={styles.averagesGrid}>
          <div className={styles.averageCard}>
            <span className={styles.averageValue}>
              {data.overview.avgCaloriesPerSession}<span className={styles.averageUnit}>kcal</span>
            </span>
            <span className={styles.averageLabel}>Entrenamientos</span>
          </div>

          <div className={styles.averageCard}>
            <span className={styles.averageValue}>
              {data.overview.avgSessionDuration}<span className={styles.averageUnit}>m</span>
            </span>
            <span className={styles.averageLabel}>Por sesión</span>
          </div>
        </div>
      </div>
    </div>
  );
}
