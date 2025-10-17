import React, { useState, useMemo } from 'react';
import { Car, Gauge, Maximize, TrendingUp, DollarSign, Wand2 } from 'lucide-react';

// --- GEMINI API UTILITY ---
const API_KEY = ""; // API key is provided at runtime in the Canvas environment
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`;
const MAX_RETRIES = 3;

/**
 * Calls the Gemini API with exponential backoff for text generation.
 */
const callGeminiApi = async (userQuery, systemPrompt) => {
  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    // Using Google Search grounding for potentially richer details, though not critical for ad copy
    tools: [{ "google_search": {} }],
  };

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API call failed with status ${response.status}`);
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "Could not generate description.";
      return { text };

    } catch (error) {
      if (attempt < MAX_RETRIES - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`Attempt ${attempt + 1} failed. Retrying in ksh {delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error("Gemini API call failed after multiple retries:", error);
        return { text: "Failed to generate description due to an API error." };
      }
    }
  }
};

// Mock function for ML prediction logic (Keep as is)
const mockPredict = (formData) => {
  const basePrice = 8000;
  const hpFactor = formData.horsepower * 50;
  const engineFactor = formData.enginesize * 20;
  const efficiencyDeduction = formData.citympg * 100;
  
  let result = basePrice + hpFactor + engineFactor - efficiencyDeduction;
  
  if (formData.carbody === 'convertible') result += 5000;
  if (formData.drivewheel === 'rwd') result += 2000;
  if (formData.fueltype === 'diesel') result += 1500;
  
  return Math.max(5000, result);
};

const InputField = ({ label, value, onChange, type = 'text', min, max, step }) => (
  <div className="flex flex-col space-y-1">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    {type === 'select' ? (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150"
      >
        {min.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) : e.target.value)}
        min={min}
        max={max}
        step={step}
        className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150"
      />
    )}
  </div>
);

const App = () => {
  const [formData, setFormData] = useState({
    brand: 'mercedes',
    fueltype: 'gas',
    aspiration: 'turbo',
    doornumber: 'four',
    carbody: 'convertible',
    drivewheel: '4wd',
    enginelocation: 'front',
    enginesize: 150,
    horsepower: 100,
    citympg: 15,
    highwaympg: 20,
  });
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // --- New State for LLM Feature ---
  const [description, setDescription] = useState(null);
  const [llmLoading, setLlmLoading] = useState(false);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPrediction(null);
    setDescription(null); // Clear description when running a new price prediction
    
    // In a real Next.js app, this would be a fetch call:
    // const response = await fetch('/api/predict', { method: 'POST', body: JSON.stringify(formData) });
    // const data = await response.json();
    
    // Using mock function for demonstration
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
    const predictedPrice = mockPredict(formData); 
    
    setPrediction(predictedPrice);
    setLoading(false);
  };
  
  // --- New LLM Handler ---
  const handleGenerateDescription = async () => {
    setLlmLoading(true);
    setDescription(null);

    const userQuery = `Write a compelling and detailed used car advertisement description (maximum 150 words) for a car with the following specifications: 
        Brand: ${formData.brand}, 
        Body Type: ${formData.carbody}, 
        Drive Type: ${formData.drivewheel}, 
        Engine Size: ${formData.enginesize}cc, 
        Horsepower: ${formData.horsepower}hp, 
        Fuel Type: ${formData.fueltype}, 
        Aspiration: ${formData.aspiration}, 
        Mileage: ${formData.citympg} City / ${formData.highwaympg} Highway MPG. 
        The estimated price is ${formatCurrency(prediction)}. Focus on key selling points.`;

    const systemInstruction = "You are a professional automotive copywriter. Your output must be formatted as a single, engaging paragraph ready for a classified ad. Do not include any headers, titles, or introductory phrases.";

    const result = await callGeminiApi(userQuery, systemInstruction);
    setDescription(result.text);
    setLlmLoading(false);
  };

  const formatCurrency = (amount) => {
    if (amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 p-4 font-inter">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl p-6 md:p-10">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <Car className="mx-auto h-12 w-12 text-blue-600" />
          <h1 className="text-3xl font-extrabold text-gray-900 mt-3">Car Price Estimator</h1>
          <p className="text-gray-500 mt-2">
            Leverage Machine Learning and AI to value and describe your vehicle.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Group 1: Core Specifications */}
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
            <h2 className="text-xl font-semibold text-blue-700 mb-4 flex items-center">
              <Maximize className="w-5 h-5 mr-2" /> Vehicle Specifications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InputField 
                label="Brand" 
                type="select"
                value={formData.brand}
                min={["audi", "bmw", "chevrolet", "honda", "hyundai", "jaguar", "mazda", "mercedes", "mitsubishi", "nissan", "porsche", "subaru", "toyota", "volkswagen", "volvo"]}
                onChange={(val) => handleChange('brand', val)}
              />
              <InputField 
                label="Car Body Type" 
                type="select"
                value={formData.carbody}
                min={["sedan", "hatchback", "convertible", "wagon", "hardtop"]}
                onChange={(val) => handleChange('carbody', val)}
              />
              <InputField 
                label="Drive Wheel" 
                type="select"
                value={formData.drivewheel}
                min={["fwd", "rwd", "4wd"]}
                onChange={(val) => handleChange('drivewheel', val)}
              />
              <InputField 
                label="Engine Location" 
                type="select"
                value={formData.enginelocation}
                min={["front", "rear"]}
                onChange={(val) => handleChange('enginelocation', val)}
              />
              <InputField 
                label="Doors" 
                type="select"
                value={formData.doornumber}
                min={["two", "four"]}
                onChange={(val) => handleChange('doornumber', val)}
              />
              <InputField 
                label="Aspiration" 
                type="select"
                value={formData.aspiration}
                min={["std", "turbo"]}
                onChange={(val) => handleChange('aspiration', val)}
              />
            </div>
          </div>

          {/* Group 2: Performance & Engine */}
          <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-100">
            <h2 className="text-xl font-semibold text-yellow-700 mb-4 flex items-center">
              <Gauge className="w-5 h-5 mr-2" /> Engine & Performance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField 
                label="Engine Size (cc)" 
                type="number"
                value={formData.enginesize}
                min={50} max={600} step={1}
                onChange={(val) => handleChange('enginesize', val)}
              />
              <InputField 
                label="Horsepower" 
                type="number"
                value={formData.horsepower}
                min={40} max={400} step={1}
                onChange={(val) => handleChange('horsepower', val)}
              />
              <InputField 
                label="Fuel Type" 
                type="select"
                value={formData.fueltype}
                min={["gas", "diesel"]}
                onChange={(val) => handleChange('fueltype', val)}
              />
              <div className="grid grid-cols-2 gap-4">
                <InputField 
                  label="City MPG" 
                  type="number"
                  value={formData.citympg}
                  min={5} max={40} step={1}
                  onChange={(val) => handleChange('citympg', val)}
                />
                <InputField 
                  label="Highway MPG" 
                  type="number"
                  value={formData.highwaympg}
                  min={5} max={50} step={1}
                  onChange={(val) => handleChange('highwaympg', val)}
                />
              </div>
            </div>
          </div>
          
          {/* Prediction Button */}
          <button 
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center py-3 px-4 border border-transparent text-lg font-bold rounded-xl shadow-lg transition-transform duration-150 transform ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-[1.01]'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Calculating Price...
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5 mr-2" /> Predict Car Price
              </>
            )}
          </button>
        </form>

        {/* Prediction Output */}
        {prediction !== null && (
          <div className="mt-8 space-y-4">
            {/* Price Result */}
            <div className="p-6 bg-green-100 border border-green-300 rounded-xl text-center shadow-inner animate-fade-in">
              <h3 className="text-2xl font-bold text-green-700 flex items-center justify-center">
                <DollarSign className="w-6 h-6 mr-3" /> 
                Estimated Price: {formatCurrency(prediction)}
              </h3>
              <p className="text-sm text-green-600 mt-2">
                This estimate is based on our Random Forest model analysis.
              </p>
            </div>
            
            {/* LLM Feature Button */}
            <div className="w-full pt-2">
              <button 
                onClick={handleGenerateDescription}
                disabled={llmLoading}
                className={`w-full flex items-center justify-center py-3 px-4 border border-transparent text-lg font-bold rounded-xl shadow-md transition-transform duration-150 transform ${
                  llmLoading 
                    ? 'bg-purple-300 cursor-not-allowed' 
                    : 'bg-purple-600 hover:bg-purple-700 text-white hover:scale-[1.01]'
                }`}
              >
                {llmLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Generating Copy...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" /> ✨ Generate Ad Copy
                  </>
                )}
              </button>
            </div>

            {/* LLM Output Display */}
            {description && (
              <div className="p-6 bg-purple-50 border border-purple-300 rounded-xl shadow-inner mt-4">
                <h4 className="text-lg font-bold text-purple-800 mb-3 flex items-center">
                  <Wand2 className="w-5 h-5 mr-2" /> AI-Generated Ad Description
                </h4>
                <p className="text-gray-700 italic leading-relaxed whitespace-pre-wrap">{description}</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Footer / Disclaimer */}
      <footer className="mt-8 text-sm text-gray-500 text-center max-w-4xl">
        Disclaimer: This price is an estimate based on a trained machine learning model and should not be used as final financial advice.
      </footer>
    </div>
  );
};

export default App;
