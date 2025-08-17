from typing import List, Dict
from datetime import datetime, date
from models.user import User
from models.nutrition import DailyNutritionSummary, FoodCategory, MealType

class NutritionAdviceEngine:
    """Motor de consejos nutricionales inteligentes"""
    
    def __init__(self):
        self.advice_templates = {
            "high_protein_breakfast": [
                "¡Excelente! Tu desayuno rico en proteínas te ayudará a mantener la saciedad durante la mañana.",
                "Perfecto desayuno proteico. Esto acelerará tu metabolismo para el resto del día.",
                "Gran elección con las proteínas en el desayuno. Tu cuerpo te lo agradecerá."
            ],
            "low_protein_breakfast": [
                "Considera agregar más proteínas a tu desayuno: huevos, yogur griego o avena con nueces.",
                "Tu desayuno podría beneficiarse de más proteínas para mayor saciedad.",
                "Intenta incluir una fuente de proteína en tu próximo desayuno."
            ],
            "alcohol_consumed": [
                "Has consumido alcohol hoy. Recuerda hidratarte extra y considera una comida rica en antioxidantes.",
                "El alcohol puede afectar tu recuperación. Asegúrate de beber mucha agua y descansar bien.",
                "Después del alcohol, tu cuerpo necesita vitaminas B. Considera alimentos como aguacate o plátano."
            ],
            "low_water": [
                "Tu hidratación está por debajo del objetivo. ¡Bebe más agua durante el día!",
                "Recuerda: la hidratación es clave para tu metabolismo y recuperación.",
                "Tu cuerpo necesita más agua. Intenta llevar una botella contigo."
            ],
            "high_processed_food": [
                "Has consumido bastantes alimentos procesados hoy. Intenta incluir más alimentos naturales.",
                "Los alimentos procesados pueden afectar tu energía. Considera opciones más naturales.",
                "Tu cuerpo se beneficiaría de más alimentos frescos y menos procesados."
            ],
            "good_balance": [
                "¡Excelente balance nutricional hoy! Sigue así.",
                "Tu alimentación de hoy está muy equilibrada. ¡Felicitaciones!",
                "Perfecto equilibrio entre proteínas, carbohidratos y grasas saludables."
            ],
            "low_calories": [
                "Tus calorías están por debajo del objetivo. Asegúrate de comer lo suficiente para tu metabolismo.",
                "Considera agregar snacks saludables para alcanzar tus metas calóricas.",
                "Tu cuerpo necesita energía suficiente. No tengas miedo de comer más alimentos nutritivos."
            ],
            "high_calories": [
                "Has superado tu meta calórica. Considera porciones más pequeñas o más actividad física.",
                "Tus calorías están altas hoy. Intenta equilibrar con ejercicio o ajustar las próximas comidas.",
                "Recuerda que la calidad de las calorías es tan importante como la cantidad."
            ],
            "pre_workout": [
                "Si vas al gimnasio hoy, considera un snack con carbohidratos 30-60 minutos antes.",
                "Para tu entrenamiento, una banana o avena te dará energía rápida.",
                "Un poco de cafeína natural (té verde) puede potenciar tu entrenamiento."
            ],
            "post_workout": [
                "Después del gimnasio, tu cuerpo necesita proteínas para la recuperación muscular.",
                "Considera una comida con proteínas y carbohidratos dentro de 2 horas post-entrenamiento.",
                "Tu ventana anabólica está abierta. ¡Aprovecha con buenas proteínas!"
            ],
            "evening_advice": [
                "Para la cena, opta por proteínas magras y vegetales. Evita carbohidratos pesados.",
                "Tu cena debería ser la comida más ligera del día para mejor descanso.",
                "Considera una infusión relajante después de cenar para mejor digestión."
            ]
        }
    
    async def generate_advice(self, summary: DailyNutritionSummary, user: User) -> List[str]:
        """Generar consejos personalizados basados en el resumen nutricional"""
        advice = []
        
        # Análisis de desayuno
        breakfast_advice = self._analyze_breakfast(summary)
        if breakfast_advice:
            advice.extend(breakfast_advice)
        
        # Análisis de alcohol
        alcohol_advice = self._analyze_alcohol_consumption(summary)
        if alcohol_advice:
            advice.extend(alcohol_advice)
        
        # Análisis de hidratación
        hydration_advice = self._analyze_hydration(summary, user)
        if hydration_advice:
            advice.extend(hydration_advice)
        
        # Análisis de alimentos procesados
        processed_advice = self._analyze_processed_foods(summary)
        if processed_advice:
            advice.extend(processed_advice)
        
        # Análisis calórico
        calorie_advice = self._analyze_calories(summary, user)
        if calorie_advice:
            advice.extend(calorie_advice)
        
        # Consejos de ejercicio
        exercise_advice = self._generate_exercise_advice(user)
        if exercise_advice:
            advice.extend(exercise_advice)
        
        # Consejos de horario
        timing_advice = self._generate_timing_advice()
        if timing_advice:
            advice.extend(timing_advice)
        
        # Si todo está bien, dar refuerzo positivo
        if not advice:
            advice.extend(self._get_random_advice("good_balance"))
        
        return advice[:3]  # Máximo 3 consejos por día
    
    def _analyze_breakfast(self, summary: DailyNutritionSummary) -> List[str]:
        """Analizar el desayuno del usuario"""
        breakfast_meals = summary.meals_by_type.get(MealType.BREAKFAST.value, [])
        
        if not breakfast_meals:
            return ["No has registrado desayuno hoy. Es la comida más importante del día."]
        
        total_protein = sum(meal.nutrition.protein for meal in breakfast_meals)
        
        if total_protein >= 20:
            return self._get_random_advice("high_protein_breakfast")
        elif total_protein < 10:
            return self._get_random_advice("low_protein_breakfast")
        
        return []
    
    def _analyze_alcohol_consumption(self, summary: DailyNutritionSummary) -> List[str]:
        """Analizar consumo de alcohol"""
        alcohol_entries = []
        
        for meal_type, meals in summary.meals_by_type.items():
            for meal in meals:
                if meal.category == FoodCategory.ALCOHOL:
                    alcohol_entries.append(meal)
        
        if alcohol_entries:
            return self._get_random_advice("alcohol_consumed")
        
        return []
    
    def _analyze_hydration(self, summary: DailyNutritionSummary, user: User) -> List[str]:
        """Analizar hidratación"""
        target_water = 2000  # ml por defecto
        
        if user.profile and user.profile.weight:
            target_water = user.profile.weight * 35  # 35ml por kg
        
        if summary.total_water < target_water * 0.7:  # Menos del 70% del objetivo
            return self._get_random_advice("low_water")
        
        return []
    
    def _analyze_processed_foods(self, summary: DailyNutritionSummary) -> List[str]:
        """Analizar consumo de alimentos procesados"""
        processed_count = 0
        total_meals = 0
        
        for meal_type, meals in summary.meals_by_type.items():
            for meal in meals:
                total_meals += 1
                if meal.category == FoodCategory.PROCESSED:
                    processed_count += 1
        
        if total_meals > 0 and (processed_count / total_meals) > 0.4:  # Más del 40% procesados
            return self._get_random_advice("high_processed_food")
        
        return []
    
    def _analyze_calories(self, summary: DailyNutritionSummary, user: User) -> List[str]:
        """Analizar consumo calórico"""
        target_calories = 2000  # Por defecto
        
        # Calcular calorías objetivo basado en perfil
        if user.profile and user.profile.age and user.profile.weight and user.profile.height:
            # Cálculo básico BMR
            bmr = 88.362 + (13.397 * user.profile.weight) + (4.799 * user.profile.height) - (5.677 * user.profile.age)
            
            activity_multipliers = {
                "sedentary": 1.2,
                "light": 1.375,
                "moderate": 1.55,
                "active": 1.725,
                "very_active": 1.9
            }
            
            multiplier = activity_multipliers.get(user.profile.activity_level.value, 1.55)
            target_calories = bmr * multiplier
            
            if user.profile.goal == "weight_loss":
                target_calories -= 500
            elif user.profile.goal == "weight_gain":
                target_calories += 500
        
        if summary.total_calories < target_calories * 0.8:  # Menos del 80%
            return self._get_random_advice("low_calories")
        elif summary.total_calories > target_calories * 1.2:  # Más del 120%
            return self._get_random_advice("high_calories")
        
        return []
    
    def _generate_exercise_advice(self, user: User) -> List[str]:
        """Generar consejos relacionados con ejercicio"""
        current_hour = datetime.now().hour
        
        # Consejos pre-entrenamiento (tarde)
        if 15 <= current_hour <= 18 and user.profile and user.profile.gym_days_per_week >= 3:
            return self._get_random_advice("pre_workout")
        
        # Consejos post-entrenamiento (noche)
        if 19 <= current_hour <= 21:
            return self._get_random_advice("post_workout")
        
        return []
    
    def _generate_timing_advice(self) -> List[str]:
        """Generar consejos basados en la hora del día"""
        current_hour = datetime.now().hour
        
        # Consejos para la cena
        if 18 <= current_hour <= 20:
            return self._get_random_advice("evening_advice")
        
        return []
    
    def _get_random_advice(self, category: str) -> List[str]:
        """Obtener consejo aleatorio de una categoría"""
        import random
        
        if category in self.advice_templates:
            return [random.choice(self.advice_templates[category])]
        
        return []

# Instancia global del motor de consejos
advice_engine = NutritionAdviceEngine()

async def get_nutrition_advice(summary: DailyNutritionSummary, user: User) -> List[str]:
    """Función principal para obtener consejos nutricionales"""
    return await advice_engine.generate_advice(summary, user)