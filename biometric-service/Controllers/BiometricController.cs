using Microsoft.AspNetCore.Mvc;
using WolfGym.BiometricService.Data;
using WolfGym.BiometricService.Models;
using WolfGym.BiometricService.Services;
using WolfGym.BiometricService.SDK;

namespace WolfGym.BiometricService.Controllers;

[ApiController]
[Route("")]
public class BiometricController : ControllerBase
{
    private readonly ZKFingerService _fingerService;
    private readonly FingerprintRepository _repository;
    private readonly ILogger<BiometricController> _logger;

    public BiometricController(
        ZKFingerService fingerService,
        FingerprintRepository repository,
        ILogger<BiometricController> logger)
    {
        _fingerService = fingerService;
        _repository = repository;
        _logger = logger;
    }

    [HttpGet("health")]
    public IActionResult Health()
    {
        return Ok(new HealthResponse(true));
    }

    [HttpPost("device/open")]
    public IActionResult OpenDevice()
    {
        try
        {
            var (success, error, deviceCount) = _fingerService.Initialize();
            if (!success)
            {
                return Ok(new DeviceOpenResponse(false, 0, null, 0, 0, null, error));
            }

            var openResult = _fingerService.OpenDevice(0);
            if (!openResult.success)
            {
                return Ok(new DeviceOpenResponse(false, deviceCount, null, 0, 0, null, openResult.error));
            }

            return Ok(new DeviceOpenResponse(
                true,
                deviceCount,
                _fingerService.DeviceSerial,
                _fingerService.FpWidth,
                _fingerService.FpHeight,
                _fingerService.TemplateVersion
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error opening device");
            return Ok(new DeviceOpenResponse(false, 0, null, 0, 0, null, ex.Message));
        }
    }

    [HttpPost("device/close")]
    public IActionResult CloseDevice()
    {
        try
        {
            var (success, error) = _fingerService.CloseDevice();
            return Ok(new DeviceCloseResponse(success, error));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error closing device");
            return Ok(new DeviceCloseResponse(false, ex.Message));
        }
    }

    [HttpGet("device/status")]
    public IActionResult DeviceStatus()
    {
        return Ok(new DeviceStatusResponse(
            true,
            _fingerService.IsDeviceOpen,
            _fingerService.DeviceSerial,
            _fingerService.HasDatabase,
            _fingerService.SdkVersion,
            _fingerService.FpWidth,
            _fingerService.FpHeight,
            _fingerService.Dpi,
            _fingerService.TemplateVersion,
            _fingerService.CachedFingerprintCount
        ));
    }

    [HttpPost("capture")]
    public async Task<IActionResult> Capture()
    {
        try
        {
            var (success, template, templateLen, image, error) = await _fingerService.CaptureFingerprint();
            
            if (!success)
            {
                return Ok(new CaptureResponse(false, null, null, 0, 0, error));
            }

            var templateB64 = template != null && templateLen > 0
                ? zkfp2.BlobToBase64String(template, templateLen)
                : null;

            var imageB64 = _fingerService.GetLastCapturedImageBase64();

            return Ok(new CaptureResponse(
                true,
                templateB64,
                imageB64,
                templateLen,
                0, // Quality no está directamente disponible en esta versión del SDK
                null
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error capturing fingerprint");
            return Ok(new CaptureResponse(false, null, null, 0, 0, ex.Message));
        }
    }

    [HttpPost("enroll")]
    public async Task<IActionResult> Enroll([FromBody] EnrollRequest request)
    {
        try
        {
            // Validar entrada
            if (string.IsNullOrEmpty(request.UserId))
            {
                return BadRequest(new EnrollResponse(false, "UserId is required", 0));
            }

            if (request.FingerIndex < 0 || request.FingerIndex > 9)
            {
                return BadRequest(new EnrollResponse(false, "FingerIndex must be between 0 and 9", 0));
            }

            if (request.SamplesB64 == null || request.SamplesB64.Count != 3)
            {
                return BadRequest(new EnrollResponse(false, "Exactly 3 samples required", 0));
            }

            // Convertir muestras de base64 a byte arrays
            var samples = request.SamplesB64.Select(s => Convert.FromBase64String(s)).ToList();

            // Validar que las 3 muestras son del mismo dedo.
            // Umbral mínimo de enrollamiento: 20 (más bajo que operación pero descarta dedos distintos).
            // Se validan los 3 pares: (0,1), (1,2) y (0,2) para evitar templates mezclados.
            const int EnrollMinScore = 20;
            var enrollPairs = new[] { (0, 1), (1, 2), (0, 2) };
            foreach (var (a, b) in enrollPairs)
            {
                var (success, match, score, error) = _fingerService.VerifyTemplate(
                    samples[a], samples[b], applyThreshold: false);

                if (!success)
                    return Ok(new EnrollResponse(false, error ?? "Verification failed", 0));

                if (score < EnrollMinScore)
                {
                    _logger.LogWarning(
                        "Enrollment: samples {A} and {B} no coinciden (score={Score} < min={Min})",
                        a + 1, b + 1, score, EnrollMinScore);
                    return Ok(new EnrollResponse(
                        false,
                        "Por favor presione el mismo dedo las 3 veces (las muestras no coinciden)",
                        0));
                }

                _logger.LogInformation("Enrollment: muestras {A} y {B} OK (score={Score})", a + 1, b + 1, score);
            }

            // Fusionar las 3 muestras
            var mergeResult = _fingerService.MergeTemplates(samples[0], samples[1], samples[2]);
            if (!mergeResult.success || mergeResult.mergedTemplate == null)
            {
                return Ok(new EnrollResponse(false, mergeResult.error ?? "Merge failed", 0));
            }

            // Guardar en base de datos
            var fingerprintRecord = new FingerprintRecord
            {
                UserId = request.UserId,
                FingerIndex = request.FingerIndex,
                Template = mergeResult.mergedTemplate.Take(mergeResult.templateLen).ToArray(),
                Version = "ZK",
                DeviceSerial = _fingerService.DeviceSerial,
                TemplateSize = mergeResult.templateLen
            };

            bool saved;
            try
            {
                saved = await _repository.SaveFingerprintAsync(fingerprintRecord);
            }
            catch (Exception dbEx)
            {
                _logger.LogError(dbEx, "Database error saving fingerprint");
                return Ok(new EnrollResponse(false, $"Database error: {dbEx.Message}", 0));
            }
            
            if (!saved)
            {
                return Ok(new EnrollResponse(false, "User not found or database error", 0));
            }

            await RefreshCacheAsync();

            _logger.LogInformation(
                "Enrollment successful for user {UserId}, finger {FingerIndex}",
                request.UserId, request.FingerIndex);

            return Ok(new EnrollResponse(true, "Enrollment successful", mergeResult.templateLen));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error enrolling fingerprint");
            return Ok(new EnrollResponse(false, ex.Message, 0));
        }
    }

    [HttpPost("verify")]
    public async Task<IActionResult> Verify([FromBody] VerifyRequest request)
    {
        try
        {
            // Validar entrada
            if (string.IsNullOrEmpty(request.UserId) || string.IsNullOrEmpty(request.TemplateB64))
            {
                return BadRequest(new VerifyResponse(false, false, 0, 0, "UserId and TemplateB64 are required"));
            }

            if (request.FingerIndex < 0 || request.FingerIndex > 9)
            {
                return BadRequest(new VerifyResponse(false, false, 0, 0, "FingerIndex must be between 0 and 9"));
            }

            // Obtener plantilla almacenada
            var storedFingerprint = await _repository.GetFingerprintAsync(request.UserId, request.FingerIndex);
            if (storedFingerprint == null)
            {
                return Ok(new VerifyResponse(
                    true,
                    false,
                    0,
                    _fingerService.Threshold,
                    "Fingerprint not found for this user and finger"
                ));
            }

            // Convertir plantilla capturada de base64
            var capturedTemplate = Convert.FromBase64String(request.TemplateB64);

            // Verificar usando DBMatch
            var (success, match, score, error) = _fingerService.VerifyTemplate(
                capturedTemplate,
                storedFingerprint.Template
            );

            if (!success)
            {
                return Ok(new VerifyResponse(false, false, 0, _fingerService.Threshold, error));
            }

            _logger.LogInformation(
                "Verification result for user {UserId}, finger {FingerIndex}: {Match} (score: {Score})",
                request.UserId, request.FingerIndex, match, score);

            return Ok(new VerifyResponse(true, match, score, _fingerService.Threshold));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying fingerprint");
            return Ok(new VerifyResponse(false, false, 0, _fingerService.Threshold, ex.Message));
        }
    }

    [HttpPost("identify")]
    public async Task<IActionResult> Identify([FromBody] IdentifyRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.TemplateB64))
            {
                return BadRequest(new IdentifyResponse(false, false, null, 0, 0, 0, "TemplateB64 is required"));
            }

            if (_fingerService.CachedFingerprintCount == 0)
                await RefreshCacheAsync();

            if (_fingerService.CachedFingerprintCount == 0)
            {
                return Ok(new IdentifyResponse(
                    true,
                    false,
                    null,
                    0,
                    0,
                    _fingerService.Threshold,
                    "No fingerprints in database"
                ));
            }

            // Convertir plantilla capturada de base64
            var capturedTemplate = Convert.FromBase64String(request.TemplateB64);

            // Identificar usando DBMatch oficial contra la cache en memoria
            var (success, match, entry, bestScore, secondBest, error) = _fingerService.IdentifyCachedTemplate(capturedTemplate);

            if (!success)
            {
                return Ok(new IdentifyResponse(
                    false,
                    false,
                    null,
                    0,
                    0,
                    _fingerService.Threshold,
                    error
                ));
            }

            if (match && entry != null)
            {
                _logger.LogInformation(
                    "Identification successful: User {UserId}, Finger {FingerIndex}, Score {Score}, SecondBest {SecondBest}",
                    entry.UserId, entry.FingerIndex, bestScore, secondBest);

                return Ok(new IdentifyResponse(
                    true,
                    true,
                    entry.UserId,
                    entry.FingerIndex,
                    bestScore,
                    _fingerService.Threshold
                ));
            }

            return Ok(new IdentifyResponse(
                true,
                false,
                null,
                0,
                bestScore,
                _fingerService.Threshold,
                "No match found"
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error identifying fingerprint");
            return Ok(new IdentifyResponse(false, false, null, 0, 0, _fingerService.Threshold, ex.Message));
        }
    }

    [HttpPost("cache/reload")]
    public async Task<IActionResult> ReloadCache()
    {
        try
        {
            var count = await RefreshCacheAsync();
            return Ok(new { ok = true, count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reloading fingerprint cache");
            return Ok(new { ok = false, message = ex.Message });
        }
    }

    [HttpGet("image/snapshot")]
    public IActionResult GetSnapshot()
    {
        try
        {
            var jpegData = _fingerService.GetLastCapturedImageJpeg();
            if (jpegData == null || jpegData.Length == 0)
            {
                return NotFound(new { ok = false, message = "No image available" });
            }

            return File(jpegData, "image/jpeg");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting snapshot");
            return StatusCode(500, new { ok = false, message = ex.Message });
        }
    }

    [HttpGet("stream")]
    public async Task Stream(CancellationToken cancellationToken)
    {
        Response.StatusCode = StatusCodes.Status200OK;
        Response.ContentType = "multipart/x-mixed-replace; boundary=frame";
        Response.Headers.CacheControl = "no-store";

        while (!cancellationToken.IsCancellationRequested)
        {
            var (success, jpeg, error) = await _fingerService.CaptureImageSnapshot();
            if (success && jpeg is { Length: > 0 })
            {
                await Response.WriteAsync("--frame\r\n", cancellationToken);
                await Response.WriteAsync("Content-Type: image/jpeg\r\n", cancellationToken);
                await Response.WriteAsync($"Content-Length: {jpeg.Length}\r\n\r\n", cancellationToken);
                await Response.Body.WriteAsync(jpeg, cancellationToken);
                await Response.WriteAsync("\r\n", cancellationToken);
                await Response.Body.FlushAsync(cancellationToken);
            }
            else if (!string.IsNullOrWhiteSpace(error))
            {
                _logger.LogDebug("Stream frame skipped: {Error}", error);
            }

            await Task.Delay(250, cancellationToken);
        }
    }

    [HttpGet("config")]
    public IActionResult GetConfig()
    {
        return Ok(new ConfigResponse(
            _fingerService.Threshold,
            _fingerService.CaptureTimeout,
            _fingerService.MergeSamples,
            _fingerService.AmbiguityMargin
        ));
    }

    [HttpPost("config")]
    public IActionResult UpdateConfig([FromBody] ConfigUpdateRequest request)
    {
        if (request.Threshold.HasValue)
        {
            _fingerService.Threshold = request.Threshold.Value;
        }

        if (request.Timeout.HasValue)
        {
            _fingerService.CaptureTimeout = request.Timeout.Value;
        }

        if (request.MergeSamples.HasValue)
        {
            _fingerService.MergeSamples = request.MergeSamples.Value;
        }

        if (request.AmbiguityMargin.HasValue && request.AmbiguityMargin.Value >= 0)
        {
            _fingerService.AmbiguityMargin = request.AmbiguityMargin.Value;
        }

        return Ok(new ConfigResponse(
            _fingerService.Threshold,
            _fingerService.CaptureTimeout,
            _fingerService.MergeSamples,
            _fingerService.AmbiguityMargin
        ));
    }

    private async Task<int> RefreshCacheAsync()
    {
        var allFingerprints = await _repository.GetAllFingerprintsAsync();
        var entries = allFingerprints.Select(f => new FingerprintCacheEntry(f.userId, f.fingerIndex, f.template));
        _fingerService.ReplaceFingerprintCache(entries);
        return _fingerService.CachedFingerprintCount;
    }
}
