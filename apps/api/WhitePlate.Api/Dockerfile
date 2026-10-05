FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
USER $APP_UID
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["WhitePlate.Api/WhitePlate.Api.csproj", "WhitePlate.Api/"]
COPY ["WhitePlate.Domain/WhitePlate.Domain.csproj", "WhitePlate.Domain/"]
COPY ["WhitePlate.Application/WhitePlate.Application.csproj", "WhitePlate.Application/"]
COPY ["WhitePlate.Infrastructure/WhitePlate.Infrastructure.csproj", "WhitePlate.Infrastructure/"]
RUN dotnet restore "WhitePlate.Api/WhitePlate.Api.csproj"
COPY . .

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "WhitePlate.Api/WhitePlate.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "WhitePlate.Api.dll"]
