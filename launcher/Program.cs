using System.Diagnostics;
using System.Net.Http;

namespace WolfGymLauncher;

internal static class Program
{
    private const string WebUrl = "http://127.0.0.1:3000";
    private const string BioUrl = "http://127.0.0.1:8001/health";

    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(2) };
    private static readonly List<Process> StartedProcesses = [];
    private static string _logDir = "";

    private static async Task<int> Main()
    {
        Console.Title = "WolfGym Launcher";
        var root = AppContext.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        _logDir = Path.Combine(root, "logs");
        Directory.CreateDirectory(_logDir);

        Console.WriteLine("==========================================");
        Console.WriteLine(" WOLF GYM - Iniciando sistema");
        Console.WriteLine("==========================================");
        Console.WriteLine();
        Console.WriteLine($"Carpeta: {root}");

        var bioDir = Path.Combine(root, "biometric");
        var bioExe = Path.Combine(bioDir, "WolfGym.BiometricService.exe");
        var webDir = Path.Combine(root, "webapp");

        if (!File.Exists(bioExe))
        {
            Fail($"No existe el servicio biometrico: {bioExe}");
            return 1;
        }

        if (!Directory.Exists(webDir))
        {
            Fail($"No existe la carpeta webapp: {webDir}");
            return 1;
        }

        if (!await IsUp(BioUrl))
        {
            StartProcess(
                "Biometric",
                bioExe,
                "",
                bioDir,
                Path.Combine(_logDir, "biometric.log"));
        }
        else
        {
            Console.WriteLine("Servicio biometrico ya estaba activo.");
        }

        await WaitFor("Servicio biometrico", BioUrl, TimeSpan.FromSeconds(20));

        if (!await IsUp(WebUrl))
        {
            StartProcess(
                "Web",
                "cmd.exe",
                "/c npm.cmd run start",
                webDir,
                Path.Combine(_logDir, "web.log"));
        }
        else
        {
            Console.WriteLine("App web ya estaba activa.");
        }

        var webReady = await WaitFor("App web", WebUrl, TimeSpan.FromSeconds(45));
        if (webReady)
        {
            Process.Start(new ProcessStartInfo(WebUrl) { UseShellExecute = true });
        }
        else
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.WriteLine("La web no respondio a tiempo. Revise logs\\web.log.");
            Console.ResetColor();
        }

        Console.WriteLine();
        Console.WriteLine("Presione ENTER para detener WolfGym.");
        Console.ReadLine();

        StopStartedProcesses();
        Http.Dispose();
        return 0;
    }

    private static Process StartProcess(string name, string fileName, string arguments, string workingDirectory, string logPath)
    {
        var psi = new ProcessStartInfo
        {
            FileName = fileName,
            Arguments = arguments,
            WorkingDirectory = workingDirectory,
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
        };

        if (name == "Web")
        {
            SetWebEnvironment(psi);
        }

        var process = new Process { StartInfo = psi, EnableRaisingEvents = true };
        process.OutputDataReceived += (_, e) => AppendLog(logPath, e.Data);
        process.ErrorDataReceived += (_, e) => AppendLog(logPath, e.Data);
        process.Exited += (_, _) => AppendLog(logPath, $"{name} terminado con codigo {process.ExitCode}.");

        process.Start();
        process.BeginOutputReadLine();
        process.BeginErrorReadLine();
        StartedProcesses.Add(process);
        Console.WriteLine($"{name} iniciado. PID: {process.Id}");
        return process;
    }

    private static void SetWebEnvironment(ProcessStartInfo psi)
    {
        psi.Environment["BIOMETRIC_CAPTURE_BASE"] = "http://127.0.0.1:8001";
        psi.Environment["BIOMETRIC_STORE_BASE"] = "http://127.0.0.1:8001";
        psi.Environment["NEXT_PUBLIC_BIOMETRIC_BASE"] = "http://127.0.0.1:8001";
        psi.Environment["NEXT_PUBLIC_KIOSK"] = "1";
        psi.Environment["NEXTAUTH_URL"] = "http://127.0.0.1:3000";
    }

    private static async Task<bool> WaitFor(string label, string url, TimeSpan timeout)
    {
        var deadline = DateTime.UtcNow + timeout;
        while (DateTime.UtcNow < deadline)
        {
            if (await IsUp(url))
            {
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine($"{label}: OK");
                Console.ResetColor();
                return true;
            }

            await Task.Delay(1000);
        }

        return false;
    }

    private static async Task<bool> IsUp(string url)
    {
        try
        {
            using var response = await Http.GetAsync(url);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    private static void AppendLog(string path, string? line)
    {
        if (line is null) return;
        try
        {
            File.AppendAllText(path, $"[{DateTime.Now:HH:mm:ss}] {line}{Environment.NewLine}");
        }
        catch
        {
            // Logging must never kill the launcher.
        }
    }

    private static void StopStartedProcesses()
    {
        foreach (var process in StartedProcesses)
        {
            try
            {
                if (!process.HasExited)
                {
                    process.Kill(entireProcessTree: true);
                }
            }
            catch
            {
                // Best-effort shutdown.
            }
            finally
            {
                process.Dispose();
            }
        }
    }

    private static void Fail(string message)
    {
        Console.ForegroundColor = ConsoleColor.Red;
        Console.WriteLine(message);
        Console.ResetColor();
        Console.WriteLine("Presione ENTER para salir.");
        Console.ReadLine();
    }
}
