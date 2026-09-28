from fastapi import FastAPI

app = FastAPI(title="Space Booking API")

@app.get("/")
def check_health():
    return {"status": "ok", "service": "Space Booking Backend"}