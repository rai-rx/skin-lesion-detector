import io

from fastapi.testclient import TestClient
from PIL import Image

from main import app


client = TestClient(app)


def test_predict_rejects_non_skin_image():
    img = Image.new("RGB", (640, 480), color=(20, 200, 20))
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG")
    response = client.post(
        "/predict",
        files={"file": ("not_skin.jpg", buffer.getvalue(), "image/jpeg")},
    )

    assert response.status_code == 400, response.text
    assert "skin" in response.json()["detail"].lower()
