using System.Drawing;
using System.Drawing.Imaging;

namespace WolfGym.BiometricService.Utils;

public static class BitmapHelper
{
    public static byte[] ConvertRawToBmp(byte[] rawImageData, int width, int height)
    {
        if (rawImageData == null || rawImageData.Length == 0)
            return Array.Empty<byte>();

        using var bitmap = new Bitmap(width, height, PixelFormat.Format8bppIndexed);
        
        // Configurar paleta de grises
        var palette = bitmap.Palette;
        for (int i = 0; i < 256; i++)
        {
            palette.Entries[i] = Color.FromArgb(i, i, i);
        }
        bitmap.Palette = palette;

        // Copiar datos
        var bmpData = bitmap.LockBits(
            new Rectangle(0, 0, width, height),
            ImageLockMode.WriteOnly,
            PixelFormat.Format8bppIndexed);

        try
        {
            var ptr = bmpData.Scan0;
            var stride = bmpData.Stride;
            var bytesPerRow = width;

            for (int y = 0; y < height; y++)
            {
                System.Runtime.InteropServices.Marshal.Copy(
                    rawImageData, 
                    y * bytesPerRow, 
                    ptr + y * stride, 
                    bytesPerRow);
            }
        }
        finally
        {
            bitmap.UnlockBits(bmpData);
        }

        using var ms = new MemoryStream();
        bitmap.Save(ms, ImageFormat.Bmp);
        return ms.ToArray();
    }

    public static string ConvertRawToBmpBase64(byte[] rawImageData, int width, int height)
    {
        var bmpBytes = ConvertRawToBmp(rawImageData, width, height);
        return Convert.ToBase64String(bmpBytes);
    }

    public static byte[] ConvertRawToJpeg(byte[] rawImageData, int width, int height, long quality = 85)
    {
        if (rawImageData == null || rawImageData.Length == 0)
            return Array.Empty<byte>();

        using var bitmap = new Bitmap(width, height, PixelFormat.Format8bppIndexed);
        
        // Configurar paleta de grises
        var palette = bitmap.Palette;
        for (int i = 0; i < 256; i++)
        {
            palette.Entries[i] = Color.FromArgb(i, i, i);
        }
        bitmap.Palette = palette;

        // Copiar datos
        var bmpData = bitmap.LockBits(
            new Rectangle(0, 0, width, height),
            ImageLockMode.WriteOnly,
            PixelFormat.Format8bppIndexed);

        try
        {
            var ptr = bmpData.Scan0;
            var stride = bmpData.Stride;
            var bytesPerRow = width;

            for (int y = 0; y < height; y++)
            {
                System.Runtime.InteropServices.Marshal.Copy(
                    rawImageData, 
                    y * bytesPerRow, 
                    ptr + y * stride, 
                    bytesPerRow);
            }
        }
        finally
        {
            bitmap.UnlockBits(bmpData);
        }

        using var ms = new MemoryStream();
        var encoder = ImageCodecInfo.GetImageEncoders()
            .First(c => c.FormatID == ImageFormat.Jpeg.Guid);
        var parameters = new EncoderParameters(1);
        parameters.Param[0] = new EncoderParameter(Encoder.Quality, quality);
        
        bitmap.Save(ms, encoder, parameters);
        return ms.ToArray();
    }
}
