# Deploy GuidedUp

Pick one option. Render is the simplest for a full-stack .NET app.

## Option A: Render (recommended)

1. Push this repo to GitHub.

2. Go to [render.com](https://render.com) → **New +** → **Web Service**.

3. Connect your GitHub repo `Kaung101/guided-up`.

4. Render auto-detects the `Dockerfile`. If it doesn't:
   - Runtime: **Docker**
   - Dockerfile path: `./Dockerfile`

5. Add environment variable:
   ```
   ANTHROPIC_API_KEY = sk-ant-...
   ```

6. Click **Deploy Web Service** (free tier — spins down when idle, wakes on request).

7. Your app is live at `https://guided-up.onrender.com`.

## Option B: Docker locally or any VPS

```bash
# Clone and build
git clone https://github.com/Kaung101/guided-up.git
cd guided-up

# Set your key
export ANTHROPIC_API_KEY=sk-ant-...

# Build and run with docker-compose
docker compose up --build

# Or plain Docker
docker build -t guided-up .
docker run -p 8080:8080 -e ANTHROPIC_API_KEY guided-up
```

Open `http://localhost:8080`.

## Option C: Manual (dev only)

See the `doctor.sh` instructions in your bootcamp docs.

## CI/CD

GitHub Actions runs on every push to `main`:
- Builds and tests the .NET backend
- Builds the Vite frontend
- Builds the Docker image

Check status at: `https://github.com/Kaung101/guided-up/actions`

No auto-deploy is wired in CI — that's handled by Render's native GitHub
integration (it watches your repo and redeploys on push).
