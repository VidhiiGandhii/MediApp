export interface Condition {
  name: string;
  description: string;
  urgency: 'low' | 'medium' | 'high';
  seeDoctor: string;
  careTips: string[];
}

export const conditions: Record<string, Condition> = {
  cold: {
    name: 'Common Cold',
    description: 'A viral infection of the nose and throat (upper respiratory tract).',
    urgency: 'low',
    seeDoctor: 'If symptoms persist for more than 10 days or worsen after 5-7 days',
    careTips: [
      'Get plenty of rest',
      'Stay hydrated',
      'Use a humidifier',
      'Try over-the-counter cold medications',
      'Gargle with warm salt water for sore throat',
    ],
  },
  flu: {
    name: 'Influenza (Flu)',
    description: 'A viral infection that attacks your respiratory system.',
    urgency: 'medium',
    seeDoctor: 'Within 24-48 hours if symptoms are severe or if in a high-risk group',
    careTips: [
      'Get plenty of rest',
      'Stay hydrated',
      'Take antiviral medications if prescribed',
      'Use over-the-counter pain relievers',
      'Stay home to avoid spreading the virus',
    ],
  },
  migraine: {
    name: 'Migraine',
    description: 'A headache of varying intensity, often accompanied by nausea and sensitivity to light and sound.',
    urgency: 'medium',
    seeDoctor: 'If headaches are severe, frequent, or change in pattern',
    careTips: [
      'Rest in a quiet, dark room',
      'Apply hot or cold compresses',
      'Try relaxation techniques',
      'Stay hydrated',
      'Avoid triggers like certain foods or stress',
    ],
  },
  strep_throat: {
    name: 'Strep Throat',
    description: 'A bacterial infection causing inflammation and pain in the throat.',
    urgency: 'medium',
    seeDoctor: 'If you suspect strep throat, see a doctor for a test',
    careTips: [
      'Gargle with warm salt water',
      'Use throat lozenges',
      'Stay hydrated',
      'Get plenty of rest',
      'Take over-the-counter pain relievers',
    ],
  },
  sinusitis: {
    name: 'Sinusitis',
    description: 'Inflammation of the sinuses causing pain and pressure in the face.',
    urgency: 'low',
    seeDoctor: 'If symptoms last more than 10 days or are severe',
    careTips: [
      'Use a saline nasal spray',
      'Apply warm compresses',
      'Stay hydrated',
      'Use a humidifier',
      'Try over-the-counter decongestants',
    ],
  },
  allergies: {
    name: 'Allergies',
    description: 'An immune system response to a foreign substance that is not typically harmful to your body.',
    urgency: 'low',
    seeDoctor: 'If symptoms are severe or interfere with daily life',
    careTips: [
      'Identify and avoid triggers',
      'Use antihistamines',
      'Try nasal irrigation',
      'Keep windows closed during high pollen counts',
      'Use air purifiers',
    ],
  },
  anxiety: {
    name: 'Anxiety',
    description: 'A mental health disorder characterized by feelings of worry, anxiety, or fear that are strong enough to interfere with daily activities.',
    urgency: 'medium',
    seeDoctor: 'If anxiety is affecting your daily life or causing distress',
    careTips: [
      'Practice deep breathing exercises',
      'Try meditation or yoga',
      'Get regular exercise',
      'Limit caffeine and alcohol',
      'Get enough sleep',
    ],
  },
  gerd: {
    name: 'GERD (Acid Reflux)',
    description: 'A chronic condition where stomach acid flows back into the esophagus, causing heartburn and other symptoms.',
    urgency: 'low',
    seeDoctor: 'If symptoms occur more than twice a week',
    careTips: [
      'Eat smaller, more frequent meals',
      "Avoid trigger foods (spicy, fatty, acidic)",
      "Don't lie down after eating",
      'Elevate the head of your bed',
      'Maintain a healthy weight',
    ],
  },
};

