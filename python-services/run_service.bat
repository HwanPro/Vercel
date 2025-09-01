@echo off
setlocal
cd /d C:\ruta\al\repo\python-services
call .\.venv\Scripts\activate
set PYTHONPATH=C:\ruta\al\repo\python-services
set UVICORN_CMD=uvicorn server:app --host 127.0.0.1 --port 8001 --workers 1
%UVICORN_CMD%
