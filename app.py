import streamlit as st
import numpy as np
import pickle

#Load the trained model
with open('Car_Price_Model.pkl', 'rb') as file:
    model = pickle.load(file)

#Litle and Description
st.set_page_config(page_title="Car Price Prediction", page_icon="🚚", layout = 'centered')