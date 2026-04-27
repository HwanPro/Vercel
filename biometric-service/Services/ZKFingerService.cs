using WolfGym.BiometricService.SDK;
using WolfGym.BiometricService.Utils;

namespace WolfGym.BiometricService.Services;

public class ZKFingerService : IDisposable
{
    private IntPtr _deviceHandle = IntPtr.Zero;
    private IntPtr _dbHandle = IntPtr.Zero;
    private bool _isInitialized = false;
    private string? _deviceSerial;
    private string? _templateVersion = "ZK";
    private string? _sdkVersion = "10.0";
    private int _dpi = 0;
    private int _fpWidth = 0;
    private int _fpHeight = 0;
    private byte[]? _lastCapturedImage;
    private byte[]? _lastCapturedTemplate;
    private int _lastTemplateLength = 0;

    // Config
    public int Threshold { get; set; } = 30;   // Threshold recomendado para 1:1 según ZKTeco (25-35)
    public int CaptureTimeout { get; set; } = 5000;
    public bool MergeSamples { get; set; } = true;
    public int AmbiguityMargin { get; set; } = 3;

    private readonly ILogger<ZKFingerService> _logger;
    private readonly SemaphoreSlim _captureLock = new(1, 1);
    private readonly List<FingerprintCacheEntry> _fingerprintCache = [];
    private readonly object _cacheLock = new();

    public bool IsDeviceOpen => _deviceHandle != IntPtr.Zero;
    public bool HasDatabase  => _dbHandle != IntPtr.Zero;
    public string? DeviceSerial => _deviceSerial;
    public string? TemplateVersion => _templateVersion;
    public string? SdkVersion => _sdkVersion;
    public int Dpi => _dpi;
    public int FpWidth => _fpWidth;
    public int FpHeight => _fpHeight;
    public int CachedFingerprintCount { get { lock (_cacheLock) return _fingerprintCache.Count; } }

    public ZKFingerService(ILogger<ZKFingerService> logger)
    {
        _logger = logger;
    }

    // ---------- Helpers de aseguramiento ----------

    /// <summary>Inicializa la DB del SDK si está liberada.</summary>
    private bool EnsureDb()
    {
        if (_dbHandle != IntPtr.Zero) return true;

        _dbHandle = zkfp2.DBInit();
        if (_dbHandle == IntPtr.Zero)
        {
            _logger.LogWarning("DBInit failed (EnsureDb)");
            return false;
        }
        _logger.LogDebug("DB initialized (EnsureDb)");
        return true;
    }

    /// <summary>Garantiza SDK inicializado, dispositivo abierto y DB lista.</summary>
    public (bool success, string? error) EnsureOpenWithDb()
    {
        if (!_isInitialized)
        {
            var init = Initialize();
            if (!init.success) return (false, init.error);
        }
        if (_deviceHandle == IntPtr.Zero)
        {
            var open = OpenDevice(0);
            if (!open.success) return (false, open.error);
        }
        if (!EnsureDb()) return (false, "Failed to initialize database");
        return (true, null);
    }

    // ---------- Ciclo de vida del SDK/Device ----------

