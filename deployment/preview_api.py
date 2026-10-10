"""Temporary read-only catalog API while Khevna builds the production FastAPI app."""
from fastapi import FastAPI
from scripts.validate_data import load

app = FastAPI(title="SmartWallet Catalog Preview")


@app.get("/health")
def health():
    return {"status": "ok", "service": "catalog-preview"}


@app.get("/api/cards")
def cards():
    return load("cards.json")


@app.get("/api/merchants")
def merchants():
    return load("merchants.json")
