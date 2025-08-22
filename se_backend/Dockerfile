FROM python:3.12.0-slim-bullseye

ENV PYTHONBUFFERED=1
ENV PORT=8080

WORKDIR /app

# Install PostgreSQL dependencies and build-essential for compiling packages
RUN apt-get update && \
    apt-get install -y libpq-dev gcc && \
    rm -rf /var/lib/apt/lists/*

COPY . /app/

RUN pip install --upgrade pip
RUN pip install -r requirements.txt
RUN pip install --upgrade pip setuptools wheel


EXPOSE 8080

CMD gunicorn server.wsgi:application --bind 0.0.0.0:8080
