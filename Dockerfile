# Stage 1: Build the React frontend
FROM node:22-alpine AS frontend-build
WORKDIR /src/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build the .NET backend
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS backend-build
WORKDIR /src/backend
COPY backend/GuidedUp.Api/GuidedUp.Api.csproj ./GuidedUp.Api/
RUN dotnet restore GuidedUp.Api/GuidedUp.Api.csproj
COPY backend/ ./
COPY --from=frontend-build /src/backend/GuidedUp.Api/wwwroot ./GuidedUp.Api/wwwroot
RUN dotnet publish GuidedUp.Api/GuidedUp.Api.csproj -c Release -o /app

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=backend-build /app ./

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080
ENTRYPOINT ["dotnet", "GuidedUp.Api.dll"]