    /// <summary>Inicializa el SDK.</summary>
    public (bool success, string? error, int deviceCount) Initialize()
    {
        try
        {
            if (_isInitialized)
            {
                int deviceCount = zkfp2.GetDeviceCount();
                _logger.LogDebug("SDK already initialized. Devices found: {Count}", deviceCount);
                return (true, null, deviceCount);
            }

            var ret = zkfp2.Init();
            if (ret != zkfperrdef.ZKFP_ERR_OK && ret != zkfperrdef.ZKFP_ERR_ALREADY_INIT)
                return (false, $"Failed to initialize SDK, error code: {ret}", 0);

            _isInitialized = true;
            int count = zkfp2.GetDeviceCount();
            _logger.LogInformation("SDK initialized successfully. Devices found: {Count}", count);
            return (true, null, count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error initializing SDK");
            return (false, ex.Message, 0);
        }
    }

    /// <summary>Abre el dispositivo (y la DB interna del SDK).</summary>
    public (bool success, string? error) OpenDevice(int deviceIndex = 0)
    {
        try
        {
            _logger.LogDebug("OpenDevice called. Current handle: {Handle}, IsInitialized: {Init}", 
                _deviceHandle, _isInitialized);

            if (!_isInitialized)
            {
                _logger.LogDebug("SDK not initialized, calling Initialize()...");
                var initResult = Initialize();
                if (!initResult.success)
                {
                    _logger.LogError("Initialize failed: {Error}", initResult.error);
                    return (false, initResult.error);
                }
            }

            // Si ya está abierto, asegure la DB
            if (_deviceHandle != IntPtr.Zero)
            {
                _logger.LogDebug("Device handle is not Zero, checking DB...");
                if (!EnsureDb())
                {
                    _logger.LogError("EnsureDb failed for existing handle");
                    return (false, "Failed to initialize database");
                }
                _logger.LogInformation("Device already open (handle: {Handle}, DB ensured)", _deviceHandle);
                return (true, null);
            }

            _logger.LogDebug("Opening device with index {Index}...", deviceIndex);
            _deviceHandle = zkfp2.OpenDevice(deviceIndex);
            _logger.LogDebug("OpenDevice returned handle: {Handle}", _deviceHandle);
            
            if (_deviceHandle == IntPtr.Zero)
            {
                _logger.LogError("zkfp2.OpenDevice returned IntPtr.Zero");
                return (false, "Failed to open device");
            }

            if (!EnsureDb())
            {
                _logger.LogError("EnsureDb failed after opening device");
                zkfp2.CloseDevice(_deviceHandle);
                _deviceHandle = IntPtr.Zero;
                return (false, "Failed to initialize database");
            }

            // Parámetros del dispositivo
            ReadDeviceMetadata();

            _logger.LogInformation("Device opened successfully. Width: {Width}, Height: {Height}, DPI: {Dpi}, Serial: {Serial}",
                _fpWidth, _fpHeight, _dpi, _deviceSerial ?? "unknown");
            return (true, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception in OpenDevice");
            return (false, ex.Message);
        }
    }

    public (bool success, string? error) RecoverDevice()
    {
        try
        {
            CloseDevice();
            if (_isInitialized)
            {
                zkfp2.Terminate();
                _isInitialized = false;
            }
            return EnsureOpenWithDb();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recovering device");
            return (false, ex.Message);
        }
    }

    private void ReadDeviceMetadata()
    {
        var width = 0;
        var height = 0;
        var dpi = 0;
        if (zkfp2.GetCaptureParamsEx(_deviceHandle, ref width, ref height, ref dpi) == zkfperrdef.ZKFP_ERR_OK)
        {
            _fpWidth = width;
            _fpHeight = height;
            _dpi = dpi;
        }

        if (_fpWidth <= 0)
            _fpWidth = ReadIntParameter(1);
        if (_fpHeight <= 0)
            _fpHeight = ReadIntParameter(2);

        _deviceSerial = ReadFirstStringParameter(110, 101, 6, 5, 4) ?? _deviceSerial;
        _templateVersion = ReadFirstStringParameter(106, 105, 104) ?? "ZK";
        _sdkVersion = "10.0";
    }

    private int ReadIntParameter(int code)
    {
        try
        {
            byte[] paramValue = new byte[4];
            int size = 4;
            if (zkfp2.GetParameters(_deviceHandle, code, paramValue, ref size) != zkfperrdef.ZKFP_ERR_OK)
                return 0;

            int value = 0;
            zkfp2.ByteArray2Int(paramValue, ref value);
            return value;
        }
        catch
        {
            return 0;
        }
    }

    private string? ReadFirstStringParameter(params int[] codes)
    {
        foreach (var code in codes)
        {
            try
            {
                byte[] paramValue = new byte[128];
                int size = paramValue.Length;
                if (zkfp2.GetParameters(_deviceHandle, code, paramValue, ref size) != zkfperrdef.ZKFP_ERR_OK || size <= 0)
                    continue;

                var text = System.Text.Encoding.ASCII.GetString(paramValue, 0, Math.Min(size, paramValue.Length)).Trim('\0', ' ', '\r', '\n', '\t');
                if (text.Length >= 3 && text.All(c => c >= 32 && c <= 126) && text.Any(char.IsLetterOrDigit))
                    return text;
            }
            catch
            {
                // Best effort: parameter codes vary by SDK build.
            }
        }

        return null;
    }

    /// <summary>Cierra DB y dispositivo.</summary>
    public (bool success, string? error) CloseDevice()
    {
        try
        {
            if (_dbHandle != IntPtr.Zero)
            {
                zkfp2.DBFree(_dbHandle);
                _dbHandle = IntPtr.Zero;
            }
            if (_deviceHandle != IntPtr.Zero)
            {
                zkfp2.CloseDevice(_deviceHandle);
                _deviceHandle = IntPtr.Zero;
            }
            _logger.LogInformation("Device closed successfully");
            return (true, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error closing device");
            return (false, ex.Message);
        }
    }

    // ---------- Captura ----------

    /// <summary>Captura huella con timeout. Devuelve plantilla exacta (solo tempLen bytes) e imagen raw.</summary>
    public async Task<(bool success, byte[]? template, int templateLen, byte[]? image, string? error)> CaptureFingerprint()
    {
        // Asegurar dispositivo abierto (opcional, por si el cliente se olvidó)
        var okOpen = EnsureOpenWithDb();
        if (!okOpen.success)
            return (false, null, 0, null, okOpen.error);

        await _captureLock.WaitAsync();
        try
        {
            int imageSize = _fpWidth * _fpHeight;
            if (imageSize <= 0)
                return (false, null, 0, null, "Invalid image dimensions");

            byte[] fpImage = new byte[imageSize];
            byte[] fpTemplate = new byte[2048];
            int tempLen = 2048;

            var startTime = DateTime.Now;
            var timeout = TimeSpan.FromMilliseconds(CaptureTimeout);
            int lastErrorCode = 0;

            while (DateTime.Now - startTime < timeout)
            {
                tempLen = 2048; // reset en cada intento
                var ret = zkfp2.AcquireFingerprint(_deviceHandle, fpImage, imageSize, fpTemplate, ref tempLen);

                if (ret == zkfperrdef.ZKFP_ERR_OK)
                {
                    // COPIAR SOLO EL TAMAÑO REAL => evita basura al final
                    var tpl = new byte[tempLen];
                    Buffer.BlockCopy(fpTemplate, 0, tpl, 0, tempLen);

                    _lastCapturedImage = fpImage;
                    _lastCapturedTemplate = tpl;
                    _lastTemplateLength = tempLen;

                    _logger.LogDebug("Fingerprint captured. Template length: {Length}", tempLen);
                    return (true, tpl, tempLen, fpImage, null);
                }

                lastErrorCode = ret;

                if (ret == zkfperrdef.ZKFP_ERR_CAPTURE || ret == zkfperrdef.ZKFP_ERR_BUSY || ret == zkfperrdef.ZKFP_ERR_TIMEOUT)
                {
                    await Task.Delay(120);
                    continue;
                }
                if (ret == zkfperrdef.ZKFP_ERR_INVALID_HANDLE || ret == zkfperrdef.ZKFP_ERR_NOT_OPEN || ret == zkfperrdef.ZKFP_ERR_NO_DEVICE)
                {
                    _logger.LogWarning("Capture returned device error {Code}; attempting recovery", ret);
                    RecoverDevice();
                }
                break; // otros errores => salir
            }

            var errorMessage = lastErrorCode switch
            {
                zkfperrdef.ZKFP_ERR_BUSY => "Device busy",
                zkfperrdef.ZKFP_ERR_CAPTURE => "No finger detected (timeout)",
                zkfperrdef.ZKFP_ERR_TIMEOUT => "No finger detected (timeout)",
                zkfperrdef.ZKFP_ERR_NOT_OPEN => "Device not open",
                zkfperrdef.ZKFP_ERR_NO_DEVICE => "No device connected",
                _ => $"Capture failed with code: {lastErrorCode}"
            };

            _logger.LogWarning("Fingerprint capture failed/timeout. Last error: {Code}", lastErrorCode);
            return (false, null, 0, null, errorMessage);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error capturing fingerprint");
            return (false, null, 0, null, ex.Message);
        }
        finally
        {
            _captureLock.Release();
        }
    }

    public async Task<(bool success, byte[]? jpeg, string? error)> CaptureImageSnapshot()
    {
        var okOpen = EnsureOpenWithDb();
        if (!okOpen.success)
            return (false, null, okOpen.error);

        await _captureLock.WaitAsync();
        try
        {
            int imageSize = _fpWidth * _fpHeight;
            if (imageSize <= 0)
                return (false, null, "Invalid image dimensions");

            byte[] fpImage = new byte[imageSize];
            var ret = zkfp2.AcquireFingerprintImage(_deviceHandle, fpImage, imageSize);
            if (ret == zkfperrdef.ZKFP_ERR_OK)
            {
                _lastCapturedImage = fpImage;
                return (true, BitmapHelper.ConvertRawToJpeg(fpImage, _fpWidth, _fpHeight), null);
            }

            var existing = GetLastCapturedImageJpeg();
            if (existing is { Length: > 0 })
                return (true, existing, null);

            return (false, null, $"Image capture failed with code: {ret}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error capturing image snapshot");
            return (false, null, ex.Message);
        }
        finally
        {
            _captureLock.Release();
        }
    }

    // ---------- Merge / Verify / Identify ----------

    /// <summary>Fusiona 3 muestras en una plantilla final usando DBMerge.</summary>
    public (bool success, byte[]? mergedTemplate, int templateLen, string? error) MergeTemplates(
        byte[] template1, byte[] template2, byte[] template3)
    {
        var ok = EnsureOpenWithDb();
        if (!ok.success) return (false, null, 0, ok.error);

        try
        {
            byte[] regTemplate = new byte[2048];
            int regTempLen = 2048;  // Indicar el tamaño del buffer disponible

            var ret = zkfp2.DBMerge(_dbHandle, template1, template2, template3, regTemplate, ref regTempLen);
            if (ret == zkfperrdef.ZKFP_ERR_OK)
            {
                // devolver plantilla compactada a su tamaño real
                var tpl = new byte[regTempLen];
                Buffer.BlockCopy(regTemplate, 0, tpl, 0, regTempLen);

                _logger.LogInformation("Templates merged. Length: {Length}", regTempLen);
                return (true, tpl, regTempLen, null);
            }
            return (false, null, 0, $"Merge failed with code: {ret}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error merging templates");
            return (false, null, 0, ex.Message);
        }
    }

    /// <summary>Verificación 1:1 con el matcher del SDK. Retorna score raw (sin aplicar threshold).</summary>
    public (bool success, bool match, int score, string? error) VerifyTemplate(
        byte[] capturedTemplate, byte[] storedTemplate, bool applyThreshold = true)
    {
        var ok = EnsureOpenWithDb();
        if (!ok.success) return (false, false, 0, ok.error);

        try
        {
            // IMPORTANTE: DBMatch requiere templates de EXACTAMENTE 2048 bytes
            if (capturedTemplate == null || capturedTemplate.Length == 0)
            {
                _logger.LogError("capturedTemplate is null or empty");
                return (false, false, 0, "Captured template is invalid");
            }

            if (storedTemplate == null || storedTemplate.Length == 0)
            {
                _logger.LogError("storedTemplate is null or empty");
                return (false, false, 0, "Stored template is invalid");
            }

            // DBMatch requiere las longitudes originales de los templates, no arrays de 2048
            int len1 = capturedTemplate.Length;
            int len2 = storedTemplate.Length;

            _logger.LogDebug("DBMatch: captured len={Len1}, stored len={Len2}", len1, len2);

            int score = zkfp2.DBMatch(_dbHandle, capturedTemplate, len1, storedTemplate, len2);
            bool match = applyThreshold ? (score >= Threshold) : (score > 0);

            _logger.LogDebug("DBMatch score: {Score}, Threshold: {Threshold}, applyThreshold: {Apply} => Match: {Match}",
                score, Threshold, applyThreshold, match);

            return (true, match, score, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying template. CapturedLen: {CaptLen}, StoredLen: {StoreLen}", 
                capturedTemplate?.Length ?? 0, storedTemplate?.Length ?? 0);
            return (false, false, 0, ex.Message);
        }
    }

    /// <summary>Identificación 1:N. Exige diferencia mínima entre top1 y top2.</summary>
    public (bool success, bool match, int bestIndex, int bestScore, string? error) IdentifyTemplate(
        byte[] capturedTemplate, List<byte[]> storedTemplates)
    {
        var ok = EnsureOpenWithDb();
        if (!ok.success) return (false, false, -1, 0, ok.error);

        if (storedTemplates == null || storedTemplates.Count == 0)
            return (true, false, -1, 0, null);

        try
        {
            int bestScore = 0, secondBest = 0, bestIndex = -1;

            for (int i = 0; i < storedTemplates.Count; i++)
            {
                int score = zkfp2.DBMatch(_dbHandle, capturedTemplate, capturedTemplate.Length, storedTemplates[i], storedTemplates[i].Length);
                if (score > bestScore)
                {
                    secondBest = bestScore;
                    bestScore = score;
                    bestIndex = i;
                }
                else if (score > secondBest)
                {
                    secondBest = score;
                }
            }

            // Con un solo template, secondBest=0 → el check de ambiguedad no aplica.
            // Con múltiples templates, exigir diferencia mínima de 5 puntos (más estricto que 3).
            bool ambiguous = storedTemplates.Count > 1 && (bestScore - secondBest) < 5;
            bool match = bestScore >= Threshold && !ambiguous;

            _logger.LogDebug("Identify best={Best} second={Second} thr={Thr} match={Match} ambiguous={Amb}",
                bestScore, secondBest, Threshold, match, ambiguous);

            if (ambiguous && bestScore >= Threshold)
                return (false, false, -1, bestScore, "Ambiguous match detected");

            return (true, match, bestIndex, bestScore, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error identifying template");
            return (false, false, -1, 0, ex.Message);
        }
    }

    public void ReplaceFingerprintCache(IEnumerable<FingerprintCacheEntry> entries)
    {
        lock (_cacheLock)
        {
            _fingerprintCache.Clear();
            _fingerprintCache.AddRange(entries.Where(e => e.Template.Length > 0));
        }

        _logger.LogInformation("Fingerprint cache loaded with {Count} templates", CachedFingerprintCount);
    }

    public List<FingerprintCacheEntry> GetFingerprintCacheSnapshot()
    {
        lock (_cacheLock)
            return _fingerprintCache.ToList();
    }

    public (bool success, bool match, FingerprintCacheEntry? entry, int bestScore, int secondBest, string? error) IdentifyCachedTemplate(
        byte[] capturedTemplate)
    {
        var ok = EnsureOpenWithDb();
        if (!ok.success) return (false, false, null, 0, 0, ok.error);

        var entries = GetFingerprintCacheSnapshot();
        if (entries.Count == 0)
            return (true, false, null, 0, 0, "No fingerprints in cache");

        try
        {
            int bestScore = 0;
            int secondBest = 0;
            FingerprintCacheEntry? bestEntry = null;

            foreach (var entry in entries)
            {
                int score = zkfp2.DBMatch(_dbHandle, capturedTemplate, capturedTemplate.Length, entry.Template, entry.Template.Length);
                if (score > bestScore)
                {
                    secondBest = bestScore;
                    bestScore = score;
                    bestEntry = entry;
                }
                else if (score > secondBest)
                {
                    secondBest = score;
                }
            }

            bool ambiguous = entries.Count > 1 && (bestScore - secondBest) < AmbiguityMargin;
            bool match = bestScore >= Threshold && !ambiguous;

            if (ambiguous && bestScore >= Threshold)
                return (true, false, null, bestScore, secondBest, "Ambiguous match detected");

            return (true, match, match ? bestEntry : null, bestScore, secondBest, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error identifying cached template");
            return (false, false, null, 0, 0, ex.Message);
        }
    }

    // ---------- Imagen ----------

    public string? GetLastCapturedImageBase64()
    {
        if (_lastCapturedImage == null || _fpWidth == 0 || _fpHeight == 0) return null;
        try
        {
            return BitmapHelper.ConvertRawToBmpBase64(_lastCapturedImage, _fpWidth, _fpHeight);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error converting image to base64");
            return null;
        }
    }

    public byte[]? GetLastCapturedImageJpeg()
    {
        if (_lastCapturedImage == null || _fpWidth == 0 || _fpHeight == 0) return null;
        try
        {
            return BitmapHelper.ConvertRawToJpeg(_lastCapturedImage, _fpWidth, _fpHeight);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error converting image to JPEG");
            return null;
        }
    }

    // ---------- Dispose ----------

    public void Dispose()
    {
        CloseDevice();
        if (_isInitialized)
        {
            zkfp2.Terminate();
            _isInitialized = false;
        }
        _captureLock.Dispose();
    }
}

public sealed record FingerprintCacheEntry(string UserId, int FingerIndex, byte[] Template);
