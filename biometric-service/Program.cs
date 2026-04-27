using Serilog;
using WolfGym.BiometricService.Services;
using WolfGym.BiometricService.Data;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.Hosting.WindowsServices;

//
//  ───────────────────────── LOGS SERILOG ─────────────────────────
//
var logPath = Path.Combine(
    Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData),
    "WolfGym", "biometric", "logs", "service-.log"
);
Directory.CreateDirectory(Path.GetDirectoryName(logPath)!);

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()  // Cambiado a Debug para diagnóstico
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File(
        logPath,
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 30,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}"
    )
    .CreateLogger();

try
{
    Log.Information("Starting WolfGym Biometric Service");

    var builder = WebApplication.CreateBuilder(args);

    // Serilog provider
    builder.Host.UseSerilog();

    // Ejecutable como Servicio de Windows (no se cierra al cerrar consola)
    // Si también lo corres en consola, no pasa nada.
    builder.Host.UseWindowsService();

    // Kestrel: configuración para desarrollo y producción
    builder.WebHost.ConfigureKestrel(k =>
    {
        k.Limits.MaxRequestBodySize = 5 * 1024 * 1024; // 5MB por si envías imágenes

        var port = builder.Configuration.GetValue<int?>("BiometricService:Port") ?? 8001;
        // El servicio biométrico debe ser local. Next.js lo consume desde la misma PC.
        k.ListenLocalhost(port);
    });

    // CORS: solo la app local. No exponer el servicio biométrico a la red.
    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(policy =>
        {
            policy.WithOrigins("http://localhost:3000", "http://127.0.0.1:3000")
            .AllowAnyMethod()
            .AllowAnyHeader();
        });
    });

    // Controllers + JSON
    builder.Services.AddControllers()
        .AddJsonOptions(o =>
        {
            o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        });

    // Swagger
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new() { Title = "WolfGym Biometric API", Version = "v1" });
    });

    // Health checks (para ping desde el cliente)
    builder.Services.AddHealthChecks();

    // DI de la app
    builder.Services.AddSingleton<ZKFingerService>();
    builder.Services.AddScoped<FingerprintRepository>();

    // Watchdog y cache biométrica
    builder.Services.AddHostedService<BiometricWatchdog>();
    builder.Services.AddHostedService<FingerprintCacheWarmup>();

    var app = builder.Build();

    // ── Cargar configuración biométrica en el servicio ──────────────────────
    // Bug fix: el threshold de appsettings.json nunca se aplicaba al servicio
    var zkService = app.Services.GetRequiredService<ZKFingerService>();
    var bioConfig = app.Configuration.GetSection("BiometricService");
    if (int.TryParse(bioConfig["Threshold"], out var cfgThreshold) && cfgThreshold > 0)
        zkService.Threshold = cfgThreshold;
    if (int.TryParse(bioConfig["CaptureTimeout"], out var cfgTimeout) && cfgTimeout > 0)
        zkService.CaptureTimeout = cfgTimeout;
    if (bool.TryParse(bioConfig["MergeSamples"], out var cfgMerge))
        zkService.MergeSamples = cfgMerge;
    if (int.TryParse(bioConfig["AmbiguityMargin"], out var cfgAmbiguity) && cfgAmbiguity >= 0)
        zkService.AmbiguityMargin = cfgAmbiguity;
    Log.Information("Biometric config loaded: Threshold={Thr} Timeout={T} Merge={M} AmbiguityMargin={A}",
        zkService.Threshold, zkService.CaptureTimeout, zkService.MergeSamples, zkService.AmbiguityMargin);

    // ── Auto-detección de libzkfp.dll ────────────────────────────────────────
    WolfGym.BiometricService.Utils.DllFinder.EnsureDllsPresent(Log.Logger);

    // Middleware global de errores (no mata el proceso)
    app.UseExceptionHandler(errorApp =>
    {
        errorApp.Run(async context =>
        {
            var feature = context.Features.Get<IExceptionHandlerPathFeature>();
            Log.Error(feature?.Error, "Unhandled exception");
            context.Response.StatusCode = 500;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new { ok = false, message = "internal-error" });
        });
    });

    // CORS
    app.UseCors();

    // Swagger solo en Dev (si quieres siempre, quita el if)
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "WolfGym Biometric API v1");
        });
    }

    // Rutas
    app.MapControllers();
    app.MapHealthChecks("/health");

    // Logs de ciclo de vida (útil si Windows reinicia el servicio)
    var boundPort = app.Configuration.GetValue<int?>("BiometricService:Port") ?? 8001;
    app.Lifetime.ApplicationStarted.Register(() =>
        Log.Information("Service started successfully on http://127.0.0.1:{Port}", boundPort));
    app.Lifetime.ApplicationStopping.Register(() =>
        Log.Information("Service stopping..."));
    app.Lifetime.ApplicationStopped.Register(() =>
        Log.Information("Service stopped."));

    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

/// <summary>
/// Watchdog: reabre device/DB si quedaron cerrados.
/// Se apoya en EnsureOpenWithDb() del ZKFingerService (método interno que ya tienes).
/// </summary>
public sealed class BiometricWatchdog : BackgroundService
{
    private readonly ILogger<BiometricWatchdog> _logger;
    private readonly ZKFingerService _zk;

    public BiometricWatchdog(ILogger<BiometricWatchdog> logger, ZKFingerService zk)
    {
        _logger = logger;
        _zk = zk;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Watchdog started");
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                if (!_zk.IsDeviceOpen || !_zk.HasDatabase)
                {
                    var result = _zk.RecoverDevice();
                    if (!result.success)
                        _logger.LogWarning("Watchdog recovery failed: {Error}", result.error);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Watchdog error");
            }

            await Task.Delay(TimeSpan.FromSeconds(20), stoppingToken);
        }
        _logger.LogInformation("Watchdog stopped");
    }
}

public sealed class FingerprintCacheWarmup : BackgroundService
{
    private readonly ILogger<FingerprintCacheWarmup> _logger;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ZKFingerService _zk;

    public FingerprintCacheWarmup(
        ILogger<FingerprintCacheWarmup> logger,
        IServiceScopeFactory scopeFactory,
        ZKFingerService zk)
    {
        _logger = logger;
        _scopeFactory = scopeFactory;
        _zk = zk;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            await using var scope = _scopeFactory.CreateAsyncScope();
            var repository = scope.ServiceProvider.GetRequiredService<FingerprintRepository>();
            var all = await repository.GetAllFingerprintsAsync();
            _zk.ReplaceFingerprintCache(all.Select(f => new FingerprintCacheEntry(f.userId, f.fingerIndex, f.template)));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Fingerprint cache warmup failed; cache will reload on first identify");
        }
    }
}
