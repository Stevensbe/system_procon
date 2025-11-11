from __future__ import annotations

import json
from typing import Any, Dict, Optional
from urllib.parse import urljoin

import requests
from requests import RequestException


class ExternalAPIError(Exception):
    """Raised when an external integration fails."""


def _normalize_base_url(base_url: str) -> str:
    cleaned = (base_url or "").strip()
    if not cleaned:
        raise ExternalAPIError("Nenhum endpoint de API configurado para o órgão externo.")
    if not cleaned.endswith("/"):
        cleaned = f"{cleaned}/"
    return cleaned


def ping_external_api(
    base_url: str,
    *,
    path: str = "health",
    headers: Optional[Dict[str, str]] = None,
    timeout: int = 10,
) -> Dict[str, Any]:
    """Executa uma chamada simples de verificação em um endpoint externo."""
    endpoint_base = _normalize_base_url(base_url)
    target_url = urljoin(endpoint_base, path.lstrip("/"))

    try:
        response = requests.get(target_url, headers=headers or {}, timeout=timeout)
    except RequestException as exc:
        raise ExternalAPIError(f"Falha ao acessar {target_url}: {exc}") from exc

    payload: Any
    try:
        payload = response.json()
    except ValueError:
        payload = response.text

    return {
        "url": target_url,
        "status_code": response.status_code,
        "payload": payload,
        "headers": dict(response.headers),
    }


def enviar_documento_externo(
    base_url: str,
    *,
    path: str = "",
    payload: Any = None,
    headers: Optional[Dict[str, str]] = None,
    timeout: int = 10,
    method: str = "POST",
) -> Dict[str, Any]:
    """Envia um documento para um endpoint externo e retorna dados relevantes da resposta."""
    endpoint_base = _normalize_base_url(base_url)
    target_url = urljoin(endpoint_base, path.lstrip("/"))

    try:
        response = requests.request(
            method.upper(),
            target_url,
            json=payload,
            headers=headers or {},
            timeout=timeout,
        )
    except RequestException as exc:
        raise ExternalAPIError(f"Erro ao enviar dados para {target_url}: {exc}") from exc

    try:
        response_payload: Any = response.json()
    except ValueError:
        response_payload = response.text

    return {
        "url": target_url,
        "status_code": response.status_code,
        "payload": response_payload,
        "headers": dict(response.headers),
        "request_payload": payload,
        "request_payload_raw": json.dumps(payload) if isinstance(payload, (dict, list)) else payload,
    }

