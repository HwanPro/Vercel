using System.Runtime.InteropServices;

namespace WolfGym.BiometricService.SDK;

/// <summary>
/// Códigos de error del SDK
/// </summary>
public static class zkfperrdef
{
    public const int ZKFP_ERR_ALREADY_INIT = 1;
    public const int ZKFP_ERR_OK = 0;
    public const int ZKFP_ERR_INITLIB = -1;
    public const int ZKFP_ERR_INIT = -2;
    public const int ZKFP_ERR_NO_DEVICE = -3;
    public const int ZKFP_ERR_NOT_SUPPORT = -4;
    public const int ZKFP_ERR_INVALID_PARAM = -5;
    public const int ZKFP_ERR_OPEN = -6;
    public const int ZKFP_ERR_INVALID_HANDLE = -7;
    public const int ZKFP_ERR_CAPTURE = -8;
    public const int ZKFP_ERR_EXTRACT_FP = -9;
    public const int ZKFP_ERR_ABSORT = -10;
    public const int ZKFP_ERR_MEMORY_NOT_ENOUGH = -11;
    public const int ZKFP_ERR_BUSY = -12;
    public const int ZKFP_ERR_ADD_FINGER = -13;
    public const int ZKFP_ERR_DEL_FINGER = -14;
    public const int ZKFP_ERR_FAIL = -17;
    public const int ZKFP_ERR_CANCEL = -18;
    public const int ZKFP_ERR_VERIFY_FP = -20;
    public const int ZKFP_ERR_MERGE = -22;
    public const int ZKFP_ERR_NOT_OPEN = -23;
    public const int ZKFP_ERR_NOT_INIT = -24;
    public const int ZKFP_ERR_ALREADY_OPENED = -25;
    public const int ZKFP_ERR_LOADIMAGE = -26;
    public const int ZKFP_ERR_ANALYSE_IMG = -27;
    public const int ZKFP_ERR_TIMEOUT = -28;
}

/// <summary>
/// Wrapper para las funciones del SDK ZKFinger (libzkfp.dll nativo)
/// </summary>
public static class zkfp2
{
    private const string DLL_NAME = "libzkfp.dll";

    // Inicialización
    [DllImport(DLL_NAME, EntryPoint = "ZKFPM_Init", CallingConvention = CallingConvention.Cdecl)]
    public static extern int Init();

    [DllImport(DLL_NAME, EntryPoint = "ZKFPM_Terminate", CallingConvention = CallingConvention.Cdecl)]
    public static extern int Terminate();

    [DllImport(DLL_NAME, EntryPoint = "ZKFPM_GetDeviceCount", CallingConvention = CallingConvention.Cdecl)]
    public static extern int GetDeviceCount();

    // Device
    [DllImport(DLL_NAME, EntryPoint = "ZKFPM_OpenDevice", CallingConvention = CallingConvention.Cdecl)]
    public static extern IntPtr OpenDevice(int index);

    [DllImport(DLL_NAME, EntryPoint = "ZKFPM_CloseDevice", CallingConvention = CallingConvention.Cdecl)]
    public static extern int CloseDevice(IntPtr devHandle);

    [DllImport(DLL_NAME, EntryPoint = "ZKFPM_GetParameters", CallingConvention = CallingConvention.Cdecl)]
    public static extern int GetParameters(IntPtr devHandle, int code, byte[] paramValue, ref int size);

    [DllImport(DLL_NAME, EntryPoint = "ZKFPM_GetCaptureParamsEx", CallingConvention = CallingConvention.Cdecl)]
    public static extern int GetCaptureParamsEx(IntPtr devHandle, ref int width, ref int height, ref int dpi);

    [DllImport(DLL_NAME, EntryPoint = "ZKFPM_AcquireFingerprintImage", CallingConvention = CallingConvention.Cdecl)]
    public static extern int AcquireFingerprintImage(IntPtr devHandle, byte[] fpImage, int imageSize);

    // Database
    [DllImport(DLL_NAME, EntryPoint = "ZKFPM_DBInit", CallingConvention = CallingConvention.Cdecl)]
    public static extern IntPtr DBInit();

    [DllImport(DLL_NAME, EntryPoint = "ZKFPM_DBFree", CallingConvention = CallingConvention.Cdecl)]
    public static extern int DBFree(IntPtr dbHandle);

    [DllImport(DLL_NAME, EntryPoint = "ZKFPM_DBMerge", CallingConvention = CallingConvention.Cdecl)]
    public static extern int DBMerge(IntPtr dbHandle, byte[] temp1, byte[] temp2, byte[] temp3, byte[] regTemp, ref int regTempLen);

    [DllImport(DLL_NAME, EntryPoint = "ZKFPM_DBAdd", CallingConvention = CallingConvention.Cdecl)]
    public static extern int DBAdd(IntPtr dbHandle, uint fid, byte[] temp, int tempLen);

    [DllImport(DLL_NAME, EntryPoint = "ZKFPM_DBDel", CallingConvention = CallingConvention.Cdecl)]
    public static extern int DBDel(IntPtr dbHandle, int fid);

    [DllImport(DLL_NAME, EntryPoint = "ZKFPM_DBClear", CallingConvention = CallingConvention.Cdecl)]
    public static extern int DBClear(IntPtr dbHandle);

    [DllImport(DLL_NAME, EntryPoint = "ZKFPM_DBCount", CallingConvention = CallingConvention.Cdecl)]
    public static extern int DBCount(IntPtr dbHandle, ref uint fpCount);

    [DllImport(DLL_NAME, EntryPoint = "ZKFPM_DBIdentify", CallingConvention = CallingConvention.Cdecl)]
    public static extern int DBIdentify(IntPtr dbHandle, byte[] temp, int tempLen, ref uint fid, ref uint score);

    [DllImport(DLL_NAME, EntryPoint = "ZKFPM_DBMatch", CallingConvention = CallingConvention.Cdecl)]
    public static extern int DBMatch(IntPtr dbHandle, byte[] temp1, int temp1Len, byte[] temp2, int temp2Len);

    // Capture
    [DllImport(DLL_NAME, EntryPoint = "ZKFPM_AcquireFingerprint", CallingConvention = CallingConvention.Cdecl)]
    public static extern int AcquireFingerprint(IntPtr devHandle, byte[] fpImage, int imageSize, byte[] fpTemp, ref int tempLen);

    // Métodos de ayuda para conversión (implementados con .NET)
    public static int ByteArray2Int(byte[] bytes, ref int value)
    {
        if (bytes == null || bytes.Length < 4)
            return -1;
        
        value = BitConverter.ToInt32(bytes, 0);
        return 0;
    }

    public static string BlobToBase64String(byte[] blob, int len)
    {
        if (blob == null || len <= 0) return string.Empty;
        return Convert.ToBase64String(blob, 0, len);
    }

    public static byte[] Base64ToBlobArray(string base64)
    {
        if (string.IsNullOrEmpty(base64)) return Array.Empty<byte>();
        try
        {
            return Convert.FromBase64String(base64);
        }
        catch
        {
            return Array.Empty<byte>();
        }
    }
}
