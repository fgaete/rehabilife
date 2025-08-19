import React from 'react';
import './Home.css';

const Home = () => {
  const tips = {
    nutrition: [
      {
        icon: '🥗',
        title: 'Variedad de colores',
        description: 'Incluye frutas y verduras de diferentes colores en cada comida para obtener diversos nutrientes.'
      },
      {
        icon: '🍽️',
        title: 'Porciones controladas',
        description: 'Usa platos más pequeños para controlar naturalmente el tamaño de las porciones.'
      },
      {
        icon: '⏰',
        title: 'Horarios regulares',
        description: 'Mantén horarios fijos de comida para regular tu metabolismo y mejorar la digestión.'
      }
    ],
    hydration: [
      {
        icon: '💧',
        title: 'Agua al despertar',
        description: 'Bebe un vaso de agua al levantarte para rehidratar tu cuerpo después del descanso nocturno.'
      },
      {
        icon: '🍋',
        title: 'Sabores naturales',
        description: 'Agrega limón, pepino o menta al agua para hacerla más atractiva y aumentar tu consumo.'
      },
      {
        icon: '📱',
        title: 'Recordatorios',
        description: 'Configura alarmas cada 2 horas para recordarte beber agua durante el día.'
      }
    ],
    exercise: [
      {
        icon: '🚶',
        title: 'Movimiento constante',
        description: 'Levántate y camina 5 minutos cada hora si trabajas sentado para mantener la circulación.'
      },
      {
        icon: '💪',
        title: 'Progresión gradual',
        description: 'Aumenta la intensidad del ejercicio gradualmente para evitar lesiones y mantener la motivación.'
      },
      {
        icon: '🎯',
        title: 'Metas realistas',
        description: 'Establece objetivos alcanzables y celebra cada logro para mantener la constancia.'
      }
    ],
    leisure: [
      {
        icon: '📚',
        title: 'Desconexión digital',
        description: 'Dedica al menos 30 minutos al día a actividades sin pantallas como leer o meditar.'
      },
      {
        icon: '🎨',
        title: 'Creatividad',
        description: 'Practica actividades creativas como dibujar, escribir o tocar un instrumento para reducir el estrés.'
      },
      {
        icon: '🌿',
        title: 'Tiempo en naturaleza',
        description: 'Pasa tiempo al aire libre regularmente para mejorar tu estado de ánimo y reducir la ansiedad.'
      }
    ]
  };

  const motivationalQuotes = [
    {
      quote: "El cuidado personal no es egoísmo, es supervivencia.",
      author: "Audre Lorde"
    },
    {
      quote: "Tu cuerpo puede hacerlo. Es tu mente la que necesitas convencer.",
      author: "Anónimo"
    },
    {
      quote: "La salud es una relación entre tú y tu cuerpo.",
      author: "Terri Guillemets"
    },
    {
      quote: "Pequeños cambios diarios llevan a grandes resultados.",
      author: "Anónimo"
    }
  ];

  const todayQuote = motivationalQuotes[new Date().getDay() % motivationalQuotes.length];

  return (
    <div className="home-container">
      <div className="welcome-section">
        <h1>🌟 Bienvenido a tu Espacio de Bienestar</h1>
        <p>Descubre consejos y tips para mejorar tu calidad de vida cada día</p>
      </div>

      <div className="quote-section">
        <div className="daily-quote">
          <h3>💭 Reflexión del Día</h3>
          <blockquote>
            <p>"{todayQuote.quote}"</p>
            <cite>- {todayQuote.author}</cite>
          </blockquote>
        </div>
      </div>

      <div className="tips-grid">
        {/* Sección de Nutrición */}
        <div className="tips-category">
          <div className="category-header">
            <h2>🍎 Nutrición</h2>
            <p>Consejos para una alimentación saludable</p>
          </div>
          <div className="tips-list">
            {tips.nutrition.map((tip, index) => (
              <div key={index} className="tip-card">
                <div className="tip-icon">{tip.icon}</div>
                <div className="tip-content">
                  <h4>{tip.title}</h4>
                  <p>{tip.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sección de Hidratación */}
        <div className="tips-category">
          <div className="category-header">
            <h2>💧 Hidratación</h2>
            <p>Mantén tu cuerpo bien hidratado</p>
          </div>
          <div className="tips-list">
            {tips.hydration.map((tip, index) => (
              <div key={index} className="tip-card">
                <div className="tip-icon">{tip.icon}</div>
                <div className="tip-content">
                  <h4>{tip.title}</h4>
                  <p>{tip.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sección de Ejercicio */}
        <div className="tips-category">
          <div className="category-header">
            <h2>🏋️ Ejercicio</h2>
            <p>Mantente activo y saludable</p>
          </div>
          <div className="tips-list">
            {tips.exercise.map((tip, index) => (
              <div key={index} className="tip-card">
                <div className="tip-icon">{tip.icon}</div>
                <div className="tip-content">
                  <h4>{tip.title}</h4>
                  <p>{tip.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sección de Ocio */}
        <div className="tips-category">
          <div className="category-header">
            <h2>🎮 Ocio y Bienestar</h2>
            <p>Equilibra tu tiempo y disfruta la vida</p>
          </div>
          <div className="tips-list">
            {tips.leisure.map((tip, index) => (
              <div key={index} className="tip-card">
                <div className="tip-icon">{tip.icon}</div>
                <div className="tip-content">
                  <h4>{tip.title}</h4>
                  <p>{tip.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="wellness-footer">
        <div className="footer-content">
          <h3>🌱 Recuerda</h3>
          <p>
            El bienestar es un viaje, no un destino. Cada pequeño paso cuenta y cada día 
            es una nueva oportunidad para cuidar de ti mismo. ¡Tú puedes lograrlo!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;