export const symptomToConditionMap: Record<string, string[]> = {
  headache: ['migraine', 'flu', 'sinusitis', 'anxiety'],
  fever: ['flu', 'strep_throat', 'covid'],
  cough: ['cold', 'flu', 'allergies', 'covid'],
  fatigue: ['flu', 'migraine', 'anemia', 'depression'],
  nausea: ['migraine', 'flu', 'food_poisoning', 'anxiety'],
  'sore throat': ['cold', 'flu', 'strep_throat', 'allergies'],
  'body aches': ['flu', 'covid', 'mono', 'dehydration'],
  'runny nose': ['cold', 'allergies', 'sinusitis'],
  sneezing: ['cold', 'allergies'],
  'sensitivity to light': ['migraine', 'concussion', 'meningitis'],
  congestion: ['cold', 'sinusitis', 'allergies'],
  'shortness of breath': ['asthma', 'copd', 'covid', 'anxiety'],
  'chest pain': ['heart_attack', 'angina', 'anxiety', 'gerd'],
  dizziness: ['vertigo', 'anemia', 'low_blood_pressure', 'anxiety'],
  heartburn: ['gerd', 'indigestion', 'hiatal_hernia'],
  sweating: ['anxiety', 'heart_attack', 'menopause', 'hyperhidrosis'],
  'trouble sleeping': ['insomnia', 'anxiety', 'sleep_apnea', 'restless_legs'],
  'loss of appetite': ['flu', 'depression', 'cancer', 'chronic_illness'],
  'stomach pain': ['food_poisoning', 'ibs', 'gerd', 'constipation'],
  diarrhea: ['food_poisoning', 'ibs', 'viral_gastroenteritis', 'anxiety'],
};

export const commonSymptoms = [
  'headache', 'fever', 'cough', 'fatigue', 'nausea',
  'sore throat', 'body aches', 'runny nose', 'sneezing',
  'congestion', 'dizziness', 'heartburn', 'stomach pain',
];

export function analyzeSymptoms(symptoms: string[]) {
  const conditionScores: Record<string, { count: number; matchedSymptoms: string[] }> = {};

  symptoms.forEach((symptom) => {
    const key = symptom.toLowerCase();
    const related = symptomToConditionMap[key] || [];
    related.forEach((cond) => {
      if (!conditionScores[cond]) conditionScores[cond] = { count: 0, matchedSymptoms: [] };
      conditionScores[cond].count++;
      if (!conditionScores[cond].matchedSymptoms.includes(symptom)) {
        conditionScores[cond].matchedSymptoms.push(symptom);
      }
    });
  });

  return Object.entries(conditionScores)
    .map(([conditionId, { count, matchedSymptoms }]) => {
      const condition = conditions[conditionId];
      if (!condition) return null;
      const confidence = Math.min(100, Math.round((count / Object.keys(condition).length) * 100));
      return { condition, confidence, matchedSymptoms };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => b.confidence - a.confidence);
}

export function generateBotResponse(userInput: string) {
  const input = userInput.toLowerCase();

  if (['hello', 'hi', 'hey'].some((g) => input.includes(g))) {
    return "Hello! I'm your health assistant. What symptoms are you experiencing?";
  }

  if (['thank', 'thanks', 'appreciate'].some((w) => input.includes(w))) {
    return "You're welcome! Is there anything else you'd like to know about your symptoms?";
  }

  const mentionedSymptoms = Object.keys(symptomToConditionMap).filter((s) => input.includes(s));

  if (mentionedSymptoms.length > 0) {
    const analysis = analyzeSymptoms(mentionedSymptoms);
    if (analysis.length > 0) {
      const top = analysis[0] as any;
      const { condition, confidence, matchedSymptoms } = top;
      let response = `Based on your symptoms (${matchedSymptoms.join(', ')}), you might have ${condition.name}. ${condition.description}\n\n`;
      response += `When to see a doctor: ${condition.seeDoctor}\n\n`;
      response += `Self-care tips:\n${condition.careTips.map((t: string) => `• ${t}`).join('\n')}`;
      return response;
    }
  }

  if (input.includes('emergency') || input.includes('urgent')) {
    return 'If you\'re experiencing a medical emergency, please call emergency services immediately or go to the nearest emergency room.';
  }

  if (input.includes('covid') || input.includes('coronavirus')) {
    return 'COVID-19 symptoms can include fever, cough, and difficulty breathing. If you suspect you have COVID-19, please get tested and follow local health guidelines.';
  }

  return "I'm here to help. Could you describe your symptoms in more detail? For example: 'I have a headache and fever' or 'My throat hurts when I swallow'";
}

export default { conditions, symptomToConditionMap, analyzeSymptoms, generateBotResponse };
