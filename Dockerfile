FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY PRDtoProd/PRDtoProd.csproj PRDtoProd/
COPY PRDtoProd.Tests/PRDtoProd.Tests.csproj PRDtoProd.Tests/
RUN dotnet restore PRDtoProd/PRDtoProd.csproj
COPY . .
RUN dotnet publish PRDtoProd/PRDtoProd.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "PRDtoProd.dll"]
