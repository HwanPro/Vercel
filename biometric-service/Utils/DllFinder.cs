using Serilog.Core;

namespace WolfGym.BiometricService.Utils;

/// <summary>
/// Busca libzkfp.dll y libzkfpcsharp.dll en ubicaciones comunes del SDK de ZKTeco
/// y las copia al directorio del ejecutable para que el DllImport las encuentre.
/// </summary>
public static class DllFinder
{
    private static readonly string[] TargetDlls = ["libzkfp.dll", "libzkfpcsharp.dll"];

    // Patrones de búsqueda por orden de prioridad
    private static readonly string[] SearchRoots =
    [
        Path.Combine(AppContext.BaseDirectory, "vendor", "zkfinger", "x64"),
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "vendor", "zkfinger", "x64")),
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "vendor", "zkfinger", "x64")),
        @"C:\Program Files\ZKFingerSDK_Windows_Standard",
        @"C:\Program Files (x86)\ZKFingerSDK_Windows_Standard",
        @"D:\Downloads\ZKFinger SDK V10.0-Windows-Lite",
        @"C:\ZKFinger10",
        @"C:\ZKTeco",
        @"C:\Program Files\ZKTeco",
        @"C:\Program Files (x86)\ZKTeco",
        @"C:\Program Files\ZKFinger SDK",
        @"C:\Program Files (x86)\ZKFinger SDK",
        Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),
        Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),
    ];

    public static void EnsureDllsPresent(Serilog.ILogger logger)
    {
        var exeDir = AppContext.BaseDirectory;

        foreach (var dll in TargetDlls)
        {
            var dest = Path.Combine(exeDir, dll);
            if (File.Exists(dest))
            {
                logger.Information("DLL ya presente: {Dll}", dll);
                continue;
            }

            var found = FindDll(dll);
            if (found != null)
            {
                try
                {
                    File.Copy(found, dest, overwrite: false);
                    logger.Information("DLL copiada: {Src} → {Dst}", found, dest);
                }
                catch (Exception ex)
                {
                    logger.Warning(ex, "No se pudo copiar {Dll} desde {Src}", dll, found);
                }
            }
            else
            {
                logger.Warning(
                    "No se encontró {Dll}. Asegúrese de instalar el driver ZKTeco ZK9500 " +
                    "o copie manualmente {Dll} al directorio: {Dir}", dll, dll, exeDir);
            }
        }
    }

    private static string? FindDll(string dllName)
    {
        // 1. Buscar en rutas conocidas del SDK (x64 primero)
        foreach (var root in SearchRoots)
        {
            if (!Directory.Exists(root)) continue;

            // Buscar subcarpetas con "x64" primero, luego cualquier subcarpeta
            var x64Candidates = TryFindInSubdirs(root, dllName, preferX64: true);
            if (x64Candidates != null) return x64Candidates;
        }

        // 2. Buscar en System32 / SysWOW64 (el installer del SDK los copia aquí a veces)
        var sys32 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), dllName);
        if (File.Exists(sys32)) return sys32;

        var sysWow = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.SystemX86), dllName);
        if (File.Exists(sysWow)) return sysWow;

        // 3. Búsqueda recursiva en Program Files (más lenta, último recurso)
        foreach (var root in SearchRoots.Distinct())
        {
            if (!Directory.Exists(root)) continue;
            var found = SearchRecursive(root, dllName, maxDepth: 5);
            if (found != null) return found;
        }

        return null;
    }

    private static string? TryFindInSubdirs(string root, string dllName, bool preferX64)
    {
        try
        {
            var dirs = Directory.GetDirectories(root, "*", SearchOption.AllDirectories)
                .OrderByDescending(d => preferX64 && d.Contains("x64", StringComparison.OrdinalIgnoreCase) ? 1 : 0)
                .ToList();

            // También revisar el root directamente
            dirs.Insert(0, root);

            foreach (var dir in dirs)
            {
                var path = Path.Combine(dir, dllName);
                if (File.Exists(path)) return path;
            }
        }
        catch (UnauthorizedAccessException) { }
        catch (IOException) { }

        return null;
    }

    private static string? SearchRecursive(string dir, string dllName, int maxDepth)
    {
        if (maxDepth <= 0) return null;
        try
        {
            var direct = Path.Combine(dir, dllName);
            if (File.Exists(direct)) return direct;

            foreach (var sub in Directory.GetDirectories(dir))
            {
                var found = SearchRecursive(sub, dllName, maxDepth - 1);
                if (found != null) return found;
            }
        }
        catch (UnauthorizedAccessException) { }
        catch (IOException) { }

        return null;
    }
}
