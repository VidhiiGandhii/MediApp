// export const API_CONFIG = {
//   BASE_URL: "http://192.168.1.13:3000", // Change this for your network
//   PYTHON_AI_URL: "http://192.168.1.13:8000",
// };
export const PYTHON_API_URL = process.env.NODE_ENV === 'production'
  ? 'https://mediapp-python.herokuapp.com' // Replace with your deployed Python backend URL
  : 'http://localhost:8000'; // Local development
export const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-backend-url.com' // Replace with deployed URL
  : 'http://192.168.1.10:3000'; // Local development


