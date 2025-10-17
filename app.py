import streamlit as st
import pandas as pd
import numpy as np
import pickle

# --- Custom Streamlit Styling (Makes it look better) ---
st.markdown("""
    <style>
    /* Main container styling */
    .main .block-container {
        padding-top: 2rem;
        padding-right: 1rem;
        padding-left: 1rem;
        padding-bottom: 2rem;
    }
    
    /* Header/Title styling */
    .stApp header {
        background-color: transparent;
    }
    .stApp h1 {
        color: #1f78b4; /* Darker blue color for the main title */
        font-size: 2.5em;
        text-align: center;
        margin-bottom: 0.5em;
        font-weight: 700;
    }

    /* Subheader/Markdown styling */
    .stApp p {
        font-size: 1.1em;
        text-align: center;
        color: #555555;
    }

    /* Sidebar/Input styling for visual separation */
    .stSelectbox label, .stNumberInput label {
        font-weight: 600;
        color: #333333;
    }

    /* Button styling */
    .stButton>button {
        background-color: #1f78b4; /* Blue primary color */
        color: white;
        font-weight: bold;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        border: none;
        transition: background-color 0.3s, transform 0.2s;
        box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
    }
    .stButton>button:hover {
        background-color: #0b5f9e; /* Darker blue on hover */
        transform: translateY(-2px);
    }

    /* Prediction Success Box */
    .stSuccess {
        background-color: #e6ffed; /* Light green background */
        border-left: 5px solid #38c172; /* Solid green border */
        color: #185a36;
        font-size: 1.2em;
        font-weight: 700;
        padding: 1rem;
        border-radius: 0.5rem;
    }
    </style>
""", unsafe_allow_html=True)


# -----------------------------
# Load model and training columns
# -----------------------------
# Note: Ensure the 'Car_Price_Model3.pkl' file exists and is saved correctly.
try:
    with open("Car_Price_Model3.pkl", "rb") as f:
        data = pickle.load(f)
    model = data["model"]
    model_columns = data["columns"]
except FileNotFoundError:
    st.error("Error: Model file 'Car_Price_Model3.pkl' not found. Please ensure it is saved in the correct directory.")
    st.stop()
except KeyError:
    st.error("Error: Model data structure invalid. Please ensure the model file contains {'model': model, 'columns': columns}.")
    st.stop()
except Exception as e:
    st.error(f"Error loading model: {e}")
    st.stop()

# -----------------------------
# Streamlit UI setup
# -----------------------------
st.title("🚗 Car Price Prediction App")
st.markdown("""
<p>Enter the key specifications below to receive an accurate market value estimate.</p>
""", unsafe_allow_html=True)


# --- Input Sections with Separators ---
st.subheader("⚙️ Core Vehicle Details")
col1, col2 = st.columns(2)

with col1:
    st.markdown("##### Basic Info")
    # Group 1 Inputs
    brand = st.selectbox("Brand", ["audi", "bmw", "chevrolet", "honda", "hyundai", "jaguar",
                                   "mazda", "mercedes", "mitsubishi", "nissan", "porsche",
                                   "subaru", "toyota", "volkswagen", "volvo"])
    fueltype = st.selectbox("Fuel Type", ["gas", "diesel"])
    aspiration = st.selectbox("Aspiration", ["std", "turbo"])
    doornumber = st.selectbox("Number of Doors", ["two", "four"])


with col2:
    st.markdown("##### Design & Drivetrain")
    # Group 2 Inputs
    carbody = st.selectbox(
        "Car Body Type", ["sedan", "hatchback", "convertible", "wagon", "hardtop"])
    drivewheel = st.selectbox("Drive Wheel", ["fwd", "rwd", "4wd"])
    enginelocation = st.selectbox("Engine Location", ["front", "rear"])
    
st.markdown("---") # Visual separator

st.subheader("🔥 Performance Metrics")
col3, col4 = st.columns(2)

with col3:
    st.markdown("##### Engine Power")
    # Group 3 Inputs
    enginesize = st.number_input(
        "Engine Size (cc):", min_value=50, max_value=600, value=150, step=1)
    horsepower = st.number_input(
        "Horsepower:", min_value=40, max_value=400, value=100, step=1)

with col4:
    st.markdown("##### Efficiency")
    # Group 4 Inputs
    citympg = st.number_input("City Mileage (km/l):",
                              min_value=5, max_value=40, value=15, step=1)
    highwaympg = st.number_input(
        "Highway Mileage (km/l):", min_value=5, max_value=50, value=20, step=1)

st.markdown("---") # Visual separator


# -----------------------------
# Prepare user input DataFrame
# -----------------------------
input_dict = {
    "brand": [brand],
    "fueltype": [fueltype],
    "aspiration": [aspiration],
    "doornumber": [doornumber],
    "carbody": [carbody],
    "drivewheel": [drivewheel],
    "enginelocation": [enginelocation],
    "enginesize": [enginesize],
    "horsepower": [horsepower],
    "citympg": [citympg],
    "highwaympg": [highwaympg]
}

input_df = pd.DataFrame(input_dict)

# 🧩 Apply same preprocessing (dummy encoding)
input_encoded = pd.get_dummies(input_df)

# Align with model training columns
# Note: You need to implement the Label Encoding step for binary columns here
# and ensure all the dummy variables that exist in the trained model (cylindernumber, fuelsystem etc.) 
# are correctly represented as 0 in the input_encoded DataFrame if they are missing.

# Placeholder for the Label Encoding that should be done:
# input_encoded['fueltype'] = 1 if input_encoded['fueltype'].iloc[0] == 'gas' else 0
# ... (Similar for aspiration, doornumber, enginelocation)

input_encoded = input_encoded.reindex(columns=model_columns, fill_value=0)

# -----------------------------
# Prediction Button and Logic
# -----------------------------
st.markdown('<div style="text-align: center;">', unsafe_allow_html=True)
if st.button("🔮 Predict Car Price"):
    try:
        # Preprocessing Check (Simplified here, full preprocessing needed for production)
        if len(input_encoded.columns) != len(model_columns):
            st.warning("Feature mismatch detected. Results may be inaccurate.")

        prediction = model.predict(input_encoded)[0]
        
        # Display the prediction with a clean format
        st.success(f"💰 Estimated Car Price: $ {prediction:,.2f}")
        st.balloons()
        
    except Exception as e:
        st.error(f"⚠️ Prediction Error: {e}")
        st.info("Please ensure all inputs are valid and your model file is compatible.")
st.markdown('</div>', unsafe_allow_html=True)
