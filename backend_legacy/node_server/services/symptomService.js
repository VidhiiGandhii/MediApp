// const fs = require('fs');
// const path = require('path');

// const getSymptoms = () => {
//   try {
//     const possiblePaths = [
//       path.join(__dirname, '..', '..', 'python_server', 'models', 'symptom_index.json'),
//       path.join(__dirname, '..', 'models', 'symptom_index.json'),
//       path.join(__dirname, '..', '..', '..', 'python_server', 'models', 'symptom_index.json')
//     ];

//     let symptomsPath = null;
//     for (const testPath of possiblePaths) {
//       if (fs.existsSync(testPath)) {
//         symptomsPath = testPath;
//         break;
//       }
//     }

//     if (!symptomsPath) {
//       throw new Error('Symptom index file not found');
//     }

//     const symptomsData = fs.readFileSync(symptomsPath, 'utf8');
//     const symptomsJson = JSON.parse(symptomsData);
//     return Object.keys(symptomsJson);
//   } catch (error) {
//     console.error('Error reading symptoms file:', error);
//     throw new Error('Could not load symptom list');
//   }
// };

// module.exports = { getSymptoms };
const fs = require('fs');
const path = require('path');

let cachedSymptoms = null; // Cache symptoms in memory

/**
 * Finds and reads the symptom_index.json file.
 * @returns {string[]} An array of symptom names.
 */
const getSymptoms = () => {
  // Return from cache if available
  if (cachedSymptoms) {
    return cachedSymptoms;
  }

  try {
    // Define potential paths relative to the `src/services` directory
    const possiblePaths = [
      path.join(__dirname, '..', '..', 'python_server', 'models', 'symptom_index.json'), // ../../python_server/models
      path.join(__dirname, '..', 'models', 'symptom_index.json'),                      // ../models
      path.join(__dirname, '..', '..', '..', 'python_server', 'models', 'symptom_index.json') // ../../../python_server/models
    ];

    let symptomsPath = null;
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        symptomsPath = testPath;
        break;
      }
    }

    if (!symptomsPath) {
      console.error('Symptom index file not found. Searched paths:', possiblePaths);
      throw new Error('Symptom index file not found');
    }

    const symptomsData = fs.readFileSync(symptomsPath, 'utf8');
    const symptomsJson = JSON.parse(symptomsData);
    const symptomsList = Object.keys(symptomsJson);
    
    cachedSymptoms = symptomsList; // Store in cache
    return symptomsList;

  } catch (error) {
    console.error('Error reading symptoms file:', error);
    throw new Error('Could not load symptom list');
  }
};

module.exports = { getSymptoms };