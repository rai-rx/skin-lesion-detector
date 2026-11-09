import asyncio
import io

from fastapi.testclient import TestClient
from fastapi import HTTPException
from PIL import Image
import pytest

from main import app
from predictions.router import import_pending_scan


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


def test_predict_rejects_non_image_upload():
    response = client.post(
        "/predict",
        files={"file": ("document.txt", b"not an image", "text/plain")},
    )

    assert response.status_code == 415, response.text
    assert "image" in response.json()["detail"].lower()


def test_predict_rejects_images_over_20_mb():
    oversized_image = b"\x00" * (20 * 1024 * 1024 + 1)
    response = client.post(
        "/predict",
        files={"file": ("large-image.png", oversized_image, "image/png")},
    )

    assert response.status_code == 413, response.text
    assert "20 MB" in response.json()["detail"]


def test_import_scan_rejects_non_image_data_url():
    with pytest.raises(HTTPException) as error:
        asyncio.run(import_pending_scan(
            {"image": "data:text/plain;base64,dGVzdA==", "result": {}},
            user={"sub": "test-user"},
        ))

    assert error.value.status_code == 415
