# API Configuration Guide

To enable real-time tracking for the Transport Layer (Flights), you must configure the **OpenSky Network** credentials. Without these credentials, the system is subject to strict IP rate limits and may not show data.

## 1. OpenSky Network (Flight Data)

1.  **Register Account**: Go to [https://opensky-network.org/](https://opensky-network.org/) and create a free account.
2.  **Get Credentials**: You simply use your **Username** and **Password** that you registered with.
3.  **Configure Environment**:
    *   Open the `.env` file in `/home/docker-sites/endtimesmonitor/.env`.
    *   Add the following lines:

```bash
OPENSKY_USERNAME=your_username_here
OPENSKY_PASSWORD=your_password_here
```

## 2. Restart Services

After saving the `.env` file, you must restart the background worker for changes to take effect:

```bash
cd /home/docker-sites/endtimesmonitor
docker compose restart worker
```

## Troubleshooting

- **No Data**: Check the worker logs: `docker compose logs worker`.
- **429/502 Error**: This means you are being rate-limited. Ensure your username/password are correct in the `.env` file. We have implemented a 2-second delay between requests to be polite to the API.
