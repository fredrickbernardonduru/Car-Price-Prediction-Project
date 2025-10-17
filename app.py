import streamlit as st
import pandas as pd
import numpy as np
#import joblib
import pickle

# -----------------------------
# Load model and training columns
# -----------------------------
with open("Car_Price_Model2.pkl", "rb") as f:
    data = pickle.load(f)
    #data = joblib.load(f)

model = data["model"]
model_columns = data["columns"]

# -----------------------------
# Streamlit UI setup
# -----------------------------
st.set_page_config(page_title="🚗 Car Price Predictor", layout="centered")
st.title("🚗 Car Price Prediction App")
st.markdown("""
Enter car details below and click **Predict Price**  
to get the estimated market value of your car 💰
""")

# -----------------------------
# Input fields
# -----------------------------
col1, col2 = st.columns(2)

with col1:
    brand = st.selectbox("Brand", ["audi", "bmw", "chevrolet", "honda", "hyundai", "jaguar",
                                   "mazda", "mercedes", "mitsubishi", "nissan", "porsche",
                                   "subaru", "toyota", "volkswagen", "volvo"])
    fueltype = st.selectbox("Fuel Type", ["gas", "diesel"])
    aspiration = st.selectbox("Aspiration", ["std", "turbo"])
    doornumber = st.selectbox("Number of Doors", ["two", "four"])
    carbody = st.selectbox(
        "Car Body Type", ["sedan", "hatchback", "convertible", "wagon", "hardtop"])

with col2:
    drivewheel = st.selectbox("Drive Wheel", ["fwd", "rwd", "4wd"])
    enginelocation = st.selectbox("Engine Location", ["front", "rear"])
    enginesize = st.number_input(
        "Engine Size (cc):", min_value=50, max_value=600, value=150)
    horsepower = st.number_input(
        "Horsepower:", min_value=40, max_value=400, value=100)
    citympg = st.number_input("City Mileage (km/l):",
                              min_value=5, max_value=40, value=15)
    highwaympg = st.number_input(
        "Highway Mileage (km/l):", min_value=5, max_value=50, value=20)

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
input_encoded = input_encoded.reindex(columns=model_columns, fill_value=0)

# -----------------------------
# Prediction
# -----------------------------
if st.button("🔮 Predict Car Price"):
    try:
        prediction = model.predict(input_encoded)[0]
        st.success(f"💰 Estimated Car Price: ₹{prediction:,.2f}")
        st.balloons()
    except Exception as e:
        st.error(f"⚠️ Error: {e}")
        st.info("Please check the input data formatting.")